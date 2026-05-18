import { Handle, Position } from '@xyflow/react';
import type { SpecialistStatus } from '../../types';

interface SpecialistNodeData {
  name: string;
  status: SpecialistStatus;
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
    <div className="relative">
      <div
        className={`px-3 py-1.5 rounded-lg border flex items-center gap-2 ${isThinking ? 'animate-pulse' : ''}`}
        style={{
          background: `${color}15`,
          borderColor: `${color}50`,
        }}
      >
        <span
          className="w-2 h-2 rounded-full"
          style={{ background: color }}
        />
        <span className="text-[10px] font-semibold text-text-primary">
          {data.name.replace('InfectiousDisease', 'ID')}
        </span>
      </div>
      <Handle type="source" position={Position.Top} className="opacity-0" />
      <Handle type="target" position={Position.Bottom} className="opacity-0" />
    </div>
  );
}
