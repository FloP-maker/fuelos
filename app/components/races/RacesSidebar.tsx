"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { ChevronDown, ChevronRight, Search } from "lucide-react";
import type { RaceEntry } from "@/lib/types/race";
import { getDaysUntilRace } from "@/lib/races";
import { raceSportVisual } from "@/lib/raceCalendarUi";
import { getRaceNutritionListStatus, type RaceNutritionListStatus } from "@/lib/raceNutritionListStatus";
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

const NUTRITION_PILL: Record<
  RaceNutritionListStatus,
  { emoji: string; className: string; title: string }
> = {
  complete: {
    emoji: "✅",
    className:
      "border-emerald-200 bg-emerald-50 text-emerald-900 dark:border-[color-mix(in_srgb,var(--color-accent)_35%,transparent)] dark:bg-[color-mix(in_srgb,var(--color-accent)_12%,transparent)] dark:text-[var(--color-text)]",
    title: "Nutrition : distance, glucides cibles et sodium renseignés",
  },
  partial: {
    emoji: "⚠️",
    className:
      "border-amber-200 bg-amber-50 text-amber-950 dark:border-amber-500/35 dark:bg-amber-500/15 dark:text-amber-100",
    title: "Nutrition : au moins un champ manquant (distance, glucides cibles ou sodium)",
  },
  empty: {
    emoji: "🔴",
    className:
      "border-rose-200 bg-rose-50 text-rose-950 dark:border-rose-500/40 dark:bg-rose-500/15 dark:text-rose-100",
    title: "Nutrition : aucun champ renseigné (distance, glucides cibles, sodium)",
  },
};

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
  const nutritionStatus = mode === "upcoming" ? getRaceNutritionListStatus(r) : null;
  const nutritionSpec = nutritionStatus ? NUTRITION_PILL[nutritionStatus] : null;

  return (
    <Link
      href={`/races/${r.id}`}
      onClick={onPick}
      className={[
        "group fuel-card fuel-card-interactive block no-underline text-inherit",
        active
          ? "ring-2 ring-[color-mix(in_srgb,var(--color-accent)_38%,rgba(0,0,0,0.12))] dark:ring-[color-mix(in_srgb,var(--color-accent)_42%,transparent)]"
          : "",
      ].join(" ")}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex min-w-0 items-center gap-2">
            <span
              className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-[color-mix(in_srgb,var(--color-text)_5%,transparent)] text-[var(--color-text)] ring-1 ring-[var(--fuel-card-border)] dark:bg-white/[0.06] dark:ring-white/[0.08]"
              aria-hidden
            >
              <Icon className="size-[1.05rem] opacity-90" strokeWidth={2} />
            </span>
            <p className="min-w-0 flex-1 truncate text-sm font-semibold text-[var(--color-text)]">{r.name}</p>
          </div>
          <p className="mt-1.5 ps-11 text-xs text-[var(--color-text-muted)]">
            {formatShortDate(r.date)}
            {r.sport ? ` · ${r.sport}` : ""}
            {typeof r.distance === "number" && r.distance > 0 ? (
              <span className="tabular-nums">{` · ${r.distance} km`}</span>
            ) : null}
            {typeof r.elevationGain === "number" && r.elevationGain > 0 ? (
              <span className="tabular-nums">{` · D+ ${r.elevationGain} m`}</span>
            ) : null}
          </p>
        </div>
        <div className="flex shrink-0 flex-col items-end gap-2">
          {nutritionSpec ? (
            <span
              className={[
                "inline-flex size-8 items-center justify-center rounded-full border text-[13px] leading-none ring-1 ring-[rgba(0,0,0,0.04)] dark:ring-white/[0.06]",
                nutritionSpec.className,
              ].join(" ")}
              title={nutritionSpec.title}
              aria-label={nutritionSpec.title}
              role="img"
            >
              <span aria-hidden>{nutritionSpec.emoji}</span>
            </span>
          ) : null}
          <span
            className={[
              "rounded-full px-3 py-1 text-[11px] font-bold tabular-nums",
              mode === "upcoming"
                ? "bg-[var(--color-primary)] text-[var(--color-on-primary)] shadow-sm"
                : "bg-[color-mix(in_srgb,var(--color-text)_6%,var(--fuel-card-surface))] text-[var(--color-text-muted)] ring-1 ring-[var(--fuel-card-border)] dark:bg-white/[0.08] dark:text-[var(--color-text-muted)]",
            ].join(" ")}
          >
            {pill}
          </span>
        </div>
      </div>
      <span className="mt-3 inline-flex items-center gap-0.5 text-xs font-semibold text-[var(--color-accent)] transition group-hover:gap-1">
        Voir la fiche
        <ChevronRight className="size-3.5" strokeWidth={2.25} aria-hidden />
      </span>
    </Link>
  );
}

function RacesListHelp() {
  return (
    <details className="group mx-1 mb-1 rounded-2xl border border-[var(--fuel-card-border)] bg-[var(--fuel-card-surface)] text-left shadow-[var(--fuel-card-shadow)] dark:border-[var(--fuel-card-border)] dark:bg-[var(--fuel-card-surface)]">
      <summary className="flex cursor-pointer list-none items-center gap-2 rounded-2xl bg-[var(--color-bg-subtle)] px-3 py-2.5 text-xs font-medium text-[var(--color-text-secondary)] marker:content-none dark:bg-white/[0.06] dark:text-[var(--color-text-muted)] [&::-webkit-details-marker]:hidden">
        <span className="text-base leading-none" aria-hidden>
          ℹ️
        </span>
        <span>En savoir plus</span>
        <ChevronDown className="ms-auto size-4 shrink-0 transition group-open:rotate-180" aria-hidden />
      </summary>
      <div className="border-t border-[var(--fuel-card-border)] px-3 py-2.5 text-[11px] leading-relaxed text-[var(--color-text-secondary)] dark:text-[var(--color-text-muted)]">
        <p>
          Les filtres <strong className="text-[var(--color-text)]">À venir</strong>,{" "}
          <strong className="text-[var(--color-text)]">Passées</strong> et{" "}
          <strong className="text-[var(--color-text)]">Tout</strong> s’appliquent aux cases du calendrier. Les bandeaux
          charge et récup (définis sur chaque course) restent visibles selon le sport et la recherche. La liste respecte
          l’horizon choisi (1 à 6 mois).
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

  const accordionBtn =
    "flex w-full items-center justify-between border-b border-[var(--fuel-card-border)] bg-[var(--color-bg-subtle)] px-3 py-2.5 text-left text-sm font-semibold text-[var(--color-text-primary)] transition hover:bg-[color-mix(in_srgb,var(--color-border-strong)_22%,var(--color-bg-subtle))] dark:border-[var(--fuel-card-border)] dark:bg-white/[0.07] dark:text-[var(--color-text)] dark:hover:bg-white/[0.1]";

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="border-b border-[var(--fuel-card-border)] px-4 py-4">
        <p className="text-[11px] font-medium tracking-wide text-[var(--color-text-muted)] dark:text-[var(--color-text-muted)]">
          Calendrier
        </p>
        <p className="mt-0.5 text-sm font-semibold text-[var(--color-text)]">Liste des courses</p>
      </div>

      <div className="px-4 py-3">
        <div className="relative">
          <Search
            className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-[var(--color-text-muted)] dark:text-[var(--color-text-muted)]"
            aria-hidden
          />
          <input
            type="search"
            value={searchQuery}
            onChange={(e) => onSearchQuery(e.target.value)}
            placeholder="Rechercher…"
            className="w-full rounded-2xl border border-[var(--fuel-card-border)] bg-[var(--fuel-card-surface)] py-2.5 pl-10 pr-3 text-sm text-[var(--color-text)] shadow-[var(--fuel-card-shadow)] outline-none transition placeholder:text-[var(--color-text-muted)] focus:border-[color-mix(in_srgb,var(--color-accent)_45%,var(--fuel-card-border))] focus:ring-2 focus:ring-[color-mix(in_srgb,var(--color-accent)_22%,transparent)] dark:placeholder:text-[var(--color-text-muted)]"
          />
        </div>
      </div>

      <div className="min-h-0 flex-1 space-y-3 overflow-y-auto overscroll-contain px-2 pb-4">
        <RacesListHelp />

        <div className="overflow-hidden rounded-2xl border border-[var(--fuel-card-border)] bg-[var(--fuel-card-surface)] shadow-[var(--fuel-card-shadow)]">
          <button type="button" onClick={() => setOpenUp((o) => !o)} className={accordionBtn}>
            <span>À venir ({upcomingFiltered.length})</span>
            {openUp ? <ChevronDown className="size-4 shrink-0 opacity-70" /> : <ChevronRight className="size-4 shrink-0 opacity-70" />}
          </button>
          {openUp ? (
            <div className="space-y-2.5 bg-[var(--fuel-card-surface)] p-2.5">
              {upcomingFiltered.length === 0 ? (
                <p className="px-2 py-2 text-xs text-[var(--color-text-muted)]">Aucun résultat.</p>
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

        <div className="overflow-hidden rounded-2xl border border-[var(--fuel-card-border)] bg-[var(--fuel-card-surface)] shadow-[var(--fuel-card-shadow)]">
          <button type="button" onClick={() => setOpenPast((o) => !o)} className={accordionBtn}>
            <span>Passées ({pastFiltered.length})</span>
            {openPast ? <ChevronDown className="size-4 shrink-0 opacity-70" /> : <ChevronRight className="size-4 shrink-0 opacity-70" />}
          </button>
          {openPast ? (
            <div className="max-h-72 space-y-2.5 overflow-y-auto bg-[var(--fuel-card-surface)] p-2.5">
              {pastFiltered.length === 0 ? (
                <p className="px-2 py-2 text-xs text-[var(--color-text-muted)]">Aucune course passée.</p>
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
                <p className="px-2 text-[10px] text-[var(--color-text-muted)]">+ {pastFiltered.length - 40} autres…</p>
              ) : null}
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
