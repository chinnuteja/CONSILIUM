import { FileText } from 'lucide-react';
import type { DemoTrace } from '../types';

interface CaseCardProps {
  trace: DemoTrace;
  isComplete: boolean;
}

export function CaseCard({ trace, isComplete }: CaseCardProps) {
  return (
    <div className="bg-bg-surface rounded-xl border border-white/5 p-6">
      <div className="flex items-center gap-2 mb-3">
        <FileText className="w-4 h-4 text-accent-teal" />
        <h3 className="text-sm font-semibold uppercase tracking-wider text-text-secondary">
          Patient Vignette
        </h3>
      </div>

      <div className="flex gap-2 mb-3">
        <span className="px-2 py-0.5 rounded bg-bg-elevated text-xs font-mono text-text-secondary">
          {trace.age}{trace.sex}
        </span>
        <span className="px-2 py-0.5 rounded bg-bg-elevated text-xs font-mono text-text-secondary">
          {trace.case_id}
        </span>
      </div>

      <p className="text-sm leading-relaxed text-text-primary/90">
        {trace.vignette}
      </p>

      {isComplete && (
        <div className="mt-4 pt-3 border-t border-white/5">
          <span className="text-xs font-mono text-text-secondary">Ground Truth: </span>
          <span className="text-xs font-mono text-accent-teal">{trace.ground_truth}</span>
        </div>
      )}
    </div>
  );
}
