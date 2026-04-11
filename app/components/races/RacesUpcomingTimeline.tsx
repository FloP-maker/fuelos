"use client";

import Link from "next/link";
import { useMemo } from "react";
import type { RaceEntry } from "@/lib/types/race";
import { getRaceCountdownLabel } from "@/lib/races";

function formatShortDate(iso: string): string {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso);
  if (!m) return iso;
  const d = new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
  return d.toLocaleDateString("fr-FR", {
    weekday: "short",
    day: "numeric",
    month: "short",
  });
}

export type RacesUpcomingTimelineProps = {
  upcoming: RaceEntry[];
  selectedDate: string | null;
  /** Centre le calendrier sur ce jour (même mois). */
  onFocusDate: (iso: string) => void;
};

export function RacesUpcomingTimeline({
  upcoming,
  selectedDate,
  onFocusDate,
}: RacesUpcomingTimelineProps) {
  const grouped = useMemo(() => {
    const days: { date: string; races: RaceEntry[] }[] = [];
    let last: string | null = null;
    for (const r of upcoming) {
      if (r.date !== last) {
        last = r.date;
        days.push({ date: r.date, races: [r] });
      } else {
        days[days.length - 1].races.push(r);
      }
    }
    return days;
  }, [upcoming]);

  if (upcoming.length === 0) {
    return (
      <div className="fuel-card p-5">
        <h2 className="font-display text-base font-bold text-[var(--color-text)]">Prochaines courses</h2>
        <p className="mt-3 text-sm leading-relaxed text-[var(--color-text-muted)]">
          Aucune course à venir. Ajoute une date sur le calendrier pour commencer ta saison.
        </p>
      </div>
    );
  }

  return (
    <div className="fuel-card flex max-h-[min(70vh,720px)] flex-col overflow-hidden">
      <div className="border-b border-[var(--color-border)] px-5 py-4">
        <h2 className="font-display text-base font-bold text-[var(--color-text)]">Prochaines courses</h2>
        <p className="mt-1 text-xs text-[var(--color-text-muted)]">{upcoming.length} événement(s)</p>
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-3 py-4">
        <ol className="relative ms-2 border-s-2 border-[var(--color-border)] ps-6">
          {grouped.map(({ date, races }) => (
            <li key={date} className="relative pb-8 last:pb-2">
              <span
                className="absolute -start-[25px] top-1.5 flex h-3 w-3 rounded-full border-2 border-[var(--color-bg-card)] bg-[var(--color-accent)]"
                aria-hidden
              />
              <div className="mb-2 text-xs font-bold uppercase tracking-wide text-[var(--color-text-muted)]">
                {formatShortDate(date)}
              </div>
              <ul className="flex flex-col gap-3">
                {races.map((r) => {
                  const active = selectedDate === r.date;
                  return (
                    <li key={r.id}>
                      <Link
                        href={`/races/${r.id}`}
                        onClick={() => onFocusDate(r.date)}
                        className={[
                          "block rounded-xl border px-3 py-2.5 transition",
                          active
                            ? "border-[var(--color-accent)] bg-[var(--color-accent-muted)]"
                            : "border-[var(--color-border)] bg-[var(--color-bg-elevated)] hover:border-[color-mix(in_srgb,var(--color-accent)_40%,var(--color-border))] hover:bg-[var(--color-bg-card-hover)]",
                        ].join(" ")}
                      >
                        <div className="text-sm font-bold leading-snug text-[var(--color-text)]">{r.name}</div>
                        <div className="mt-1 flex flex-wrap gap-x-2 gap-y-0.5 text-[11px] text-[var(--color-text-muted)]">
                          <span>{r.sport}</span>
                          {r.distance > 0 ? <span>{r.distance} km</span> : null}
                        </div>
                        <div className="mt-1.5 text-[11px] font-medium text-[var(--color-accent)]">
                          {getRaceCountdownLabel(r)}
                        </div>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </li>
          ))}
        </ol>
      </div>
    </div>
  );
}
