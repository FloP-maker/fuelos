'use client';

import Link from 'next/link';
import type { RaceEvent, RaceSport } from '@/types/race';
import { NutritionScoreBadge } from './NutritionScoreBadge';

const SPORT_FR: Record<RaceSport, string> = {
  trail: 'Trail',
  marathon: 'Marathon',
  triathlon: 'Triathlon',
  cyclisme: 'Cyclisme',
  autre: 'Autre',
};

function formatDateFr(d: Date): string {
  return new Intl.DateTimeFormat('fr-FR', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(d);
}

function formatDuration(min: number): string {
  const h = Math.floor(min / 60);
  const m = Math.round(min % 60);
  if (h <= 0) return `${m} min`;
  return `${h} h ${m.toString().padStart(2, '0')} min`;
}

export type RaceCardProps = {
  race: RaceEvent;
};

export function RaceCard({ race }: RaceCardProps) {
  return (
    <article
      className="rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-bg-card)] p-4 shadow-[var(--shadow-xs)] min-w-0"
      style={{ maxWidth: '100%' }}
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <h2 className="font-display text-base font-extrabold leading-snug text-[var(--color-text)] [overflow-wrap:anywhere]">
            {race.name}
          </h2>
          <p className="mt-1 text-xs font-semibold text-[var(--color-text-muted)]">
            {SPORT_FR[race.sport]} · {formatDateFr(race.date)}
          </p>
          <p className="mt-2 text-[13px] leading-relaxed text-[var(--color-text-muted)]">
            {race.distanceKm.toFixed(1)} km · D+ {Math.round(race.elevationGainM)} m ·{' '}
            {formatDuration(race.durationMin)}
          </p>
        </div>
        <div className="flex shrink-0 flex-col items-end gap-2">
          <NutritionScoreBadge score={race.nutritionScore} />
          <div
            className="flex items-center gap-1.5 rounded-full border border-[var(--color-border-subtle)] px-2.5 py-1 text-[12px] font-bold text-[var(--color-text-muted)]"
            title="Ressenti gastro-intestinal"
          >
            <span className="text-[15px] leading-none" aria-hidden>
              🫃
            </span>
            <span>GI {race.giLog.overallScore}/5</span>
          </div>
        </div>
      </div>
      <div className="mt-4">
        <Link
          href={`/history/${race.id}`}
          className="inline-flex min-h-11 items-center justify-center rounded-full border border-[var(--color-border)] bg-[var(--color-bg-elevated)] px-4 text-[13px] font-bold text-[var(--color-text)] transition hover:bg-[var(--color-bg-card-hover)]"
        >
          Voir le détail
        </Link>
      </div>
    </article>
  );
}
