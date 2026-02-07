import { Phone } from 'lucide-react';
import { motion } from 'motion/react';

export function FloatingCallButton() {
  return (
    <motion.button
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
  );
}
