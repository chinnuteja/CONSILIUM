import { Handle, Position } from '@xyflow/react';

interface AdvocateNodeData {
  alternative_diagnosis: string;
  confidence: number;
  reasoning: string;
}

export function AdvocateNode({ data }: { data: AdvocateNodeData }) {
  return (
    <div className="relative group">
      <div className="px-3 py-2 rounded-lg border border-accent-crimson/40 bg-accent-crimson/10 max-w-[160px]">
        <span className="text-[8px] font-mono text-accent-crimson uppercase block mb-0.5">
          Devil's Advocate
        </span>
        <span className="text-[10px] font-medium text-text-primary block truncate">
          {data.alternative_diagnosis}
        </span>
        <div className="mt-1 h-1 rounded-full overflow-hidden bg-bg-elevated">
          <div
            className="h-full rounded-full bg-accent-crimson/60"
            style={{ width: `${data.confidence * 100}%` }}
          />
        </div>
      </div>
      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block z-50">
        <div className="bg-bg-elevated border border-white/10 rounded-lg p-2 max-w-[240px] shadow-xl">
          <p className="text-[9px] text-text-secondary leading-relaxed">{data.reasoning}</p>
        </div>
      </div>
      <Handle type="source" position={Position.Top} className="opacity-0" />
      <Handle type="target" position={Position.Bottom} className="opacity-0" />
    </div>
  );
}
