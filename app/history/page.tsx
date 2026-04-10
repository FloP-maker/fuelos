'use client';

import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { useCallback, useEffect, useState } from 'react';
import { Header } from '../components/Header';
import { RaceCard } from '../components/history/RaceCard';
import { Button } from '../components/Button';
import type { RaceEvent, RaceSport } from '@/types/race';
import { aggregateRaceHistory } from '@/lib/nutrition/raceHistoryStats';
import { raceEventFromJson } from '@/lib/nutrition/raceHistory';
import {
  clearRaceHistoryDraft,
  flushRaceHistoryOutbox,
} from '@/lib/raceHistoryLocal';

const SPORT_FR: Record<RaceSport, string> = {
  trail: 'Trail',
  marathon: 'Marathon',
  triathlon: 'Triathlon',
  cyclisme: 'Cyclisme',
  autre: 'Autre',
};

export default function HistoryListPage() {
  const { status } = useSession();
  const [races, setRaces] = useState<RaceEvent[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setError(null);
    const res = await fetch('/api/user/race-events', { credentials: 'include' });
    if (!res.ok) {
      setRaces([]);
      setError(res.status === 401 ? 'connect' : 'load');
      return;
    }
    const body = (await res.json()) as { races?: unknown[] };
    const list = Array.isArray(body.races)
      ? body.races.map((x) => raceEventFromJson(x)).filter((x): x is RaceEvent => x !== null)
      : [];
    setRaces(list);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    if (status !== 'authenticated' || typeof window === 'undefined') return;
    void (async () => {
      const flushed = await flushRaceHistoryOutbox(async (payload) => {
        const res = await fetch('/api/user/race-events', {
          method: 'POST',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        return res.ok;
      });
      if (flushed > 0) void load();
    })();
  }, [status, load]);

  const agg =
    races && races.length > 0 ? aggregateRaceHistory(races) : null;

  return (
    <div className="min-h-[100dvh] bg-[var(--color-bg)] text-[var(--color-text)]">
      <Header sticky />
      <main
        className="mx-auto w-full max-w-[var(--fuel-shell-max)] px-4 pb-16 pt-6"
        style={{ minWidth: 0, maxWidth: 'min(100%, var(--fuel-shell-max))' }}
      >
        <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="font-display text-2xl font-extrabold tracking-tight md:text-3xl">
              Mémoire nutritionnelle
            </h1>
            <p className="mt-2 max-w-prose text-[14px] leading-relaxed text-[var(--color-text-muted)]">
              Historique des courses complétées — chaque sortie enrichit ton profil pour les prochains plans.
            </p>
          </div>
          <Link href="/history/new">
            <Button variant="primary" className="min-h-11 px-5">
              Ajouter une course
            </Button>
          </Link>
        </div>

        {status === 'unauthenticated' ? (
          <div className="rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-bg-card)] p-6 text-[14px] text-[var(--color-text-muted)]">
            Connecte-toi pour synchroniser ton historique sur tous tes appareils.
          </div>
        ) : null}

        {error === 'load' ? (
          <p className="text-[14px] text-[var(--color-danger)]">Impossible de charger l&apos;historique.</p>
        ) : null}

        {agg ? (
          <section
            className="mb-8 grid gap-3 rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-bg-card)] p-4 sm:grid-cols-2 lg:grid-cols-4"
            aria-label="Synthèse"
          >
            <Stat label="Courses enregistrées" value={String(agg.raceCount)} />
            <Stat
              label="Score nutritionnel moyen"
              value={agg.raceCount ? `${agg.avgNutritionScore} / 100` : '—'}
            />
            <Stat
              label="Produit le plus utilisé"
              value={agg.topProduct ? agg.topProduct.name : '—'}
            />
            <Stat
              label="Sport dominant"
              value={agg.dominantSport ? SPORT_FR[agg.dominantSport] : '—'}
            />
          </section>
        ) : null}

        {races && races.length === 0 ? (
          <div className="rounded-[var(--radius-lg)] border border-dashed border-[var(--color-border)] bg-[var(--color-bg-card)] p-8 text-center">
            <p className="text-[15px] font-semibold text-[var(--color-text)]">Aucune course pour l’instant</p>
            <p className="mt-2 text-[14px] text-[var(--color-text-muted)]">
              Enregistre une sortie après l’arrivée pour commencer la mémoire nutritionnelle.
            </p>
            <div className="mt-6 flex justify-center gap-3">
              <Link href="/history/new">
                <Button variant="primary" className="min-h-11 px-5">
                  Saisir une course
                </Button>
              </Link>
              <Button
                type="button"
                variant="secondary"
                className="min-h-11 px-5"
                onClick={() => {
                  clearRaceHistoryDraft();
                  void load();
                }}
              >
                Effacer le brouillon local
              </Button>
            </div>
          </div>
        ) : null}

        {races && races.length > 0 ? (
          <ul className="flex flex-col gap-4">
            {races.map((r) => (
              <li key={r.id}>
                <RaceCard race={r} />
              </li>
            ))}
          </ul>
        ) : null}
      </main>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0">
      <div className="text-[11px] font-extrabold uppercase tracking-wide text-[var(--color-text-muted)]">
        {label}
      </div>
      <div className="mt-1 truncate text-[15px] font-extrabold text-[var(--color-text)]" title={value}>
        {value}
      </div>
    </div>
  );
}
