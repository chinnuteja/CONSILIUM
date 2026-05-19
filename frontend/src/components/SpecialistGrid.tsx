import { SpecialistCard } from './SpecialistCard';
import type { SpecialistState } from '../types';

interface SpecialistGridProps {
  specialists: SpecialistState[];
}

export function SpecialistGrid({ specialists }: SpecialistGridProps) {
  return (
    <div>
      <h3 className="text-[10px] font-semibold uppercase tracking-[0.18em] text-text-secondary mb-4">
        Specialist Council
      </h3>
      <div className="grid grid-cols-4 gap-3">
        {specialists.map((spec) => (
          <SpecialistCard key={spec.name} specialist={spec} />
        ))}
      </div>
    </div>
  );
}
