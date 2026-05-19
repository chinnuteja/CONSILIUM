import { useState } from 'react';
import { motion } from 'framer-motion';
import { Shield, AlertTriangle, ChevronDown, ChevronUp } from 'lucide-react';
import type { TriageData, Complexity } from '../types';

interface TriageCardProps {
  triage: TriageData | null;
}

const COMPLEXITY_STYLES: Record<Complexity, { bg: string; text: string; border: string }> = {
  SIMPLE: { bg: 'bg-accent-emerald/10', text: 'text-accent-emerald', border: 'border-accent-emerald/30' },
  MODERATE: { bg: 'bg-accent-amber/10', text: 'text-accent-amber', border: 'border-accent-amber/30' },
  COMPLEX: { bg: 'bg-accent-crimson/10', text: 'text-accent-crimson', border: 'border-accent-crimson/30' },
};

const ALL_SPECIALTIES = [
  'cardiology', 'endocrinology', 'neurology', 'rheumatology',
  'infectious_disease', 'gastroenterology', 'psychiatry',
];

export function TriageCard({ triage }: TriageCardProps) {
  const [showReasoning, setShowReasoning] = useState(false);

  if (!triage) {
    return (
      <div className="bg-bg-surface rounded-xl border border-white/5 p-5">
        <div className="flex items-center gap-2 mb-3">
          <Shield className="w-4 h-4 text-text-secondary" />
          <h3 className="text-[10px] font-semibold uppercase tracking-[0.18em] text-text-secondary">
            Triage Decision
          </h3>
        </div>
        <p className="text-xs text-text-secondary italic">Awaiting triage...</p>
      </div>
    );
  }

  const styles = COMPLEXITY_STYLES[triage.case_complexity];
  const invokedSpecs = triage.recommended_specialties.map((s) => s.toLowerCase());

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-bg-surface rounded-xl border border-white/5 p-5"
    >
      <div className="flex items-center gap-2 mb-4">
        <Shield className="w-4 h-4 text-accent-teal" />
        <h3 className="text-[10px] font-semibold uppercase tracking-[0.18em] text-text-secondary">
          Triage Decision
        </h3>
      </div>

      <div className={`inline-flex px-4 py-1.5 rounded-full ${styles.bg} border ${styles.border} mb-4`}>
        <span className={`text-[14px] font-semibold ${styles.text}`}>
          {triage.case_complexity}
        </span>
      </div>

      <div className="mb-4">
        <div className="mb-1.5">
          <span className="text-[16px] font-semibold text-text-primary block">
            Routing certainty {(triage.confidence * 100).toFixed(0)}%
          </span>
        </div>
        <div className="h-1.5 rounded-full overflow-hidden" style={{ background: '#1F2937' }}>
          <div
            className="h-full bg-accent-teal/60 rounded-full transition-all duration-500"
            style={{ width: `${triage.confidence * 100}%` }}
          />
        </div>
        <p className="mt-2 text-[11px] leading-relaxed text-text-secondary">
          How confident the triage agent is in the complexity classification ({triage.case_complexity}).
        </p>
      </div>

      <div className="mb-4">
        <span className="text-[10px] font-mono uppercase tracking-wider text-text-secondary block mb-2">Specialists</span>
        <div className="flex gap-1.5 flex-wrap">
          {ALL_SPECIALTIES.map((spec) => {
            const isInvoked = invokedSpecs.includes(spec) || invokedSpecs.includes('all');
            return (
              <span
                key={spec}
                className={`px-2 py-0.5 rounded text-[10px] font-mono transition-all ${
                  isInvoked
                    ? 'bg-accent-teal text-white border border-accent-teal'
                    : 'bg-transparent text-text-secondary/50 border border-white/10'
                }`}
              >
                {spec.replace('_', ' ')}
              </span>
            );
          })}
        </div>
      </div>

      {triage.red_flags && triage.red_flags.length > 0 && (
        <div className="mb-4">
          <span className="text-xs text-text-secondary block mb-2">Red Flags</span>
          <div className="flex gap-1.5 flex-wrap">
            {triage.red_flags.map((flag, i) => (
              <span key={i} className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-accent-crimson/10 text-accent-crimson text-[10px] border border-accent-crimson/20">
                <AlertTriangle className="w-3 h-3" />
                {flag}
              </span>
            ))}
          </div>
        </div>
      )}

      <button
        onClick={() => setShowReasoning(!showReasoning)}
        className="flex items-center gap-1 text-xs text-text-secondary hover:text-accent-teal transition-colors"
      >
        {showReasoning ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
        {showReasoning ? 'Hide' : 'Show'} reasoning
      </button>
      {showReasoning && (
        <motion.p
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          className="text-xs text-text-secondary mt-2 leading-relaxed"
        >
          {triage.reasoning}
        </motion.p>
      )}
    </motion.div>
  );
}
