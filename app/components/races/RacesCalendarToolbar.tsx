"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";

export type RacesCalendarViewFilter = "upcoming" | "past" | "all";

/** Horizon liste + granularité du calendrier (mois complet ou une semaine type ISO). */
export type RacesCalendarListRange = 1 | 3 | 6 | "week";

export type RacesCalendarToolbarProps = {
  viewFilter: RacesCalendarViewFilter;
  onViewFilter: (v: RacesCalendarViewFilter) => void;
  sportFilter: string;
  onSportFilter: (sport: string) => void;
  sportsOptions: string[];
  listRange: RacesCalendarListRange;
  onListRange: (n: RacesCalendarListRange) => void;
  /** Titre affiché au centre (mois courant ou plage de semaine). */
  calendarTitle: string;
  onPrevMonth: () => void;
  onNextMonth: () => void;
  onThisMonth: () => void;
  /** Mois affiché = mois courant, ou semaine affichée contient aujourd’hui. */
  isThisMonthView: boolean;
};

const pillNav =
  "inline-flex size-9 shrink-0 items-center justify-center rounded-full bg-[var(--color-bg-subtle)] text-[var(--color-text-primary)] transition hover:bg-[color-mix(in_srgb,var(--color-border-strong)_35%,var(--color-bg-subtle))] active:scale-[0.98] dark:bg-[var(--color-bg-elevated)] dark:text-[var(--color-text)] dark:ring-1 dark:ring-white/[0.06] dark:hover:bg-[var(--color-bg-card-hover)]";

export function RacesCalendarToolbar({
  viewFilter,
  onViewFilter,
  sportFilter,
  onSportFilter,
  sportsOptions,
  listRange,
  onListRange,
  calendarTitle,
  onPrevMonth,
  onNextMonth,
  onThisMonth,
  isThisMonthView,
}: RacesCalendarToolbarProps) {
  const isWeek = listRange === "week";
  return (
    <div className="flex flex-col gap-4 border-b border-[var(--fuel-card-border)] bg-[var(--fuel-card-surface)] px-4 py-4 md:flex-row md:flex-wrap md:items-center md:justify-between md:gap-3 md:px-5 dark:border-[var(--color-border-subtle)] dark:bg-[var(--color-bg-card)]">
      <div
        className="inline-flex w-full max-w-md gap-0.5 p-1 md:w-auto"
        style={{
          background: "#f0f4f1",
          borderRadius: 12,
        }}
      >
        {(
          [
            ["upcoming", "À venir"],
            ["past", "Passées"],
            ["all", "Tout"],
          ] as const
        ).map(([id, label]) => {
          const active = viewFilter === id;
          return (
            <button
              key={id}
              type="button"
              onClick={() => onViewFilter(id)}
              className="flex-1 px-3 py-2 text-center text-xs font-semibold transition-colors duration-150 ease-out md:flex-none md:px-4 md:text-sm"
              style={
                active
                  ? {
                      background: "#2d6a4f",
                      color: "white",
                      borderRadius: 8,
                      border: "none",
                    }
                  : {
                      background: "transparent",
                      color: "#5a6a5a",
                      border: "none",
                      borderRadius: 8,
                    }
              }
            >
              {label}
            </button>
          );
        })}
      </div>

      <div className="flex flex-wrap items-center justify-center gap-2 md:gap-2.5">
        <button
          type="button"
          onClick={onPrevMonth}
          className={pillNav}
          aria-label={isWeek ? "Semaine précédente" : "Mois précédent"}
        >
          <ChevronLeft size={18} strokeWidth={2.25} />
        </button>
        <h2 className="min-w-[10rem] text-center text-base font-semibold capitalize tracking-tight text-[var(--color-text-primary)] dark:text-[var(--color-text)] md:text-lg">
          {calendarTitle}
        </h2>
        <button
          type="button"
          onClick={onNextMonth}
          className={pillNav}
          aria-label={isWeek ? "Semaine suivante" : "Mois suivant"}
        >
          <ChevronRight size={18} strokeWidth={2.25} />
        </button>
        {!isThisMonthView ? (
          <button
            type="button"
            onClick={onThisMonth}
            className="rounded-full bg-[var(--color-bg-subtle)] px-3.5 py-2 text-xs font-semibold text-[var(--color-text-primary)] transition hover:bg-[color-mix(in_srgb,var(--color-border-strong)_35%,var(--color-bg-subtle))] dark:bg-[var(--color-bg-elevated)] dark:text-[var(--color-text)] dark:ring-1 dark:ring-white/[0.06] dark:hover:bg-[var(--color-bg-card-hover)]"
          >
            {isWeek ? "Cette semaine" : "Mois actuel"}
          </button>
        ) : null}
      </div>

      <div className="flex flex-wrap items-center gap-2 md:gap-3">
        <label className="flex items-center gap-2 text-xs font-medium text-[var(--color-text-secondary)] dark:text-[var(--color-text-muted)]">
          <span className="hidden sm:inline">Sport</span>
          <select
            value={sportFilter}
            onChange={(e) => onSportFilter(e.target.value)}
            className="rounded-full border-0 bg-[var(--color-bg-subtle)] px-3 py-2 text-xs font-semibold text-[var(--color-text-primary)] outline-none ring-0 transition focus:ring-2 focus:ring-[color-mix(in_srgb,var(--color-primary)_28%,transparent)] dark:bg-[var(--color-bg-elevated)] dark:text-[var(--color-text)] dark:ring-1 dark:ring-white/[0.05] dark:focus:ring-[color-mix(in_srgb,var(--color-accent)_30%,transparent)]"
          >
            <option value="all">Tous les sports</option>
            {sportsOptions.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </label>
        <label className="flex items-center gap-2 text-xs font-medium text-[var(--color-text-secondary)] dark:text-[var(--color-text-muted)]">
          <span className="hidden sm:inline">Vue liste</span>
          <select
            value={listRange === "week" ? "week" : String(listRange)}
            onChange={(e) => {
              const v = e.target.value;
              if (v === "week") onListRange("week");
              else onListRange(Number(v) as 1 | 3 | 6);
            }}
            className="rounded-full border-0 bg-[var(--color-bg-subtle)] px-3 py-2 text-xs font-semibold text-[var(--color-text-primary)] outline-none transition focus:ring-2 focus:ring-[color-mix(in_srgb,var(--color-primary)_28%,transparent)] dark:bg-[var(--color-bg-elevated)] dark:text-[var(--color-text)] dark:ring-1 dark:ring-white/[0.05] dark:focus:ring-[color-mix(in_srgb,var(--color-accent)_30%,transparent)]"
          >
            <option value="week">Semaine</option>
            <option value="1">1 mois</option>
            <option value="3">3 mois</option>
            <option value="6">6 mois</option>
          </select>
        </label>
      </div>
    </div>
  );
}
