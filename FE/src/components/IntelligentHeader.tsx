import { motion } from 'motion/react';
import { Sparkles, Building2 } from 'lucide-react';
import ciplaLogo from '../assets/Cipla.png';
import jjLogo from '../assets/jnj.png';
import pfizerLogo from '../assets/pfizer.png';

/** Map company name → local logo asset */
const LOGO_MAP: Record<string, string> = {
  'Cipla': ciplaLogo,
  'Pfizer': pfizerLogo,
  'Johnson & Johnson': jjLogo,
};

/** Map backend background_gradient token → CSS gradient color */
const GRADIENT_COLOR_MAP: Record<string, string> = {
  'light_blue': '#00AEEF',
  'deep_blue': '#0033A0',
  'orange': '#D51900',
};

interface IntelligentHeaderProps {
  brand?: {
    name: string;
    color: string;
    tagline: string;
    division?: string;
    background_gradient?: string;
  };
  company?: {
    overview: string;
    specialties: string;
    stats: Record<string, string>;
    mission: string;
  };
  drugName: string;
}

export function IntelligentHeader({ brand, company, drugName }: IntelligentHeaderProps) {
  // Provide defaults for unknown drugs (no brand in brands.json)
  const effectiveBrand = brand || {
    name: '',
    color: '#1976D2',
    tagline: '',
    division: undefined,
    background_gradient: undefined,
  };

  // Use background_gradient token if available, else fall back to brand.color
  const gradientBase = effectiveBrand.background_gradient
    ? (GRADIENT_COLOR_MAP[effectiveBrand.background_gradient] || effectiveBrand.color)
    : effectiveBrand.color;

  // Resolve logo from company name
  const logoSrc = LOGO_MAP[effectiveBrand.name] || null;

  // Darker gradient for Cipla
  const isCipla = effectiveBrand.name === 'Cipla';
  const gradientOpacity = isCipla 
    ? { start: '', mid1: 'dd', mid2: '88', end: '40' } 
    : { start: 'ee', mid1: '99', mid2: '70', end: '40' };

  return (
    <motion.div 
      className="relative w-full overflow-hidden"
      style={{
        background: `linear-gradient(180deg, ${gradientBase}${gradientOpacity.start} 0%, ${gradientBase}${gradientOpacity.mid1} 40%, ${gradientBase}${gradientOpacity.mid2} 70%, ${gradientBase}${gradientOpacity.end} 90%, #F5F5F7 100%)`,
        minHeight: '1000px',
      }}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 1, ease: 'easeOut' }}
    >
      {/* Subtle Pattern Overlay */}
      <div 
        className="absolute inset-0 opacity-10"
        style={{
          backgroundImage: `radial-gradient(circle at 20% 50%, white 1px, transparent 1px)`,
          backgroundSize: '50px 50px',
        }}
      />

      {/* Content - Centered */}
      <div className="relative flex h-full min-h-[900px] flex-col items-center justify-center px-[33px] py-[33px]">
        {/* Detected Brand Logo */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, delay: 0.1 }}
        >
          {logoSrc ? (
            <img 
              src={logoSrc} 
              alt={`${effectiveBrand.name} Logo`} 
              className="mb-6"
              style={{
                height: '100px',
                width: 'auto',
                filter: 'brightness(0) invert(1)',
                opacity: 1,
              }}
            />
          ) : (
            <h1 
              className="mb-6 text-7xl font-bold tracking-tight text-white"
              style={{
                fontFamily: 'Source Sans Pro, -apple-system, system-ui, sans-serif',
                textShadow: '0 4px 24px rgba(0, 0, 0, 0.2)',
              }}
            >
              {effectiveBrand.name || drugName}
            </h1>
          )}
        </motion.div>

        {/* Tagline */}
        <motion.div
          className="flex items-center gap-2 mb-12"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          <Sparkles size={16} className="text-white" strokeWidth={1} />
          <span 
            className="text-sm text-white"
            style={{ 
              fontFamily: 'Source Sans Pro, -apple-system, system-ui, sans-serif',
              fontWeight: 400
            }}
          >
            {effectiveBrand.name ? `${effectiveBrand.name} • ${effectiveBrand.tagline}` : drugName}
          </span>
        </motion.div>

        {/* Company Information Section */}
        {company && (
          <motion.div
            className="w-full max-w-[800px] rounded-[32px] p-10"
            style={{
              background: 'rgba(255, 255, 255)',
              backdropFilter: 'blur(40px)',
              border: '1px solid rgba(255, 255, 255, 0.4)',
            }}
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.3 }}
          >
            {/* Company Icon + Name */}
            <div className="mb-6 flex items-center gap-3">
              <Building2 size={24} className="text-black" strokeWidth={2} />
              <h2 
                className="text-2xl font-bold text-black"
                style={{ fontFamily: 'Source Sans Pro, -apple-system, system-ui, sans-serif' }}
              >
                About {effectiveBrand.name || drugName}
              </h2>
            </div>

            {/* Overview */}
            <p 
              className="mb-6 text-base leading-relaxed font-semibold text-black/90"
              style={{ fontFamily: 'Source Sans Pro, -apple-system, system-ui, sans-serif' }}
            >
              {company.overview}
            </p>

            {/* Specialties */}
            <div className="mb-6">
              <p 
                className="mb-2 text-xs font-normal uppercase tracking-wider text-black/60"
                style={{ fontFamily: 'Source Sans Pro, -apple-system, system-ui, sans-serif' }}
              >
                Therapeutic Areas
              </p>
              <p 
                className="text-sm font-semibold text-black/80"
                style={{ fontFamily: 'Source Sans Pro, -apple-system, system-ui, sans-serif' }}
              >
                {company.specialties}
              </p>
            </div>

            {/* Stats Grid */}
            <div className="mb-6 grid grid-cols-4 gap-4">
              {Object.entries(company.stats).map(([key, value]) => (
                <div 
                  key={key}
                  className="rounded-2xl p-3"
                  style={{
                    background: 'rgba(255, 255, 255, 0.1)',
                    border: '1px solid rgba(0, 0, 0, 0.2)',
                  }}
                >
                  <p 
                    className="mb-1 text-xs font-normal text-black/60"
                    style={{ fontFamily: 'Source Sans Pro, -apple-system, system-ui, sans-serif' }}
                  >
                    {key.charAt(0).toUpperCase() + key.slice(1)}
                  </p>
                  <p 
                    className="text-sm font-bold text-black"
                    style={{ fontFamily: 'Source Sans Pro, -apple-system, system-ui, sans-serif' }}
                  >
                    {value}
                  </p>
                </div>
              ))}
            </div>

            {/* Mission */}
            <div 
              className="rounded-2xl p-4"
              style={{
                background: 'rgba(255, 255, 255, 0.08)',
                border: '1px solid rgba(0, 0, 0, 0.15)',
              }}
            >
              <p 
                className="mb-1 text-xs font-normal text-black/60"
                style={{ fontFamily: 'Source Sans Pro, -apple-system, system-ui, sans-serif' }}
              >
                Mission
              </p>
              <p 
                className="text-sm font-semibold italic text-black/90"
                style={{ fontFamily: 'Source Sans Pro, -apple-system, system-ui, sans-serif' }}
              >
                "{company.mission}"
              </p>
            </div>
          </motion.div>
        )}
      </div>

      {/* Bottom Fade Edge - Seamless Transition */}
      <div 
        className="absolute bottom-0 left-0 right-0 h-32"
        style={{
          background: 'linear-gradient(to bottom, transparent, #F5F5F7)',
        }}
      />
    </motion.div>
  );
}