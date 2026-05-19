import { Handle, Position } from '@xyflow/react';

interface EvidenceNodeData {
  code: string;
  index: number;
  evType?: string;
}

export function EvidenceNode({ data }: { data: EvidenceNodeData }) {
  return (
    <div className="relative group">
      <div className="px-2.5 py-1.5 rounded-md border flex flex-col items-center gap-0.5 transition-all duration-200 group-hover:border-[#00B4A8] group-hover:shadow-[0_0_8px_rgba(0,180,168,0.15)]" style={{ background: '#1F2937', borderColor: '#374151' }}>
        {data.evType && (
          <span className="text-[8px] font-mono uppercase tracking-wider" style={{ color: '#9CA3AF' }}>
            {data.evType}
          </span>
        )}
        <span className="text-[11px] font-mono font-medium" style={{ color: '#E5E7EB' }}>
          {data.code}
        </span>
      </div>
      <Handle type="source" position={Position.Top} className="opacity-0" />
      <Handle type="target" position={Position.Bottom} className="opacity-0" />
    </div>
  );
}
