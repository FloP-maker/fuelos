'use client';

import { useCallback, useEffect, useState } from 'react';
import usePageTitle from '../lib/hooks/usePageTitle';
import { Header } from '../components/Header';
import { AddRaceModal } from '../components/AddRaceModal';
import { RaceCard } from '../components/RaceCard';
import { loadRaces, partitionRacesByUpcoming } from '@/lib/races';
import type { RaceEntry } from '@/lib/types/race';

export default function RacesPage() {
  usePageTitle('Mes courses');
  const [races, setRaces] = useState<RaceEntry[]>([]);
  const [addOpen, setAddOpen] = useState(false);

  const refresh = useCallback(() => {
    setRaces(loadRaces());
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const { upcoming, past } = partitionRacesByUpcoming(races);
  const empty = races.length === 0;

  return (
    <>
      <Header />
      <main className="fuel-main mx-auto w-full max-w-2xl px-4 py-8 md:px-6">
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h1 className="font-display text-2xl font-bold tracking-tight text-[var(--color-text)] md:text-3xl">
              Mes courses
            </h1>
            <p className="mt-2 text-[var(--color-text-muted)]">Ta saison en un coup d&apos;œil.</p>
          </div>
          <button
            type="button"
            onClick={() => setAddOpen(true)}
            className="shrink-0 self-start rounded-lg bg-[#16a34a] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#15803d]"
          >
            + Ajouter une course
          </button>
        </div>

        {empty ? (
          <div className="flex flex-col items-center py-16 text-center">
            <span className="mb-4 text-[64px] leading-none" aria-hidden>
              🗓️
            </span>
            <p className="text-lg font-semibold text-[var(--color-text)]">Aucune course planifiée.</p>
            <p className="mt-2 max-w-md text-[var(--color-text-muted)]">
              Ajoute ta prochaine course pour générer ton plan nutritionnel et suivre ta préparation.
            </p>
            <button
              type="button"
              onClick={() => setAddOpen(true)}
              className="mt-8 rounded-lg bg-[#16a34a] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#15803d]"
            >
              + Ajouter ma première course
            </button>
          </div>
        ) : (
          <div className="flex flex-col gap-10">
            {upcoming.length > 0 ? (
              <section>
                <h2 className="mb-4 text-sm font-bold uppercase tracking-wide text-[#6b7280]">
                  À venir
                </h2>
                <ul className="flex flex-col gap-4">
                  {upcoming.map((race) => (
                    <li key={race.id}>
                      <RaceCard race={race} />
                    </li>
                  ))}
                </ul>
              </section>
            ) : null}
            {past.length > 0 ? (
              <section>
                <h2 className="mb-4 text-sm font-bold uppercase tracking-wide text-[#6b7280]">
                  Passées
                </h2>
                <ul className="flex flex-col gap-4">
                  {past.map((race) => (
                    <li key={race.id}>
                      <RaceCard race={race} />
                    </li>
                  ))}
                </ul>
              </section>
            ) : null}
          </div>
        )}
      </main>

      <AddRaceModal open={addOpen} onClose={() => setAddOpen(false)} onSaved={refresh} />
    </>
  );
}
