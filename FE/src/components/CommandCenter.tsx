import { useState } from 'react';
import { Mic, Send } from 'lucide-react';
import { motion } from 'motion/react';

interface CommandCenterProps {
  onSearch: (query: string) => void;
  isActive: boolean;
  currentDrug?: string;
  isExpanded?: boolean;
}

export function CommandCenter({ onSearch, isActive, currentDrug, isExpanded = false }: CommandCenterProps) {
  const [isListening, setIsListening] = useState(false);
  const [inputValue, setInputValue] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputValue.trim()) {
      onSearch(inputValue);
      setInputValue(''); // Clear after submitting
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  if (isExpanded) {
    // Expanded mode - large text area embedded in page
    return (
      <motion.div
        className="relative mx-auto max-w-[900px] px-8 pb-16"
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <form onSubmit={handleSubmit}>
          <motion.div
            className="rounded-[32px] p-8"
            style={{
              background: 'rgba(255, 255, 255, 0.65)',
              backdropFilter: 'blur(60px)',
              border: '1px solid rgba(255, 255, 255, 0.4)',
              boxShadow: '0 24px 48px rgba(0, 0, 0, 0.12)',
            }}
          >
            {/* Title */}
            <h3 
              className="mb-4 text-2xl font-bold text-black/80"
              style={{ fontFamily: 'Source Sans Pro, -apple-system, system-ui, sans-serif' }}
            >
              Continue the Conversation
            </h3>
            <p 
              className="mb-6 text-sm font-semibold text-black/50"
              style={{ fontFamily: 'Source Sans Pro, -apple-system, system-ui, sans-serif' }}
            >
              Ask follow-up questions about {currentDrug || 'this medication'}, compare alternatives, or explore dosing guidelines.
            </p>

            {/* Large Text Area */}
            <div className="relative">
              <textarea
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder="Type your question here..."
                rows={6}
                className="w-full resize-none rounded-3xl border-none bg-white/80 px-6 py-4 text-base text-black placeholder-black/30 outline-none"
                style={{
                  fontFamily: 'Source Sans Pro, -apple-system, system-ui, sans-serif',
                  fontWeight: 600,
                  boxShadow: 'inset 0 2px 8px rgba(0, 0, 0, 0.06)',
                }}
              />

              {/* Action Bar */}
              <div className="mt-4 flex items-center justify-between">
                {/* Left: Voice Input */}
                <motion.button
                  type="button"
                  onClick={() => setIsListening(!isListening)}
                  className="flex items-center gap-2 rounded-full px-5 py-2.5"
                  style={{
                    background: isListening
                      ? 'linear-gradient(135deg, #1976D2 0%, #42A5F5 100%)'
                      : 'rgba(0, 0, 0, 0.05)',
                    color: isListening ? 'white' : 'rgba(0, 0, 0, 0.6)',
                    fontFamily: 'Source Sans Pro, -apple-system, system-ui, sans-serif',
                    fontWeight: 600,
                  }}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Mic size={16} strokeWidth={2} />
                  <span className="text-sm">{isListening ? 'Listening...' : 'Use Voice'}</span>
                </motion.button>

                {/* Right: Send Button */}
                <motion.button
                  type="submit"
                  className="flex items-center gap-2 rounded-full px-8 py-2.5"
                  style={{
                    background: inputValue.trim()
                      ? 'linear-gradient(135deg, #1976D2 0%, #42A5F5 100%)'
                      : 'rgba(0, 0, 0, 0.1)',
                    color: inputValue.trim() ? 'white' : 'rgba(0, 0, 0, 0.3)',
                    fontFamily: 'Source Sans Pro, -apple-system, system-ui, sans-serif',
                    fontWeight: 700,
                    boxShadow: inputValue.trim()
                      ? '0 8px 24px rgba(25, 118, 210, 0.3)'
                      : 'none',
                  }}
                  whileHover={inputValue.trim() ? { scale: 1.05 } : {}}
                  whileTap={inputValue.trim() ? { scale: 0.95 } : {}}
                  disabled={!inputValue.trim()}
                >
                  <span className="text-sm font-bold">Ask Question</span>
                  <Send size={16} strokeWidth={2} />
                </motion.button>
              </div>
            </div>
          </motion.div>
        </form>
      </motion.div>
    );
  }

  // Floating mode - original compact design
  return (
    <form onSubmit={handleSubmit}>
      <motion.div 
        className="fixed bottom-10 left-1/2 z-50 flex h-20 w-[700px] -translate-x-1/2 items-center gap-6 rounded-full px-8"
        style={{
          background: 'rgba(255, 255, 255, 0.3)',
          backdropFilter: 'blur(60px)',
          border: '1px solid rgba(255, 255, 255, 0.4)',
          boxShadow: isActive 
            ? '0 24px 48px rgba(0, 0, 0, 0.12), 0 0 0 1px rgba(25, 118, 210, 0.3), 0 0 40px rgba(25, 118, 210, 0.15)'
            : '0 24px 48px rgba(0, 0, 0, 0.12)',
        }}
        animate={isActive ? {
          boxShadow: [
            '0 24px 48px rgba(0, 0, 0, 0.12), 0 0 0 1px rgba(25, 118, 210, 0.3), 0 0 40px rgba(25, 118, 210, 0.15)',
            '0 24px 48px rgba(0, 0, 0, 0.12), 0 0 0 1px rgba(25, 118, 210, 0.5), 0 0 50px rgba(25, 118, 210, 0.25)',
            '0 24px 48px rgba(0, 0, 0, 0.12), 0 0 0 1px rgba(25, 118, 210, 0.3), 0 0 40px rgba(25, 118, 210, 0.15)',
          ]
        } : {}}
        transition={{ duration: 2, repeat: isActive ? Infinity : 0, ease: 'easeInOut' }}
      >
        {/* Input Field */}
        <div className="flex-1">
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder={isActive ? "Ask follow-up questions..." : "Ask about any medication..."}
            className="w-full bg-transparent text-sm text-black placeholder-black/40 outline-none"
            style={{
              fontFamily: 'Source Sans Pro, -apple-system, system-ui, sans-serif',
              fontWeight: 600,
            }}
          />
        </div>

        {/* Right: Action Buttons */}
        <div className="flex items-center gap-3">
          {/* Audio Waveform Visualization */}
          {isListening && (
            <div className="flex items-center gap-1">
              {[...Array(4)].map((_, i) => (
                <motion.div
                  key={i}
                  className="w-1 rounded-full"
                  style={{ background: '#1976D2' }}
                  animate={{
                    height: [8, 20, 8],
                  }}
                  transition={{
                    duration: 0.6,
                    repeat: Infinity,
                    delay: i * 0.1,
                    ease: 'easeInOut',
                  }}
                />
              ))}
            </div>
          )}

          {/* Mic Button */}
          <motion.button
            type="button"
            onClick={() => setIsListening(!isListening)}
            className="relative flex h-12 w-12 items-center justify-center rounded-full"
            style={{
              background: isListening 
                ? 'linear-gradient(135deg, #1976D2 0%, #42A5F5 100%)'
                : 'rgba(255, 255, 255, 0.5)',
              boxShadow: isListening 
                ? '0 0 0 6px rgba(25, 118, 210, 0.15), 0 6px 20px rgba(25, 118, 210, 0.3)'
                : '0 2px 12px rgba(0, 0, 0, 0.08)',
              border: isListening ? 'none' : '1px solid rgba(0, 0, 0, 0.08)',
            }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            animate={isListening ? {
              scale: [1, 1.08, 1],
            } : {}}
            transition={{
              duration: 1.5,
              repeat: isListening ? Infinity : 0,
              ease: 'easeInOut',
            }}
          >
            <Mic 
              size={20} 
              strokeWidth={2} 
              className={isListening ? 'text-white' : 'text-black/50'}
            />
            
            {/* Pulse Ring */}
            {isListening && (
              <motion.div
                className="absolute inset-0 rounded-full"
                style={{
                  border: '2px solid #1976D2',
                }}
                animate={{
                  scale: [1, 1.6],
                  opacity: [0.6, 0],
                }}
                transition={{
                  duration: 1.5,
                  repeat: Infinity,
                  ease: 'easeOut',
                }}
              />
            )}
          </motion.button>

          {/* Send Button */}
          <motion.button
            type="submit"
            className="flex h-12 w-12 items-center justify-center rounded-full"
            style={{
              background: inputValue.trim() 
                ? 'linear-gradient(135deg, #1976D2 0%, #42A5F5 100%)'
                : 'rgba(0, 0, 0, 0.05)',
              boxShadow: inputValue.trim()
                ? '0 4px 16px rgba(25, 118, 210, 0.3)'
                : 'none',
            }}
            whileHover={inputValue.trim() ? { scale: 1.05 } : {}}
            whileTap={inputValue.trim() ? { scale: 0.95 } : {}}
            disabled={!inputValue.trim()}
          >
            <Send 
              size={18} 
              strokeWidth={2} 
              className={inputValue.trim() ? 'text-white' : 'text-black/30'}
            />
          </motion.button>
        </div>

        {/* Active Context Indicator */}
        {isActive && (
          <motion.div 
            className="absolute -top-10 left-1/2 -translate-x-1/2 rounded-full px-4 py-1.5 text-xs font-medium"
            style={{
              background: 'rgba(25, 118, 210, 0.1)',
              color: '#1976D2',
              border: '1px solid rgba(25, 118, 210, 0.2)',
              fontFamily: 'Source Sans Pro, -apple-system, system-ui, sans-serif',
              fontWeight: 400
            }}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
          >
            Context Active: {currentDrug || 'Jardiance'}
          </motion.div>
        )}

        {/* Hinglish Support Indicator */}
        <div 
          className="absolute -bottom-10 right-0 rounded-full px-3 py-1 text-xs font-medium text-black/50"
          style={{
            background: 'rgba(255, 255, 255, 0.6)',
            backdropFilter: 'blur(12px)',
            border: '1px solid rgba(255, 255, 255, 0.4)',
            fontFamily: 'Source Sans Pro, -apple-system, system-ui, sans-serif',
            fontWeight: 400
          }}
        >
          हिंग्लिश supported
        </div>
      </motion.div>
    </form>
  );
}