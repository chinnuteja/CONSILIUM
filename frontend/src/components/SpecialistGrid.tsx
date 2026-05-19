import { SpecialistCard } from './SpecialistCard';
import type { SpecialistState } from '../types';
import type { PlaybackState } from '../hooks/usePlayback';

interface SpecialistGridProps {
  specialists: SpecialistState[];
  currentFocus?: PlaybackState['currentFocus'];
}

export function SpecialistGrid({ specialists, currentFocus }: SpecialistGridProps) {
  const isCrossExamFocus = currentFocus?.type === 'cross_exam';
  const isSpecialistFocus = currentFocus?.type === 'specialist';

  const postedSpecs = specialists.filter((s) => s.confidence !== undefined);
  const maxConf = postedSpecs.length > 0 ? Math.max(...postedSpecs.map((s) => s.confidence!)) : 0;
  const leadersAtMax = postedSpecs.filter((s) => s.confidence === maxConf);
  const leadingName = leadersAtMax.length === 1 ? leadersAtMax[0].name : null;

  return (
    <div className={`transition-opacity duration-500 ${isCrossExamFocus ? 'opacity-40' : 'opacity-100'}`}>
      <h3 className="text-[10px] font-semibold uppercase tracking-[0.18em] text-text-secondary mb-4">
        Specialist Council
      </h3>
      <div className="grid grid-cols-4 gap-3">
        {specialists.map((spec) => (
          <SpecialistCard
            key={spec.name}
            specialist={spec}
            isFocused={isSpecialistFocus && currentFocus?.specialist === spec.name}
            isDimmed={isSpecialistFocus && currentFocus?.specialist !== spec.name}
            isLeading={spec.name === leadingName}
          />
        ))}
      </div>
    </div>
  );
}
