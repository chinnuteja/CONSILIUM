import { motion } from 'framer-motion';
import { Gavel } from 'lucide-react';
import type { DevilsAdvocateData } from '../types';

interface DevilsAdvocatePanelProps {
  data: DevilsAdvocateData | null;
}

export function DevilsAdvocatePanel({ data }: DevilsAdvocatePanelProps) {
  if (!data) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.5, type: 'spring' }}
      className="mt-4 bg-accent-crimson/5 rounded-xl border border-accent-crimson/20 p-5"
    >
      <div className="flex items-center gap-2 mb-3">
        <Gavel className="w-4 h-4 text-accent-crimson" />
        <h3 className="text-sm font-semibold text-accent-crimson">
          Devil's Advocate
        </h3>
      </div>

      <div className="mb-3">
        <span className="text-xs text-text-secondary">Alternative Diagnosis:</span>
        <p className="text-sm font-medium text-text-primary mt-1">{data.alternative_diagnosis}</p>
      </div>

      {data.confidence > 0 && (
        <div className="mb-3">
          <div className="flex justify-between text-[10px] mb-1">
            <span className="text-text-secondary">Confidence</span>
            <span className="font-mono text-accent-crimson">{(data.confidence * 100).toFixed(0)}%</span>
          </div>
          <div className="h-1 bg-bg-elevated rounded-full overflow-hidden">
            <div
              className="h-full bg-accent-crimson/60 rounded-full"
              style={{ width: `${data.confidence * 100}%` }}
            />
          </div>
        </div>
      )}

      <p className="text-[11px] text-text-secondary leading-relaxed line-clamp-3">
        {data.reasoning}
      </p>

      {data.citations && data.citations.length > 0 && (
        <span className="inline-flex items-center mt-2 px-2 py-0.5 rounded bg-bg-elevated text-[10px] font-mono text-text-secondary">
          {data.citations.length} citation{data.citations.length > 1 ? 's' : ''}
        </span>
      )}
    </motion.div>
  );
}
