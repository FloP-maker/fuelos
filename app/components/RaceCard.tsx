'use client';

import { useRouter } from 'next/navigation';
import type { CSSProperties } from 'react';
import type { RaceEntry, RacePhase } from '@/lib/types/race';
import { getRaceCountdownLabel, getRacePhase } from '@/lib/races';

const PHASE_BADGE: Record<
  RacePhase,
  { label: string; style: CSSProperties }
> = {
  far: {
    label: 'Saison',
    style: {
      background: '#f0fdf4',
      color: '#16a34a',
      border: '1px solid #bbf7d0',
    },
  },
  prep: {
    label: 'Préparation',
    style: {
      background: '#eff6ff',
      color: '#2563eb',
      border: '1px solid #bfdbfe',
    },
  },
  charge: {
    label: 'Charge ⚡',
    style: {
      background: '#fff7ed',
      color: '#ea580c',
      border: '1px solid #fed7aa',
    },
  },
  race_day: {
    label: '🏁 Aujourd\'hui',
    style: {
      background: '#16a34a',
      color: '#ffffff',
      border: 'none',
    },
  },
  past: {
    label: 'Terminée',
    style: {
      background: '#f9fafb',
      color: '#6b7280',
      border: '1px solid #e5e7eb',
    },
  },
  done: {
    label: '✅ Débrief fait',
    style: {
      background: '#f0fdf4',
      color: '#16a34a',
      border: '1px solid #bbf7d0',
    },
  },
};

function formatRaceDate(dateStr: string): string {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dateStr);
  if (!m) return dateStr;
  const y = Number(m[1]);
  const mo = Number(m[2]) - 1;
  const d = Number(m[3]);
  return new Intl.DateTimeFormat('fr-FR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(new Date(y, mo, d));
}

export type RaceCardProps = {
  race: RaceEntry;
};

export function RaceCard({ race }: RaceCardProps) {
  const router = useRouter();
  const phase = getRacePhase(race);
  const badge = PHASE_BADGE[phase];
  const countdown = getRaceCountdownLabel(race);
  const hasPlan = race.planSnapshot != null && typeof race.planSnapshot === 'object';
  const hasDebrief =
    race.debriefSnapshot != null && typeof race.debriefSnapshot === 'object';

  return (
    <button
      type="button"
      onClick={() => router.push(`/races/${race.id}`)}
      className="race-card w-full cursor-pointer border border-[#e5e7eb] bg-white text-left shadow-sm transition hover:shadow-md focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#16a34a] max-sm:flex max-sm:flex-col"
      style={{
        borderRadius: 12,
        padding: 'clamp(16px, 4vw, 20px)',
        display: 'flex',
        flexDirection: 'column',
        gap: 12,
      }}
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <span
          className="inline-flex w-fit shrink-0 items-center rounded-full px-2.5 py-1 text-xs font-semibold"
          style={badge.style}
        >
          {badge.label}
        </span>
        <span className="text-sm text-[#6b7280] sm:text-right">{countdown}</span>
      </div>

      <div>
        <div className="text-[18px] font-bold leading-snug">{race.name}</div>
        {race.location?.trim() ? (
          <div className="mt-1 text-[14px] text-[#6b7280]">{race.location.trim()}</div>
        ) : null}
      </div>

      <div
        className="flex flex-col gap-2 text-[14px] text-[#6b7280] sm:flex-row sm:flex-wrap sm:gap-x-4"
        style={{ gap: '8px 16px' }}
      >
        <span>📅 {formatRaceDate(race.date)}</span>
        <span>🏃 {race.sport}</span>
        {race.distance > 0 ? (
          <span>
            📏 {race.distance}
            km
          </span>
        ) : (
          <span className="text-[#9ca3af]">📏 —</span>
        )}
        {race.elevationGain != null && race.elevationGain > 0 ? (
          <span>
            ⛰️ {race.elevationGain}
            m D+
          </span>
        ) : null}
      </div>

      <div className="flex flex-col gap-1.5 text-[13px] text-[#6b7280] sm:flex-row sm:flex-wrap sm:gap-x-4">
        {hasPlan ? <span>✅ Plan lié</span> : <span className="text-[#ea580c]">⚠️ Plan non généré</span>}
        {phase === 'done' ? <span>✅ Débrief rempli</span> : null}
        {phase === 'past' && !hasDebrief ? (
          <span className="text-[#ea580c]">📝 Débrief à faire</span>
        ) : null}
      </div>
    </button>
  );
}
