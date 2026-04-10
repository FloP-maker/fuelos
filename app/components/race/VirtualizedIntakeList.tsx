'use client';

import { useRef } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import type { PlannedIntake } from '@/types/race-session';
import { IntakeCard } from './IntakeCard';

const VIRTUAL_THRESHOLD = 20;

export type VirtualizedIntakeListProps = {
  intakes: PlannedIntake[];
  currentMin: number;
  onSelect: (intake: PlannedIntake) => void;
};

export function VirtualizedIntakeList({ intakes, currentMin, onSelect }: VirtualizedIntakeListProps) {
  const parentRef = useRef<HTMLDivElement>(null);

  const virtualizer = useVirtualizer({
    count: intakes.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 96,
    overscan: 4,
  });

  if (intakes.length <= VIRTUAL_THRESHOLD) {
    return (
      <div className="flex flex-col gap-2">
        {intakes.map((i) => (
          <IntakeCard key={i.id} intake={i} currentMin={currentMin} onPress={() => onSelect(i)} />
        ))}
      </div>
    );
  }

  const items = virtualizer.getVirtualItems();

  return (
    <div
      ref={parentRef}
      className="max-h-[min(420px,55vh)] overflow-auto pr-1"
      style={{ contain: 'strict' }}
    >
      <div
        className="relative w-full"
        style={{ height: `${virtualizer.getTotalSize()}px` }}
      >
        {items.map((vi) => {
          const i = intakes[vi.index];
          return (
            <div
              key={i.id}
              className="absolute left-0 top-0 w-full pr-1"
              style={{ transform: `translateY(${vi.start}px)` }}
            >
              <IntakeCard intake={i} currentMin={currentMin} onPress={() => onSelect(i)} />
            </div>
          );
        })}
      </div>
    </div>
  );
}
