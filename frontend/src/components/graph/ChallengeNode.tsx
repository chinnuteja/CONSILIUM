import { Handle, Position } from '@xyflow/react';

interface ChallengeNodeData {
  question: string;
  action?: 'DEFEND' | 'REVISE';
  from: string;
  to: string;
}

export function ChallengeNode({ data }: { data: ChallengeNodeData }) {
  const actionColor = data.action === 'DEFEND' ? '#10B981' : data.action === 'REVISE' ? '#EF4444' : '#F59E0B';

  return (
    <div className="relative group">
      <div
        className="w-8 h-8 rounded-full border-2 flex items-center justify-center"
        style={{
          background: `${actionColor}15`,
          borderColor: `${actionColor}60`,
        }}
      >
        <span className="text-[10px] font-bold" style={{ color: actionColor }}>
          {data.action ? (data.action === 'DEFEND' ? 'D' : 'R') : '?'}
        </span>
      </div>
      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block z-50">
        <div className="bg-bg-elevated border border-white/10 rounded-lg p-2 max-w-[200px] shadow-xl">
          <p className="text-[9px] text-text-secondary leading-relaxed">{data.question}</p>
          {data.action && (
            <span className="text-[8px] font-mono mt-1 block" style={{ color: actionColor }}>
              {data.action}
            </span>
          )}
        </div>
      </div>
      <Handle type="source" position={Position.Top} className="opacity-0" />
      <Handle type="target" position={Position.Bottom} className="opacity-0" />
    </div>
  );
}
