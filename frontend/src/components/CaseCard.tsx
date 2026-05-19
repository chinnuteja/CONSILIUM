import { FileText, Lock } from 'lucide-react';
import type { DemoTrace } from '../types';

interface CaseCardProps {
  trace: DemoTrace;
  isComplete: boolean;
}

export function CaseCard({ trace, isComplete }: CaseCardProps) {
  return (
    <div className="bg-bg-surface rounded-xl border border-white/5 p-6">
      <div className="flex items-center gap-2 mb-3">
        <FileText className="w-3.5 h-3.5 text-accent-teal/60" />
        <h3 className="text-[10px] font-semibold uppercase tracking-[0.15em] text-accent-teal/70">
          Patient Vignette
        </h3>
      </div>

      <div className="flex gap-1.5 mb-3">
        <span className="px-1.5 py-0.5 rounded bg-bg-elevated text-[10px] font-mono text-text-secondary">
          {trace.age}{trace.sex}
        </span>
        <span className="px-1.5 py-0.5 rounded bg-bg-elevated text-[10px] font-mono text-text-secondary">
          {trace.case_id}
        </span>
      </div>

      <p className="text-sm text-text-primary/90" style={{ lineHeight: '1.7' }}>
        {trace.vignette}
      </p>

      {isComplete && (
        <div className="mt-4 pt-3 border-t border-white/5">
          <span className="inline-flex items-center gap-1 text-xs font-mono text-text-secondary">
            <Lock className="w-3 h-3" /> Ground Truth:
          </span>
          <span className="text-xs font-mono text-accent-teal/80 italic ml-1">{trace.ground_truth}</span>
        </div>
      )}
    </div>
  );
}
