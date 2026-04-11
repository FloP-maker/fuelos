"use client";

import Link from "next/link";
import { useMemo } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import type { RaceEntry } from "@/lib/types/race";

const WEEKDAYS = ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"] as const;

function pad2(n: number): string {
  return String(n).padStart(2, "0");
}

function dateKey(y: number, monthIndex: number, day: number): string {
  return `${y}-${pad2(monthIndex + 1)}-${pad2(day)}`;
}

function todayKey(): string {
  const t = new Date();
  return dateKey(t.getFullYear(), t.getMonth(), t.getDate());
}

export type RacesMonthCalendarProps = {
  viewYear: number;
  viewMonth: number;
  onPrevMonth: () => void;
  onNextMonth: () => void;
  onThisMonth: () => void;
  racesByDate: Map<string, RaceEntry[]>;
  selectedDate: string | null;
  onSelectDate: (iso: string | null) => void;
};

export function RacesMonthCalendar({
  viewYear,
  viewMonth,
  onPrevMonth,
  onNextMonth,
  onThisMonth,
  racesByDate,
  selectedDate,
  onSelectDate,
}: RacesMonthCalendarProps) {
  const title = useMemo(
    () =>
      new Intl.DateTimeFormat("fr-FR", { month: "long", year: "numeric" }).format(
        new Date(viewYear, viewMonth, 1)
      ),
    [viewYear, viewMonth]
  );

  const cells = useMemo(() => {
    const first = new Date(viewYear, viewMonth, 1);
    const last = new Date(viewYear, viewMonth + 1, 0);
    const daysInMonth = last.getDate();
    const startOffset = (first.getDay() + 6) % 7;
    const out: ({ day: number; key: string } | null)[] = [];
    for (let i = 0; i < startOffset; i++) out.push(null);
    for (let d = 1; d <= daysInMonth; d++) {
      out.push({ day: d, key: dateKey(viewYear, viewMonth, d) });
    }
    while (out.length % 7 !== 0) out.push(null);
    const rowCount = Math.max(6, Math.ceil(out.length / 7));
    while (out.length < rowCount * 7) out.push(null);
    return out;
  }, [viewYear, viewMonth]);

  const today = todayKey();
  const isPastDay = (k: string) => k < today;
  const isThisMonthView =
    new Date().getFullYear() === viewYear && new Date().getMonth() === viewMonth;

  return (
    <div className="fuel-card flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
      <div className="flex flex-col gap-4 border-b border-[var(--color-border)] px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <div className="flex items-center gap-1 sm:gap-2">
          <button
            type="button"
            onClick={onPrevMonth}
            className="rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-elevated)] p-2 text-[var(--color-text)] hover:bg-[var(--color-bg-card-hover)]"
            aria-label="Mois précédent"
          >
            <ChevronLeft size={20} strokeWidth={2.25} />
          </button>
          <button
            type="button"
            onClick={onNextMonth}
            className="rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-elevated)] p-2 text-[var(--color-text)] hover:bg-[var(--color-bg-card-hover)]"
            aria-label="Mois suivant"
          >
            <ChevronRight size={20} strokeWidth={2.25} />
          </button>
          <h2 className="font-display ml-2 min-w-0 flex-1 text-center text-lg font-bold capitalize tracking-tight text-[var(--color-text)] sm:ml-4 sm:text-left sm:text-xl">
            {title}
          </h2>
        </div>
        {!isThisMonthView ? (
          <button
            type="button"
            onClick={onThisMonth}
            className="shrink-0 self-start rounded-lg border border-[var(--color-border)] bg-[var(--color-accent-muted)] px-3 py-2 text-xs font-bold text-[var(--color-text)] hover:opacity-95 sm:self-center"
          >
            Aujourd&apos;hui
          </button>
        ) : (
          <span className="hidden text-xs font-semibold text-[var(--color-text-muted)] sm:block">
            Mois en cours
          </span>
        )}
      </div>

      <div className="grid flex-1 auto-rows-fr grid-cols-7 gap-px bg-[var(--color-border-subtle)] p-px sm:p-1">
        {WEEKDAYS.map((wd) => (
          <div
            key={wd}
            className="flex items-center justify-center bg-[var(--color-bg-card)] py-2 text-[11px] font-bold uppercase tracking-wide text-[var(--color-text-muted)] sm:text-xs"
          >
            {wd}
          </div>
        ))}
        {cells.map((cell, idx) => {
          if (!cell) {
            return (
              <div
                key={`e-${idx}`}
                className="min-h-[72px] bg-[var(--color-bg-elevated)]/50 sm:min-h-[88px] md:min-h-[100px]"
              />
            );
          }
          const { day, key } = cell;
          const list = racesByDate.get(key) ?? [];
          const isToday = key === today;
          const isSelected = key === selectedDate;
          const pastDay = isPastDay(key);
          return (
            <button
              key={key}
              type="button"
              onClick={() => onSelectDate(isSelected ? null : key)}
              className={[
                "group flex min-h-[72px] flex-col border border-transparent bg-[var(--color-bg-card)] p-1.5 text-left transition sm:min-h-[88px] sm:p-2 md:min-h-[100px]",
                pastDay ? "opacity-[0.92]" : "",
                isToday ? "ring-2 ring-[var(--color-accent)] ring-offset-2 ring-offset-[var(--color-bg-card)]" : "",
                isSelected ? "border-[var(--color-accent)] bg-[var(--color-accent-muted)]" : "hover:bg-[var(--color-bg-card-hover)]",
              ].join(" ")}
            >
              <span
                className={[
                  "text-sm font-bold tabular-nums sm:text-base",
                  isToday ? "text-[var(--color-accent)]" : "text-[var(--color-text)]",
                ].join(" ")}
              >
                {day}
              </span>
              {list.length > 0 ? (
                <ul className="mt-1 flex min-h-0 flex-1 flex-col gap-0.5 overflow-hidden">
                  {list.slice(0, 3).map((r) => (
                    <li key={r.id} className="min-w-0">
                      <Link
                        href={`/races/${r.id}`}
                        onClick={(e) => e.stopPropagation()}
                        className={[
                          "block truncate rounded px-0.5 text-[10px] font-semibold leading-tight underline-offset-2 hover:bg-[var(--color-bg-elevated)] hover:underline sm:text-[11px]",
                          pastDay ? "text-[var(--color-text-muted)]" : "text-[var(--color-text)]",
                        ].join(" ")}
                      >
                        {r.name}
                      </Link>
                    </li>
                  ))}
                  {list.length > 3 ? (
                    <li className="text-[10px] font-medium text-[var(--color-text-muted)]">+{list.length - 3}</li>
                  ) : null}
                </ul>
              ) : (
                <span className="mt-auto text-[10px] text-transparent sm:text-xs">.</span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
