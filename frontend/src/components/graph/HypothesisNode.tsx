import { Handle, Position } from '@xyflow/react';
import type { SpecialistStatus } from '../../types';

interface HypothesisNodeData {
  diagnosis: string;
  confidence?: number;
  specialist: string;
  status: SpecialistStatus;
  isTopFinal?: boolean;
  isDimmed?: boolean;
}

export function HypothesisNode({ data }: { data: HypothesisNodeData }) {
  const isDefended = data.status === 'DEFENDED';
  const isRevised = data.status === 'REVISED';
  const accentColor = isDefended ? '#10B981' : isRevised ? '#EF4444' : '#00B4A8';

  return (
    <div className="relative group transition-all duration-500" style={{ opacity: data.isDimmed ? 0.3 : 1 }}>
      <div
        className="px-3 py-2.5 rounded-lg border max-w-[180px] min-w-[120px]"
        style={{
          background: '#11161D',
          borderColor: data.isTopFinal ? '#FBBF24' : `${accentColor}50`,
          boxShadow: data.isTopFinal ? '0 0 18px rgba(251,191,36,0.18)' : undefined,
        }}
      >
        {data.isTopFinal && (
          <span className="absolute -top-2 -left-2 px-1.5 py-0.5 rounded text-[7px] font-mono font-bold uppercase tracking-wide bg-amber-400/10 text-amber-300 border border-amber-300/30">
            TOP 3
          </span>
        )}
        {/* Status badge — top right */}
        {(isDefended || isRevised) && (
          <span
            className="absolute -top-2 -right-2 px-1.5 py-0.5 rounded text-[7px] font-mono font-bold uppercase tracking-wide"
            style={{
              background: `${accentColor}20`,
              color: accentColor,
              border: `1px solid ${accentColor}40`,
            }}
          >
            {isDefended ? 'DEFENDED' : 'REVISED'}
          </span>
        )}

        {/* Diagnosis name */}
        <span className="text-[13px] font-semibold text-text-primary block leading-tight">
          {data.diagnosis}
        </span>

        {/* Confidence bar */}
        {data.confidence !== undefined && (
          <div className="mt-2">
            <div className="flex justify-between mb-0.5">
              <span className="text-[8px] font-mono" style={{ color: '#9CA3AF' }}>confidence</span>
              <span className="text-[8px] font-mono" style={{ color: accentColor }}>
                {(data.confidence * 100).toFixed(0)}%
              </span>
            </div>
            <div className="h-1.5 rounded-full overflow-hidden" style={{ background: '#1A2030' }}>
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{ width: `${data.confidence * 100}%`, background: accentColor }}
              />
            </div>
          </div>
        )}
      </div>
      <Handle type="source" position={Position.Top} className="opacity-0" />
      <Handle type="target" position={Position.Bottom} className="opacity-0" />
    </div>
  );
}
