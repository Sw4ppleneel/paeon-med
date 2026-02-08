import { useState } from 'react';
import { motion } from 'motion/react';
import { FileText, Send, DollarSign, Building2, Stethoscope } from 'lucide-react';

interface AccessPanelProps {
  drugName: string;
  onSubmit: (data: { insurance_type: string; diagnosis: string; claim_amount: number }) => void;
  loading?: boolean;
  reimbursement?: {
    drug_name: string;
    status: string;
    coverage_percent: number;
    approved_amount: number;
    reason_codes: string[];
  } | null;
}

const INSURANCE_TYPES = [
  { value: 'government', label: 'Government', desc: 'Ayushman Bharat / CGHS' },
  { value: 'corporate', label: 'Corporate', desc: 'Employer Insurance' },
  { value: 'private', label: 'Private', desc: 'Private TPA / Self-pay' },
];

export function AccessPanel({ drugName, onSubmit, loading, reimbursement }: AccessPanelProps) {
  const [insuranceType, setInsuranceType] = useState('');
  const [diagnosis, setDiagnosis] = useState('');
  const [claimAmount, setClaimAmount] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (insuranceType && diagnosis.trim() && claimAmount) {
      setSubmitted(true);
      onSubmit({
        insurance_type: insuranceType,
        diagnosis: diagnosis.trim(),
        claim_amount: parseFloat(claimAmount),
      });
    }
  };

  const canSubmit = insuranceType && diagnosis.trim() && claimAmount && parseFloat(claimAmount) > 0;

  return (
    <div>
      {/* Section Header */}
      <div className="mb-8">
        <h3
          className="text-3xl font-bold tracking-tight text-black"
          style={{ fontFamily: 'Source Sans Pro, -apple-system, system-ui, sans-serif' }}
        >
          Patient Access & Reimbursement
        </h3>
        <p
          className="mt-2 text-base font-normal text-black/50"
          style={{ fontFamily: 'Source Sans Pro, -apple-system, system-ui, sans-serif' }}
        >
          Check coverage eligibility and reimbursement for {drugName}
        </p>
      </div>

      {/* Reimbursement Results */}
      {reimbursement && submitted && (
        <motion.div
          className="mb-8 rounded-[28px] p-8"
          style={{
            background: reimbursement.status === 'APPROVED'
              ? 'rgba(46, 125, 50, 0.08)'
              : reimbursement.status === 'DENIED'
                ? 'rgba(211, 47, 47, 0.08)'
                : 'rgba(245, 127, 23, 0.08)',
            backdropFilter: 'blur(60px)',
            border: `1px solid ${reimbursement.status === 'APPROVED' ? 'rgba(46, 125, 50, 0.2)' : reimbursement.status === 'DENIED' ? 'rgba(211, 47, 47, 0.2)' : 'rgba(245, 127, 23, 0.2)'}`,
            boxShadow: '0 12px 32px rgba(0, 0, 0, 0.06)',
          }}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="flex items-start justify-between mb-6">
            <div>
              <div
                className="inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-xs font-bold uppercase tracking-wider mb-3"
                style={{
                  background: reimbursement.status === 'APPROVED'
                    ? 'rgba(46, 125, 50, 0.15)' : 'rgba(245, 127, 23, 0.15)',
                  color: reimbursement.status === 'APPROVED' ? '#2E7D32' : '#F57F17',
                }}
              >
                {reimbursement.status === 'APPROVED' ? '✓' : '⚠'} {reimbursement.status}
              </div>
              <h4
                className="text-2xl font-bold text-black/80"
                style={{ fontFamily: 'Source Sans Pro, -apple-system, system-ui, sans-serif' }}
              >
                Reimbursement Report
              </h4>
            </div>
            <div className="text-right">
              <p
                className="text-sm font-normal text-black/40"
                style={{ fontFamily: 'Source Sans Pro, -apple-system, system-ui, sans-serif' }}
              >
                Coverage
              </p>
              <p
                className="text-3xl font-bold"
                style={{
                  color: reimbursement.status === 'APPROVED' ? '#2E7D32' : '#F57F17',
                  fontFamily: 'Source Sans Pro, -apple-system, system-ui, sans-serif',
                }}
              >
                {reimbursement.coverage_percent}%
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-6">
            <div
              className="rounded-2xl p-5"
              style={{ background: 'rgba(255, 255, 255, 0.5)' }}
            >
              <p className="text-xs font-normal uppercase tracking-wider text-black/40 mb-1"
                style={{ fontFamily: 'Source Sans Pro, -apple-system, system-ui, sans-serif' }}>
                Approved Amount
              </p>
              <p className="text-xl font-bold text-black/80"
                style={{ fontFamily: 'Source Sans Pro, -apple-system, system-ui, sans-serif' }}>
                ₹{reimbursement.approved_amount.toLocaleString()}
              </p>
            </div>
            <div
              className="rounded-2xl p-5"
              style={{ background: 'rgba(255, 255, 255, 0.5)' }}
            >
              <p className="text-xs font-normal uppercase tracking-wider text-black/40 mb-1"
                style={{ fontFamily: 'Source Sans Pro, -apple-system, system-ui, sans-serif' }}>
                Reason Codes
              </p>
              <div className="flex flex-wrap gap-1.5">
                {reimbursement.reason_codes.map((code, i) => (
                  <span
                    key={i}
                    className="rounded-full px-2.5 py-0.5 text-xs font-semibold"
                    style={{
                      background: 'rgba(0, 0, 0, 0.06)',
                      color: 'rgba(0, 0, 0, 0.6)',
                      fontFamily: 'Source Sans Pro, -apple-system, system-ui, sans-serif',
                    }}
                  >
                    {code}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {/* Reimbursement Form */}
      <motion.div
        className="rounded-[28px] p-8"
        style={{
          background: 'rgba(255, 255, 255, 0.6)',
          backdropFilter: 'blur(60px)',
          border: '1px solid rgba(255, 255, 255, 0.4)',
          boxShadow: '0 12px 32px rgba(0, 0, 0, 0.08)',
        }}
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <div className="flex items-center gap-3 mb-6">
          <div
            className="flex h-10 w-10 items-center justify-center rounded-xl"
            style={{ background: 'rgba(25, 118, 210, 0.1)' }}
          >
            <FileText size={20} style={{ color: '#1976D2' }} strokeWidth={2} />
          </div>
          <div>
            <h4
              className="text-lg font-bold text-black/80"
              style={{ fontFamily: 'Source Sans Pro, -apple-system, system-ui, sans-serif' }}
            >
              {submitted ? 'Run Another Check' : 'Check Reimbursement Eligibility'}
            </h4>
            <p
              className="text-xs font-normal text-black/40"
              style={{ fontFamily: 'Source Sans Pro, -apple-system, system-ui, sans-serif' }}
            >
              Enter patient details to generate a coverage report
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          {/* Insurance Type Selector */}
          <div className="mb-5">
            <label
              className="mb-2 block text-xs font-semibold uppercase tracking-wider text-black/50"
              style={{ fontFamily: 'Source Sans Pro, -apple-system, system-ui, sans-serif' }}
            >
              <Building2 size={12} className="inline mr-1.5 -mt-0.5" />
              Insurance Type
            </label>
            <div className="grid grid-cols-3 gap-3">
              {INSURANCE_TYPES.map((type) => (
                <button
                  key={type.value}
                  type="button"
                  onClick={() => setInsuranceType(type.value)}
                  className="rounded-2xl p-4 text-left transition-all"
                  style={{
                    background: insuranceType === type.value
                      ? 'rgba(25, 118, 210, 0.1)'
                      : 'rgba(0, 0, 0, 0.03)',
                    border: insuranceType === type.value
                      ? '2px solid rgba(25, 118, 210, 0.4)'
                      : '2px solid transparent',
                  }}
                >
                  <p
                    className="text-sm font-bold"
                    style={{
                      color: insuranceType === type.value ? '#1976D2' : 'rgba(0, 0, 0, 0.6)',
                      fontFamily: 'Source Sans Pro, -apple-system, system-ui, sans-serif',
                    }}
                  >
                    {type.label}
                  </p>
                  <p
                    className="text-xs font-normal text-black/40 mt-0.5"
                    style={{ fontFamily: 'Source Sans Pro, -apple-system, system-ui, sans-serif' }}
                  >
                    {type.desc}
                  </p>
                </button>
              ))}
            </div>
          </div>

          {/* Diagnosis Input */}
          <div className="mb-5">
            <label
              className="mb-2 block text-xs font-semibold uppercase tracking-wider text-black/50"
              style={{ fontFamily: 'Source Sans Pro, -apple-system, system-ui, sans-serif' }}
            >
              <Stethoscope size={12} className="inline mr-1.5 -mt-0.5" />
              Diagnosis / Indication
            </label>
            <input
              type="text"
              value={diagnosis}
              onChange={(e) => setDiagnosis(e.target.value)}
              placeholder="e.g. Allergic rhinitis, Hypertension, Rheumatoid arthritis"
              className="w-full rounded-xl border-none bg-white/70 px-4 py-3 text-sm text-black placeholder-black/30 outline-none"
              style={{
                fontFamily: 'Source Sans Pro, -apple-system, system-ui, sans-serif',
                fontWeight: 500,
                boxShadow: 'inset 0 1px 4px rgba(0, 0, 0, 0.06)',
              }}
            />
          </div>

          {/* Claim Amount */}
          <div className="mb-6">
            <label
              className="mb-2 block text-xs font-semibold uppercase tracking-wider text-black/50"
              style={{ fontFamily: 'Source Sans Pro, -apple-system, system-ui, sans-serif' }}
            >
              <DollarSign size={12} className="inline mr-1.5 -mt-0.5" />
              Claim Amount (₹)
            </label>
            <input
              type="number"
              value={claimAmount}
              onChange={(e) => setClaimAmount(e.target.value)}
              placeholder="e.g. 5000"
              min="0"
              step="100"
              className="w-full rounded-xl border-none bg-white/70 px-4 py-3 text-sm text-black placeholder-black/30 outline-none"
              style={{
                fontFamily: 'Source Sans Pro, -apple-system, system-ui, sans-serif',
                fontWeight: 500,
                boxShadow: 'inset 0 1px 4px rgba(0, 0, 0, 0.06)',
              }}
            />
          </div>

          {/* Submit Button */}
          <motion.button
            type="submit"
            disabled={!canSubmit || loading}
            className="flex w-full items-center justify-center gap-2 rounded-2xl py-3.5 text-sm font-bold text-white transition-all"
            style={{
              background: canSubmit && !loading
                ? 'linear-gradient(135deg, #1976D2 0%, #42A5F5 100%)'
                : 'rgba(0, 0, 0, 0.12)',
              color: canSubmit && !loading ? 'white' : 'rgba(0, 0, 0, 0.3)',
              boxShadow: canSubmit && !loading ? '0 8px 24px rgba(25, 118, 210, 0.3)' : 'none',
              fontFamily: 'Source Sans Pro, -apple-system, system-ui, sans-serif',
            }}
            whileHover={canSubmit && !loading ? { scale: 1.02 } : {}}
            whileTap={canSubmit && !loading ? { scale: 0.98 } : {}}
          >
            {loading ? (
              <>
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                Checking Coverage…
              </>
            ) : (
              <>
                <Send size={16} strokeWidth={2} />
                Generate Reimbursement Report
              </>
            )}
          </motion.button>
        </form>
      </motion.div>
    </div>
  );
}
