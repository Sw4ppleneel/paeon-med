import { useState } from 'react';
import { Phone, PhoneOff, Mic, MicOff } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useCallAgent } from '../hooks/useCallAgent';

export function FloatingCallButton() {
  const [isExpanded, setIsExpanded] = useState(false);
  const { state, startCall, endCall, toggleMic } = useCallAgent({
    serverUrl: `ws://${window.location.hostname}:3001/media-stream`,
    onStatusChange: (status) => {
      console.log('[Call Status]', status);
    },
    onError: (error) => {
      console.error('[Call Error]', error);
    },
  });

  const handleStartCall = async () => {
    try {
      await startCall();
    } catch (err) {
      console.error('Failed to start call:', err);
    }
  };

  const handleEndCall = () => {
    endCall();
    setIsExpanded(false);
  };

  const handleToggleExpand = () => {
    if (!isExpanded) {
      setIsExpanded(true);
    }
  };

  return (
    <AnimatePresence>
      {!isExpanded ? (
        // Floating Button - Collapsed State
        <motion.button
          key="collapsed"
          onClick={handleToggleExpand}
          className="fixed bottom-8 right-8 z-50 flex h-16 w-16 items-center justify-center rounded-full shadow-xl transition-all hover:scale-110"
          style={{
            background: 'linear-gradient(135deg, #007AFF 0%, #0051D5 100%)',
          }}
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ 
            type: 'spring', 
            stiffness: 260, 
            damping: 20,
            delay: 0.5 
          }}
          whileHover={{ 
            boxShadow: '0 20px 40px rgba(0, 122, 255, 0.4)' 
          }}
          whileTap={{ scale: 0.95 }}
        >
          <Phone className="text-white" size={24} strokeWidth={2} />
          
          {/* Pulse Ring Animation */}
          <motion.div
            className="absolute inset-0 rounded-full border-2 border-[#007AFF]"
            initial={{ scale: 1, opacity: 0.6 }}
            animate={{ 
              scale: [1, 1.4, 1.4],
              opacity: [0.6, 0, 0]
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: 'easeOut'
            }}
          />
        </motion.button>
      ) : (
        // Expanded Panel - Call Interface
        <motion.div
          key="expanded"
          className="fixed bottom-8 right-8 z-50 w-80 overflow-hidden rounded-[24px] shadow-2xl"
          style={{
            background: 'linear-gradient(135deg, rgba(255,255,255,0.95) 0%, rgba(245,245,247,0.95) 100%)',
            backdropFilter: 'blur(20px)',
          }}
          initial={{ scale: 0.5, opacity: 0, y: 40 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.5, opacity: 0, y: 40 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
        >
          {/* Close Button */}
          <button
            onClick={() => {
              if (state.isActive) {
                endCall();
              }
              setIsExpanded(false);
            }}
            className="absolute right-2 top-4 z-10 rounded-full p-2 text-gray-500 hover:bg-gray-100 transition-colors"
          >
            <span className="text-xl font-bold">×</span>
          </button>

          {/* Content Wrapper */}
          <div className="p-6 pt-8">
            {/* Title */}
            <h2
              className="mb-1 text-xl font-bold text-black"
              style={{ fontFamily: 'Source Sans Pro, -apple-system, system-ui, sans-serif' }}
            >
              Voice Call
            </h2>

            {/* Status Display */}
            <div className="mb-6">
              <p
                className="text-sm font-medium text-black/60"
                style={{ fontFamily: 'Source Sans Pro, -apple-system, system-ui, sans-serif' }}
              >
                {state.status}
              </p>
            </div>

            {/* Error Message */}
            {state.error && (
              <div className="mb-4 rounded-lg bg-red-50 p-3">
                <p
                  className="text-xs font-medium text-red-700"
                  style={{ fontFamily: 'Source Sans Pro, -apple-system, system-ui, sans-serif' }}
                >
                  {state.error}
                </p>
              </div>
            )}

            {/* Control Buttons */}
            <div className="mb-4 flex gap-3">
              {!state.isActive ? (
                <motion.button
                  onClick={handleStartCall}
                  className="flex-1 flex items-center justify-center gap-2 rounded-full py-3 font-semibold text-white transition-all hover:scale-105"
                  style={{
                    background: 'linear-gradient(135deg, #16A34A 0%, #15803D 100%)',
                    boxShadow: '0 4px 12px rgba(22, 163, 74, 0.3)',
                  }}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <Phone size={18} />
                  Start Call
                </motion.button>
              ) : (
                <>
                  <motion.button
                    onClick={toggleMic}
                    className={`flex items-center justify-center rounded-lg py-3 px-4 transition-all ${
                      state.isMicEnabled
                        ? 'bg-yellow-100 text-yellow-600 hover:bg-yellow-200'
                        : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
                    }`}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    {state.isMicEnabled ? <Mic size={18} /> : <MicOff size={18} />}
                  </motion.button>

                  <motion.button
                    onClick={handleEndCall}
                    className="flex-1 flex items-center justify-center gap-2 rounded-lg py-3 font-semibold text-white transition-all hover:scale-105"
                    style={{
                      background: 'linear-gradient(135deg, #DC2626 0%, #991B1B 100%)',
                      boxShadow: '0 4px 12px rgba(220, 38, 38, 0.3)',
                    }}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <PhoneOff size={18} />
                    End Call
                  </motion.button>
                </>
              )}
            </div>

            {/* Statement */}
            <p
              className="text-xs text-center text-black/40"
              style={{ fontFamily: 'Source Sans Pro, -apple-system, system-ui, sans-serif' }}
            >
              Calling agent server must be running on port 3001
            </p>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
