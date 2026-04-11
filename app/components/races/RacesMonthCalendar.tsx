"use client";

import Link from "next/link";
import { useMemo } from "react";
import type { RaceEntry } from "@/lib/types/race";
import { RacesCalendarToolbar, type RacesCalendarViewFilter } from "./RacesCalendarToolbar";
import { raceSportChip } from "@/lib/raceCalendarUi";

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

function weekKmForKeys(keys: (string | null)[], racesByDate: Map<string, RaceEntry[]>): number {
  let km = 0;
  for (const k of keys) {
    if (!k) continue;
    for (const r of racesByDate.get(k) ?? []) {
      if (typeof r.distance === "number" && r.distance > 0) km += r.distance;
    }
  }
  return Math.round(km * 10) / 10;
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
  viewFilter: RacesCalendarViewFilter;
  onViewFilter: (v: RacesCalendarViewFilter) => void;
  sportFilter: string;
  onSportFilter: (sport: string) => void;
  sportsOptions: string[];
  rangeMonths: 1 | 3 | 6;
  onRangeMonths: (n: 1 | 3 | 6) => void;
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
  viewFilter,
  onViewFilter,
  sportFilter,
  onSportFilter,
  sportsOptions,
  rangeMonths,
  onRangeMonths,
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

  const rowCount = cells.length / 7;

  const today = todayKey();
  const isPastDay = (k: string) => k < today;
  const isThisMonthView =
    new Date().getFullYear() === viewYear && new Date().getMonth() === viewMonth;

  return (
    <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden bg-[var(--color-bg-card)]">
      <RacesCalendarToolbar
        viewFilter={viewFilter}
        onViewFilter={onViewFilter}
        sportFilter={sportFilter}
        onSportFilter={onSportFilter}
        sportsOptions={sportsOptions}
        rangeMonths={rangeMonths}
        onRangeMonths={onRangeMonths}
        monthTitle={title}
        onPrevMonth={onPrevMonth}
        onNextMonth={onNextMonth}
        onThisMonth={onThisMonth}
        isThisMonthView={isThisMonthView}
      />

      <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain p-2 sm:p-3">
        <div className="mb-2 flex gap-2">
          <div className="grid min-w-0 flex-1 grid-cols-7 gap-1 sm:gap-1.5">
            {WEEKDAYS.map((wd) => (
              <div
                key={wd}
                className="flex h-9 items-center justify-center rounded-lg bg-[var(--color-bg-elevated)] text-[10px] font-bold uppercase tracking-wide text-[var(--color-text-muted)] sm:text-[11px]"
              >
                {wd}
              </div>
            ))}
          </div>
          <div className="flex w-[4.25rem] shrink-0 flex-col items-center justify-center rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-elevated)]/60 px-1 py-2 text-center shadow-sm sm:w-[5rem]">
            <span className="text-[9px] font-bold uppercase leading-tight text-[var(--color-text-muted)]">Σ</span>
            <span className="text-[9px] font-semibold text-[var(--color-text-muted)]">km</span>
          </div>
        </div>

        {Array.from({ length: rowCount }, (_, ri) => {
          const keys = cells.slice(ri * 7, ri * 7 + 7).map((c) => (c ? c.key : null));
          return (
            <div key={ri} className="mb-2 flex gap-2 last:mb-0">
              <div className="grid min-w-0 flex-1 grid-cols-7 gap-1 sm:gap-1.5">
                {cells.slice(ri * 7, ri * 7 + 7).map((cell, ci) => {
                  const idx = ri * 7 + ci;
                  if (!cell) {
                    return (
                      <div
                        key={`e-${idx}`}
                        className="min-h-[92px] rounded-xl bg-[var(--color-bg-elevated)]/40 sm:min-h-[104px] md:min-h-[118px]"
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
                        "flex min-h-[92px] flex-col rounded-xl border bg-[var(--color-bg-elevated)]/50 p-1.5 text-left shadow-sm transition sm:min-h-[104px] sm:p-2 md:min-h-[118px]",
                        pastDay ? "opacity-[0.88]" : "",
                        isToday
                          ? "border-[var(--color-accent)] ring-2 ring-[var(--color-accent)]/35"
                          : "border-[var(--color-border)] hover:border-[color-mix(in_srgb,var(--color-accent)_45%,var(--color-border))]",
                        isSelected ? "bg-[var(--color-accent-muted)]" : "",
                      ].join(" ")}
                    >
                      <span
                        className={[
                          "text-xs font-bold tabular-nums sm:text-sm",
                          isToday ? "text-[var(--color-accent)]" : "text-[var(--color-text)]",
                        ].join(" ")}
                      >
                        {day}
                      </span>
                      {list.length > 0 ? (
                        <ul className="mt-1 flex min-h-0 flex-1 flex-col gap-1 overflow-hidden">
                          {list.slice(0, 4).map((r) => {
                            const chip = raceSportChip(r.sport);
                            return (
                              <li key={r.id} className="min-w-0">
                                <Link
                                  href={`/races/${r.id}`}
                                  onClick={(e) => e.stopPropagation()}
                                  className={[
                                    "flex items-center gap-1 truncate rounded-lg px-1.5 py-1 text-[9px] font-bold leading-tight shadow-sm transition hover:brightness-95 sm:text-[10px]",
                                    chip.pillClass,
                                    pastDay ? "opacity-90" : "",
                                  ].join(" ")}
                                >
                                  <span className="shrink-0" aria-hidden>
                                    {chip.icon}
                                  </span>
                                  <span className="truncate">{r.name}</span>
                                </Link>
                              </li>
                            );
                          })}
                          {list.length > 4 ? (
                            <li className="text-[9px] font-semibold text-[var(--color-text-muted)]">
                              +{list.length - 4}
                            </li>
                          ) : null}
                        </ul>
                      ) : (
                        <span className="mt-auto text-[9px] text-transparent">.</span>
                      )}
                    </button>
                  );
                })}
              </div>

              <div className="flex w-[4.25rem] shrink-0 flex-col items-center justify-center rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-elevated)]/60 px-1.5 py-2 text-center shadow-sm sm:w-[5rem]">
                <span className="text-[9px] font-bold text-[var(--color-text-muted)]">Sem.</span>
                <span className="mt-1 font-display text-sm font-bold tabular-nums text-[var(--color-text)]">
                  {weekKmForKeys(keys, racesByDate) || "—"}
                </span>
                <span className="text-[9px] text-[var(--color-text-muted)]">km</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
