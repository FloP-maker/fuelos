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

const pillNav =
  "inline-flex size-9 shrink-0 items-center justify-center rounded-full bg-[#f3f4f6] text-[#111827] transition hover:bg-[#e5e7eb] active:scale-[0.98] dark:bg-[var(--color-bg-elevated)] dark:text-[var(--color-text)] dark:ring-1 dark:ring-white/[0.06] dark:hover:bg-[var(--color-bg-card-hover)]";

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
    <div className="flex flex-col gap-4 border-b border-[#e5e7eb] bg-[var(--color-bg-card)] px-4 py-4 md:flex-row md:flex-wrap md:items-center md:justify-between md:gap-3 md:px-5 dark:border-[var(--color-border-subtle)]">
      <div className="inline-flex w-full max-w-md rounded-full bg-[#f3f4f6] p-1 dark:bg-[var(--color-bg-elevated)] md:w-auto">
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
              "flex-1 rounded-full px-3 py-2 text-center text-xs font-semibold transition duration-200 ease-out md:flex-none md:px-4 md:text-sm",
              viewFilter === id
                ? "bg-white text-[#111827] shadow-[0_1px_3px_rgba(15,23,42,0.12)] dark:bg-[var(--color-bg-card)] dark:text-[var(--color-text)] dark:shadow-[var(--shadow-xs)] dark:ring-1 dark:ring-white/[0.06]"
                : "text-[#6b7280] hover:text-[#111827] dark:text-[var(--color-text-muted)] dark:hover:text-[var(--color-text)]",
            ].join(" ")}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="flex flex-wrap items-center justify-center gap-2 md:gap-2.5">
        <button type="button" onClick={onPrevMonth} className={pillNav} aria-label="Mois précédent">
          <ChevronLeft size={18} strokeWidth={2.25} />
        </button>
        <h2 className="min-w-[10rem] text-center text-base font-semibold capitalize tracking-tight text-[#111827] dark:text-[var(--color-text)] md:text-lg">
          {monthTitle}
        </h2>
        <button type="button" onClick={onNextMonth} className={pillNav} aria-label="Mois suivant">
          <ChevronRight size={18} strokeWidth={2.25} />
        </button>
        {!isThisMonthView ? (
          <button
            type="button"
            onClick={onThisMonth}
            className="rounded-full bg-[#f3f4f6] px-3.5 py-2 text-xs font-semibold text-[#111827] transition hover:bg-[#e5e7eb] dark:bg-[var(--color-bg-elevated)] dark:text-[var(--color-text)] dark:ring-1 dark:ring-white/[0.06] dark:hover:bg-[var(--color-bg-card-hover)]"
          >
            Mois actuel
          </button>
        ) : null}
      </div>

      <div className="flex flex-wrap items-center gap-2 md:gap-3">
        <label className="flex items-center gap-2 text-xs font-medium text-[#6b7280] dark:text-[var(--color-text-muted)]">
          <span className="hidden sm:inline">Sport</span>
          <select
            value={sportFilter}
            onChange={(e) => onSportFilter(e.target.value)}
            className="rounded-full border-0 bg-[#f3f4f6] px-3 py-2 text-xs font-semibold text-[#111827] outline-none ring-0 transition focus:ring-2 focus:ring-[color-mix(in_srgb,#16a34a_28%,transparent)] dark:bg-[var(--color-bg-elevated)] dark:text-[var(--color-text)] dark:ring-1 dark:ring-white/[0.05] dark:focus:ring-[color-mix(in_srgb,var(--color-accent)_30%,transparent)]"
          >
            <option value="all">Tous les sports</option>
            {sportsOptions.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </label>
        <label className="flex items-center gap-2 text-xs font-medium text-[#6b7280] dark:text-[var(--color-text-muted)]">
          <span className="hidden sm:inline">Vue liste</span>
          <select
            value={String(rangeMonths)}
            onChange={(e) => onRangeMonths(Number(e.target.value) as 1 | 3 | 6)}
            className="rounded-full border-0 bg-[#f3f4f6] px-3 py-2 text-xs font-semibold text-[#111827] outline-none transition focus:ring-2 focus:ring-[color-mix(in_srgb,#16a34a_28%,transparent)] dark:bg-[var(--color-bg-elevated)] dark:text-[var(--color-text)] dark:ring-1 dark:ring-white/[0.05] dark:focus:ring-[color-mix(in_srgb,var(--color-accent)_30%,transparent)]"
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
