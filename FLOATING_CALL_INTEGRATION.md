# FloatingCallButton Integration with Calling Agent

Your FloatingCallButton is now integrated with the Calling Agent! Here's how to use it:

## Quick Start

### 1. **Start the Calling Agent Server**

Open a terminal and run:

```bash
cd "Calling agent"
npm install  # (if not already done)
npm start
```

The server should start on port 3001:
```
╔══════════════════════════════════════════════════════════╗
║  Voice AI Medical Rep — PRODUCTION SERVER                ║
║  Port: 3001                                              ║
║  ...                                                     ║
╚══════════════════════════════════════════════════════════╝
```

### 2. **Start the Frontend**

In another terminal:

```bash
cd FE
npm install  # (if not already done)
npm run dev
```

Frontend runs on port 3000 (Vite dev server).

### 3. **Use the FloatingCallButton**

- Click the **blue phone button** in the bottom-right corner of the app
- An inline call panel will expand
- Click **"Start Call"** to begin a voice conversation with the AI medical representative
- The AI will greet you first — your mic is suppressed during the greeting
- Once the greeting finishes (or after 8s fallback), your mic activates automatically
- Use the **mic button** to toggle your microphone on/off
- Click **"End Call"** to disconnect

## How It Works

### Architecture

1. **FloatingCallButton.tsx** - The blue button in the bottom-right corner
   - Expands into an inline call panel (no separate modal)
   - Shows call status, mic toggle, start/end buttons
   - Displays real-time connection status and error messages

2. **useCallAgent.ts** - Hook managing the full voice pipeline
   - Twilio-style WebSocket handshake (connected → start events)
   - Mulaw codec (linearToMulaw / mulawToLinear) matching Twilio's PCMU
   - Resampling (browser sample rate → 8000Hz and back)
   - Noise gate (RMS threshold 0.008) to filter ambient noise
   - Playback queue with drain mechanism for smooth AI audio
   - Mark echoing AFTER audio playback completes (correct timing)
   - Mic suppression during AI greeting with 8s timeout fallback
   - ScriptProcessorNode for raw PCM mic capture

3. **CallModal.tsx** - Alternative modal-based call interface (available but not currently used)

### Data Flow

```
FloatingCallButton (click → expand panel)
       ↓
  useCallAgent Hook
       ↓
   WebSocket Connection
   ws://localhost:3001/media-stream
       ↓
   Twilio-style Handshake
   (connected → start events with streamSid)
       ↓
   Bidirectional Audio Stream
   Mic → Resample → Noise Gate → Mulaw Encode → WS → Server
   Server → WS → Mulaw Decode → Resample → Playback Queue → Speaker
```

## Configuration

### Server URL

The default WebSocket URL is:
```
ws://localhost:3001/media-stream
```

If your calling agent is on a different machine or port, update the `serverUrl` in the `useCallAgent` hook call (in `FloatingCallButton.tsx`):

```tsx
const { state, startCall, endCall, toggleMic } = useCallAgent({
  serverUrl: `ws://YOUR_SERVER_IP:3001/media-stream`,
  // ... rest of config
});
```

### Port Assignment

| Service         | Port |
|-----------------|------|
| Frontend (Vite) | 3000 |
| Calling Agent   | 3001 |
| Backend (FastAPI)| 8000 |

### Environment Setup

Make sure your calling agent `.env` file is properly configured:

```
GOOGLE_PROJECT_ID=your-gcp-project
GOOGLE_APPLICATION_CREDENTIALS=/path/to/service-account-key.json
PORT=3001
```

See `Calling agent/.env.example` for a complete template.

## Troubleshooting

### "Failed to initialize audio"
- **Cause**: Browser doesn't have microphone permission
- **Fix**: Allow microphone access when the browser prompts

### "WebSocket connection failed"
- **Cause**: Calling agent server not running or on wrong port
- **Fix**: 
  1. Check that `npm start` is running in the `Calling agent` folder
  2. Make sure it says "Port: 3000"
  3. Check that there's no port conflict

### "Connection Timeout"
- **Cause**: CORS or network issues
- **Fix**: 
  1. Check firewall settings
  2. Make sure frontend and backend are on the same network
  3. Try `localhost` if both are on the same machine

### No audio response
- **Cause**: Missing Google Cloud API credentials or unavailable service
- **Fix**: 
  1. Check that `GOOGLE_PROJECT_ID` is set in `.env`
  2. Verify service account JSON key path is correct
  3. Check Google Cloud console for API quotas/errors

## Files Changed

- **Created**: `FE/src/hooks/useCallAgent.ts` - WebSocket hook
- **Created**: `FE/src/components/CallModal.tsx` - Call interface
- **Modified**: `FE/src/components/FloatingCallButton.tsx` - Added modal trigger

## Next Steps

1. Test the integration locally with `localhost`
2. Once working, update WebSocket URL to your production server
3. Add proper error boundaries and logging for production
4. Consider adding call history/transcript storage
5. Add CORS headers in calling agent server if needed for cross-origin requests

---

**Happy calling! 🎤**
