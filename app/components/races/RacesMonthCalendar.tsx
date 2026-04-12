"use client";

import Link from "next/link";
import { useMemo } from "react";
import type { RaceEntry } from "@/lib/types/race";
import {
  RacesCalendarToolbar,
  type RacesCalendarListRange,
  type RacesCalendarViewFilter,
} from "./RacesCalendarToolbar";
import { raceSportDotClass, raceSportVisual } from "@/lib/raceCalendarUi";
import {
  addDaysIso,
  buildSixWeekGrid,
  layoutBandsInWeek,
  nutritionBandsFromRaces,
  nutritionDayTintsFromRaces,
  type CalendarCell,
  type NutritionDayCellTint,
} from "@/lib/raceNutritionBands";

const WEEKDAYS = ["lun", "mar", "mer", "jeu", "ven", "sam", "dim"] as const;

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

function dayCellSurfaceClass(opts: {
  inMonth: boolean;
  pastDay: boolean;
  isToday: boolean;
  isSelected: boolean;
  tint?: NutritionDayCellTint;
}): string {
  const { inMonth, pastDay, isSelected, tint } = opts;
  const base = [
    "relative flex min-h-[76px] flex-col rounded-[8px] p-1.5 text-left transition-[background-color,box-shadow,opacity] duration-150 ease-out sm:min-h-[82px] sm:p-2",
    inMonth
      ? "hover:bg-[#f0f7f0] dark:hover:bg-[color-mix(in_srgb,var(--color-bg-elevated)_40%,var(--color-bg-card))]"
      : "opacity-[0.58]",
    pastDay && inMonth ? "opacity-[0.88]" : "",
  ];
  if (!inMonth) {
    const outMonthBg =
      tint === "race"
        ? "bg-emerald-600/12 dark:bg-emerald-500/[0.12]"
        : tint === "charge"
          ? "bg-orange-50/80 dark:bg-orange-500/[0.08]"
          : tint === "recovery"
            ? "bg-emerald-50/70 dark:bg-emerald-400/[0.06]"
            : "bg-white dark:bg-[var(--color-bg-card)]";
    base.push(outMonthBg);
    return base.filter(Boolean).join(" ");
  }
  if (tint === "race") {
    base.push(
      "bg-emerald-600/18 ring-1 ring-inset ring-emerald-700/25 dark:bg-emerald-500/22 dark:ring-emerald-400/35"
    );
  } else if (tint === "charge") {
    base.push("bg-orange-100/90 dark:bg-orange-500/[0.14]");
  } else if (tint === "recovery") {
    base.push("bg-emerald-50 dark:bg-emerald-400/[0.1]");
  } else {
    base.push("bg-white dark:bg-[var(--color-bg-card)]");
  }
  if (isSelected && inMonth) {
    base.push(
      "ring-2 ring-[color-mix(in_srgb,var(--color-primary)_38%,var(--color-border))] ring-offset-0 dark:ring-[color-mix(in_srgb,var(--color-accent)_40%,transparent)]"
    );
  }
  return base.filter(Boolean).join(" ");
}

function WeekKmSparkline({ values }: { values: number[] }) {
  const max = Math.max(...values, 1);
  const h = 22;
  const w = 48;
  const n = values.length;
  if (n === 0) return null;
  const pts = values.map((v, i) => {
    const x = n <= 1 ? w / 2 : (i / (n - 1)) * (w - 4) + 2;
    const y = h - 3 - (v / max) * (h - 6);
    return `${x},${y}`;
  });
  return (
    <svg
      width={w}
      height={h}
      className="mt-1.5 text-[var(--color-accent)] opacity-[0.92] dark:opacity-100 dark:drop-shadow-[0_0_12px_color-mix(in_srgb,var(--color-accent)_28%,transparent)]"
      viewBox={`0 0 ${w} ${h}`}
      aria-hidden
    >
      <polyline
        fill="none"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
        points={pts.join(" ")}
      />
    </svg>
  );
}

export type RacesMonthCalendarProps = {
  viewYear: number;
  viewMonth: number;
  /** Lundi ISO de la semaine affichée lorsque `calendarListRange === "week"`. */
  weekStartKey: string;
  calendarListRange: RacesCalendarListRange;
  onListRange: (n: RacesCalendarListRange) => void;
  onPrevMonth: () => void;
  onNextMonth: () => void;
  onThisMonth: () => void;
  racesByDate: Map<string, RaceEntry[]>;
  bandSourceRaces: RaceEntry[];
  selectedDate: string | null;
  onSelectDate: (iso: string | null) => void;
  viewFilter: RacesCalendarViewFilter;
  onViewFilter: (v: RacesCalendarViewFilter) => void;
  sportFilter: string;
  onSportFilter: (sport: string) => void;
  sportsOptions: string[];
  /** Titre du bandeau (mois ou plage de semaine). */
  calendarTitle: string;
  /** Mois courant ou semaine affichée contenant aujourd’hui. */
  isAnchorCurrent: boolean;
};

export function RacesMonthCalendar({
  viewYear,
  viewMonth,
  weekStartKey,
  calendarListRange,
  onListRange,
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
  calendarTitle,
  isAnchorCurrent,
}: RacesMonthCalendarProps) {
  const isWeekMode = calendarListRange === "week";

  const cells = useMemo((): CalendarCell[] => {
    if (!isWeekMode) return buildSixWeekGrid(viewYear, viewMonth);
    const out: CalendarCell[] = [];
    for (let i = 0; i < 7; i++) {
      const key = addDaysIso(weekStartKey, i);
      const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(key);
      if (!m) continue;
      out.push({ key, day: Number(m[3]), inMonth: true });
    }
    return out;
  }, [isWeekMode, viewYear, viewMonth, weekStartKey]);

  const rowCount = cells.length / 7;

  const bands = useMemo(() => nutritionBandsFromRaces(bandSourceRaces), [bandSourceRaces]);

  const dayTints = useMemo(() => nutritionDayTintsFromRaces(bandSourceRaces), [bandSourceRaces]);

  const weekKmSeries = useMemo(() => {
    const series: number[] = [];
    for (let ri = 0; ri < rowCount; ri++) {
      const rowCells = cells.slice(ri * 7, ri * 7 + 7);
      series.push(weekKmForKeys(rowCells.map((c) => c.key), racesByDate));
    }
    return series;
  }, [cells, rowCount, racesByDate]);

  const maxWeekKm = useMemo(() => Math.max(...weekKmSeries, 1), [weekKmSeries]);

  const today = todayKey();
  const isPastDay = (k: string) => k < today;

  return (
    <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden bg-[var(--color-bg-card)]">
      <RacesCalendarToolbar
        viewFilter={viewFilter}
        onViewFilter={onViewFilter}
        sportFilter={sportFilter}
        onSportFilter={onSportFilter}
        sportsOptions={sportsOptions}
        listRange={calendarListRange}
        onListRange={onListRange}
        calendarTitle={calendarTitle}
        onPrevMonth={onPrevMonth}
        onNextMonth={onNextMonth}
        onThisMonth={onThisMonth}
        isThisMonthView={isAnchorCurrent}
      />

      <div className="races-scrollable-y min-h-0 flex-1 overflow-y-auto overscroll-contain p-2 sm:p-3 md:p-4">
        <div className="rounded-2xl border border-[var(--fuel-card-border)] bg-[var(--fuel-card-surface)] p-2 shadow-[var(--fuel-card-shadow)] sm:p-3 dark:bg-[color-mix(in_srgb,var(--color-bg-elevated)_45%,var(--color-bg))]">
          <div className="mb-2 flex gap-2 sm:gap-3 md:mb-3">
            <div className="grid min-w-0 flex-1 grid-cols-7 gap-px overflow-hidden rounded-xl border border-[var(--fuel-card-border)] bg-[var(--color-races-grid-mute)] dark:border-[var(--color-border-subtle)] dark:bg-[var(--color-races-grid-mute)]">
              {WEEKDAYS.map((wd) => (
                <div
                  key={wd}
                  className="flex h-8 items-center justify-center bg-white py-1 text-[10px] font-medium capitalize tracking-wide text-[#6b7280] first:rounded-ss-lg last:rounded-se-lg dark:bg-[var(--color-bg-card)] dark:text-[var(--color-text-muted)] sm:h-8 sm:text-[11px]"
                  style={{ fontVariant: "all-small-caps", letterSpacing: "0.06em" }}
                >
                  {wd}
                </div>
              ))}
            </div>
            <div className="flex w-[3.75rem] shrink-0 flex-col items-center rounded-xl border border-[var(--fuel-card-border)] bg-[#fafafa] px-1 py-2 text-center dark:border-[var(--color-border-subtle)] dark:bg-[color-mix(in_srgb,var(--color-bg-elevated)_55%,var(--color-bg))] sm:w-[4.5rem]">
              <span className="text-[9px] font-medium tracking-wide text-[#9ca3af] dark:text-[var(--color-text-muted)]">Σ km</span>
              <WeekKmSparkline values={weekKmSeries} />
            </div>
          </div>

          {Array.from({ length: rowCount }, (_, ri) => {
            const rowCells = cells.slice(ri * 7, ri * 7 + 7);
            const weekKeys = rowCells.map((c) => c.key);
            const placed = layoutBandsInWeek(weekKeys, bands);
            const maxLane = placed.reduce((m, p) => Math.max(m, p.lane), -1);
            const bandRows = maxLane >= 0 ? maxLane + 1 : 0;
            const weekKm = weekKmSeries[ri] ?? 0;
            const barPct = maxWeekKm > 0 ? Math.min(100, (weekKm / maxWeekKm) * 100) : 0;

            return (
              <div key={ri} className="mb-2 flex flex-col gap-1.5 last:mb-0 md:mb-2.5">
                {placed.length > 0 ? (
                  <div className="flex gap-2 sm:gap-3">
                    <div
                      className="relative min-w-0 flex-1 gap-1"
                      style={{
                        display: "grid",
                        gridTemplateColumns: "repeat(7, minmax(0, 1fr))",
                        gridTemplateRows: `repeat(${bandRows}, minmax(16px, auto))`,
                        gap: "3px",
                      }}
                    >
                      {placed.map((p) => (
                        <Link
                          key={p.band.id}
                          href={`/races/${p.band.raceId}`}
                          title={`${p.band.label} — ${p.band.raceName}`}
                          className={[
                            "flex min-h-[16px] items-center overflow-hidden rounded-md px-1.5 py-0.5 text-[9px] font-medium leading-tight transition hover:opacity-90 sm:text-[10px]",
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
                    <div className="w-[3.75rem] shrink-0 sm:w-[4.5rem]" aria-hidden />
                  </div>
                ) : null}

                <div className="flex gap-2 sm:gap-3">
                  <div className="grid min-w-0 flex-1 grid-cols-7 gap-px overflow-hidden rounded-xl border border-[var(--fuel-card-border)] bg-[var(--color-races-grid-mute)] dark:border-[var(--color-border-subtle)] dark:bg-[var(--color-races-grid-mute)]">
                    {rowCells.map((cell, ci) => {
                      const idx = ri * 7 + ci;
                      const { key, day, inMonth } = cell;
                      const list = racesByDate.get(key) ?? [];
                      const isToday = key === today;
                      const isSelected = key === selectedDate;
                      const pastDay = isPastDay(key);
                      const tint = dayTints.get(key);
                      return (
                        <button
                          key={`${key}-${idx}`}
                          type="button"
                          onClick={() => onSelectDate(isSelected ? null : key)}
                          className={dayCellSurfaceClass({
                            inMonth,
                            pastDay,
                            isToday,
                            isSelected,
                            tint,
                          })}
                        >
                          <span className="relative z-[1] flex h-7 items-start justify-center sm:h-8">
                            {isToday && inMonth ? (
                              <span className="inline-flex size-8 items-center justify-center rounded-full bg-[#2d5016] text-sm font-semibold tabular-nums text-white shadow-sm dark:bg-[#3d6b24]">
                                {day}
                              </span>
                            ) : (
                              <span
                                className={[
                                  "inline-flex min-w-[1.75rem] justify-center pt-0.5 text-xs font-medium tabular-nums sm:text-sm",
                                  inMonth
                                    ? "text-[var(--color-text-primary)] dark:text-[var(--color-text)]"
                                    : "text-[#9ca3af] dark:text-[var(--color-text-muted)]",
                                ].join(" ")}
                              >
                                {day}
                              </span>
                            )}
                          </span>
                          {list.length > 0 ? (
                            <ul className="relative z-[1] mt-0.5 flex min-h-0 flex-1 flex-col gap-0.5 overflow-hidden pb-2">
                              {list.slice(0, 3).map((r) => {
                                const { Icon } = raceSportVisual(r.sport);
                                return (
                                  <li key={r.id} className="min-w-0">
                                    <Link
                                      href={`/races/${r.id}`}
                                      onClick={(e) => e.stopPropagation()}
                                      className={[
                                        "flex items-center gap-0.5 truncate rounded border border-[var(--fuel-card-border)] bg-[#fafafa] px-1 py-0.5 text-[8px] font-medium leading-tight text-[#374151] transition hover:bg-white dark:border-[var(--color-border-subtle)] dark:bg-[color-mix(in_srgb,var(--color-bg-elevated)_40%,var(--color-bg-card))] dark:text-[var(--color-text)] dark:hover:bg-[color-mix(in_srgb,var(--color-bg-card-hover)_70%,var(--color-bg-card))] sm:text-[9px]",
                                        pastDay && inMonth ? "opacity-90" : "",
                                      ].join(" ")}
                                    >
                                      <Icon className="size-2.5 shrink-0 opacity-75 sm:size-3" strokeWidth={2} aria-hidden />
                                      <span className="truncate">{r.name}</span>
                                    </Link>
                                  </li>
                                );
                              })}
                              {list.length > 3 ? (
                                <li className="text-[8px] font-medium text-[#9ca3af] dark:text-[var(--color-text-muted)] sm:text-[9px]">
                                  +{list.length - 3}
                                </li>
                              ) : null}
                            </ul>
                          ) : (
                            <span className="mt-auto flex-1 text-[8px] text-transparent">.</span>
                          )}
                          {list.length > 0 ? (
                            <span
                              className={`pointer-events-none absolute bottom-1.5 left-1/2 z-[2] size-[6px] -translate-x-1/2 rounded-full shadow-sm ${raceSportDotClass(list[0].sport)}`}
                              aria-hidden
                            />
                          ) : null}
                        </button>
                      );
                    })}
                  </div>

                  <div className="flex w-[3.75rem] shrink-0 flex-col items-center justify-center rounded-xl border border-[var(--fuel-card-border)] bg-[#fafafa] px-1.5 py-2 text-center dark:border-[var(--color-border-subtle)] dark:bg-[color-mix(in_srgb,var(--color-bg-elevated)_55%,var(--color-bg))] sm:w-[4.5rem]">
                    <span className="text-[9px] font-medium text-[#9ca3af] dark:text-[var(--color-text-muted)]">Sem.</span>
                    <span
                      className={
                        weekKm > 0
                          ? "mt-0.5 font-semibold tabular-nums text-sm text-[var(--color-text-primary)] dark:text-[var(--color-text)]"
                          : "mt-0.5 font-semibold tabular-nums text-sm text-[#c4c4c4] dark:text-zinc-500"
                      }
                    >
                      {weekKm > 0 ? weekKm : "—"}
                    </span>
                    <span className="text-[9px] text-[#9ca3af] dark:text-[var(--color-text-muted)]">km</span>
                    <div className="mt-1.5 h-1 w-full max-w-[2.75rem] overflow-hidden rounded-full bg-[var(--color-races-grid-mute)] dark:bg-[var(--color-border-subtle)]">
                      <div
                        className="h-full rounded-full bg-[var(--color-accent)] opacity-95 transition-all duration-300 dark:opacity-100"
                        style={{ width: `${barPct}%` }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
