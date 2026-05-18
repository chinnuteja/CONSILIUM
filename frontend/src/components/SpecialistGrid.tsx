import { SpecialistCard } from './SpecialistCard';
import type { SpecialistState } from '../types';

interface SpecialistGridProps {
  specialists: SpecialistState[];
}

export function SpecialistGrid({ specialists }: SpecialistGridProps) {
  return (
    <div>
      <h3 className="text-xs font-semibold uppercase tracking-wider text-text-secondary mb-3">
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
