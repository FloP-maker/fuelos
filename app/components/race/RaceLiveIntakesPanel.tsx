'use client';

import { useState } from 'react';
import { useRaceLiveOptional } from '@/app/contexts/RaceContext';
import type { PlannedIntake } from '@/types/race-session';
import { LiveDashboard } from './LiveDashboard';
import { IntakeActionSheet } from './IntakeActionSheet';
import { VirtualizedIntakeList } from './VirtualizedIntakeList';

/**
 * Liste des prises + bandeau live — à afficher sous le chrono lorsque la session live est initialisée.
 */
export function RaceLiveIntakesPanel() {
  const ctx = useRaceLiveOptional();
  const [sheetIntake, setSheetIntake] = useState<PlannedIntake | null>(null);

  if (!ctx?.session) return null;
  const { session, dispatch } = ctx;
  if (session.status === 'finished') return null;

  const sorted = [...session.intakes].sort((a, b) => a.scheduledAtMin - b.scheduledAtMin);

  return (
    <section className="mb-4 mt-2" aria-label="Prises planifiées — suivi détaillé">
      <LiveDashboard />
      <div className="mx-auto mt-3 max-w-md px-1">
        <h3 className="mb-2 text-[11px] font-extrabold uppercase tracking-wider text-[var(--color-text-muted)]">
          Toutes les prises
        </h3>
        <VirtualizedIntakeList
          intakes={sorted}
          currentMin={session.currentMin}
          onSelect={(i) => setSheetIntake(i)}
        />
      </div>

      <IntakeActionSheet
        open={sheetIntake != null}
        intake={sheetIntake}
        currentMin={session.currentMin}
        currentKm={session.currentKm}
        onClose={() => setSheetIntake(null)}
        onAction={(input) => {
          if (!sheetIntake) return;
          dispatch({
            type: 'INTAKE_ACTION',
            payload: {
              intakeId: sheetIntake.id,
              action: input.action,
              currentMin: session.currentMin,
              currentKm: session.currentKm,
              actualIntake: input.actualIntake ?? undefined,
            },
          });
          setSheetIntake(null);
        }}
      />
    </section>
  );
}
