import { motion } from 'motion/react';
import { TrendingUp } from 'lucide-react';

interface ComparisonTableProps {
  comparisonData?: {
    competitor: string;
    rows: Array<{
      metric: string;
      value: string;
      competitorValue: string;
      winner: boolean;
    }>;
  };
  brandColor: string;
}

export function ComparisonTable({ comparisonData, brandColor }: ComparisonTableProps) {
  if (!comparisonData) return null;

  return (
    <div id="comparison" className="scroll-mt-32">
      {/* Section Header */}
      <div className="mb-8">
        <h3 
          className="text-3xl font-bold tracking-tight text-black"
          style={{ fontFamily: 'Source Sans Pro, -apple-system, system-ui, sans-serif' }}
        >
          Clinical Superiority
        </h3>
        <p 
          className="mt-2 text-base font-normal text-black/50"
          style={{ fontFamily: 'Source Sans Pro, -apple-system, system-ui, sans-serif' }}
        >
          Head-to-head comparison vs. {comparisonData.competitor}
        </p>
      </div>

      {/* Comparison Table */}
      <motion.div
        className="rounded-[32px] overflow-hidden"
        style={{
          background: 'rgba(255, 255, 255, 0.6)',
          backdropFilter: 'blur(60px)',
          border: '1px solid rgba(255, 255, 255, 0.4)',
          boxShadow: '0 20px 40px rgba(0, 0, 0, 0.08)'
        }}
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7 }}
      >
        {/* Table Header */}
        <div 
          className="grid grid-cols-3 gap-6 px-8 py-6"
          style={{
            background: 'rgba(0, 0, 0, 0.03)',
            borderBottom: '1px solid rgba(0, 0, 0, 0.08)',
          }}
        >
          <div 
            className="text-sm font-normal uppercase tracking-wider text-black/60"
            style={{ fontFamily: 'Source Sans Pro, -apple-system, system-ui, sans-serif' }}
          >
            Clinical Metric
          </div>
          <div 
            className="text-sm font-normal uppercase tracking-wider text-black/60"
            style={{ fontFamily: 'Source Sans Pro, -apple-system, system-ui, sans-serif' }}
          >
            This Drug
          </div>
          <div 
            className="text-sm font-normal uppercase tracking-wider text-black/60"
            style={{ fontFamily: 'Source Sans Pro, -apple-system, system-ui, sans-serif' }}
          >
            {comparisonData.competitor}
          </div>
        </div>

        {/* Table Rows */}
        {comparisonData.rows.map((row, index) => (
          <motion.div
            key={index}
            className="grid grid-cols-3 gap-6 px-8 py-6 transition-all hover:bg-black/[0.02]"
            style={{
              borderBottom: index < comparisonData.rows.length - 1 ? '1px solid rgba(0, 0, 0, 0.05)' : 'none',
            }}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: index * 0.1 }}
          >
            {/* Metric Name */}
            <div 
              className="text-lg font-semibold text-black/80"
              style={{ fontFamily: 'Source Sans Pro, -apple-system, system-ui, sans-serif' }}
            >
              {row.metric}
            </div>

            {/* Our Value (Winner) */}
            <div className="flex items-center gap-3">
              <span 
                className="text-2xl font-bold"
                style={{ 
                  color: brandColor,
                  fontFamily: 'Source Sans Pro, -apple-system, system-ui, sans-serif' 
                }}
              >
                {row.value}
              </span>
              {row.winner && (
                <TrendingUp 
                  size={20} 
                  style={{ color: brandColor }}
                  strokeWidth={2.5}
                />
              )}
            </div>

            {/* Competitor Value */}
            <div 
              className="text-xl font-semibold text-black/50"
              style={{ fontFamily: 'Source Sans Pro, -apple-system, system-ui, sans-serif' }}
            >
              {row.competitorValue}
            </div>
          </motion.div>
        ))}
      </motion.div>
    </div>
  );
}