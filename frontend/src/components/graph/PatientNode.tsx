import { Handle, Position } from '@xyflow/react';

interface PatientNodeData {
  age: number;
  sex: string;
  caseId: string;
}

export function PatientNode({ data }: { data: PatientNodeData }) {
  return (
    <div className="relative">
      <div className="w-20 h-20 rounded-full bg-bg-elevated border-2 border-accent-teal flex flex-col items-center justify-center shadow-lg shadow-accent-teal/10">
        <span className="text-lg font-semibold text-accent-teal">
          {data.age}{data.sex}
        </span>
        <span className="text-[8px] font-mono text-text-secondary uppercase">Patient</span>
      </div>
      <Handle type="source" position={Position.Top} className="opacity-0" />
      <Handle type="target" position={Position.Bottom} className="opacity-0" />
    </div>
  );
}
