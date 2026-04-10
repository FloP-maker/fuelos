'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import usePageTitle from '../../lib/hooks/usePageTitle';
import { Header } from '../../components/Header';
import { loadRaces } from '@/lib/races';
import type { RaceEntry } from '@/lib/types/race';

export default function RaceDetailPage() {
  const params = useParams();
  const id = typeof params?.id === 'string' ? params.id : '';
  const [race, setRace] = useState<RaceEntry | null | undefined>(undefined);

  useEffect(() => {
    if (!id) {
      setRace(null);
      return;
    }
    setRace(loadRaces().find((r) => r.id === id) ?? null);
  }, [id]);

  usePageTitle(race?.name ?? 'Course');

  if (race === undefined) {
    return (
      <>
        <Header />
        <main className="fuel-main mx-auto max-w-2xl px-4 py-8 text-[var(--color-text-muted)]">
          Chargement…
        </main>
      </>
    );
  }

  if (!race) {
    return (
      <>
        <Header />
        <main className="fuel-main mx-auto max-w-2xl px-4 py-8">
          <p className="text-[var(--color-text-muted)]">Course introuvable.</p>
          <Link href="/races" className="mt-4 inline-block font-semibold text-[#16a34a] underline">
            Retour à mes courses
          </Link>
        </main>
      </>
    );
  }

  return (
    <>
      <Header />
      <main className="fuel-main mx-auto w-full max-w-2xl px-4 py-8 md:px-6">
        <Link href="/races" className="mb-6 inline-block text-sm font-semibold text-[#16a34a] hover:underline">
          ← Mes courses
        </Link>
        <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
          <h1 className="font-display text-2xl font-bold text-[var(--color-text)]">{race.name}</h1>
          <div className="flex flex-wrap items-center gap-3 text-sm">
            <Link
              href="/plan"
              className="font-semibold text-[var(--color-text-muted)] underline-offset-4 hover:text-[var(--color-text)] hover:underline"
            >
              Modifier
            </Link>
            <Link
              href={`/races/${race.id}/export`}
              className="font-semibold text-[var(--color-text-muted)] underline-offset-4 hover:text-[var(--color-text)] hover:underline"
            >
              📄 Exporter la fiche
            </Link>
          </div>
        </div>
        <p className="mt-2 text-[var(--color-text-muted)]">
          {race.date} · {race.sport} · {race.distance} km
        </p>
      </main>
    </>
  );
}
