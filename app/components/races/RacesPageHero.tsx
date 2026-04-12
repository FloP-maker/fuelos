"use client";

import Link from "next/link";
import { Mountain, Plus } from "lucide-react";
import type { RaceEntry } from "@/lib/types/race";
import { getDaysUntilRace } from "@/lib/races";
import { raceSportVisual } from "@/lib/raceCalendarUi";
import { RacesTodayCard } from "./RacesTodayCard";

export type RacesPageHeroProps = {
  nextRace: RaceEntry | null;
  onAddRace: () => void;
};

function countdownJLabel(days: number): string {
  if (days <= 0) return "J0";
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

export function RacesPageHero({ nextRace, onAddRace }: RacesPageHeroProps) {
  const days = nextRace ? getDaysUntilRace(nextRace) : null;
  const SportIcon = nextRace ? raceSportVisual(nextRace.sport).Icon : null;

  return (
    <section
      className="relative overflow-hidden rounded-2xl border border-white/10 shadow-[0_20px_50px_-20px_rgba(0,0,0,0.45)]"
      aria-labelledby="races-hero-title"
    >
      <div
        className="absolute inset-0 bg-[linear-gradient(145deg,#0b1220_0%,#152238_42%,#0d3d4d_78%,#0a2e28_100%)]"
        aria-hidden
      />
      <div
        className="absolute inset-0 bg-[radial-gradient(ellipse_120%_80%_at_20%_-20%,rgba(34,211,238,0.12),transparent_55%),radial-gradient(ellipse_90%_60%_at_100%_0%,rgba(16,185,129,0.1),transparent_50%)]"
        aria-hidden
      />
      <svg
        className="pointer-events-none absolute inset-x-0 bottom-0 h-[42%] w-full text-black/25 md:h-[38%]"
        viewBox="0 0 1200 200"
        preserveAspectRatio="none"
        aria-hidden
      >
        <path fill="currentColor" d="M0 200 L0 120 L180 40 L320 95 L480 25 L620 80 L780 15 L920 70 L1080 30 L1200 90 L1200 200 Z" />
        <path
          fill="currentColor"
          className="opacity-60"
          d="M0 200 L0 150 L220 85 L400 130 L560 60 L720 110 L900 50 L1040 95 L1200 75 L1200 200 Z"
        />
      </svg>
      <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-black/20 to-transparent" aria-hidden />

      <div className="relative px-4 pb-8 pt-5 sm:px-7 sm:pb-10 sm:pt-6 md:px-9 md:pb-11 md:pt-7">
        <div className="mb-6 flex flex-col gap-4 sm:mb-8 sm:flex-row sm:items-start sm:justify-between sm:gap-6">
          <div className="min-w-0 max-w-2xl pr-2">
            <h1
              id="races-hero-title"
              className="flex flex-wrap items-center gap-2 text-2xl font-semibold leading-tight tracking-tight text-white sm:text-3xl md:text-[1.85rem]"
            >
              <span className="select-none text-[1.35em] leading-none" aria-hidden>
                🏔️
              </span>
              Mes courses
            </h1>
            <p className="mt-2 max-w-lg text-sm leading-relaxed text-zinc-300/95 sm:text-[0.9375rem]">
              Prochain objectif, charge et récup : lecture rapide, comme un jalon en tête de tableau de bord.
            </p>
          </div>
          <button
            type="button"
            onClick={onAddRace}
            className="inline-flex h-10 max-h-10 shrink-0 items-center justify-center gap-1.5 self-start rounded-full bg-emerald-950 px-4 text-sm font-semibold text-emerald-50 shadow-sm ring-1 ring-emerald-800/80 transition hover:bg-emerald-900 hover:ring-emerald-700/60 sm:self-auto"
          >
            <Plus className="size-4 shrink-0 opacity-95" strokeWidth={2.5} aria-hidden />
            Nouvelle course
          </button>
        </div>

        <RacesTodayCard nextRace={nextRace} />

        <div className="relative z-[1] mt-0 sm:mt-1">
          {nextRace && days != null && SportIcon ? (
            <div className="rounded-2xl border border-white/15 bg-white/[0.07] px-5 py-8 shadow-[0_8px_40px_-12px_rgba(0,0,0,0.5)] backdrop-blur-md sm:px-8 sm:py-10 md:px-10 md:py-11">
              <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:gap-8">
                <span
                  className="flex size-14 shrink-0 items-center justify-center rounded-2xl bg-white/10 text-white ring-1 ring-white/20 sm:size-16"
                  aria-hidden
                >
                  <SportIcon className="size-7 opacity-95 sm:size-8" strokeWidth={2} />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="break-words text-4xl font-bold leading-[1.05] tracking-tight text-white sm:text-5xl md:text-6xl">
                    {nextRace.name}
                  </p>
                  <p
                    className="mt-3 font-mono text-3xl font-bold tabular-nums tracking-tight text-emerald-200 sm:text-4xl md:text-[2.75rem]"
                    aria-label={`Compte à rebours : ${countdownJLabel(days)}`}
                  >
                    {countdownJLabel(days)}
                  </p>
                  <p className="mt-5 max-w-2xl text-base leading-relaxed text-white/90 sm:text-lg">
                    {heroNutritionRecommendation(days)}
                  </p>
                  {nextRace.location ? (
                    <p className="mt-3 text-sm text-zinc-400">{nextRace.location}</p>
                  ) : null}
                  <Link
                    href={`/races/${nextRace.id}`}
                    className="mt-6 inline-flex items-center gap-1 text-sm font-semibold text-emerald-300 transition hover:text-emerald-200 sm:text-base"
                  >
                    Voir mon plan nutritionnel →
                  </Link>
                </div>
              </div>
            </div>
          ) : (
            <div className="rounded-2xl border border-white/15 bg-white/[0.07] px-5 py-8 backdrop-blur-md sm:px-8 sm:py-10">
              <div className="flex flex-col items-start gap-4 sm:flex-row sm:gap-6">
                <span className="flex size-14 shrink-0 items-center justify-center rounded-2xl bg-white/10 text-white ring-1 ring-white/15 sm:size-16">
                  <Mountain className="size-7 opacity-90 sm:size-8" strokeWidth={2} aria-hidden />
                </span>
                <div>
                  <p className="text-2xl font-bold text-white sm:text-3xl">Aucune course à venir</p>
                  <p className="mt-2 max-w-lg text-base leading-relaxed text-white/85">
                    Utilise le bouton « Nouvelle course » ci-dessus pour ajouter ton prochain objectif.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
