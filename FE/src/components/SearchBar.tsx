/**
 * SearchBar — Top floating search bar with Drug / Company toggle.
 *
 * Drug mode  → POST /api/drug-search (fast, then optionally /api/drug-profile)
 * Company mode → POST /api/company-profile (deterministic, instant)
 *
 * This component NEVER calls /api/ask. That is handled by TalkMore.
 */

import { useState } from 'react';
import { Search, Pill, Building2 } from 'lucide-react';
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
      <div className="fixed bottom-0 left-0 right-0 z-50 flex flex-col items-center pb-6 pt-3"
        style={{
          background: 'linear-gradient(to top, rgba(245,245,247,0.95) 60%, rgba(245,245,247,0) 100%)',
          pointerEvents: 'none',
        }}
      >
        {/* ── Context Indicator (above the bar) ──────────────────────── */}
        <div style={{ pointerEvents: 'auto' }}>
          <AnimatePresence>
            {isActive && currentQuery && (
              <motion.div
                className="mb-2.5 rounded-full px-4 py-1.5 text-xs font-medium"
                style={{
                  background: isDrug ? 'rgba(25, 118, 210, 0.08)' : 'rgba(38, 166, 154, 0.08)',
                  color: isDrug ? '#1976D2' : '#26A69A',
                  border: `1px solid ${isDrug ? 'rgba(25, 118, 210, 0.15)' : 'rgba(38, 166, 154, 0.15)'}`,
                  fontFamily: 'Source Sans Pro, -apple-system, system-ui, sans-serif',
                  fontWeight: 500,
                }}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 8 }}
                transition={{ duration: 0.3 }}
              >
                Viewing {isDrug ? 'drug' : 'company'}: <span style={{ fontWeight: 700 }}>{currentQuery}</span>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* ── Main Bar ───────────────────────────────────────────────── */}
        <motion.div
          className="flex items-center gap-3 px-2.5"
          style={{
            height: '60px',
            width: '720px',
            borderRadius: '9999px',
            background: 'rgba(255, 255, 255, 0.65)',
            backdropFilter: 'blur(60px) saturate(180%)',
            WebkitBackdropFilter: 'blur(60px) saturate(180%)',
            border: '1px solid rgba(255, 255, 255, 0.5)',
            boxShadow: isActive
              ? `0 16px 40px rgba(0, 0, 0, 0.10), 0 0 0 1px ${isDrug ? 'rgba(25, 118, 210, 0.18)' : 'rgba(38, 166, 154, 0.18)'}, 0 0 30px ${isDrug ? 'rgba(25, 118, 210, 0.06)' : 'rgba(38, 166, 154, 0.06)'}`
              : '0 16px 40px rgba(0, 0, 0, 0.10), 0 2px 8px rgba(0, 0, 0, 0.04)',
            pointerEvents: 'auto',
          }}
        >
          {/* ── Mode Toggle ────────────────────────────────────────── */}
          <div
            className="relative flex shrink-0 items-center p-[3px]"
            style={{
              height: '44px',
              borderRadius: '9999px',
              background: 'rgba(0, 0, 0, 0.06)',
              border: '1px solid rgba(0, 0, 0, 0.04)',
            }}
          >
            <button
              type="button"
              onClick={() => onModeChange('drug')}
              className="relative z-10 flex items-center gap-[6px] py-2 transition-colors duration-200"
              style={{
                fontFamily: 'Source Sans Pro, -apple-system, system-ui, sans-serif',
                color: isDrug ? 'white' : 'rgba(0, 0, 0, 0.50)',
                fontWeight: isDrug ? 700 : 600,
                fontSize: '13px',
                paddingLeft: '16px',
                paddingRight: '16px',
                borderRadius: '9999px',
                letterSpacing: '0.01em',
              }}
            >
              <Pill size={14} strokeWidth={2.5} />
              Drug
            </button>
            <button
              type="button"
              onClick={() => onModeChange('company')}
              className="relative z-10 flex items-center gap-[6px] py-2 transition-colors duration-200"
              style={{
                fontFamily: 'Source Sans Pro, -apple-system, system-ui, sans-serif',
                color: !isDrug ? 'white' : 'rgba(0, 0, 0, 0.50)',
                fontWeight: !isDrug ? 700 : 600,
                fontSize: '13px',
                paddingLeft: '16px',
                paddingRight: '16px',
                borderRadius: '9999px',
                letterSpacing: '0.01em',
              }}
            >
              <Building2 size={14} strokeWidth={2.5} />
              Company
            </button>
            {/* Sliding pill indicator */}
            <motion.div
              className="absolute"
              style={{
                top: '3px',
                bottom: '3px',
                borderRadius: '9999px',
                background: isDrug
                  ? 'linear-gradient(135deg, #1976D2 0%, #42A5F5 100%)'
                  : 'linear-gradient(135deg, #26A69A 0%, #4DB6AC 100%)',
                boxShadow: isDrug
                  ? '0 3px 10px rgba(25, 118, 210, 0.35)'
                  : '0 3px 10px rgba(38, 166, 154, 0.35)',
              }}
              animate={{
                left: isDrug ? '3px' : '50%',
                right: isDrug ? '50%' : '3px',
              }}
              transition={{ type: 'spring', stiffness: 380, damping: 32 }}
            />
          </div>

          {/* ── Subtle Divider ──────────────────────────────────────── */}
          <div className="h-7 w-px shrink-0" style={{ background: 'rgba(0, 0, 0, 0.08)' }} />

          {/* ── Search Input ───────────────────────────────────────── */}
          <div className="flex flex-1 items-center gap-2.5 pl-1">
            <Search size={17} className="shrink-0" strokeWidth={2} style={{ color: 'rgba(0, 0, 0, 0.28)' }} />
            <AnimatePresence mode="wait">
              <motion.input
                key={mode}
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder={
                  isDrug
                    ? (isActive ? 'Search another drug…' : 'Search for a drug…')
                    : (isActive ? 'Search another company…' : 'Search for a company…')
                }
                className="w-full bg-transparent outline-none"
                style={{
                  fontFamily: 'Source Sans Pro, -apple-system, system-ui, sans-serif',
                  fontWeight: 500,
                  fontSize: '14.5px',
                  color: 'rgba(0, 0, 0, 0.8)',
                  letterSpacing: '0.005em',
                }}
                initial={{ opacity: 0, x: 8 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -8 }}
                transition={{ duration: 0.12 }}
              />
            </AnimatePresence>
          </div>

          {/* ── Send Button ────────────────────────────────────────── */}
          <motion.button
            type="submit"
            className="flex shrink-0 items-center justify-center"
            style={{
              height: '44px',
              width: '44px',
              borderRadius: '9999px',
              background: inputValue.trim()
                ? isDrug
                  ? 'linear-gradient(135deg, #1976D2 0%, #42A5F5 100%)'
                  : 'linear-gradient(135deg, #26A69A 0%, #4DB6AC 100%)'
                : 'rgba(0, 0, 0, 0.04)',
              boxShadow: inputValue.trim()
                ? isDrug
                  ? '0 4px 14px rgba(25, 118, 210, 0.30)'
                  : '0 4px 14px rgba(38, 166, 154, 0.30)'
                : 'none',
              transition: 'background 0.2s, box-shadow 0.2s',
            }}
            whileHover={inputValue.trim() ? { scale: 1.06 } : {}}
            whileTap={inputValue.trim() ? { scale: 0.94 } : {}}
            disabled={!inputValue.trim()}
          >
            <Search
              size={17}
              strokeWidth={2.2}
              style={{ color: inputValue.trim() ? 'white' : 'rgba(0, 0, 0, 0.25)' }}
            />
          </motion.button>
        </motion.div>
      </div>
    </form>
  );
}
