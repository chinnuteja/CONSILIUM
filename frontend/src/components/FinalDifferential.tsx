import { motion } from 'framer-motion';
import { Trophy, Minus } from 'lucide-react';
import type { FinalDifferentialData, Complexity } from '../types';
import type { PlaybackState } from '../hooks/usePlayback';

interface FinalDifferentialProps {
  data: FinalDifferentialData | null;
  complexity: Complexity | null;
  currentFocus?: PlaybackState['currentFocus'];
}

export function FinalDifferential({ data, complexity, currentFocus }: FinalDifferentialProps) {
  if (!data) {
    return (
      <div className="mt-4 bg-bg-surface rounded-xl border border-white/5 p-5">
        <div className="border-t border-white/[0.08] mb-4" />
        <div className="flex items-center gap-2 mb-2">
          <Trophy className="w-4 h-4 text-text-secondary/40" />
          <h3 className="text-[10px] font-semibold uppercase tracking-[0.18em] text-text-secondary/40">
            Final Differential
          </h3>
        </div>
        <div className="flex items-center gap-2 text-text-secondary/30">
          <Minus className="w-4 h-4" />
          <span className="text-xs italic">Awaiting council deliberation...</span>
        </div>
      </div>
    );
  }

  const maxScore = data.top_3.length > 0
    ? Math.max(...data.top_3.map((d) => d.agreement_score))
    : 1;
  const isFocused = currentFocus?.type === 'final';

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0, scale: isFocused ? [1, 1.02, 1] : 1 }}
      transition={{ duration: 0.5 }}
      className="mt-4 bg-bg-surface rounded-xl border border-accent-teal/20 p-5"
      style={{ boxShadow: isFocused ? '0 0 28px rgba(0,180,168,0.16)' : undefined }}
    >
      <div className="border-t border-white/[0.08] mb-4" />
      <div className="flex items-center gap-2 mb-4">
        <Trophy className="w-4 h-4 text-accent-teal" />
        <h3 className="text-[10px] font-semibold uppercase tracking-[0.18em] text-accent-teal">
          Final Differential
        </h3>
      </div>

      {complexity === 'SIMPLE' && data.top_3.length <= 1 && (
        <p className="text-xs text-text-secondary mb-3 italic">
          No council convened — routine presentation
        </p>
      )}

      <div className="space-y-3">
        {data.top_3.map((item, i) => (
          <motion.div
            key={item.diagnosis}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.15 }}
            className="flex items-center gap-3"
          >
            <span className={`w-6 h-6 flex items-center justify-center rounded-full text-xs font-semibold ${
              i === 0
                ? 'bg-accent-teal/20 text-accent-teal'
                : 'bg-bg-elevated text-text-secondary'
            }`}>
              {i + 1}
            </span>
            <div className="flex-1">
              <div className="flex items-center justify-between mb-1">
                <span className={`text-sm ${i === 0 ? 'font-semibold text-text-primary' : 'text-text-secondary'}`}>
                  {item.diagnosis}
                </span>
                <span className="text-[10px] font-mono text-text-secondary">
                  {(item.agreement_score * 100).toFixed(0)}%
                </span>
              </div>
              <div className="h-1.5 bg-bg-elevated rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${(item.agreement_score / maxScore) * 100}%` }}
                  transition={{ duration: 0.8, delay: i * 0.15 }}
                  className={`h-full rounded-full ${
                    i === 0 ? 'bg-accent-teal' : 'bg-accent-teal/40'
                  }`}
                />
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}
