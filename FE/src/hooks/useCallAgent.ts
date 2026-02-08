import { useState, useRef, useEffect, useCallback } from 'react';

// ── Mulaw codec (matches Twilio's PCMU) ────────────────────
const MULAW_BIAS = 33;
const MULAW_MAX = 32635;

function linearToMulaw(sample: number): number {
  sample = Math.max(-32768, Math.min(32767, sample));
  const sign = sample < 0 ? 0x80 : 0;
  if (sample < 0) sample = -sample;
  sample = Math.min(sample + MULAW_BIAS, MULAW_MAX);

  const exp = [0, 1, 2, 3, 4, 5, 6, 7].find((e) => sample < 0x84 << e) ?? 7;
  const mantissa = (sample >> (exp + 3)) & 0x0f;
  return ~(sign | (exp << 4) | mantissa) & 0xff;
}

function mulawToLinear(byte: number): number {
  byte = ~byte & 0xff;
  const sign = byte & 0x80;
  const exp = (byte >> 4) & 0x07;
  const mantissa = byte & 0x0f;
  let sample = ((mantissa << 4) + 0x84) << exp;
  sample -= MULAW_BIAS * 4;
  return sign ? -sample : sample;
}

// ── Resampler: browserRate → 8000 Hz (and back) ────────────
function resample(input: Float32Array, fromRate: number, toRate: number): Float32Array {
  const ratio = fromRate / toRate;
  const len = Math.floor(input.length / ratio);
  const out = new Float32Array(len);
  for (let i = 0; i < len; i++) {
    const srcIdx = i * ratio;
    const idx = Math.floor(srcIdx);
    const frac = srcIdx - idx;
    const a = input[idx] || 0;
    const b = input[idx + 1] || 0;
    out[i] = a + frac * (b - a); // linear interpolation
  }
  return out;
}

// ── Constants ───────────────────────────────────────────────
const SAMPLE_RATE = 8000;
const CHUNK_SIZE = 160; // 20ms at 8kHz — matches Twilio
const NOISE_GATE = 0.008; // RMS threshold for noise gating

export interface CallAgentState {
  isConnected: boolean;
  isActive: boolean;
  isMicEnabled: boolean;
  status: string;
  error: string | null;
}

interface CallAgentConfig {
  serverUrl?: string;
  onStatusChange?: (status: string) => void;
  onError?: (error: string) => void;
}

export function useCallAgent(config: CallAgentConfig = {}) {
  const {
    serverUrl = `ws://${window.location.hostname}:3001/media-stream`,
    onStatusChange,
    onError,
  } = config;

  const [state, setState] = useState<CallAgentState>({
    isConnected: false,
    isActive: false,
    isMicEnabled: false,
    status: 'Idle',
    error: null,
  });

  // Refs for mutable state that shouldn't trigger re-renders
  const wsRef = useRef<WebSocket | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const micStreamRef = useRef<MediaStream | null>(null);
  const scriptNodeRef = useRef<ScriptProcessorNode | null>(null);
  const streamSidRef = useRef<string>('');
  const activeRef = useRef(false);
  const micEnabledRef = useRef(false);

  // Playback queue refs
  const playbackQueueRef = useRef<Uint8Array[]>([]);
  const isPlayingRef = useRef(false);
  const pendingMarksRef = useRef<string[]>([]);

  // Mic rate detected from the actual mic stream
  const micRateRef = useRef(48000);

  const updateState = useCallback(
    (updates: Partial<CallAgentState>) => {
      setState((prev) => {
        const newState = { ...prev, ...updates };
        if (updates.status) {
          onStatusChange?.(updates.status);
        }
        return newState;
      });
    },
    [onStatusChange],
  );

  const handleError = useCallback(
    (error: string) => {
      updateState({ error, status: 'Error' });
      onError?.(error);
      console.error('[CallAgent Error]', error);
    },
    [updateState, onError],
  );

  // ── Playback: mulaw → speaker ──────────────────────────────
  const drainPlayback = useCallback(() => {
    const audioCtx = audioCtxRef.current;
    if (!audioCtx || playbackQueueRef.current.length === 0) {
      isPlayingRef.current = false;
      return;
    }
    isPlayingRef.current = true;

    // Merge all queued chunks
    let total = 0;
    for (const c of playbackQueueRef.current) total += c.length;
    const merged = new Uint8Array(total);
    let offset = 0;
    for (const c of playbackQueueRef.current) {
      merged.set(c, offset);
      offset += c.length;
    }
    playbackQueueRef.current = [];

    // Decode mulaw → float32 at 8kHz
    const pcm = new Float32Array(merged.length);
    for (let i = 0; i < merged.length; i++) {
      pcm[i] = mulawToLinear(merged[i]) / 32768;
    }

    // Upsample 8kHz → audioCtx.sampleRate for playback
    const playRate = audioCtx.sampleRate;
    const upsampled = resample(pcm, SAMPLE_RATE, playRate);

    const buf = audioCtx.createBuffer(1, upsampled.length, playRate);
    buf.getChannelData(0).set(upsampled);

    const src = audioCtx.createBufferSource();
    src.buffer = buf;
    src.connect(audioCtx.destination);
    src.start();
    updateState({ status: '🔊 AI speaking...' });

    src.onended = () => {
      if (playbackQueueRef.current.length > 0) {
        drainPlayback();
      } else {
        isPlayingRef.current = false;
        // Echo any pending marks — audio has actually played through the speaker
        while (pendingMarksRef.current.length > 0) {
          const name = pendingMarksRef.current.shift()!;
          if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
            wsRef.current.send(JSON.stringify({ event: 'mark', streamSid: streamSidRef.current, mark: { name } }));
            console.log(`[CallAgent] → echo mark: ${name}`);
          }
          // Enable mic after first mark playback (greeting done)
          if (!micEnabledRef.current) {
            micEnabledRef.current = true;
            updateState({ isMicEnabled: true, status: '🎤 Listening... speak now' });
            console.log('[CallAgent] Audio done — mic enabled');
          }
        }
        if (activeRef.current) {
          updateState({ status: '🎤 Listening... speak now' });
        }
      }
    };
  }, [updateState]);

  const queuePlayback = useCallback(
    (mulawBytes: Uint8Array) => {
      playbackQueueRef.current.push(mulawBytes);
      if (!isPlayingRef.current) drainPlayback();
    },
    [drainPlayback],
  );

  // ── Mic capture → mulaw → send ────────────────────────────
  const startMicCapture = useCallback(
    (audioCtx: AudioContext, micStream: MediaStream, micRate: number) => {
      const source = audioCtx.createMediaStreamSource(micStream);
      const bufSize = 4096;
      const scriptNode = audioCtx.createScriptProcessor(bufSize, 1, 1);
      scriptNodeRef.current = scriptNode;

      scriptNode.onaudioprocess = (e: AudioProcessingEvent) => {
        if (!activeRef.current || !wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) return;
        if (!micEnabledRef.current) return; // suppress until greeting finishes

        const input = e.inputBuffer.getChannelData(0);

        // Noise gate: compute RMS energy, skip quiet frames
        let sumSq = 0;
        for (let i = 0; i < input.length; i++) sumSq += input[i] * input[i];
        const rms = Math.sqrt(sumSq / input.length);

        // Resample to 8kHz
        const resampled = resample(input, micRate, SAMPLE_RATE);

        if (rms < NOISE_GATE) {
          // Send silence frames (mulaw 0xFF = silence) to keep stream alive
          const silenceChunk = new Uint8Array(CHUNK_SIZE).fill(0xff);
          const b64 = btoa(String.fromCharCode(...silenceChunk));
          wsRef.current!.send(
            JSON.stringify({
              event: 'media',
              streamSid: streamSidRef.current,
              media: { payload: b64 },
            }),
          );
          return;
        }

        // Convert float → 16-bit PCM → mulaw, send in 160-byte chunks
        const mulawBuf = new Uint8Array(resampled.length);
        for (let i = 0; i < resampled.length; i++) {
          const s16 = Math.max(-32768, Math.min(32767, Math.round(resampled[i] * 32767)));
          mulawBuf[i] = linearToMulaw(s16);
        }

        // Send in 160-sample chunks (20ms at 8kHz), matching Twilio
        for (let i = 0; i < mulawBuf.length; i += CHUNK_SIZE) {
          const chunk = mulawBuf.slice(i, Math.min(i + CHUNK_SIZE, mulawBuf.length));
          const b64 = btoa(String.fromCharCode(...chunk));
          wsRef.current!.send(
            JSON.stringify({
              event: 'media',
              streamSid: streamSidRef.current,
              media: { payload: b64, timestamp: Date.now().toString(), chunk: String(i / CHUNK_SIZE) },
            }),
          );
        }
      };

      source.connect(scriptNode);
      scriptNode.connect(audioCtx.destination); // needed for onaudioprocess to fire
    },
    [],
  );

  // ── Start call ─────────────────────────────────────────────
  const startCall = useCallback(async () => {
    try {
      updateState({ status: 'Requesting microphone...', isActive: true, error: null });

      // Get mic
      const micStream = await navigator.mediaDevices.getUserMedia({
        audio: { echoCancellation: true, noiseSuppression: true, sampleRate: SAMPLE_RATE },
      });
      micStreamRef.current = micStream;
      const micRate = micStream.getAudioTracks()[0].getSettings().sampleRate || 48000;
      micRateRef.current = micRate;
      console.log(`[CallAgent] Mic opened at ${micRate} Hz`);

      // Audio context for mic capture + playback
      const audioCtx = new AudioContext({ sampleRate: micRate });
      audioCtxRef.current = audioCtx;

      // Generate unique stream ID
      streamSidRef.current = 'WEB_' + Math.random().toString(36).slice(2, 10);
      activeRef.current = true;
      micEnabledRef.current = false; // suppress mic until greeting finishes

      updateState({ status: 'Connecting...', isMicEnabled: false });

      // Connect WebSocket
      const ws = new WebSocket(serverUrl);
      wsRef.current = ws;

      ws.onopen = () => {
        console.log('[CallAgent] WebSocket connected');
        updateState({ isConnected: true, status: '🔊 AI greeting... please wait' });

        // Send Twilio-style handshake — connected event first
        ws.send(JSON.stringify({ event: 'connected', protocol: 'Call', version: '1.0.0' }));

        // Send start event with full metadata
        ws.send(
          JSON.stringify({
            event: 'start',
            streamSid: streamSidRef.current,
            start: {
              streamSid: streamSidRef.current,
              callSid: 'CA_browser_' + Date.now().toString(36),
              customParameters: { callerNumber: '+0000000000' },
              mediaFormat: { encoding: 'audio/x-mulaw', sampleRate: '8000', channels: '1' },
            },
          }),
        );

        // Start mic capture but suppress sending until greeting finishes
        startMicCapture(audioCtx, micStream, micRate);

        // Safety: enable mic after 8s even if mark never arrives (e.g. TTS error)
        setTimeout(() => {
          if (!micEnabledRef.current && activeRef.current) {
            micEnabledRef.current = true;
            updateState({ isMicEnabled: true, status: '🎤 Listening... speak now' });
            console.log('[CallAgent] Mic enabled (timeout fallback)');
          }
        }, 8000);
      };

      ws.onmessage = (evt) => {
        try {
          const data = JSON.parse(evt.data);

          if (data.event === 'media' && data.media?.payload) {
            // Decode base64 → mulaw bytes → queue for playback
            const raw = atob(data.media.payload);
            const mulaw = new Uint8Array(raw.length);
            for (let i = 0; i < raw.length; i++) mulaw[i] = raw.charCodeAt(i);
            queuePlayback(mulaw);
          } else if (data.event === 'mark') {
            console.log(`[CallAgent] ← mark: ${data.mark?.name}`);
            // Don't echo immediately — queue it for when audio actually finishes playing
            pendingMarksRef.current.push(data.mark.name);
          } else if (data.event === 'clear') {
            console.log('[CallAgent] ← clear (AI interrupted)');
            playbackQueueRef.current = [];
          }
        } catch (err) {
          console.warn('[CallAgent] WebSocket parse error:', err);
        }
      };

      ws.onerror = () => {
        handleError('WebSocket error — is the calling agent server running?');
      };

      ws.onclose = () => {
        console.log('[CallAgent] WebSocket closed');
        if (activeRef.current) {
          // Server-initiated close
          cleanupCall();
          updateState({
            isConnected: false,
            isActive: false,
            isMicEnabled: false,
            status: 'Call ended',
          });
        }
      };
    } catch (err) {
      handleError(`Failed to start call: ${err instanceof Error ? err.message : String(err)}`);
    }
  }, [serverUrl, updateState, handleError, startMicCapture, queuePlayback]);

  // ── Cleanup helper (no state update) ───────────────────────
  const cleanupCall = useCallback(() => {
    activeRef.current = false;
    micEnabledRef.current = false;

    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(
        JSON.stringify({ event: 'stop', streamSid: streamSidRef.current, stop: { callSid: 'CA_browser' } }),
      );
      wsRef.current.close();
    }
    wsRef.current = null;

    if (scriptNodeRef.current) {
      scriptNodeRef.current.disconnect();
      scriptNodeRef.current = null;
    }
    if (micStreamRef.current) {
      micStreamRef.current.getTracks().forEach((t) => t.stop());
      micStreamRef.current = null;
    }
    if (audioCtxRef.current) {
      audioCtxRef.current.close();
      audioCtxRef.current = null;
    }

    playbackQueueRef.current = [];
    pendingMarksRef.current = [];
    isPlayingRef.current = false;
  }, []);

  // ── End call ───────────────────────────────────────────────
  const endCall = useCallback(() => {
    cleanupCall();
    updateState({
      isConnected: false,
      isActive: false,
      isMicEnabled: false,
      status: 'Idle',
    });
  }, [cleanupCall, updateState]);

  // ── Toggle mic (manual mute/unmute) ────────────────────────
  const toggleMic = useCallback(() => {
    if (!activeRef.current) return;
    micEnabledRef.current = !micEnabledRef.current;
    updateState({ isMicEnabled: micEnabledRef.current });
  }, [updateState]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      cleanupCall();
    };
  }, [cleanupCall]);

  return {
    state,
    startCall,
    endCall,
    toggleMic,
  };
}
