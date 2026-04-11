"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { Activity, ChevronDown, ChevronRight, Mountain, Search } from "lucide-react";
import type { RaceEntry } from "@/lib/types/race";
import { getDaysUntilRace } from "@/lib/races";
import { raceSportVisual } from "@/lib/raceCalendarUi";

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
  if (d === 0) return "Aujourd'hui";
  if (d === 1) return "Demain";
  return `${d} j`;
}

export type RacesSidebarProps = {
  upcoming: RaceEntry[];
  past: RaceEntry[];
  selectedDate: string | null;
  onFocusDate: (iso: string) => void;
  searchQuery: string;
  onSearchQuery: (q: string) => void;
  listRangeMonths: 1 | 3 | 6;
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
  const hasMeta =
    (typeof r.distance === "number" && r.distance > 0) ||
    (typeof r.elevationGain === "number" && r.elevationGain > 0);

  return (
    <Link
      href={`/races/${r.id}`}
      onClick={onPick}
      className={[
        "group relative block overflow-hidden rounded-xl border border-[#e5e7eb] bg-white py-3 pl-3.5 pr-3 shadow-[var(--shadow-xs)] transition",
        "dark:border-[var(--color-border-subtle)] dark:bg-[var(--color-races-veil)] dark:shadow-[var(--shadow-xs)] dark:ring-1 dark:ring-white/[0.04]",
        "border-l-[3px]",
        mode === "upcoming"
          ? "border-l-[#16a34a] dark:border-l-[var(--color-accent)]"
          : "border-l-zinc-300 dark:border-l-[color-mix(in_srgb,var(--color-text-muted)_45%,var(--color-border))]",
        active
          ? "ring-2 ring-[color-mix(in_srgb,var(--color-accent)_45%,#e5e7eb)] dark:ring-[color-mix(in_srgb,var(--color-accent)_42%,transparent)]"
          : "hover:border-[#d1d5db] hover:shadow-sm dark:hover:border-[var(--color-border)] dark:hover:bg-[color-mix(in_srgb,var(--color-bg-card)_92%,var(--color-bg-elevated))]",
      ].join(" ")}
    >
      <div className="flex gap-3">
        <span
          className="mt-0.5 flex size-10 shrink-0 items-center justify-center rounded-lg bg-[#f9fafb] text-[var(--color-text)] ring-1 ring-[#e5e7eb] dark:bg-[color-mix(in_srgb,var(--color-bg-elevated)_70%,var(--color-bg))] dark:ring-[var(--color-border-subtle)]"
          aria-hidden
        >
          <Icon className="size-[1.15rem] opacity-90" strokeWidth={2} />
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-[#111827] dark:text-[var(--color-text)]">{r.name}</p>
              <p className="mt-0.5 text-xs text-[#6b7280] dark:text-[var(--color-text-muted)]">
                {formatShortDate(r.date)}
                {r.sport ? ` · ${r.sport}` : ""}
              </p>
            </div>
            <span
              className={[
                "shrink-0 rounded-full px-2.5 py-0.5 text-[11px] font-semibold tabular-nums",
                mode === "upcoming"
                  ? "bg-emerald-50 text-emerald-800 ring-1 ring-emerald-200/80 dark:bg-[color-mix(in_srgb,var(--color-accent)_14%,transparent)] dark:text-[var(--color-text)] dark:ring-[color-mix(in_srgb,var(--color-accent)_24%,transparent)]"
                  : "bg-zinc-100 text-zinc-600 ring-1 ring-zinc-200/80 dark:bg-[color-mix(in_srgb,var(--color-text-muted)_10%,var(--color-bg-elevated))] dark:text-[var(--color-text-muted)] dark:ring-[var(--color-border-subtle)]",
              ].join(" ")}
            >
              {pill}
            </span>
          </div>
          {hasMeta ? (
            <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-[#6b7280] dark:text-[var(--color-text-muted)]">
              {typeof r.distance === "number" && r.distance > 0 ? (
                <span className="inline-flex items-center gap-1">
                  <Activity className="size-3.5 shrink-0 opacity-80" aria-hidden />
                  <span className="tabular-nums">{r.distance} km</span>
                </span>
              ) : null}
              {typeof r.elevationGain === "number" && r.elevationGain > 0 ? (
                <span className="inline-flex items-center gap-1">
                  <Mountain className="size-3.5 shrink-0 opacity-80" aria-hidden />
                  <span className="tabular-nums">D+ {r.elevationGain} m</span>
                </span>
              ) : null}
            </div>
          ) : null}
          <span className="mt-2 inline-flex items-center gap-0.5 text-xs font-semibold text-[#16a34a] transition group-hover:gap-1 dark:text-[var(--color-accent)]">
            Voir la fiche
            <ChevronRight className="size-3.5" strokeWidth={2.25} aria-hidden />
          </span>
        </div>
      </div>
    </Link>
  );
}

function RacesListHelp() {
  return (
    <details className="group mx-2 mb-1 rounded-lg border border-[#e5e7eb] bg-[#fafafa] text-left dark:border-[var(--color-border-subtle)] dark:bg-[color-mix(in_srgb,var(--color-bg-elevated)_55%,var(--color-bg))]">
      <summary className="flex cursor-pointer list-none items-center gap-2 px-3 py-2 text-xs font-medium text-[#6b7280] marker:content-none dark:text-[var(--color-text-muted)] [&::-webkit-details-marker]:hidden">
        <span className="text-base leading-none" aria-hidden>
          ℹ️
        </span>
        <span>En savoir plus</span>
        <ChevronDown className="ms-auto size-4 shrink-0 transition group-open:rotate-180" aria-hidden />
      </summary>
      <div className="border-t border-[#e5e7eb] px-3 py-2.5 text-[11px] leading-relaxed text-[#6b7280] dark:border-[var(--color-border-subtle)] dark:text-[var(--color-text-muted)]">
        <p>
          Les filtres <strong className="text-[#111827] dark:text-[var(--color-text)]">À venir</strong>,{" "}
          <strong className="text-[#111827] dark:text-[var(--color-text)]">Passées</strong> et{" "}
          <strong className="text-[#111827] dark:text-[var(--color-text)]">Tout</strong> s’appliquent aux cases du
          calendrier. Les bandeaux charge et récup (définis sur chaque course) restent visibles selon le sport et la
          recherche. La liste respecte l’horizon choisi (1 à 6 mois).
        </p>
      </div>
    </details>
  );
}

export function RacesSidebar({
  upcoming,
  past,
  selectedDate,
  onFocusDate,
  searchQuery,
  onSearchQuery,
  listRangeMonths,
}: RacesSidebarProps) {
  const [openUp, setOpenUp] = useState(true);
  const [openPast, setOpenPast] = useState(false);

  const maxListDate = useMemo(() => {
    const t = new Date();
    t.setMonth(t.getMonth() + listRangeMonths);
    const y = t.getFullYear();
    const m = String(t.getMonth() + 1).padStart(2, "0");
    const d = String(t.getDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
  }, [listRangeMonths]);

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
    <div className="flex h-full min-h-0 flex-col border-b border-[var(--color-border)] lg:border-b-0 lg:border-e">
      <div className="border-b border-[var(--color-border-subtle)] px-4 py-4">
        <p className="text-[11px] font-medium tracking-wide text-[#9ca3af] dark:text-[var(--color-text-muted)]">
          Calendrier
        </p>
        <p className="mt-0.5 text-sm font-semibold text-[#111827] dark:text-[var(--color-text)]">Liste des courses</p>
      </div>

      <div className="px-4 py-3">
        <div className="relative">
          <Search
            className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-[#9ca3af] dark:text-[var(--color-text-muted)]"
            aria-hidden
          />
          <input
            type="search"
            value={searchQuery}
            onChange={(e) => onSearchQuery(e.target.value)}
            placeholder="Rechercher…"
            className="w-full rounded-xl border border-[#e5e7eb] bg-white py-2.5 pl-10 pr-3 text-sm text-[#111827] outline-none transition placeholder:text-[#9ca3af] focus:border-[#16a34a] focus:ring-2 focus:ring-[color-mix(in_srgb,#16a34a_22%,transparent)] dark:border-[var(--color-border-subtle)] dark:bg-[color-mix(in_srgb,var(--color-bg-elevated)_50%,var(--color-bg))] dark:text-[var(--color-text)] dark:placeholder:text-[var(--color-text-muted)] dark:focus:border-[color-mix(in_srgb,var(--color-accent)_45%,var(--color-border))] dark:focus:ring-[color-mix(in_srgb,var(--color-accent)_22%,transparent)]"
          />
        </div>
      </div>

      <div className="min-h-0 flex-1 space-y-3 overflow-y-auto overscroll-contain px-2 pb-4">
        <RacesListHelp />

        <div>
          <button
            type="button"
            onClick={() => setOpenUp((o) => !o)}
            className="flex w-full items-center justify-between rounded-xl bg-[#f3f4f6] px-3 py-2.5 text-left text-sm font-semibold text-[#111827] transition hover:bg-[#e5e7eb] dark:bg-[var(--color-bg-elevated)] dark:text-[var(--color-text)] dark:ring-1 dark:ring-white/[0.04] dark:hover:bg-[var(--color-bg-card-hover)]"
          >
            <span>À venir ({upcomingFiltered.length})</span>
            {openUp ? <ChevronDown className="size-4 shrink-0 opacity-70" /> : <ChevronRight className="size-4 shrink-0 opacity-70" />}
          </button>
          {openUp ? (
            <div className="mt-2 space-y-2.5 px-0.5 pb-2">
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

        <div className="border-t border-[#e5e7eb] pt-2 dark:border-[var(--color-border-subtle)]">
          <button
            type="button"
            onClick={() => setOpenPast((o) => !o)}
            className="flex w-full items-center justify-between rounded-xl bg-[#f3f4f6] px-3 py-2.5 text-left text-sm font-semibold text-[#111827] transition hover:bg-[#e5e7eb] dark:bg-[var(--color-bg-elevated)] dark:text-[var(--color-text)] dark:ring-1 dark:ring-white/[0.04] dark:hover:bg-[var(--color-bg-card-hover)]"
          >
            <span>Passées ({pastFiltered.length})</span>
            {openPast ? <ChevronDown className="size-4 shrink-0 opacity-70" /> : <ChevronRight className="size-4 shrink-0 opacity-70" />}
          </button>
          {openPast ? (
            <div className="mt-2 max-h-72 space-y-2.5 overflow-y-auto px-0.5 pb-2">
              {pastFiltered.length === 0 ? (
                <p className="px-2 py-2 text-xs text-[#6b7280] dark:text-[var(--color-text-muted)]">Aucune course passée.</p>
              ) : (
                pastFiltered.slice(0, 40).map((r) => (
                  <div key={r.id} className="space-y-1.5">
                    <RaceListCard
                      r={r}
                      mode="past"
                      active={selectedDate === r.date}
                      onPick={() => onFocusDate(r.date)}
                    />
                  </div>
                ))
              )}
              {pastFiltered.length > 40 ? (
                <p className="px-2 text-[10px] text-[#6b7280] dark:text-[var(--color-text-muted)]">
                  + {pastFiltered.length - 40} autres…
                </p>
              ) : null}
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
