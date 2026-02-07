import { motion } from 'motion/react';

interface DrugIdentityProps {
  drugDisplay?: {
    name: string;
    subtitle?: string | null;
    description?: string | null;
  };
  brandColor: string;
  brandName: string;
}

export function DrugIdentity({ drugDisplay, brandColor, brandName }: DrugIdentityProps) {
  if (!drugDisplay) return null;

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
      transition={{ duration: 0.7, delay: 0.2 }}
    >
      <div className="flex items-center justify-between gap-12">
        {/* Left: Drug Information */}
        <div className="flex-1">
          <h2 
            className="mb-4 font-bold tracking-tight text-black"
            style={{ 
              fontSize: '72px', 
              lineHeight: '1',
              fontFamily: 'Source Sans Pro, -apple-system, system-ui, sans-serif' 
            }}
          >
            {drugDisplay.name}
          </h2>
          {drugDisplay.subtitle && (
            <p 
              className="mb-6 text-2xl font-semibold text-black/60"
              style={{ fontFamily: 'Source Sans Pro, -apple-system, system-ui, sans-serif' }}
            >
              {drugDisplay.subtitle}
            </p>
          )}
          
          {/* Description */}
          {drugDisplay.description && (
            <p 
              className="mb-8 text-lg leading-relaxed font-semibold text-black/70"
              style={{ fontFamily: 'Source Sans Pro, -apple-system, system-ui, sans-serif' }}
            >
              {drugDisplay.description}
            </p>
          )}

          {/* Classification Badge */}
          {brandName && (
            <div className="flex flex-wrap items-center gap-3">
              <span 
                className="rounded-full px-5 py-2 text-sm font-normal"
                style={{
                  background: `${brandColor}20`,
                  color: brandColor,
                  fontFamily: 'Source Sans Pro, -apple-system, system-ui, sans-serif'
                }}
              >
                {brandName} Product
              </span>
            </div>
          )}
        </div>

        {/* Right: 3D Abstract Medical Graphic */}
        <div className="relative h-80 w-80 flex-shrink-0">
          <div 
            className="absolute inset-0"
            style={{
              background: `linear-gradient(135deg, ${brandColor} 0%, ${brandColor}dd 50%, ${brandColor}aa 100%)`,
              borderRadius: '40% 60% 70% 30% / 40% 50% 60% 50%',
              boxShadow: `
                0 0 80px ${brandColor}40,
                inset 0 0 60px rgba(255, 255, 255, 0.3)
              `,
              animation: 'morphBlob 8s ease-in-out infinite, rotate3D 20s linear infinite',
              transform: 'translateZ(0)',
            }}
          />
          
          {/* Glossy Highlight */}
          <div 
            className="absolute inset-0"
            style={{
              background: 'linear-gradient(135deg, transparent 0%, rgba(255, 255, 255, 0.6) 40%, transparent 80%)',
              borderRadius: '40% 60% 70% 30% / 40% 50% 60% 50%',
              animation: 'shimmer 4s ease-in-out infinite',
            }}
          />

          {/* Inner Glow */}
          <div 
            className="absolute inset-8"
            style={{
              background: 'radial-gradient(circle, rgba(255, 255, 255, 0.4) 0%, transparent 70%)',
              borderRadius: '50%',
            }}
          />
        </div>
      </div>

      <style jsx>{`
        @keyframes morphBlob {
          0%, 100% {
            border-radius: 40% 60% 70% 30% / 40% 50% 60% 50%;
            transform: scale(1) translateY(0);
          }
          25% {
            border-radius: 60% 40% 30% 70% / 50% 60% 40% 50%;
            transform: scale(1.05) translateY(-10px);
          }
          50% {
            border-radius: 30% 70% 50% 50% / 60% 30% 70% 40%;
            transform: scale(0.95) translateY(5px);
          }
          75% {
            border-radius: 70% 30% 60% 40% / 30% 50% 50% 70%;
            transform: scale(1.03) translateY(-5px);
          }
        }

        @keyframes rotate3D {
          0% {
            transform: rotateY(0deg) rotateX(0deg);
          }
          100% {
            transform: rotateY(360deg) rotateX(360deg);
          }
        }

        @keyframes shimmer {
          0%, 100% {
            opacity: 0.3;
            transform: translateX(-20px);
          }
          50% {
            opacity: 0.8;
            transform: translateX(20px);
          }
        }
      `}</style>
    </motion.div>
  );
}