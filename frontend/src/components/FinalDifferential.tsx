import { useEffect, useMemo, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { CheckCircle2, Minus } from 'lucide-react';
import type { ChallengeArrow, Complexity, FinalDifferentialData, SpecialistState } from '../types';
import type { PlaybackState } from '../hooks/usePlayback';

interface FinalDifferentialProps {
  data: FinalDifferentialData | null;
  complexity: Complexity | null;
  currentFocus?: PlaybackState['currentFocus'];
  specialists?: SpecialistState[];
  challenges?: ChallengeArrow[];
}

export function FinalDifferential({
  data,
  complexity,
  currentFocus,
  specialists = [],
  challenges = [],
}: FinalDifferentialProps) {
  const [typedSummary, setTypedSummary] = useState('');
  const [showNumberHelp, setShowNumberHelp] = useState(false);
  const numberHelpRef = useRef<HTMLDivElement | null>(null);
  const verdict = data?.top_3[0] ?? null;
  const alternatives = data?.top_3.slice(1, 3) ?? [];
  const isFocused = currentFocus?.type === 'final';

  const supportingSpecialists = useMemo(() => {
    if (!verdict) return [];
    return specialists.filter((s) => s.diagnosis === verdict.diagnosis);
  }, [specialists, verdict]);

  const summary = useMemo(() => {
    if (!verdict) return '';
    const leadingReasoning = supportingSpecialists[0]?.reasoning ?? '';
    const lastResponse = [...challenges].reverse().find((c) => c.responseText)?.responseText ?? '';
    const combined = [leadingReasoning, lastResponse].filter(Boolean).join(' ');
    return combined || `The council converged on ${verdict.diagnosis} after weighing specialist confidence and cross-examination responses.`;
  }, [challenges, supportingSpecialists, verdict]);

  useEffect(() => {
    if (!data || !summary) {
      setTypedSummary('');
      return;
    }

    const capped = summary.length > 200 ? `${summary.slice(0, 200)}…` : summary;
    setTypedSummary('');
    let index = 0;
    const timer = setInterval(() => {
      index += 1;
      setTypedSummary(capped.slice(0, index));
      if (index >= capped.length) clearInterval(timer);
    }, 33);

    return () => clearInterval(timer);
  }, [data, summary]);

  useEffect(() => {
    if (!showNumberHelp) return;

    const handlePointerDown = (event: PointerEvent) => {
      if (!numberHelpRef.current?.contains(event.target as Node)) {
        setShowNumberHelp(false);
      }
    };

    window.addEventListener('pointerdown', handlePointerDown);
    return () => window.removeEventListener('pointerdown', handlePointerDown);
  }, [showNumberHelp]);

  if (!data || !verdict) {
    return (
      <div className="mt-4 bg-bg-surface rounded-xl border border-white/5 p-5">
        <div className="border-t border-white/[0.08] mb-4" />
        <div className="flex items-center gap-2 mb-2">
          <CheckCircle2 className="w-4 h-4 text-text-secondary/40" />
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

  const maxScore = Math.max(...data.top_3.map((d) => d.agreement_score), 1);

  return (
    <div className="mt-4">
      {complexity === 'SIMPLE' && data.top_3.length <= 1 && (
        <p className="text-xs text-text-secondary mb-3 italic">
          No council convened — routine presentation
        </p>
      )}

      <motion.div
        initial={{ opacity: 0, y: 18, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: isFocused ? [1, 1.02, 1] : 1 }}
        transition={{ duration: 0.45, ease: 'easeOut' }}
        className="rounded-2xl border border-accent-teal/30 bg-bg-surface p-6"
        style={{ boxShadow: isFocused ? '0 0 32px rgba(0,180,168,0.18)' : undefined }}
      >
        <div className="relative flex items-center gap-2 mb-4" ref={numberHelpRef}>
          <CheckCircle2 className="w-4 h-4 text-accent-teal" />
          <h3 className="text-[11px] font-semibold uppercase tracking-[0.2em] text-accent-teal/80">
            Council Verdict
          </h3>
          <button
            type="button"
            onClick={() => setShowNumberHelp((prev) => !prev)}
            className="flex h-5 w-5 items-center justify-center rounded-full border border-white/10 text-[11px] font-semibold text-text-secondary transition-colors hover:border-accent-teal/40 hover:text-accent-teal"
            aria-label="About these numbers"
          >
            ?
          </button>
          {showNumberHelp && (
            <motion.div
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              className="absolute left-0 top-7 z-30 w-[280px] rounded-xl border border-white/10 bg-bg-elevated p-4 shadow-2xl"
            >
              <h4 className="mb-3 text-[10px] font-semibold uppercase tracking-[0.18em] text-text-primary">
                About these numbers
              </h4>
              <div className="space-y-3 text-[11px] leading-relaxed text-text-secondary">
                <p>
                  <span className="text-text-primary">Routing certainty (Triage):</span> How confident the system is about case complexity classification.
                </p>
                <p>
                  <span className="text-text-primary">Diagnostic support (Specialists):</span> How strongly each specialist's cited evidence supports their proposed diagnosis. Low values are expected for ambiguous cases.
                </p>
                <p>
                  <span className="text-text-primary">Council agreement (Verdict):</span> Aggregated support across specialists for the leading diagnosis. Reflects both individual specialist confidence and inter-specialty convergence.
                </p>
              </div>
            </motion.div>
          )}
        </div>

        <div className="flex items-start justify-between gap-4 mb-4">
          <h4 className="text-[22px] font-semibold text-text-primary leading-tight">
            {verdict.diagnosis}
          </h4>
          <span className="text-right text-[15px] font-semibold text-accent-teal">
            Council agreement: {(verdict.agreement_score * 100).toFixed(0)}%
          </span>
        </div>

        <div className="h-3 rounded-full overflow-hidden bg-bg-elevated mb-2">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${(verdict.agreement_score / maxScore) * 100}%` }}
            transition={{ duration: 0.9, ease: 'easeOut' }}
            className="h-full rounded-full bg-gradient-to-r from-accent-teal to-accent-emerald"
          />
        </div>
        <p className="mb-4 text-[11px] leading-relaxed text-text-secondary">
          Aggregated support across all consulted specialists. Higher values indicate stronger convergence. In this case, {(verdict.agreement_score * 100).toFixed(0)}% reflects high diagnostic uncertainty — both specialists support {verdict.diagnosis} but with low individual confidence.
        </p>

        <div className="flex flex-wrap items-center gap-2 mb-4">
          <span className="text-[10px] font-mono uppercase tracking-wider text-text-secondary">
            Supported by:
          </span>
          {(supportingSpecialists.length > 0 ? supportingSpecialists : specialists.filter((s) => s.diagnosis).slice(0, 2)).map((s) => (
            <span key={s.name} className="px-2 py-0.5 rounded-full bg-accent-teal/10 text-accent-teal text-[10px] font-mono">
              {s.name.replace('InfectiousDisease', 'Infectious Disease')}
            </span>
          ))}
        </div>

        <p className="text-[13px] leading-[1.7] italic text-text-secondary">
          “{typedSummary}”
        </p>
      </motion.div>

      {alternatives.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.35 }}
          className="mt-4 rounded-xl border border-white/5 bg-bg-surface/80 p-5"
        >
          <h3 className="text-[10px] font-semibold uppercase tracking-[0.18em] text-text-secondary mb-4">
            Alternative Hypotheses
          </h3>
          <div className="mb-2 flex items-center justify-between text-[9px] font-mono uppercase tracking-wider text-text-secondary/60">
            <span>Diagnosis</span>
            <span>Agreement score</span>
          </div>
          <div className="space-y-4">
            {alternatives.map((item, i) => (
              <div key={item.diagnosis}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm text-text-secondary">
                    {i + 2} · {item.diagnosis}
                  </span>
                  <span className="text-[11px] font-mono text-accent-teal">
                    {(item.agreement_score * 100).toFixed(0)}%
                  </span>
                </div>
                <div className="h-1.5 bg-bg-elevated rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${(item.agreement_score / maxScore) * 100}%` }}
                    transition={{ duration: 0.7, delay: 0.5 + i * 0.1 }}
                    className="h-full rounded-full bg-accent-teal/40"
                  />
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      )}
    </div>
  );
}
