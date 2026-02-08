/**
 * SearchBar — Top floating search bar with Drug / Company toggle.
 *
 * Drug mode  → POST /api/drug-search (fast, then optionally /api/drug-profile)
 * Company mode → POST /api/company-profile (deterministic, instant)
 *
 * This component NEVER calls /api/ask. That is handled by TalkMore.
 */

import { useState } from 'react';
import { Search, Pill, Building2, Factory } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export type SearchMode = 'drug' | 'company';

interface SearchBarProps {
  onDrugSearch: (query: string) => void;
  onCompanySearch: (query: string) => void;
  isActive: boolean;
  currentQuery?: string;
  mode: SearchMode;
  onModeChange: (mode: SearchMode) => void;
}

export function SearchBar({
  onDrugSearch,
  onCompanySearch,
  isActive,
  currentQuery,
  mode,
  onModeChange
}: SearchBarProps) {
  const [inputValue, setInputValue] = useState('');
  const [isFocused, setIsFocused] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim()) return;

    if (mode === 'drug') {
      onDrugSearch(inputValue.trim());
    } else {
      onCompanySearch(inputValue.trim());
    }
    setInputValue('');
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const isDrug = mode === 'drug';

  return (
    <form onSubmit={handleSubmit}>
<<<<<<< HEAD
      <div
        className="fixed bottom-0 left-0 right-0 z-40 flex flex-col items-center pb-12 pt-6"
        style={{
          background: 'linear-gradient(to top, rgba(245,245,247,0.98) 70%, rgba(245,245,247,0) 100%)',
=======
      <div className="fixed bottom-0 left-0 right-0 z-50 flex flex-col items-center pb-[12vh] pt-3"
        style={{
          background: 'linear-gradient(to top, rgba(245,245,247,0.95) 40%, rgba(245,245,247,0) 100%)',
>>>>>>> 74fc2625c535ba4f254a723aa2f01bd97f0e9d10
          pointerEvents: 'none',
        }}
      >
        {/* ── Context Indicator (above the bar) ──────────────────────── */}
        <div style={{ pointerEvents: 'auto' }}>
          <AnimatePresence>
            {isActive && currentQuery && (
              <motion.div
                className="mb-4 px-5 py-2"
                style={{
                  background: 'rgba(255, 255, 255, 0.65)',
                  backdropFilter: 'blur(50px)',
                  WebkitBackdropFilter: 'blur(50px)',
                  borderRadius: '32px',
                  border: '1px solid rgba(255, 255, 255, 0.8)',
                  boxShadow: '0 8px 32px rgba(0, 0, 0, 0.08)',
                  fontFamily: 'Source Sans Pro, -apple-system, system-ui, sans-serif',
                  fontSize: '13px',
                  fontWeight: 600,
                  color: 'rgba(0, 0, 0, 0.6)',
                }}
                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 10, scale: 0.95 }}
                transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
              >
                <span style={{ opacity: 0.5 }}>Viewing {isDrug ? 'drug' : 'company'}:</span>{' '}
                <span style={{ fontWeight: 700, color: 'rgba(0, 0, 0, 0.8)' }}>{currentQuery}</span>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* ── Main Bar ───────────────────────────────────────────────── */}
        <motion.div
          className="flex items-center gap-4 px-4"
          style={{
            height: '68px',
            width: '780px',
            borderRadius: '32px',
            background: 'rgba(255, 255, 255, 0.65)',
            backdropFilter: 'blur(50px)',
            WebkitBackdropFilter: 'blur(50px)',
            border: isFocused || isActive
              ? '1.5px solid rgba(255, 255, 255, 0.9)'
              : '1px solid rgba(255, 255, 255, 0.8)',
            boxShadow: isFocused
              ? '0 20px 60px rgba(0, 0, 0, 0.12), 0 0 0 4px rgba(0, 122, 255, 0.06)'
              : isActive
                ? '0 16px 48px rgba(0, 0, 0, 0.10)'
                : '0 12px 40px rgba(0, 0, 0, 0.08)',
            pointerEvents: 'auto',
            transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
          }}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        >
          {/* ── Mode Toggle ────────────────────────────────────────── */}
          <div
            className="relative flex shrink-0 items-center p-1"
            style={{
              height: '60px',
              width: '280px',
              borderRadius: '30px',
              background: 'rgba(0, 0, 0, 0.04)',
              border: '1px solid rgba(0, 0, 0, 0.06)',
              overflow: 'hidden',
            }}
          >
            {/* Sliding background indicator */}
            <motion.div
              className="absolute"
              style={{
                top: '4px',
                bottom: '4px',
                left: '4px',
                width: isDrug ? '100px' : '164px',
                borderRadius: '26px',
                background: isDrug
                  ? 'linear-gradient(135deg, #1976D2 0%, #42A5F5 100%)'
                  : 'linear-gradient(135deg, #26A69A 0%, #4DB6AC 100%)',
                boxShadow: isDrug
                  ? '0 4px 16px rgba(25, 118, 210, 0.30), 0 2px 8px rgba(25, 118, 210, 0.20)'
                  : '0 4px 16px rgba(38, 166, 154, 0.30), 0 2px 8px rgba(38, 166, 154, 0.20)',
              }}
              animate={{
                x: isDrug ? 0 : '108px',
              }}
              transition={{
                type: 'spring',
                stiffness: 400,
                damping: 30,
                mass: 0.8
              }}
            />

            <button
              type="button"
              onClick={() => onModeChange('drug')}
              className="relative z-10 flex items-center justify-center gap-2 px-6 py-3 transition-all duration-200"
              style={{
                width: '108px',
                fontFamily: 'Source Sans Pro, -apple-system, system-ui, sans-serif',
                color: isDrug ? 'white' : 'rgba(0, 0, 0, 0.45)',
                fontWeight: isDrug ? 700 : 600,
                fontSize: '15px',
                letterSpacing: '0.01em',
              }}
            >
              <Pill size={18} strokeWidth={2.5} />
              Drug
            </button>
            <button
              type="button"
              onClick={() => onModeChange('company')}
              className="relative z-10 flex items-center justify-center gap-2 px-6 py-3 transition-all duration-200"
              style={{
                width: '164px',
                fontFamily: 'Source Sans Pro, -apple-system, system-ui, sans-serif',
                color: !isDrug ? 'white' : 'rgba(0, 0, 0, 0.45)',
                fontWeight: !isDrug ? 700 : 600,
                fontSize: '15px',
                letterSpacing: '0.01em',
              }}
            >
              <Factory size={18} strokeWidth={2.5} />
              Company
            </button>
          </div>

          {/* ── Subtle Divider ──────────────────────────────────────── */}
          <div className="h-7 w-px shrink-0" style={{ background: 'rgba(0, 0, 0, 0.08)' }} />

          {/* ── Search Input ───────────────────────────────────────── */}
          <div className="flex flex-1 items-center gap-3 pl-1">
            <Search
              size={18}
              className="shrink-0"
              strokeWidth={2}
              style={{ color: isFocused ? 'rgba(0, 0, 0, 0.4)' : 'rgba(0, 0, 0, 0.25)', transition: 'color 0.2s' }}
            />
            <AnimatePresence mode="wait">
              <motion.input
                key={mode}
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyPress={handleKeyPress}
                onFocus={() => setIsFocused(true)}
                onBlur={() => setIsFocused(false)}
                placeholder={
                  isDrug
                    ? (isActive ? 'Search another drug…' : 'Search for a drug…')
                    : (isActive ? 'Search another company…' : 'Search for a company…')
                }
                className="w-full bg-transparent outline-none placeholder:transition-colors"
                style={{
                  fontFamily: 'Source Sans Pro, -apple-system, system-ui, sans-serif',
                  fontWeight: 600,
                  fontSize: '15px',
                  color: 'rgba(0, 0, 0, 0.85)',
                  letterSpacing: '0.005em',
                }}
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
              />
            </AnimatePresence>
          </div>

          {/* ── Send Button ────────────────────────────────────────── */}
          <motion.button
            type="submit"
            className="flex shrink-0 items-center justify-center"
            style={{
              height: '52px',
              width: '52px',
              borderRadius: '26px',
              background: inputValue.trim()
                ? isDrug
                  ? 'linear-gradient(135deg, #1976D2 0%, #42A5F5 100%)'
                  : 'linear-gradient(135deg, #26A69A 0%, #4DB6AC 100%)'
                : 'rgba(0, 0, 0, 0.04)',
              boxShadow: inputValue.trim()
                ? isDrug
                  ? '0 6px 20px rgba(25, 118, 210, 0.35)'
                  : '0 6px 20px rgba(38, 166, 154, 0.35)'
                : 'none',
              transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
            }}
            whileHover={inputValue.trim() ? { scale: 1.05 } : {}}
            whileTap={inputValue.trim() ? { scale: 0.95 } : {}}
            disabled={!inputValue.trim()}
          >
            <Search
              size={18}
              strokeWidth={2.5}
              style={{ color: inputValue.trim() ? 'white' : 'rgba(0, 0, 0, 0.25)' }}
            />
          </motion.button>
        </motion.div>
      </div>
    </form>
  );
}