"use client";

import Link from "next/link";
import { useMemo } from "react";
import type { RaceEntry } from "@/lib/types/race";
import { RacesCalendarToolbar, type RacesCalendarViewFilter } from "./RacesCalendarToolbar";
import { raceSportChip } from "@/lib/raceCalendarUi";
import { buildSixWeekGrid, layoutBandsInWeek, nutritionBandsFromRaces } from "@/lib/raceNutritionBands";

const WEEKDAYS = ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"] as const;

function todayKey(): string {
  const t = new Date();
  const y = t.getFullYear();
  const m = String(t.getMonth() + 1).padStart(2, "0");
  const d = String(t.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function weekKmForKeys(keys: string[], racesByDate: Map<string, RaceEntry[]>): number {
  let km = 0;
  for (const k of keys) {
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
  /** Courses pour les bandeaux charge / récup (souvent toutes les courses filtrées sport + recherche). */
  bandSourceRaces: RaceEntry[];
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
  bandSourceRaces,
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

  const cells = useMemo(
    () => buildSixWeekGrid(viewYear, viewMonth),
    [viewYear, viewMonth]
  );

  const rowCount = cells.length / 7;

  const bands = useMemo(() => nutritionBandsFromRaces(bandSourceRaces), [bandSourceRaces]);

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
          const rowCells = cells.slice(ri * 7, ri * 7 + 7);
          const weekKeys = rowCells.map((c) => c.key);
          const placed = layoutBandsInWeek(weekKeys, bands);
          const maxLane = placed.reduce((m, p) => Math.max(m, p.lane), -1);
          const bandRows = maxLane >= 0 ? maxLane + 1 : 0;

          return (
            <div key={ri} className="mb-2 flex flex-col gap-1 last:mb-0">
              {placed.length > 0 ? (
                <div className="flex gap-2">
                  <div
                    className="relative min-w-0 flex-1 gap-1"
                    style={{
                      display: "grid",
                      gridTemplateColumns: "repeat(7, minmax(0, 1fr))",
                      gridTemplateRows: `repeat(${bandRows}, minmax(17px, auto))`,
                      gap: "4px",
                    }}
                  >
                    {placed.map((p) => (
                      <Link
                        key={p.band.id}
                        href={`/races/${p.band.raceId}`}
                        title={`${p.band.label} — ${p.band.raceName}`}
                        className={[
                          "flex min-h-[17px] items-center overflow-hidden rounded-md px-1.5 py-0.5 text-[9px] font-bold leading-tight shadow-sm transition hover:brightness-105 sm:text-[10px]",
                          p.band.barClass,
                        ].join(" ")}
                        style={{
                          gridColumn: `${p.startCol + 1} / span ${p.endCol - p.startCol + 1}`,
                          gridRow: p.lane + 1,
                        }}
                      >
                        <span className="truncate">{p.band.label}</span>
                      </Link>
                    ))}
                  </div>
                  <div
                    className="w-[4.25rem] shrink-0 sm:w-[5rem]"
                    aria-hidden
                  />
                </div>
              ) : null}

              <div className="flex gap-2">
                <div className="grid min-w-0 flex-1 grid-cols-7 gap-1 sm:gap-1.5">
                  {rowCells.map((cell, ci) => {
                    const idx = ri * 7 + ci;
                    const { key, day, inMonth } = cell;
                    const list = racesByDate.get(key) ?? [];
                    const isToday = key === today;
                    const isSelected = key === selectedDate;
                    const pastDay = isPastDay(key);
                    return (
                      <button
                        key={`${key}-${idx}`}
                        type="button"
                        onClick={() => onSelectDate(isSelected ? null : key)}
                        className={[
                          "flex min-h-[92px] flex-col rounded-xl border p-1.5 text-left shadow-sm transition sm:min-h-[104px] sm:p-2 md:min-h-[118px]",
                          inMonth
                            ? "border-[var(--color-border)] bg-[var(--color-bg-elevated)]/50"
                            : "border-[var(--color-border-subtle)] bg-[var(--color-bg-elevated)]/25",
                          pastDay && inMonth ? "opacity-[0.88]" : "",
                          !inMonth ? "opacity-70" : "",
                          isToday
                            ? "ring-2 ring-[var(--color-accent)] ring-offset-2 ring-offset-[var(--color-bg-card)]"
                            : "hover:border-[color-mix(in_srgb,var(--color-accent)_45%,var(--color-border))]",
                          isSelected && inMonth ? "bg-[var(--color-accent-muted)]" : "",
                        ].join(" ")}
                      >
                        <span
                          className={[
                            "text-xs font-bold tabular-nums sm:text-sm",
                            isToday ? "text-[var(--color-accent)]" : "text-[var(--color-text)]",
                            !inMonth ? "text-[var(--color-text-muted)]" : "",
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
                                      pastDay && inMonth ? "opacity-90" : "",
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
                    {weekKmForKeys(weekKeys, racesByDate) || "—"}
                  </span>
                  <span className="text-[9px] text-[var(--color-text-muted)]">km</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
