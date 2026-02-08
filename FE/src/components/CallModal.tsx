import { motion, AnimatePresence } from 'motion/react';
import { Phone, PhoneOff, Mic, MicOff, X } from 'lucide-react';
import { useCallAgent } from '../hooks/useCallAgent';

interface CallModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function CallModal({ isOpen, onClose }: CallModalProps) {
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
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            className="fixed inset-0 z-40 bg-black/50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />

          {/* Modal */}
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center px-4"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          >
            <div
              className="relative w-full max-w-md overflow-hidden rounded-[32px] bg-gradient-to-br from-white to-gray-50 p-8 shadow-2xl"
              style={{
                background:
                  'linear-gradient(135deg, rgba(255,255,255,0.95) 0%, rgba(245,245,247,0.95) 100%)',
                backdropFilter: 'blur(20px)',
              }}
            >
              {/* Close Button */}
              <button
                onClick={onClose}
                className="absolute right-4 top-4 rounded-full p-2 text-gray-500 hover:bg-gray-100"
              >
                <X size={20} />
              </button>

              {/* Content */}
              <div className="flex flex-col items-center gap-6">
                {/* Status */}
                <div className="text-center">
                  <h2
                    className="mb-2 text-2xl font-bold text-black"
                    style={{ fontFamily: 'Source Sans Pro, -apple-system, system-ui, sans-serif' }}
                  >
                    {state.isActive ? 'In Call' : 'Voice Call'}
                  </h2>
                  <p
                    className="text-sm font-medium text-black/60"
                    style={{ fontFamily: 'Source Sans Pro, -apple-system, system-ui, sans-serif' }}
                  >
                    {state.status}
                  </p>
                </div>

                {/* Audio Indicator */}
                <div className="relative">
                  <div
                    className="h-24 w-24 rounded-full flex items-center justify-center"
                    style={{
                      background: state.isActive
                        ? 'linear-gradient(135deg, #DC2626 0%, #991B1B 100%)'
                        : 'linear-gradient(135deg, #16A34A 0%, #15803D 100%)',
                    }}
                  >
                    <Phone
                      size={40}
                      className="text-white"
                      fill="currentColor"
                    />
                  </div>

                  {/* Pulse Animation */}
                  {state.isActive && (
                    <motion.div
                      className="absolute inset-0 rounded-full border-2 border-red-500"
                      animate={{
                        scale: [1, 1.4, 1.4],
                        opacity: [0.6, 0, 0],
                      }}
                      transition={{
                        duration: 2,
                        repeat: Infinity,
                        ease: 'easeOut',
                      }}
                    />
                  )}
                </div>

                {/* Error Message */}
                {state.error && (
                  <div className="w-full rounded-lg bg-red-50 p-3">
                    <p
                      className="text-sm font-medium text-red-700"
                      style={{ fontFamily: 'Source Sans Pro, -apple-system, system-ui, sans-serif' }}
                    >
                      {state.error}
                    </p>
                  </div>
                )}

                {/* Control Buttons */}
                <div className="flex gap-4">
                  {!state.isActive ? (
                    <motion.button
                      onClick={handleStartCall}
                      className="flex h-14 items-center justify-center gap-2 rounded-full px-6 font-semibold text-white transition-all hover:scale-105"
                      style={{
                        background: 'linear-gradient(135deg, #16A34A 0%, #15803D 100%)',
                        boxShadow: '0 8px 24px rgba(22, 163, 74, 0.3)',
                      }}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      <Phone size={20} />
                      Start Call
                    </motion.button>
                  ) : (
                    <>
                      <motion.button
                        onClick={toggleMic}
                        className={`flex h-14 w-14 items-center justify-center rounded-full transition-all ${
                          state.isMicEnabled
                            ? 'bg-yellow-500 text-white'
                            : 'bg-gray-200 text-gray-600'
                        }`}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                      >
                        {state.isMicEnabled ? <Mic size={20} /> : <MicOff size={20} />}
                      </motion.button>

                      <motion.button
                        onClick={handleEndCall}
                        className="flex h-14 items-center justify-center gap-2 rounded-full px-6 font-semibold text-white transition-all hover:scale-105"
                        style={{
                          background: 'linear-gradient(135deg, #DC2626 0%, #991B1B 100%)',
                          boxShadow: '0 8px 24px rgba(220, 38, 38, 0.3)',
                        }}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                      >
                        <PhoneOff size={20} />
                        End Call
                      </motion.button>
                    </>
                  )}
                </div>

                {/* Info Text */}
                <p
                  className="text-xs text-black/40"
                  style={{ fontFamily: 'Source Sans Pro, -apple-system, system-ui, sans-serif' }}
                >
                  Make sure the calling agent server is running on port 3001
                </p>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
