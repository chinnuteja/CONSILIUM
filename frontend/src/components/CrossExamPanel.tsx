import { motion, AnimatePresence } from 'framer-motion';
import {
  Heart, Activity, Brain, Bone, Bug,
  Stethoscope, BrainCircuit, Shield, RefreshCw, MessageCircle,
} from 'lucide-react';
import type { ChallengeArrow } from '../types';

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
}

export function CrossExamPanel({ challenges }: CrossExamPanelProps) {
  if (challenges.length === 0) return null;

  return (
    <div className="mt-4">
      <h3 className="text-xs font-semibold uppercase tracking-wider text-text-secondary mb-3">
        Cross-Examination
      </h3>
      <div className="space-y-3">
        <AnimatePresence>
          {challenges.map((challenge, i) => (
            <motion.div
              key={challenge.id + i}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
              className="relative"
            >
              {/* Connector line */}
              <div className="absolute left-5 top-0 bottom-0 w-px bg-white/5" />

              {/* Challenge: Challenger asks */}
              <div className="relative pl-10 pb-2">
                <div className="absolute left-3 top-1 w-4 h-4 rounded-full bg-accent-amber/20 border border-accent-amber/40 flex items-center justify-center">
                  <SpecIcon name={challenge.from} className="w-2.5 h-2.5 text-accent-amber" />
                </div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-[10px] font-semibold text-accent-amber">
                    {formatSpec(challenge.from)}
                  </span>
                  <span className="text-[9px] text-text-secondary">challenges</span>
                  <span className="text-[10px] font-semibold text-accent-teal">
                    {formatSpec(challenge.to)}
                  </span>
                </div>
                <blockquote className="text-[11px] text-text-secondary leading-relaxed bg-bg-elevated/50 rounded-lg px-3 py-2 border-l-2 border-accent-amber/30">
                  {challenge.question}
                </blockquote>
              </div>

              {/* Response: Target responds */}
              {challenge.action ? (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.3 }}
                  className="relative pl-10 pt-1"
                >
                  <div
                    className={`absolute left-3 top-2 w-4 h-4 rounded-full flex items-center justify-center ${
                      challenge.action === 'DEFEND'
                        ? 'bg-accent-emerald/20 border border-accent-emerald/40'
                        : 'bg-accent-crimson/20 border border-accent-crimson/40'
                    }`}
                  >
                    {challenge.action === 'DEFEND' ? (
                      <Shield className="w-2.5 h-2.5 text-accent-emerald" />
                    ) : (
                      <RefreshCw className="w-2.5 h-2.5 text-accent-crimson" />
                    )}
                  </div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`text-[10px] font-semibold ${
                      challenge.action === 'DEFEND' ? 'text-accent-emerald' : 'text-accent-crimson'
                    }`}>
                      {formatSpec(challenge.to)}
                    </span>
                    <span className={`px-1.5 py-0.5 rounded text-[8px] font-mono uppercase ${
                      challenge.action === 'DEFEND'
                        ? 'bg-accent-emerald/10 text-accent-emerald border border-accent-emerald/20'
                        : 'bg-accent-crimson/10 text-accent-crimson border border-accent-crimson/20'
                    }`}>
                      {challenge.action}
                    </span>
                  </div>
                  {challenge.responseText && (
                    <blockquote className={`text-[11px] leading-relaxed bg-bg-elevated/50 rounded-lg px-3 py-2 border-l-2 ${
                      challenge.action === 'DEFEND'
                        ? 'border-accent-emerald/30 text-text-primary/80'
                        : 'border-accent-crimson/30 text-text-primary/80'
                    }`}>
                      {challenge.responseText}
                    </blockquote>
                  )}
                </motion.div>
              ) : (
                <div className="relative pl-10 pt-1">
                  <div className="absolute left-3 top-2 w-4 h-4 rounded-full bg-bg-elevated border border-white/10 flex items-center justify-center">
                    <span className="w-1.5 h-1.5 rounded-full bg-accent-amber animate-pulse" />
                  </div>
                  <span className="text-[10px] text-text-secondary italic">Deliberating...</span>
                </div>
              )}

              {/* Divider between exchanges */}
              {i < challenges.length - 1 && (
                <div className="mt-3 border-t border-white/5" />
              )}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}
