/**
 * CompanyOverview — Displays the CompanyOverviewCard from /api/company-profile.
 * Shows company info + hero product with a CTA to drill into the drug profile.
 */

import { motion } from 'motion/react';
import { Building2, Pill, ArrowRight, Sparkles, MapPin } from 'lucide-react';
import ciplaLogo from '../assets/Cipla.png';
import jjLogo from '../assets/jnj.png';
import pfizerLogo from '../assets/pfizer.png';
import emcureLogo from '../assets/Emcure.png';
import sunpharmaLogo from '../assets/sunpharma.svg';
import drreddyLogo from '../assets/drreddy.png';
import lupinLogo from '../assets/lupinlogo.svg';
import astrazenecaLogo from '../assets/astrazeneca.png';
import type { CompanyOverviewCard } from '../types/api';

const LOGO_MAP: Record<string, string> = {
  'Cipla.png': ciplaLogo,
  'pfizer.png': pfizerLogo,
  'jnj.png': jjLogo,
  'Emcure.png': emcureLogo,
  'sunpharma.svg': sunpharmaLogo,
  'drreddy.png': drreddyLogo,
  'lupinlogo.svg': lupinLogo,
  'astrazeneca.png': astrazenecaLogo,
};

const GRADIENT_MAP: Record<string, string> = {
  'Cipla': '#00AEEF',
  'Pfizer': '#0033A0',
  'Johnson & Johnson': '#D51900',
  'Emcure Pharmaceuticals': '#7C4DFF',       // purple
  'Sun Pharma': '#FFB300',                    // amber / yellowish
  "Dr. Reddy's Laboratories": '#E91E63',     // pink
  'Lupin': '#009688',                         // teal
  'AstraZeneca': '#FF7043',                   // warm sunset orange
};

interface CompanyOverviewProps {
  data: CompanyOverviewCard;
  onDrugSelect: (drugName: string) => void;
}

export function CompanyOverview({ data, onDrugSelect }: CompanyOverviewProps) {
  const logoSrc = LOGO_MAP[data.logo_url] || null;
  const gradientBase = GRADIENT_MAP[data.company_name] || '#1976D2';

  if (data.status === 'unknown_company') {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <motion.div
          className="mx-auto max-w-md text-center"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div
            className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full"
            style={{ background: 'rgba(0, 0, 0, 0.05)' }}
          >
            <Building2 size={28} className="text-black/30" strokeWidth={1.5} />
          </div>
          <h2
            className="mb-2 text-2xl font-bold tracking-tight text-black/50"
            style={{ fontFamily: 'Source Sans Pro, -apple-system, system-ui, sans-serif' }}
          >
            Company not found
          </h2>
          <p
            className="text-sm font-semibold text-black/35"
            style={{ fontFamily: 'Source Sans Pro, -apple-system, system-ui, sans-serif' }}
          >
            "{data.company_name}" is not in our database. Try Cipla, Pfizer, Sun Pharma, Dr. Reddy's, Lupin, AstraZeneca, Emcure, or Johnson & Johnson.
          </p>
        </motion.div>
      </div>
    );
  }

  return (
    <div>
      {/* Hero Banner */}
      <motion.div
        className="relative w-full overflow-hidden"
        style={{
          background: `linear-gradient(180deg, ${gradientBase} 0%, ${gradientBase}dd 40%, ${gradientBase}88 70%, ${gradientBase}40 90%, #F5F5F7 100%)`,
          minHeight: '700px',
        }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1, ease: 'easeOut' }}
      >
        <div
          className="absolute inset-0 opacity-10"
          style={{
            backgroundImage: 'radial-gradient(circle at 20% 50%, white 1px, transparent 1px)',
            backgroundSize: '50px 50px',
          }}
        />

        <div className="relative flex h-full min-h-[650px] flex-col items-center justify-center px-8 py-12">
          {/* Logo */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.1 }}
          >
            {logoSrc ? (
              <div className="mb-8 flex items-center justify-center">
                {data.logo_url.endsWith('.svg') ? (
                  /* SVGs often have embedded colors — show on a white pill */
                  <div
                    className="flex items-center justify-center rounded-3xl px-8 py-5"
                    style={{
                      background: 'rgba(255, 255, 255, 0.95)',
                      boxShadow: '0 8px 32px rgba(0, 0, 0, 0.12)',
                    }}
                  >
                    <img
                      src={logoSrc}
                      alt={`${data.company_name} Logo`}
                      style={{
                        height: '70px',
                        width: 'auto',
                        maxWidth: '220px',
                        objectFit: 'contain',
                      }}
                    />
                  </div>
                ) : (
                  /* PNGs — render white on the gradient background */
                  <img
                    src={logoSrc}
                    alt={`${data.company_name} Logo`}
                    style={{
                      height: '100px',
                      width: 'auto',
                      maxWidth: '280px',
                      objectFit: 'contain',
                      filter: 'brightness(0) invert(1)',
                      opacity: 0.95,
                    }}
                  />
                )}
              </div>
            ) : (
              <h1
                className="mb-6 text-7xl font-bold tracking-tight text-white"
                style={{
                  fontFamily: 'Source Sans Pro, -apple-system, system-ui, sans-serif',
                  textShadow: '0 4px 24px rgba(0, 0, 0, 0.2)',
                }}
              >
                {data.company_name}
              </h1>
            )}
          </motion.div>

          {/* Tagline */}
          <motion.div
            className="mb-12 flex items-center gap-2"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <Sparkles size={16} className="text-white" strokeWidth={1} />
            <span
              className="text-sm text-white"
              style={{
                fontFamily: 'Source Sans Pro, -apple-system, system-ui, sans-serif',
                fontWeight: 400,
              }}
            >
              {data.company_name} • {data.tagline}
            </span>
          </motion.div>

          {/* Company Card */}
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
            <div className="mb-6 flex items-center gap-3">
              <Building2 size={24} className="text-black" strokeWidth={2} />
              <h2
                className="text-2xl font-bold text-black"
                style={{ fontFamily: 'Source Sans Pro, -apple-system, system-ui, sans-serif' }}
              >
                About {data.company_name}
              </h2>
            </div>

            <p
              className="mb-6 text-base font-semibold leading-relaxed text-black/90"
              style={{ fontFamily: 'Source Sans Pro, -apple-system, system-ui, sans-serif' }}
            >
              {data.company_description}
            </p>

            {/* Specialties */}
            <div className="mb-6">
              <p
                className="mb-2 text-xs font-normal uppercase tracking-wider text-black/60"
                style={{ fontFamily: 'Source Sans Pro, -apple-system, system-ui, sans-serif' }}
              >
                Therapeutic Areas
              </p>
              <div className="flex flex-wrap gap-2">
                {data.supported_specialties.map((s) => (
                  <span
                    key={s}
                    className="rounded-full px-3 py-1 text-xs font-semibold"
                    style={{
                      background: `${gradientBase}15`,
                      color: gradientBase,
                      border: `1px solid ${gradientBase}30`,
                      fontFamily: 'Source Sans Pro, -apple-system, system-ui, sans-serif',
                    }}
                  >
                    {s}
                  </span>
                ))}
              </div>
            </div>

            {/* Mission */}
            <div
              className="mb-8 rounded-2xl p-4"
              style={{
                background: 'rgba(0, 0, 0, 0.03)',
                border: '1px solid rgba(0, 0, 0, 0.08)',
              }}
            >
              <p
                className="mb-1 text-xs font-normal text-black/50"
                style={{ fontFamily: 'Source Sans Pro, -apple-system, system-ui, sans-serif' }}
              >
                Mission
              </p>
              <p
                className="text-sm font-semibold italic text-black/80"
                style={{ fontFamily: 'Source Sans Pro, -apple-system, system-ui, sans-serif' }}
              >
                "{data.mission_statement}"
              </p>
            </div>

            {/* Hero Product CTA */}
            <motion.div
              className="rounded-2xl p-6"
              style={{
                background: `linear-gradient(135deg, ${gradientBase}0A 0%, ${gradientBase}15 100%)`,
                border: `1px solid ${gradientBase}25`,
              }}
              whileHover={{ scale: 1.01 }}
              transition={{ type: 'spring', stiffness: 300, damping: 20 }}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div
                    className="flex h-12 w-12 items-center justify-center rounded-2xl"
                    style={{ background: `${gradientBase}20` }}
                  >
                    <Pill size={22} style={{ color: gradientBase }} strokeWidth={2} />
                  </div>
                  <div>
                    <p
                      className="text-xs font-normal uppercase tracking-wider text-black/45"
                      style={{ fontFamily: 'Source Sans Pro, -apple-system, system-ui, sans-serif' }}
                    >
                      Hero Product
                    </p>
                    <p
                      className="text-lg font-bold text-black"
                      style={{ fontFamily: 'Source Sans Pro, -apple-system, system-ui, sans-serif' }}
                    >
                      {data.hero_product.drug_name}
                    </p>
                    <p
                      className="mt-0.5 text-xs font-medium text-black/50"
                      style={{ fontFamily: 'Source Sans Pro, -apple-system, system-ui, sans-serif' }}
                    >
                      {data.hero_product.rationale}
                    </p>
                  </div>
                </div>

                <motion.button
                  onClick={() => onDrugSelect(data.hero_product.drug_name)}
                  className="flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-bold text-white"
                  style={{
                    background: `linear-gradient(135deg, ${gradientBase} 0%, ${gradientBase}CC 100%)`,
                    boxShadow: `0 8px 24px ${gradientBase}40`,
                    fontFamily: 'Source Sans Pro, -apple-system, system-ui, sans-serif',
                  }}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  View Drug Profile
                  <ArrowRight size={16} strokeWidth={2} />
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        </div>

        <div
          className="absolute bottom-0 left-0 right-0 h-32"
          style={{
            background: 'linear-gradient(to bottom, transparent, #F5F5F7)',
          }}
        />
      </motion.div>
    </div>
  );
}
