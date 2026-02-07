import { motion } from 'motion/react';
import { CheckCircle, Clock, Shield, XCircle, AlertCircle } from 'lucide-react';

interface CoverageScheme {
  status: string;
  color: string;
  label: string;
}

interface CoverageStatusProps {
  coverageData?: {
    government: CoverageScheme | null;
    corporate: CoverageScheme | null;
    private: CoverageScheme | null;
  };
}

/** Scheme display names matching the backend locked mapping */
const SCHEME_TITLES: Record<string, { title: string; scheme: string }> = {
  government: { title: 'Government Schemes', scheme: 'Ayushman Bharat' },
  corporate: { title: 'Corporate', scheme: 'CGHS' },
  private: { title: 'Private TPA', scheme: 'Private Insurance' },
};

export function CoverageStatus({ coverageData }: CoverageStatusProps) {
  if (!coverageData) return null;

  const getIconAndStyle = (baseColor: string) => {
=======
interface CoverageScheme {
  status: string;
  color: string;
  label: string;
}

interface CoverageStatusProps {
  coverageData?: {
    government: CoverageScheme | null;
    corporate: CoverageScheme | null;
    private: CoverageScheme | null;
  };
}

/** Scheme display names matching the backend locked mapping */
const SCHEME_TITLES: Record<string, { title: string; scheme: string }> = {
  government: { title: 'Government Schemes', scheme: 'Ayushman Bharat' },
  corporate: { title: 'Corporate', scheme: 'CGHS' },
  private: { title: 'Private TPA', scheme: 'Private Insurance' },
};

export function CoverageStatus({ coverageData }: CoverageStatusProps) {
  if (!coverageData) return null;

  const getIconAndStyle = (baseColor: string) => {
    const colorMap: Record<string, { bg: string; text: string; glow: string; icon: any }> = {
      'green': {
        bg: 'rgba(46, 125, 50, 0.15)',
        text: '#2E7D32',
        glow: 'rgba(46, 125, 50, 0.2)',
        icon: CheckCircle,
      },
      'blue': {
        bg: 'rgba(25, 118, 210, 0.15)',
        text: '#1976D2',
        glow: 'rgba(25, 118, 210, 0.2)',
        icon: Shield,
      },
      'yellow': {
        bg: 'rgba(245, 127, 23, 0.15)',
        text: '#F57F17',
        glow: 'rgba(245, 127, 23, 0.2)',
        icon: Clock,
      },
      'red': {
        bg: 'rgba(211, 47, 47, 0.15)',
        text: '#D32F2F',
        glow: 'rgba(211, 47, 47, 0.2)',
        icon: XCircle,
      },
      'grey': {
        bg: 'rgba(97, 97, 97, 0.15)',
        text: '#616161',
        glow: 'rgba(97, 97, 97, 0.2)',
        icon: XCircle,
      },
    };

    return colorMap[baseColor] || colorMap.blue;
  };

  // Build items from non-null slots
  const slotKeys = ['government', 'corporate', 'private'] as const;
  const coverageItems = slotKeys
    .filter((key) => coverageData[key] !== null && coverageData[key] !== undefined)
    .map((key) => {
      const slot = coverageData[key]!;
      const info = SCHEME_TITLES[key];
      return {
        title: info.title,
        scheme: info.scheme,
        status: slot.status,
        color: slot.color,
        label: slot.label,
      };
    });

  if (coverageItems.length === 0) return null;

  return (
    <div id="access" className="scroll-mt-32">
      {/* Section Title */}
      <div className="mb-6">
        <h3 
          className="text-3xl font-bold tracking-tight text-black"
          style={{ fontFamily: 'Source Sans Pro, -apple-system, system-ui, sans-serif' }}
        >
          Patient Coverage
        </h3>
        <p 
          className="mt-2 text-base font-normal text-black/50"
          style={{ fontFamily: 'Source Sans Pro, -apple-system, system-ui, sans-serif' }}
        >
          Real-time reimbursement status & affordability
        </p>
      </div>

      {/* Three Horizontal Glass Badges */}
      <div className="grid grid-cols-3 gap-4">
        {coverageItems.map((item, index) => {
          const styling = getIconAndStyle(item.color);
          const Icon = styling.icon;
          
          return (
            <motion.div
              key={index}
              className="group relative overflow-hidden rounded-[28px] p-8 transition-all hover:scale-[1.02]"
              style={{
                background: 'rgba(255, 255, 255, 0.6)',
                backdropFilter: 'blur(60px)',
                border: '1px solid rgba(255, 255, 255, 0.4)',
                boxShadow: '0 12px 32px rgba(0, 0, 0, 0.08)'
              }}
              whileHover={{ y: -4 }}
              transition={{ duration: 0.2 }}
            >
              {/* Status Badge - Top */}
              <div 
                className="mb-6 inline-flex items-center gap-2 rounded-full px-4 py-2 text-xs font-normal uppercase tracking-wider"
                style={{
                  background: styling.bg,
                  color: styling.text,
                  fontFamily: 'Source Sans Pro, -apple-system, system-ui, sans-serif'
                }}
              >
                <Icon size={14} strokeWidth={2.5} />
                {item.status}
              </div>

              {/* Scheme Name - Large */}
              <h4 
                className="mb-2 text-2xl font-bold text-black/80"
                style={{ fontFamily: 'Source Sans Pro, -apple-system, system-ui, sans-serif' }}
              >
                {item.scheme}
              </h4>

              {/* Category Label */}
              <p 
                className="text-sm font-semibold text-black/50"
                style={{ fontFamily: 'Source Sans Pro, -apple-system, system-ui, sans-serif' }}
              >
                {item.title} • {item.label}
              </p>

              {/* Background Icon - Decorative */}
              <div 
                className="absolute -bottom-4 -right-4 opacity-5"
                style={{
                  color: styling.text,
                }}
              >
                <Icon size={120} strokeWidth={1} />
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
