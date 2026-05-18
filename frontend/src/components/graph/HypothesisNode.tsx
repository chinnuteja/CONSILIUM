import { Handle, Position } from '@xyflow/react';
import type { SpecialistStatus } from '../../types';

interface HypothesisNodeData {
  diagnosis: string;
  confidence?: number;
  specialist: string;
  status: SpecialistStatus;
}

export function HypothesisNode({ data }: { data: HypothesisNodeData }) {
  const isDefended = data.status === 'DEFENDED';
  const isRevised = data.status === 'REVISED';
  const borderColor = isDefended ? '#10B981' : isRevised ? '#EF4444' : '#00B4A8';

  return (
    <div className="relative">
      <div
        className="px-3 py-2 rounded-lg border max-w-[160px]"
        style={{
          background: '#11161D',
          borderColor: `${borderColor}60`,
        }}
      >
        <span className="text-[10px] font-medium text-text-primary block truncate">
          {data.diagnosis}
        </span>
        {data.confidence !== undefined && (
          <div className="mt-1 h-1 rounded-full overflow-hidden" style={{ background: '#1A2030' }}>
            <div
              className="h-full rounded-full"
              style={{ width: `${data.confidence * 100}%`, background: borderColor }}
            />
          </div>
        )}
        {isDefended && (
          <span className="text-[8px] text-accent-emerald mt-0.5 block">DEFENDED</span>
        )}
        {isRevised && (
          <span className="text-[8px] text-accent-crimson mt-0.5 block">REVISED</span>
        )}
      </div>
      <Handle type="source" position={Position.Top} className="opacity-0" />
      <Handle type="target" position={Position.Bottom} className="opacity-0" />
    </div>
  );
}
