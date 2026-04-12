"use client";

import { ChevronDown, ChevronLeft, ChevronRight } from "lucide-react";
import {
  forwardRef,
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
  type ReactNode,
  type RefObject,
} from "react";

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

const VIEW_TABS = [
  ["upcoming", "À venir"],
  ["past", "Passées"],
  ["all", "Tout"],
] as const;

function viewTabIndex(v: RacesCalendarViewFilter): number {
  if (v === "upcoming") return 0;
  if (v === "past") return 1;
  return 2;
}

const RANGE_OPTIONS: { value: RacesCalendarListRange; label: string }[] = [
  { value: "week", label: "Semaine" },
  { value: 1, label: "1 mois" },
  { value: 3, label: "3 mois" },
  { value: 6, label: "6 mois" },
];

function useClickOutside<E extends HTMLElement>(handler: () => void, open: boolean): RefObject<E | null> {
  const ref = useRef<E | null>(null);
  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      const el = ref.current;
      if (el && !el.contains(e.target as Node)) handler();
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [open, handler]);
  return ref;
}

type CalendarSelectProps = {
  label: string;
  valueLabel: string;
  open: boolean;
  onOpenChange: (o: boolean) => void;
  children: ReactNode;
};

const CalendarSelect = forwardRef<HTMLDivElement, CalendarSelectProps>(function CalendarSelect(
  { label, valueLabel, open, onOpenChange, children },
  ref
) {
  return (
    <div ref={ref} className="relative w-full">
      <span className="sr-only">{label}</span>
      <button
        type="button"
        aria-expanded={open}
        aria-haspopup="listbox"
        onClick={() => onOpenChange(!open)}
        className="flex min-h-[38px] w-full min-w-[9.5rem] items-center justify-between gap-2 rounded-lg border border-[rgba(0,0,0,0.1)] bg-white px-3 py-2 text-left text-xs font-semibold text-[#1a1a1a] shadow-sm transition hover:border-[rgba(0,0,0,0.16)] hover:bg-[#fafafa] dark:border-[var(--color-border-subtle)] dark:bg-[var(--color-bg-elevated)] dark:text-[var(--color-text)] dark:hover:bg-[var(--color-bg-card-hover)]"
      >
        <span className="truncate">{valueLabel}</span>
        <ChevronDown
          className={`size-4 shrink-0 text-[#6b7280] transition-transform dark:text-[var(--color-text-muted)] ${open ? "rotate-180" : ""}`}
          strokeWidth={2}
          aria-hidden
        />
      </button>
      {open ? (
        <ul
          className="absolute left-0 right-0 top-[calc(100%+4px)] z-50 max-h-60 overflow-auto rounded-lg border border-[rgba(0,0,0,0.1)] bg-white py-1 shadow-lg dark:border-[var(--color-border-subtle)] dark:bg-[var(--color-bg-card)]"
          role="listbox"
        >
          {children}
        </ul>
      ) : null}
    </div>
  );
});

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
  const tabIdx = viewTabIndex(viewFilter);
  const [sportOpen, setSportOpen] = useState(false);
  const [rangeOpen, setRangeOpen] = useState(false);
  const closeSport = useCallback(() => setSportOpen(false), []);
  const closeRange = useCallback(() => setRangeOpen(false), []);
  const sportWrapRef = useClickOutside<HTMLDivElement>(closeSport, sportOpen);
  const rangeWrapRef = useClickOutside<HTMLDivElement>(closeRange, rangeOpen);
  const listPrefix = useId();

  const sportValueLabel =
    sportFilter === "all" ? "Tous les sports" : sportsOptions.find((s) => s === sportFilter) ?? sportFilter;
  const rangeValueLabel = RANGE_OPTIONS.find((o) => o.value === listRange)?.label ?? "3 mois";

  return (
    <div className="flex shrink-0 flex-col gap-3 border-b border-[var(--fuel-card-border)] bg-[var(--fuel-card-surface)] px-3 py-3 dark:border-[var(--color-border-subtle)] dark:bg-[var(--color-bg-card)] sm:px-4 sm:py-3.5">
      <div className="flex items-center gap-2 sm:gap-3">
        <button
          type="button"
          onClick={onPrevMonth}
          className="inline-flex size-10 shrink-0 items-center justify-center rounded-full border border-[rgba(0,0,0,0.08)] bg-white text-[#374151] shadow-sm transition hover:border-[rgba(0,0,0,0.12)] hover:bg-[#f4f7f4] hover:text-[#111] active:scale-[0.97] dark:border-[var(--color-border-subtle)] dark:bg-[var(--color-bg-elevated)] dark:text-[var(--color-text)] dark:hover:bg-[var(--color-bg-card-hover)]"
          aria-label={isWeek ? "Semaine précédente" : "Mois précédent"}
        >
          <ChevronLeft size={20} strokeWidth={2.25} />
        </button>
        <h2 className="min-w-0 flex-1 text-center text-lg font-bold capitalize leading-tight tracking-tight text-[#111827] dark:text-[var(--color-text)] sm:text-xl">
          {calendarTitle}
        </h2>
        <button
          type="button"
          onClick={onNextMonth}
          className="inline-flex size-10 shrink-0 items-center justify-center rounded-full border border-[rgba(0,0,0,0.08)] bg-white text-[#374151] shadow-sm transition hover:border-[rgba(0,0,0,0.12)] hover:bg-[#f4f7f4] hover:text-[#111] active:scale-[0.97] dark:border-[var(--color-border-subtle)] dark:bg-[var(--color-bg-elevated)] dark:text-[var(--color-text)] dark:hover:bg-[var(--color-bg-card-hover)]"
          aria-label={isWeek ? "Semaine suivante" : "Mois suivant"}
        >
          <ChevronRight size={20} strokeWidth={2.25} />
        </button>
      </div>

      {!isThisMonthView ? (
        <div className="flex justify-center">
          <button
            type="button"
            onClick={onThisMonth}
            className="rounded-full bg-[var(--color-bg-subtle)] px-3 py-1.5 text-xs font-semibold text-[var(--color-text-primary)] transition hover:bg-[color-mix(in_srgb,var(--color-border-strong)_35%,var(--color-bg-subtle))] dark:bg-[var(--color-bg-elevated)] dark:text-[var(--color-text)] dark:ring-1 dark:ring-white/[0.06] dark:hover:bg-[var(--color-bg-card-hover)]"
          >
            {isWeek ? "Cette semaine" : "Mois actuel"}
          </button>
        </div>
      ) : null}

      <div className="relative w-full rounded-[10px] bg-[#eceeec] p-1 dark:bg-[color-mix(in_srgb,var(--color-bg-elevated)_55%,var(--color-bg))]">
        <span
          className="pointer-events-none absolute top-1 bottom-1 left-1 rounded-lg bg-[#2d5016] shadow-sm transition-transform duration-200 ease-out dark:bg-[#3d6b24]"
          style={{
            width: "calc((100% - 8px) / 3)",
            transform: `translateX(calc(${tabIdx} * 100%))`,
          }}
          aria-hidden
        />
        <div className="relative z-10 flex">
          {VIEW_TABS.map(([id, label]) => {
            const active = viewFilter === id;
            return (
              <button
                key={id}
                type="button"
                role="tab"
                aria-selected={active}
                onClick={() => onViewFilter(id)}
                className={`flex-1 rounded-lg px-2 py-2 text-center text-xs font-semibold transition-colors duration-150 sm:px-3 sm:text-sm ${
                  active ? "text-white" : "text-[#4b5563] hover:text-[#111827] dark:text-[var(--color-text-muted)] dark:hover:text-[var(--color-text)]"
                }`}
              >
                {label}
              </button>
            );
          })}
        </div>
      </div>

      <div className="flex flex-wrap items-stretch justify-center gap-2 sm:gap-3">
        <div className="min-w-[10rem] flex-1 sm:min-w-[11rem]">
          <CalendarSelect
            ref={sportWrapRef}
            label="Sport"
            valueLabel={sportValueLabel}
            open={sportOpen}
            onOpenChange={(o) => {
              setSportOpen(o);
              if (o) setRangeOpen(false);
            }}
          >
            <li>
              <button
                type="button"
                role="option"
                aria-selected={sportFilter === "all"}
                className="flex w-full px-3 py-2 text-left text-xs font-medium text-[#1a1a1a] hover:bg-[#f0f7f0] dark:text-[var(--color-text)] dark:hover:bg-[var(--color-bg-elevated)]"
                onClick={() => {
                  onSportFilter("all");
                  setSportOpen(false);
                }}
              >
                Tous les sports
              </button>
            </li>
            {sportsOptions.map((s) => (
              <li key={`${listPrefix}-sport-${s}`}>
                <button
                  type="button"
                  role="option"
                  aria-selected={sportFilter === s}
                  className="flex w-full px-3 py-2 text-left text-xs font-medium text-[#1a1a1a] hover:bg-[#f0f7f0] dark:text-[var(--color-text)] dark:hover:bg-[var(--color-bg-elevated)]"
                  onClick={() => {
                    onSportFilter(s);
                    setSportOpen(false);
                  }}
                >
                  {s}
                </button>
              </li>
            ))}
          </CalendarSelect>
        </div>

        <div className="min-w-[10rem] flex-1 sm:min-w-[9rem]">
          <CalendarSelect
            ref={rangeWrapRef}
            label="Vue liste"
            valueLabel={rangeValueLabel}
            open={rangeOpen}
            onOpenChange={(o) => {
              setRangeOpen(o);
              if (o) setSportOpen(false);
            }}
          >
            {RANGE_OPTIONS.map((o) => (
              <li key={`${listPrefix}-range-${String(o.value)}`}>
                <button
                  type="button"
                  role="option"
                  aria-selected={listRange === o.value}
                  className="flex w-full px-3 py-2 text-left text-xs font-medium text-[#1a1a1a] hover:bg-[#f0f7f0] dark:text-[var(--color-text)] dark:hover:bg-[var(--color-bg-elevated)]"
                  onClick={() => {
                    onListRange(o.value);
                    setRangeOpen(false);
                  }}
                >
                  {o.label}
                </button>
              </li>
            ))}
          </CalendarSelect>
        </div>
      </div>
    </div>
  );
}
