'use client';

import type { GISymptom } from '@/types/race';

export type GITimelineProps = {
  distanceKm: number;
  symptoms: GISymptom[];
};

export function GITimeline({ distanceKm, symptoms }: GITimelineProps) {
  const dist = Math.max(0.001, distanceKm);
  const relevant = symptoms.filter((s) => s.type !== 'aucun');

  return (
    <div className="w-full min-w-0">
      <div className="mb-2 flex justify-between text-[11px] font-bold text-[var(--color-text-muted)]">
        <span>0 km</span>
        <span>{dist.toFixed(1)} km</span>
      </div>
      <div
        className="relative h-28 rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-bg-elevated)]"
        role="img"
        aria-label="Symptômes GI en fonction du kilomètre"
      >
        <div className="absolute left-0 right-0 top-1/2 h-px bg-[var(--color-border)]" />
        <p className="absolute bottom-1 left-2 text-[10px] font-semibold uppercase tracking-wide text-[var(--color-text-muted)]">
          Sévérité
        </p>
        {relevant.length === 0 ? (
          <p className="flex h-full items-center justify-center px-4 text-center text-[13px] text-[var(--color-text-muted)]">
            Aucun symptôme signalé (ou uniquement « aucun »).
          </p>
        ) : (
          relevant.map((s, i) => {
            const xPct = Math.min(100, Math.max(0, (s.kmMark / dist) * 100));
            const yPct = 100 - ((s.severity - 0.5) / 3) * 100;
            const size = 8 + s.severity * 4;
            return (
              <div
                key={i}
                className="absolute z-[1] flex -translate-x-1/2 -translate-y-1/2 flex-col items-center"
                style={{ left: `${xPct}%`, top: `${yPct}%` }}
                title={`${s.type} · km ${s.kmMark}`}
              >
                <div
                  className="rounded-full bg-amber-500 shadow-sm ring-2 ring-white dark:ring-[var(--color-bg-card)]"
                  style={{ width: size, height: size }}
                />
              </div>
            );
          })
        )}
      </div>
      <ul className="mt-3 space-y-1.5 text-[12px] text-[var(--color-text-muted)]">
        {relevant.map((s, i) => (
          <li key={i}>
            <span className="font-bold text-[var(--color-text)]">{s.type}</span> · km{' '}
            {s.kmMark.toFixed(1)} · sévérité {s.severity}
            {s.note ? ` — ${s.note}` : ''}
          </li>
        ))}
      </ul>
    </div>
  );
}
