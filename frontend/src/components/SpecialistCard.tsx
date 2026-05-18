import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Heart, Activity, Brain, Bone, Bug,
  Stethoscope, BrainCircuit, ChevronDown, ChevronUp,
} from 'lucide-react';
import type { SpecialistState, SpecialistStatus } from '../types';

const SPECIALTY_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  Cardiology: Heart,
  Endocrinology: Activity,
  Neurology: Brain,
  Rheumatology: Bone,
  InfectiousDisease: Bug,
  Gastroenterology: Stethoscope,
  Psychiatry: BrainCircuit,
};

const STATUS_STYLES: Record<SpecialistStatus, { label: string; bg: string; text: string; dot: string }> = {
  IDLE: { label: 'Idle', bg: 'bg-white/5', text: 'text-text-secondary/50', dot: 'bg-white/20' },
  THINKING: { label: 'Thinking', bg: 'bg-accent-teal/5', text: 'text-accent-teal', dot: 'bg-accent-teal animate-pulse' },
  POSTED: { label: 'Posted', bg: 'bg-accent-teal/10', text: 'text-accent-teal', dot: 'bg-accent-teal' },
  CHALLENGED: { label: 'Challenged', bg: 'bg-accent-amber/10', text: 'text-accent-amber', dot: 'bg-accent-amber animate-pulse' },
  DEFENDED: { label: 'Defended', bg: 'bg-accent-emerald/10', text: 'text-accent-emerald', dot: 'bg-accent-emerald' },
  REVISED: { label: 'Revised', bg: 'bg-accent-crimson/10', text: 'text-accent-crimson', dot: 'bg-accent-crimson' },
};

interface SpecialistCardProps {
  specialist: SpecialistState;
}

export function SpecialistCard({ specialist }: SpecialistCardProps) {
  const [expanded, setExpanded] = useState(false);
  const Icon = SPECIALTY_ICONS[specialist.name] || Stethoscope;
  const style = STATUS_STYLES[specialist.status];
  const isActive = specialist.status !== 'IDLE';

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: isActive ? 1 : 0.4, scale: 1 }}
      transition={{ duration: 0.3 }}
      className={`relative rounded-xl border p-4 transition-all ${
        isActive ? 'border-white/10 bg-bg-surface' : 'border-white/5 bg-bg-surface/50'
      }`}
      style={{
        borderLeftWidth: '3px',
        borderLeftColor: isActive ? 'var(--color-accent-teal)' : 'transparent',
      }}
    >
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <Icon className={`w-4 h-4 ${isActive ? 'text-accent-teal' : 'text-text-secondary/40'}`} />
          <span className={`text-xs font-semibold ${isActive ? 'text-text-primary' : 'text-text-secondary/50'}`}>
            {specialist.name.replace('InfectiousDisease', 'Infectious Disease')}
          </span>
        </div>
        <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[9px] font-mono uppercase ${style.bg} ${style.text}`}>
          <span className={`w-1.5 h-1.5 rounded-full ${style.dot}`} />
          {style.label}
        </span>
      </div>

      {specialist.diagnosis && (
        <div className="mt-2">
          <p className="text-sm font-medium text-text-primary truncate">{specialist.diagnosis}</p>
          {specialist.confidence !== undefined && (
            <div className="mt-1.5">
              <div className="h-1 bg-bg-elevated rounded-full overflow-hidden">
                <div
                  className="h-full bg-accent-teal/70 rounded-full transition-all duration-500"
                  style={{ width: `${specialist.confidence * 100}%` }}
                />
              </div>
              <span className="text-[10px] font-mono text-text-secondary mt-0.5 block">
                {(specialist.confidence * 100).toFixed(0)}% confidence
              </span>
            </div>
          )}

          {specialist.citations && specialist.citations.length > 0 && (
            <span className="inline-flex items-center mt-1.5 px-2 py-0.5 rounded bg-bg-elevated text-[10px] font-mono text-text-secondary">
              {specialist.citations.length} citation{specialist.citations.length > 1 ? 's' : ''}
            </span>
          )}

          {specialist.reasoning && (
            <>
              <button
                onClick={() => setExpanded(!expanded)}
                className="flex items-center gap-1 mt-2 text-[10px] text-text-secondary hover:text-text-primary transition-colors"
              >
                {expanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                {expanded ? 'Less' : 'More'}
              </button>
              {expanded && (
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-[11px] text-text-secondary mt-1 leading-relaxed line-clamp-4"
                >
                  {specialist.reasoning}
                </motion.p>
              )}
            </>
          )}
        </div>
      )}
    </motion.div>
  );
}
