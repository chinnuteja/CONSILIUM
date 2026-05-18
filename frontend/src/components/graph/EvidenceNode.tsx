import { Handle, Position } from '@xyflow/react';

interface EvidenceNodeData {
  code: string;
  index: number;
}

export function EvidenceNode({ data }: { data: EvidenceNodeData }) {
  return (
    <div className="relative">
      <div className="w-10 h-6 rounded bg-accent-amber/10 border border-accent-amber/30 flex items-center justify-center">
        <span className="text-[9px] font-mono text-accent-amber">{data.code}</span>
      </div>
      <Handle type="source" position={Position.Top} className="opacity-0" />
      <Handle type="target" position={Position.Bottom} className="opacity-0" />
    </div>
  );
}
