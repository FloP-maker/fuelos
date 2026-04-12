"use client";

import Link from "next/link";
import { Mountain } from "lucide-react";
import type { RaceEntry } from "@/lib/types/race";
import { getDaysUntilRace } from "@/lib/races";
import { raceSportVisual } from "@/lib/raceCalendarUi";

export type RacesNextMilestoneProps = {
  nextRace: RaceEntry | null;
};

function countdownJLabel(days: number): string {
  if (days < 0) return "—";
  return `J-${days}`;
}

function heroNutritionRecommendation(days: number): string {
  if (days > 30) {
    return "Phase de préparation — maintiens 5–7 g/kg de glucides/jour";
  }
  if (days >= 6) {
    return "Approche de la course — augmente progressivement les glucides";
  }
  if (days >= 3) {
    return "🔥 Phase de charge — vise 8–10 g/kg/jour";
  }
  return "⚡ Jour course — glucides rapides, hydratation maximale";
}

export function RacesNextMilestone({ nextRace }: RacesNextMilestoneProps) {
  const days = nextRace ? getDaysUntilRace(nextRace) : null;
  const SportIcon = nextRace ? raceSportVisual(nextRace.sport).Icon : null;

  return (
    <div className="relative z-[1] sm:mt-1">
      {nextRace && days != null && SportIcon ? (
        <div className="fuel-card fuel-card--flush p-6 sm:p-8 md:px-10 md:py-10">
          <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:gap-8">
            <span
              className="flex size-14 shrink-0 items-center justify-center rounded-2xl bg-zinc-100 text-zinc-800 ring-1 ring-zinc-200 dark:bg-white/10 dark:text-white dark:ring-white/20 sm:size-16"
              aria-hidden
            >
              <SportIcon className="size-7 opacity-95 sm:size-8" strokeWidth={2} />
            </span>
            <div className="min-w-0 flex-1">
              <p className="break-words text-3xl font-bold leading-[1.05] tracking-tight text-[var(--color-text)] sm:text-4xl md:text-5xl">
                {nextRace.name}
              </p>
              <p
                className="mt-3 font-mono text-2xl font-bold tabular-nums tracking-tight text-emerald-600 dark:text-emerald-200 sm:text-3xl md:text-[2.5rem]"
                aria-label={`Compte à rebours : ${countdownJLabel(days)}`}
              >
                {countdownJLabel(days)}
              </p>
              <p className="mt-5 max-w-2xl text-base leading-relaxed text-[var(--color-text-muted)] sm:text-lg">
                {heroNutritionRecommendation(days)}
              </p>
              {nextRace.location ? (
                <p className="mt-3 text-sm text-[var(--color-text-muted)]">{nextRace.location}</p>
              ) : null}
              <Link
                href={`/races/${nextRace.id}`}
                className="mt-6 inline-flex items-center gap-1 text-sm font-semibold text-emerald-600 transition hover:text-emerald-500 dark:text-emerald-300 dark:hover:text-emerald-200 sm:text-base"
              >
                Voir mon plan nutritionnel →
              </Link>
            </div>
          </div>
        </div>
      ) : (
        <div className="fuel-card fuel-card--flush p-6 sm:p-8 sm:py-10">
          <div className="flex flex-col items-start gap-4 sm:flex-row sm:gap-6">
            <span className="flex size-14 shrink-0 items-center justify-center rounded-2xl bg-zinc-100 text-zinc-700 ring-1 ring-zinc-200 dark:bg-white/10 dark:text-white dark:ring-white/15 sm:size-16">
              <Mountain className="size-7 opacity-90 sm:size-8" strokeWidth={2} aria-hidden />
            </span>
            <div>
              <p className="text-2xl font-bold text-[var(--color-text)] sm:text-3xl">Aucune course à venir</p>
              <p className="mt-2 max-w-lg text-base leading-relaxed text-[var(--color-text-muted)]">
                Utilise le bouton « Nouvelle course » en haut de page pour ajouter ton prochain objectif.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
