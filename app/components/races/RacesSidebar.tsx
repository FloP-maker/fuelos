"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { ChevronDown, ChevronRight, Search } from "lucide-react";
import type { RaceEntry } from "@/lib/types/race";
import { getRaceCountdownLabel } from "@/lib/races";
import { raceSportChip } from "@/lib/raceCalendarUi";

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

export type RacesSidebarProps = {
  upcoming: RaceEntry[];
  past: RaceEntry[];
  selectedDate: string | null;
  onFocusDate: (iso: string) => void;
  onAddRace: () => void;
  searchQuery: string;
  onSearchQuery: (q: string) => void;
  /** Filtre la liste latérale : événements dans les N prochains mois (à partir d’aujourd’hui). */
  listRangeMonths: 1 | 3 | 6;
};

function RaceRow({
  r,
  active,
  onPick,
}: {
  r: RaceEntry;
  active: boolean;
  onPick: () => void;
}) {
  const chip = raceSportChip(r.sport);
  return (
    <Link
      href={`/races/${r.id}`}
      onClick={onPick}
      className={[
        "flex items-start gap-2 rounded-xl border px-2.5 py-2 text-left transition",
        active
          ? "border-[var(--color-accent)] bg-[var(--color-accent-muted)] shadow-sm"
          : "border-[var(--color-border)] bg-[var(--color-bg-card)] hover:border-[color-mix(in_srgb,var(--color-accent)_35%,var(--color-border))]",
      ].join(" ")}
    >
      <span className="mt-0.5 text-sm" aria-hidden>
        {chip.icon}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-xs font-bold text-[var(--color-text)]">{r.name}</span>
        <span className="mt-0.5 block text-[10px] text-[var(--color-text-muted)]">
          {getRaceCountdownLabel(r)}
        </span>
      </span>
    </Link>
  );
}

export function RacesSidebar({
  upcoming,
  past,
  selectedDate,
  onFocusDate,
  onAddRace,
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
      <div className="border-b border-[var(--color-border)] px-4 py-4">
        <h1 className="font-display text-lg font-bold tracking-tight text-[var(--color-text)]">Mes courses</h1>
        <p className="mt-1 text-xs text-[var(--color-text-muted)]">Calendrier & saison</p>
        <button
          type="button"
          onClick={onAddRace}
          className="mt-4 w-full rounded-full bg-[var(--color-accent)] py-2.5 text-sm font-bold text-black shadow-sm hover:opacity-95"
        >
          + Nouvelle course
        </button>
      </div>

      <div className="px-4 py-3">
        <div className="relative">
          <Search
            className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-[var(--color-text-muted)]"
            aria-hidden
          />
          <input
            type="search"
            value={searchQuery}
            onChange={(e) => onSearchQuery(e.target.value)}
            placeholder="Rechercher…"
            className="w-full rounded-full border border-[var(--color-border)] bg-[var(--color-bg-card)] py-2.5 pl-10 pr-3 text-sm text-[var(--color-text)] shadow-sm outline-none placeholder:text-[var(--color-text-muted)] focus:ring-2 focus:ring-[var(--color-accent)]"
          />
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-2 pb-4">
        <div className="rounded-xl border border-[var(--color-border)] bg-[color-mix(in_srgb,var(--color-accent)_6%,var(--color-bg-card))] px-3 py-2.5 text-[11px] leading-snug text-[var(--color-text-muted)]">
          Les filtres <strong className="text-[var(--color-text)]">À venir / Passées / Tout</strong> s’appliquent aux cases
          du calendrier. Les <strong className="text-[var(--color-text)]">bandeaux</strong> charge / récup (définis sur
          chaque course) restent visibles selon sport et recherche. La liste respecte l’horizon (1 à 6 mois).
        </div>

        <div className="mt-3">
          <button
            type="button"
            onClick={() => setOpenUp((o) => !o)}
            className="flex w-full items-center justify-between rounded-lg px-2 py-2 text-left text-sm font-bold text-[var(--color-text)] hover:bg-[var(--color-bg-elevated)]"
          >
            <span>À venir ({upcomingFiltered.length})</span>
            {openUp ? <ChevronDown className="size-4 shrink-0" /> : <ChevronRight className="size-4 shrink-0" />}
          </button>
          {openUp ? (
            <div className="mt-1 space-y-2 px-1 pb-3">
              {upcomingFiltered.length === 0 ? (
                <p className="px-2 py-2 text-xs text-[var(--color-text-muted)]">Aucun résultat.</p>
              ) : (
                upcomingFiltered.map((r) => (
                  <RaceRow
                    key={r.id}
                    r={r}
                    active={selectedDate === r.date}
                    onPick={() => onFocusDate(r.date)}
                  />
                ))
              )}
            </div>
          ) : null}
        </div>

        <div className="mt-1 border-t border-[var(--color-border-subtle)] pt-1">
          <button
            type="button"
            onClick={() => setOpenPast((o) => !o)}
            className="flex w-full items-center justify-between rounded-lg px-2 py-2 text-left text-sm font-bold text-[var(--color-text)] hover:bg-[var(--color-bg-elevated)]"
          >
            <span>Passées ({pastFiltered.length})</span>
            {openPast ? <ChevronDown className="size-4 shrink-0" /> : <ChevronRight className="size-4 shrink-0" />}
          </button>
          {openPast ? (
            <div className="mt-1 max-h-64 space-y-2 overflow-y-auto px-1 pb-3">
              {pastFiltered.length === 0 ? (
                <p className="px-2 py-2 text-xs text-[var(--color-text-muted)]">Aucune course passée.</p>
              ) : (
                pastFiltered.slice(0, 40).map((r) => (
                  <div key={r.id} className="space-y-1">
                    <div className="px-1 text-[10px] font-semibold uppercase tracking-wide text-[var(--color-text-muted)]">
                      {formatShortDate(r.date)}
                    </div>
                    <RaceRow r={r} active={selectedDate === r.date} onPick={() => onFocusDate(r.date)} />
                  </div>
                ))
              )}
              {pastFiltered.length > 40 ? (
                <p className="px-2 text-[10px] text-[var(--color-text-muted)]">+ {pastFiltered.length - 40} autres…</p>
              ) : null}
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
