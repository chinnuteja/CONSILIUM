import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRight, Shield, AlertTriangle } from 'lucide-react';
import type { ChallengeArrow } from '../types';

interface CrossExamPanelProps {
  challenges: ChallengeArrow[];
}

export function CrossExamPanel({ challenges }: CrossExamPanelProps) {
  if (challenges.length === 0) return null;

  return (
    <div className="mt-4">
      <h3 className="text-xs font-semibold uppercase tracking-wider text-text-secondary mb-3">
        Cross-Examination
      </h3>
      <div className="space-y-2">
        <AnimatePresence>
          {challenges.map((challenge, i) => (
            <motion.div
              key={challenge.id + i}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.4, delay: i * 0.1 }}
              className="bg-bg-surface rounded-lg border border-white/5 p-3"
            >
              <div className="flex items-center gap-2 mb-2">
                <span className="text-[10px] font-mono text-accent-amber">
                  {challenge.from.replace('InfectiousDisease', 'Infectious Disease')}
                </span>
                <ArrowRight className="w-3 h-3 text-text-secondary" />
                <span className="text-[10px] font-mono text-accent-teal">
                  {challenge.to.replace('InfectiousDisease', 'Infectious Disease')}
                </span>
                {challenge.action && (
                  <span
                    className={`ml-auto inline-flex items-center gap-1 px-2 py-0.5 rounded text-[9px] font-mono uppercase ${
                      challenge.action === 'DEFEND'
                        ? 'bg-accent-emerald/10 text-accent-emerald border border-accent-emerald/20'
                        : 'bg-accent-crimson/10 text-accent-crimson border border-accent-crimson/20'
                    }`}
                  >
                    {challenge.action === 'DEFEND' ? (
                      <Shield className="w-3 h-3" />
                    ) : (
                      <AlertTriangle className="w-3 h-3" />
                    )}
                    {challenge.action}
                  </span>
                )}
              </div>
              <p className="text-[11px] text-text-secondary leading-relaxed line-clamp-2">
                {challenge.question}
              </p>
              {challenge.responseText && (
                <p className="text-[11px] text-text-primary/70 mt-1.5 leading-relaxed line-clamp-2 border-t border-white/5 pt-1.5">
                  {challenge.responseText}
                </p>
              )}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}
