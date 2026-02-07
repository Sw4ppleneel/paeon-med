import { motion } from 'motion/react';

interface MechanismCardProps {
  mechanismData?: {
    title: string;
    text: string;
  };
}

export function MechanismCard({ mechanismData }: MechanismCardProps) {
  if (!mechanismData) return null;

  return (
    <motion.div 
      className="rounded-[32px] p-12"
      style={{
        background: 'rgba(255, 255, 255, 0.6)',
        backdropFilter: 'blur(60px)',
        border: '1px solid rgba(255, 255, 255, 0.4)',
        boxShadow: '0 20px 40px rgba(0, 0, 0, 0.08)'
      }}
      initial={{ opacity: 0, y: 40 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.7, delay: 0.4 }}
    >
      {/* Title */}
      <div className="mb-8">
        <h3 
          className="text-3xl font-bold tracking-tight text-black"
          style={{ fontFamily: 'Source Sans Pro, -apple-system, system-ui, sans-serif' }}
        >
          Mechanism of Action
        </h3>
        <p 
          className="mt-2 text-base font-normal text-black/50"
          style={{ fontFamily: 'Source Sans Pro, -apple-system, system-ui, sans-serif' }}
        >
          {mechanismData.title}
        </p>
      </div>

      {/* Content */}
      <div 
        className="rounded-3xl p-8"
        style={{
          background: 'linear-gradient(135deg, rgba(38, 166, 154, 0.1) 0%, rgba(38, 166, 154, 0.05) 100%)',
          border: '1px solid rgba(38, 166, 154, 0.2)',
        }}
      >
        <p 
          className="text-lg leading-relaxed font-semibold text-black/80"
          style={{ 
            fontFamily: 'Source Sans Pro, -apple-system, system-ui, sans-serif' 
          }}
        >
          {mechanismData.text}
        </p>
      </div>

      {/* Visual Diagram Placeholder */}
      <div className="mt-8 flex justify-center">
        <div 
          className="flex items-center justify-center rounded-3xl"
          style={{
            background: 'linear-gradient(135deg, rgba(38, 166, 154, 0.1) 0%, rgba(25, 118, 210, 0.1) 100%)',
            border: '1px solid rgba(255, 255, 255, 0.5)',
            width: '100%',
            minHeight: '200px',
          }}
        >
          {/* Animated Abstract Visual */}
          <div className="relative h-32 w-32">
            <motion.div 
              className="absolute inset-0 rounded-full"
              style={{
                background: 'linear-gradient(135deg, #26A69A 0%, #1976D2 100%)',
                opacity: 0.3,
              }}
              animate={{
                scale: [1, 1.2, 1],
                rotate: [0, 180, 360],
              }}
              transition={{
                duration: 8,
                repeat: Infinity,
                ease: 'easeInOut',
              }}
            />
            <motion.div 
              className="absolute inset-0 rounded-full"
              style={{
                background: 'linear-gradient(135deg, #1976D2 0%, #26A69A 100%)',
                opacity: 0.3,
              }}
              animate={{
                scale: [1.2, 1, 1.2],
                rotate: [360, 180, 0],
              }}
              transition={{
                duration: 8,
                repeat: Infinity,
                ease: 'easeInOut',
              }}
            />
          </div>
        </div>
      </div>
    </motion.div>
  );
}