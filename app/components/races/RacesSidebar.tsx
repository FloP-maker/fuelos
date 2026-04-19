"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { ArrowRight, ChevronDown, ChevronRight, Info, Search } from "lucide-react";
import type { RaceEntry } from "@/lib/types/race";
import { getDaysUntilRace } from "@/lib/races";
import { raceSportVisual } from "@/lib/raceCalendarUi";
import type { RacesCalendarListRange } from "./RacesCalendarToolbar";
import { addDaysIso } from "@/lib/raceNutritionBands";

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

function norm(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

function countdownPillLabel(r: RaceEntry, mode: "upcoming" | "past"): string {
  const d = getDaysUntilRace(r);
  if (mode === "past") {
    if (d >= 0) return "Récent";
    const abs = Math.abs(d);
    return abs === 1 ? "Hier" : `Il y a ${abs} j`;
  }
  if (d < 0) return "—";
  return `J-${d}`;
}

function urgencyPillClass(r: RaceEntry, mode: "upcoming" | "past"): string {
  const d = getDaysUntilRace(r);
  if (mode === "past") {
    return "border border-[#e5e5e5] bg-[#f3f3f3] text-[#555] dark:border-[var(--color-border-subtle)] dark:bg-white/10 dark:text-[var(--color-text-muted)]";
  }
  if (d < 0) {
    return "border border-[#e5e5e5] bg-[#f3f3f3] text-[#555] dark:border-[var(--color-border-subtle)] dark:bg-white/10 dark:text-[var(--color-text-muted)]";
  }
  if (d < 30) {
    return "border border-red-200/80 bg-red-50 text-red-900 dark:border-red-500/35 dark:bg-red-950/40 dark:text-red-100";
  }
  if (d < 90) {
    return "border border-amber-200/90 bg-amber-50 text-amber-950 dark:border-amber-500/35 dark:bg-amber-950/35 dark:text-amber-100";
  }
  return "border border-emerald-200/90 bg-emerald-50 text-emerald-950 dark:border-emerald-500/30 dark:bg-emerald-950/35 dark:text-emerald-100";
}

export type RacesSidebarProps = {
  upcoming: RaceEntry[];
  past: RaceEntry[];
  selectedDate: string | null;
  onFocusDate: (iso: string) => void;
  searchQuery: string;
  onSearchQuery: (q: string) => void;
  listRange: RacesCalendarListRange;
};

function RaceListCard({
  r,
  active,
  mode,
  onPick,
}: {
  r: RaceEntry;
  active: boolean;
  mode: "upcoming" | "past";
  onPick: () => void;
}) {
  const { Icon } = raceSportVisual(r.sport);
  const pill = countdownPillLabel(r, mode);
  const pillClass = urgencyPillClass(r, mode);
  const metaLine = [
    formatShortDate(r.date),
    r.sport || null,
    typeof r.distance === "number" && r.distance > 0 ? `${r.distance} km` : null,
    typeof r.elevationGain === "number" && r.elevationGain > 0 ? `D+ ${r.elevationGain} m` : null,
  ]
    .filter(Boolean)
    .join(" · ");

  return (
    <article
      className={[
        "rounded-xl border border-[#e8e8e8] bg-white p-3 shadow-sm dark:border-[var(--color-border-subtle)] dark:bg-[var(--color-bg-card)]",
        active
          ? "ring-2 ring-[color-mix(in_srgb,var(--color-primary)_35%,transparent)] dark:ring-[color-mix(in_srgb,var(--color-accent)_40%,transparent)]"
          : "",
        "hover:-translate-y-px hover:shadow-md",
      ].join(" ")}
    >
      <div className="flex items-start gap-3">
        <span
          className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-[#f4f5f4] text-[#1a1a1a] ring-1 ring-[#ececec] dark:bg-white/[0.06] dark:text-[var(--color-text)] dark:ring-white/[0.08]"
          aria-hidden
        >
          <Icon className="size-[1.15rem]" strokeWidth={2} />
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate text-[15px] font-bold leading-snug text-[#111] dark:text-[var(--color-text)]">{r.name}</p>
          <p className="mt-0.5 text-xs leading-relaxed text-[#6b7280] dark:text-[var(--color-text-muted)]">{metaLine}</p>
        </div>
        <span
          className={[
            "shrink-0 rounded-full px-2.5 py-1 text-[11px] font-bold tabular-nums leading-none",
            pillClass,
          ].join(" ")}
        >
          {pill}
        </span>
      </div>
      <Link
        href={`/races/${r.id}`}
        onClick={onPick}
        className="mt-3 inline-flex w-full items-center justify-center gap-1.5 rounded-lg border border-[#2d6a4f] bg-transparent px-3 py-2 text-xs font-semibold text-[#2d6a4f] transition hover:bg-[#ecf5ef] dark:border-[var(--color-primary-light)] dark:text-[var(--color-primary-light)] dark:hover:bg-[color-mix(in_srgb,var(--color-accent)_12%,transparent)] sm:w-auto sm:justify-start"
      >
        Voir la fiche
        <ArrowRight className="size-3.5 shrink-0" strokeWidth={2.25} aria-hidden />
      </Link>
    </article>
  );
}

function RacesListHelp() {
  return (
    <details className="group mb-1 rounded-xl border border-[#e8e8e8] bg-white text-left dark:border-[var(--color-border-subtle)] dark:bg-[var(--color-bg-card)]">
      <summary className="flex cursor-pointer list-none items-center gap-2.5 px-3 py-2.5 text-sm text-[#6b7280] marker:content-none dark:text-[var(--color-text-muted)] [&::-webkit-details-marker]:hidden">
        <Info className="size-4 shrink-0 text-[#9ca3af] dark:text-[var(--color-text-muted)]" strokeWidth={2} aria-hidden />
        <span className="font-medium">En savoir plus</span>
        <ChevronDown
          className="ms-auto size-4 shrink-0 text-[#9ca3af] transition-transform duration-200 ease-out group-open:rotate-180 dark:text-[var(--color-text-muted)]"
          aria-hidden
        />
      </summary>
      <div className="border-t border-[#ececec] px-3 py-2.5 text-[12px] leading-relaxed text-[#6b7280] dark:border-[var(--color-border-subtle)] dark:text-[var(--color-text-muted)]">
        <p>
          Les filtres <strong className="text-[#374151] dark:text-[var(--color-text)]">À venir</strong>,{" "}
          <strong className="text-[#374151] dark:text-[var(--color-text)]">Passées</strong> et{" "}
          <strong className="text-[#374151] dark:text-[var(--color-text)]">Tout</strong> s’appliquent aux cases du calendrier. Les bandeaux
          charge et récup (définis sur chaque course) restent visibles selon le sport et la recherche. La liste respecte
          l’horizon choisi (1 à 6 mois).
        </p>
      </div>
    </details>
  );
}

function AccordionGroupHeader({
  label,
  count,
  open,
  onToggle,
}: {
  label: string;
  count: number;
  open: boolean;
  onToggle: () => void;
}) {
  return (
    <button
      type="button"
      aria-expanded={open}
      onClick={onToggle}
      className="flex w-full cursor-pointer items-center gap-2 border-b border-[#ececec] bg-transparent py-3 pl-1 pr-1 text-left transition hover:bg-black/[0.02] dark:border-[var(--color-border-subtle)] dark:hover:bg-white/[0.03]"
    >
      <span className="text-sm font-medium text-[#6b7280] dark:text-[var(--color-text-muted)]">{label}</span>
      <span className="ms-auto flex items-center gap-1.5">
        <span className="inline-flex min-w-[1.5rem] items-center justify-center rounded-full bg-[#ececec] px-2 py-0.5 text-[11px] font-semibold tabular-nums text-[#555] dark:bg-white/10 dark:text-[var(--color-text-muted)]">
          {count}
        </span>
        {open ? (
          <ChevronDown className="size-4 shrink-0 text-[#9ca3af] dark:text-[var(--color-text-muted)]" aria-hidden />
        ) : (
          <ChevronRight className="size-4 shrink-0 text-[#9ca3af] dark:text-[var(--color-text-muted)]" aria-hidden />
        )}
      </span>
    </button>
  );
}

export function RacesSidebar({
  upcoming,
  past,
  selectedDate,
  onFocusDate,
  searchQuery,
  onSearchQuery,
  listRange,
}: RacesSidebarProps) {
  const [openUp, setOpenUp] = useState(true);
  const [openPast, setOpenPast] = useState(false);

  const maxListDate = useMemo(() => {
    if (listRange === "week") {
      const t = new Date();
      const y = t.getFullYear();
      const m = String(t.getMonth() + 1).padStart(2, "0");
      const d = String(t.getDate()).padStart(2, "0");
      const todayKey = `${y}-${m}-${d}`;
      return addDaysIso(todayKey, 6);
    }
    const t = new Date();
    t.setMonth(t.getMonth() + listRange);
    const y = t.getFullYear();
    const m = String(t.getMonth() + 1).padStart(2, "0");
    const d = String(t.getDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
  }, [listRange]);

  const upcomingFiltered = useMemo(() => {
    const q = norm(searchQuery.trim());
    return upcoming.filter((r) => {
      if (r.date > maxListDate) return false;
      if (!q) return true;
      return norm(r.name).includes(q) || norm(r.sport).includes(q) || norm(r.location ?? "").includes(q);
    });
  }, [upcoming, searchQuery, maxListDate]);

  const pastFiltered = useMemo(() => {
    const q = norm(searchQuery.trim());
    return past.filter((r) => {
      if (!q) return true;
      return norm(r.name).includes(q) || norm(r.sport).includes(q) || norm(r.location ?? "").includes(q);
    });
  }, [past, searchQuery]);

  return (
    <div className="races-season-panel flex flex-col">
      <div className="races-season-panel__header border-b border-[var(--fuel-card-border)] px-5 pb-4 pt-5 dark:border-[var(--color-border-subtle)]">
        <h2 className="races-section-eyebrow">Ma saison</h2>
      </div>

      <div className="px-5 py-4">
        <div className="relative">
          <Search
            className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-[#9ca3af] dark:text-[var(--color-text-muted)]"
            strokeWidth={2}
            aria-hidden
          />
          <input
            type="search"
            value={searchQuery}
            onChange={(e) => onSearchQuery(e.target.value)}
            placeholder="Rechercher une course..."
            className="w-full rounded-[10px] border border-[#e3e3e3] bg-[#f8f8f8] py-2.5 pl-10 pr-3 text-sm font-normal text-[#111] transition placeholder:text-[var(--color-text-muted)] focus:border-[var(--color-primary)] focus:bg-white dark:border-[var(--color-border-subtle)] dark:bg-white/[0.06] dark:text-[var(--color-text)] dark:placeholder:text-[var(--color-text-muted)] dark:focus:border-[var(--color-accent)] dark:focus:bg-[var(--color-bg-card)]"
          />
        </div>
      </div>

      <div className="space-y-3 px-3 pb-5">
        <RacesListHelp />

        <div className="overflow-hidden rounded-xl border border-[#e8e8e8] bg-[var(--fuel-card-surface)] dark:border-[var(--color-border-subtle)] dark:bg-[var(--color-bg-card)]">
          <AccordionGroupHeader
            label="À venir"
            count={upcomingFiltered.length}
            open={openUp}
            onToggle={() => setOpenUp((o) => !o)}
          />
          {openUp ? (
            <div className="space-y-2.5 border-t border-[#f0f0f0] bg-[#fafafa] p-2.5 dark:border-[var(--color-border-subtle)] dark:bg-[color-mix(in_srgb,var(--color-bg)_40%,var(--color-bg-card))]">
              {upcomingFiltered.length === 0 ? (
                <p className="px-2 py-2 text-xs text-[#6b7280] dark:text-[var(--color-text-muted)]">Aucun résultat.</p>
              ) : (
                upcomingFiltered.map((r) => (
                  <RaceListCard
                    key={r.id}
                    r={r}
                    mode="upcoming"
                    active={selectedDate === r.date}
                    onPick={() => onFocusDate(r.date)}
                  />
                ))
              )}
            </div>
          ) : null}
        </div>

        <div className="overflow-hidden rounded-xl border border-[#e8e8e8] bg-[var(--fuel-card-surface)] dark:border-[var(--color-border-subtle)] dark:bg-[var(--color-bg-card)]">
          <AccordionGroupHeader
            label="Passées"
            count={pastFiltered.length}
            open={openPast}
            onToggle={() => setOpenPast((o) => !o)}
          />
          {openPast ? (
            <div className="space-y-2.5 border-t border-[#f0f0f0] bg-[#fafafa] p-2.5 dark:border-[var(--color-border-subtle)] dark:bg-[color-mix(in_srgb,var(--color-bg)_40%,var(--color-bg-card))]">
              {pastFiltered.length === 0 ? (
                <p className="px-2 py-2 text-xs text-[#6b7280] dark:text-[var(--color-text-muted)]">Aucune course passée.</p>
              ) : (
                pastFiltered.slice(0, 40).map((r) => (
                  <RaceListCard
                    key={r.id}
                    r={r}
                    mode="past"
                    active={selectedDate === r.date}
                    onPick={() => onFocusDate(r.date)}
                  />
                ))
              )}
              {pastFiltered.length > 40 ? (
                <p className="px-2 text-[10px] text-[#9ca3af] dark:text-[var(--color-text-muted)]">+ {pastFiltered.length - 40} autres…</p>
              ) : null}
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
