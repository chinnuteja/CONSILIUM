import { motion, AnimatePresence } from 'framer-motion';
import {
  Heart, Activity, Brain, Bone, Bug,
  Stethoscope, BrainCircuit, Shield, RefreshCw, MessageCircle,
} from 'lucide-react';
import type { ChallengeArrow } from '../types';
import type { PlaybackState } from '../hooks/usePlayback';

const SPECIALTY_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  Cardiology: Heart,
  Endocrinology: Activity,
  Neurology: Brain,
  Rheumatology: Bone,
  InfectiousDisease: Bug,
  Gastroenterology: Stethoscope,
  Psychiatry: BrainCircuit,
};

function SpecIcon({ name, className }: { name: string; className?: string }) {
  const Icon = SPECIALTY_ICONS[name] || MessageCircle;
  return <Icon className={className} />;
}

function formatSpec(name: string) {
  return name.replace('InfectiousDisease', 'Infectious Disease');
}

interface CrossExamPanelProps {
  challenges: ChallengeArrow[];
  currentFocus?: PlaybackState['currentFocus'];
}

export function CrossExamPanel({ challenges, currentFocus }: CrossExamPanelProps) {
  if (challenges.length === 0) return null;
  const isFocused = currentFocus?.type === 'cross_exam';

  return (
    <div className={`mt-4 transition-all duration-500 ${isFocused ? 'border-l border-accent-amber/40 pl-4 bg-accent-amber/[0.03]' : ''}`}>
      <div className="border-t border-white/[0.08] pt-4 mb-4" />
      <h3 className="text-[10px] font-semibold uppercase tracking-[0.18em] text-text-secondary mb-4">
        Cross-Examination
      </h3>
      <div className="space-y-6">
        <AnimatePresence>
          {challenges.map((challenge, i) => (
            <motion.div
              key={challenge.id + i}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, ease: 'easeOut' }}
              className="rounded-xl p-5" style={{ background: '#11161D' }}
            >
              <span className="text-[10px] font-semibold uppercase tracking-[0.18em] text-text-secondary/50 mb-3 block">
                Deliberation {i + 1}
              </span>

              {/* Challenger header */}
              <div className="flex items-center gap-2 mb-2">
                <div className="w-5 h-5 rounded-full bg-accent-amber/15 border border-accent-amber/30 flex items-center justify-center">
                  <SpecIcon name={challenge.from} className="w-3 h-3 text-accent-amber" />
                </div>
                <span className="text-[14px] font-semibold text-accent-amber">
                  {formatSpec(challenge.from)}
                </span>
                <span className="text-[11px] text-text-secondary">challenges</span>
                <span className="text-[14px] font-semibold text-accent-teal">
                  {formatSpec(challenge.to)}
                </span>
              </div>

              {/* Question blockquote */}
              <blockquote className="text-[13px] text-text-secondary ml-7 pl-4 py-2 border-l-[3px] border-accent-amber/30 italic" style={{ lineHeight: '1.7' }}>
                {challenge.question}
              </blockquote>

              {/* Thin divider */}
              <div className="border-t border-white/[0.06] my-4 ml-7" />

              {/* Response */}
              {challenge.action ? (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.6 }}
                >
                  <div className="flex items-center gap-2 mb-2">
                    <div className={`w-5 h-5 rounded-full flex items-center justify-center ${
                      challenge.action === 'DEFEND'
                        ? 'bg-accent-emerald/15 border border-accent-emerald/30'
                        : 'bg-accent-crimson/15 border border-accent-crimson/30'
                    }`}>
                      {challenge.action === 'DEFEND' ? (
                        <Shield className="w-3 h-3 text-accent-emerald" />
                      ) : (
                        <RefreshCw className="w-3 h-3 text-accent-crimson" />
                      )}
                    </div>
                    <span className={`text-[14px] font-semibold ${
                      challenge.action === 'DEFEND' ? 'text-accent-emerald' : 'text-accent-crimson'
                    }`}>
                      {formatSpec(challenge.to)}
                    </span>
                    <span className="text-[11px] text-text-secondary">
                      {challenge.action === 'DEFEND' ? 'defends' : 'revises'}
                    </span>
                  </div>

                  {challenge.responseText && (
                    <blockquote className={`text-[13px] ml-7 pl-4 py-2 border-l-[3px] ${
                      challenge.action === 'DEFEND'
                        ? 'border-accent-emerald/30 text-text-primary/80'
                        : 'border-accent-crimson/30 text-text-primary/80'
                    }`} style={{ lineHeight: '1.7' }}>
                      {challenge.responseText}
                    </blockquote>
                  )}

                  <div className="flex justify-end mt-3">
                    <span className={`px-2 py-0.5 rounded text-[9px] font-mono uppercase ${
                      challenge.action === 'DEFEND'
                        ? 'bg-accent-emerald/10 text-accent-emerald border border-accent-emerald/20'
                        : 'bg-accent-crimson/10 text-accent-crimson border border-accent-crimson/20'
                    }`}>
                      {challenge.action === 'DEFEND' ? 'DEFENDED' : 'REVISED'}
                    </span>
                  </div>
                </motion.div>
              ) : (
                <div className="flex items-center gap-2 ml-7">
                  <span className="w-2 h-2 rounded-full bg-accent-amber animate-pulse" />
                  <span className="text-[12px] text-text-secondary italic">Deliberating...</span>
                </div>
              )}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}
