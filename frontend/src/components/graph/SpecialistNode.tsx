import { Handle, Position } from '@xyflow/react';
import type { SpecialistStatus } from '../../types';

interface SpecialistNodeData {
  name: string;
  status: SpecialistStatus;
  isFocused?: boolean;
  isDimmed?: boolean;
  isChallengeParticipant?: boolean;
}

const STATUS_COLORS: Record<SpecialistStatus, string> = {
  IDLE: '#9CA3AF',
  THINKING: '#00B4A8',
  POSTED: '#00B4A8',
  CHALLENGED: '#F59E0B',
  DEFENDED: '#10B981',
  REVISED: '#EF4444',
};

export function SpecialistNode({ data }: { data: SpecialistNodeData }) {
  const color = STATUS_COLORS[data.status];
  const isThinking = data.status === 'THINKING';

  return (
    <div
      className={`relative transition-all duration-500 ${data.isFocused ? 'graph-node-pulse' : ''}`}
      style={{ opacity: data.isDimmed ? 0.5 : 1 }}
    >
      <div
        className={`px-3 py-2 rounded-lg border flex flex-col gap-0.5 ${isThinking ? 'animate-pulse' : ''}`}
        style={{
          background: `${color}12`,
          borderColor: data.isChallengeParticipant ? '#F59E0B' : `${color}40`,
          opacity: data.status === 'IDLE' ? 0.35 : 1,
          boxShadow: data.isChallengeParticipant ? '0 0 18px rgba(245,158,11,0.2)' : data.isFocused ? '0 0 18px rgba(0,180,168,0.22)' : undefined,
        }}
      >
        <div className="flex items-center gap-2">
          <span
            className="w-2 h-2 rounded-full shrink-0"
            style={{ background: color }}
          />
          <span className="text-[12px] font-semibold text-text-primary leading-none">
            {data.name.replace('InfectiousDisease', 'Infectious Dis.')}
          </span>
        </div>
        <span className="text-[9px] font-mono uppercase tracking-wider ml-4" style={{ color: `${color}99` }}>
          {data.status === 'IDLE' ? 'standby' : data.status.toLowerCase()}
        </span>
      </div>
      <Handle type="source" position={Position.Top} className="opacity-0" />
      <Handle type="target" position={Position.Bottom} className="opacity-0" />
    </div>
  );
}
