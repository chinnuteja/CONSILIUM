import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Heart, Activity, Brain, Bone, Bug,
  Stethoscope, BrainCircuit, ChevronDown, ChevronUp,
  Shield, RefreshCw,
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

const STATUS_STYLES: Record<SpecialistStatus, { label: string; bg: string; text: string; dot: string; border: string }> = {
  IDLE: { label: 'Idle', bg: 'bg-white/5', text: 'text-text-secondary/50', dot: 'bg-white/20', border: 'transparent' },
  THINKING: { label: 'Reasoning', bg: 'bg-accent-teal/5', text: 'text-accent-teal', dot: 'bg-accent-teal', border: 'var(--color-accent-teal)' },
  POSTED: { label: 'Posted', bg: 'bg-accent-teal/10', text: 'text-accent-teal', dot: 'bg-accent-teal', border: 'var(--color-accent-teal)' },
  CHALLENGED: { label: 'Challenged', bg: 'bg-accent-amber/10', text: 'text-accent-amber', dot: 'bg-accent-amber', border: 'var(--color-accent-amber)' },
  DEFENDED: { label: 'Defended', bg: 'bg-accent-emerald/10', text: 'text-accent-emerald', dot: 'bg-accent-emerald', border: 'var(--color-accent-emerald)' },
  REVISED: { label: 'Revised', bg: 'bg-accent-crimson/10', text: 'text-accent-crimson', dot: 'bg-accent-crimson', border: 'var(--color-accent-crimson)' },
};

interface SpecialistCardProps {
  specialist: SpecialistState;
  isFocused?: boolean;
  isDimmed?: boolean;
  isLeading?: boolean;
}

export function SpecialistCard({ specialist, isFocused = false, isDimmed = false, isLeading = false }: SpecialistCardProps) {
  const [expanded, setExpanded] = useState(false);
  const Icon = SPECIALTY_ICONS[specialist.name] || Stethoscope;
  const style = STATUS_STYLES[specialist.status];
  const isActive = specialist.status !== 'IDLE';
  const isThinking = specialist.status === 'THINKING';
  const isDefended = specialist.status === 'DEFENDED';
  const isRevised = specialist.status === 'REVISED';
  const isChallenged = specialist.status === 'CHALLENGED';

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{
        opacity: isDimmed ? 0.6 : isActive ? 1 : 0.4,
        scale: isLeading ? 1.05 : isFocused ? [1.02, 1] : specialist.status === 'POSTED' ? [1.03, 1] : 1,
      }}
      transition={{ duration: 0.3 }}
      className={`relative rounded-xl p-4 overflow-hidden ${
        isActive ? 'border-white/10 bg-bg-surface' : 'border-white/5 bg-bg-surface/50'
      }`}
      style={{
        borderTopWidth: isLeading ? '2px' : '1px',
        borderRightWidth: isLeading ? '2px' : '1px',
        borderBottomWidth: isLeading ? '2px' : '1px',
        borderLeftWidth: '3px',
        borderLeftColor: style.border,
        boxShadow: isLeading ? '0 0 24px rgba(0,180,168,0.15)' : isFocused ? '0 0 20px rgba(0,180,168,0.14)' : undefined,
      }}
    >
      {isLeading && (
        <span className="absolute top-2 right-2 px-2 py-0.5 rounded-full bg-accent-teal/10 text-accent-teal text-[9px] font-mono uppercase tracking-wider border border-accent-teal/20">
          Leading
        </span>
      )}
      {isThinking && (
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-accent-teal/5 to-transparent animate-shimmer" />
      )}
      {isChallenged && (
        <motion.div
          initial={{ opacity: 0.5 }}
          animate={{ opacity: [0.5, 0, 0.5] }}
          transition={{ duration: 1, repeat: 1 }}
          className="absolute inset-0 border-2 border-accent-amber/40 rounded-xl pointer-events-none"
        />
      )}

      <div className="relative flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <Icon className={`w-4 h-4 ${isActive ? 'text-accent-teal' : 'text-text-secondary/40'}`} />
          <span className={`text-xs font-semibold ${isActive ? 'text-text-primary' : 'text-text-secondary/50'}`}>
            {specialist.name.replace('InfectiousDisease', 'Infectious Disease')}
          </span>
          {isDefended && <Shield className="w-3 h-3 text-accent-emerald" />}
          {isRevised && <RefreshCw className="w-3 h-3 text-accent-crimson" />}
        </div>
        <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[9px] font-mono uppercase ${style.bg} ${style.text}`}>
          <span className={`w-1.5 h-1.5 rounded-full ${style.dot} ${isThinking ? 'animate-pulse' : ''}`} />
          {style.label}
        </span>
      </div>

      <AnimatePresence mode="wait">
        {isThinking && !specialist.diagnosis && (
          <motion.div
            key="thinking"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="mt-2"
          >
            <div className="h-4 w-3/4 rounded bg-bg-elevated animate-pulse" />
            <div className="h-1 w-1/2 rounded bg-bg-elevated animate-pulse mt-2" />
          </motion.div>
        )}

        {specialist.diagnosis && (
          <motion.div
            key="posted"
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="mt-2 relative"
          >
            <p className={`${isLeading ? 'text-[18px]' : 'text-sm'} font-semibold text-text-primary truncate`}>
              {specialist.diagnosis}
            </p>

            {specialist.confidence !== undefined && (
              <div className="mt-2">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[9px] font-mono text-text-secondary uppercase">confidence</span>
                  <span className="text-[14px] font-semibold text-accent-teal">
                    {(specialist.confidence * 100).toFixed(0)}%
                  </span>
                </div>
                <div className="h-1 rounded-full overflow-hidden" style={{ background: '#1F2937' }}>
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${specialist.confidence * 100}%` }}
                    transition={{ duration: 0.5, ease: 'easeOut' }}
                    className="h-full bg-accent-teal/70 rounded-full"
                  />
                </div>
              </div>
            )}

            {specialist.citations && specialist.citations.length > 0 && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.3, type: 'spring', stiffness: 300 }}
                className="mt-2"
              >
                <span className="text-[9px] font-mono text-text-secondary uppercase block mb-1">Cited Evidence</span>
                <div className="flex flex-wrap gap-1">
                  {specialist.citations.map((cit) => (
                    <span key={cit} className="px-1.5 py-0.5 rounded bg-bg-elevated text-[11px] font-mono text-text-secondary">
                      {cit}
                    </span>
                  ))}
                </div>
              </motion.div>
            )}

            {specialist.reasoning && (
              <>
                <button
                  onClick={() => setExpanded(!expanded)}
                  className="flex items-center gap-1 mt-2 text-[10px] text-accent-teal/60 hover:text-accent-teal transition-colors"
                >
                  {expanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                  {expanded ? 'Hide reasoning' : 'View reasoning'}
                </button>
                {expanded && (
                  <motion.blockquote
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="text-[11px] text-text-secondary/80 mt-1.5 leading-relaxed italic border-l-[3px] border-accent-teal/20 pl-3 max-h-[200px] overflow-y-auto"
                  >
                    {specialist.reasoning}
                  </motion.blockquote>
                )}
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
