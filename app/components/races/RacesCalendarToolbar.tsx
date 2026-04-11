"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";

export type RacesCalendarViewFilter = "upcoming" | "past" | "all";

export type RacesCalendarToolbarProps = {
  viewFilter: RacesCalendarViewFilter;
  onViewFilter: (v: RacesCalendarViewFilter) => void;
  sportFilter: string;
  onSportFilter: (sport: string) => void;
  sportsOptions: string[];
  rangeMonths: 1 | 3 | 6;
  onRangeMonths: (n: 1 | 3 | 6) => void;
  monthTitle: string;
  onPrevMonth: () => void;
  onNextMonth: () => void;
  onThisMonth: () => void;
  isThisMonthView: boolean;
};

export function RacesCalendarToolbar({
  viewFilter,
  onViewFilter,
  sportFilter,
  onSportFilter,
  sportsOptions,
  rangeMonths,
  onRangeMonths,
  monthTitle,
  onPrevMonth,
  onNextMonth,
  onThisMonth,
  isThisMonthView,
}: RacesCalendarToolbarProps) {
  return (
    <div className="flex flex-col gap-4 border-b border-[var(--color-border)] bg-[var(--color-bg-elevated)]/35 px-4 py-4 md:flex-row md:flex-wrap md:items-center md:justify-between md:gap-3 md:px-5">
      <div className="inline-flex w-full max-w-md rounded-full border border-[var(--color-border)] bg-[var(--color-bg-card)] p-1 shadow-sm md:w-auto">
        {(
          [
            ["upcoming", "À venir"],
            ["past", "Passées"],
            ["all", "Tout"],
          ] as const
        ).map(([id, label]) => (
          <button
            key={id}
            type="button"
            onClick={() => onViewFilter(id)}
            className={[
              "flex-1 rounded-full px-3 py-2 text-center text-xs font-bold transition md:flex-none md:px-4 md:text-sm",
              viewFilter === id
                ? "bg-[var(--color-accent)] text-black shadow-sm"
                : "text-[var(--color-text-muted)] hover:text-[var(--color-text)]",
            ].join(" ")}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="flex flex-wrap items-center justify-center gap-2 md:gap-3">
        <button
          type="button"
          onClick={onPrevMonth}
          className="rounded-full border border-[var(--color-border)] bg-[var(--color-bg-card)] p-2 text-[var(--color-text)] shadow-sm hover:bg-[var(--color-bg-card-hover)]"
          aria-label="Mois précédent"
        >
          <ChevronLeft size={18} strokeWidth={2.25} />
        </button>
        <h2 className="font-display min-w-[10rem] text-center text-base font-bold capitalize tracking-tight text-[var(--color-text)] md:text-lg">
          {monthTitle}
        </h2>
        <button
          type="button"
          onClick={onNextMonth}
          className="rounded-full border border-[var(--color-border)] bg-[var(--color-bg-card)] p-2 text-[var(--color-text)] shadow-sm hover:bg-[var(--color-bg-card-hover)]"
          aria-label="Mois suivant"
        >
          <ChevronRight size={18} strokeWidth={2.25} />
        </button>
        {!isThisMonthView ? (
          <button
            type="button"
            onClick={onThisMonth}
            className="rounded-full border border-[var(--color-border)] bg-[var(--color-accent-muted)] px-3 py-1.5 text-xs font-bold text-[var(--color-text)] hover:opacity-95"
          >
            Mois actuel
          </button>
        ) : null}
      </div>

      <div className="flex flex-wrap items-center gap-2 md:gap-3">
        <label className="flex items-center gap-2 text-xs font-semibold text-[var(--color-text-muted)]">
          <span className="hidden sm:inline">Sport</span>
          <select
            value={sportFilter}
            onChange={(e) => onSportFilter(e.target.value)}
            className="rounded-full border border-[var(--color-border)] bg-[var(--color-bg-card)] px-3 py-2 text-xs font-bold text-[var(--color-text)] shadow-sm outline-none focus:ring-2 focus:ring-[var(--color-accent)]"
          >
            <option value="all">Tous les sports</option>
            {sportsOptions.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </label>
        <label className="flex items-center gap-2 text-xs font-semibold text-[var(--color-text-muted)]">
          <span className="hidden sm:inline">Vue liste</span>
          <select
            value={String(rangeMonths)}
            onChange={(e) => onRangeMonths(Number(e.target.value) as 1 | 3 | 6)}
            className="rounded-full border border-[var(--color-border)] bg-[var(--color-bg-card)] px-3 py-2 text-xs font-bold text-[var(--color-text)] shadow-sm outline-none focus:ring-2 focus:ring-[var(--color-accent)]"
          >
            <option value="1">1 mois</option>
            <option value="3">3 mois</option>
            <option value="6">6 mois</option>
          </select>
        </label>
      </div>
    </div>
  );
}
