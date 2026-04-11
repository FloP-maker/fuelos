"use client";

import Link from "next/link";
import { ChevronRight, Mountain, Plus } from "lucide-react";
import type { RaceEntry } from "@/lib/types/race";
import { getDaysUntilRace, getRaceApproachProgress } from "@/lib/races";
import { raceSportVisual } from "@/lib/raceCalendarUi";

export type RacesPageHeroProps = {
  nextRace: RaceEntry | null;
  onAddRace: () => void;
};

export function RacesPageHero({ nextRace, onAddRace }: RacesPageHeroProps) {
  const days = nextRace ? getDaysUntilRace(nextRace) : null;
  const progress = nextRace ? getRaceApproachProgress(nextRace) : 0;
  const pct = Math.round(progress * 100);
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

        <div className="flex flex-col gap-6 lg:flex-row lg:justify-end">
          <div className="w-full max-w-xl lg:ml-auto lg:shrink-0">
            {nextRace && days != null && SportIcon ? (
              <div className="rounded-xl border border-white/10 bg-white/[0.07] p-4 backdrop-blur-sm sm:p-5">
                <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-zinc-400">
                  Prochaine course
                </p>
                <div className="mt-3 flex items-start gap-3">
                  <span
                    className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-white/12 text-white ring-1 ring-white/20"
                    aria-hidden
                  >
                    <SportIcon className="size-5 opacity-95" strokeWidth={2} />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-2xl font-bold leading-[1.15] tracking-tight text-white sm:text-3xl md:text-4xl">
                      {days === 0 ? (
                        <>
                          {nextRace.name}
                          <span className="mt-1 block text-lg font-semibold text-emerald-200 sm:text-xl">
                            Aujourd&apos;hui
                          </span>
                        </>
                      ) : days === 1 ? (
                        <>
                          <span className="break-words">{nextRace.name}</span>{" "}
                          <span className="font-semibold text-emerald-200/95">demain</span>
                        </>
                      ) : (
                        <>
                          <span className="break-words">{nextRace.name}</span>{" "}
                          <span className="whitespace-nowrap font-semibold text-emerald-200/95">
                            dans {days} jours
                          </span>
                        </>
                      )}
                    </p>
                    {nextRace.location ? (
                      <p className="mt-2 truncate text-xs text-zinc-400 sm:text-sm">{nextRace.location}</p>
                    ) : null}
                  </div>
                </div>

                <div className="mt-5">
                  <div className="mb-1.5 flex items-center justify-between gap-2 text-[11px] text-zinc-400">
                    <span>Avancement vers le jour J</span>
                    <span className="tabular-nums text-zinc-300">{pct}%</span>
                  </div>
                  <div
                    className="h-2.5 overflow-hidden rounded-full bg-black/35 ring-1 ring-inset ring-white/10"
                    role="progressbar"
                    aria-valuenow={pct}
                    aria-valuemin={0}
                    aria-valuemax={100}
                    aria-label="Progression vers la date de la course"
                  >
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-emerald-400 via-teal-300 to-cyan-300 shadow-[0_0_20px_rgba(52,211,153,0.35)] transition-[width] duration-500 ease-out"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>

                <Link
                  href={`/races/${nextRace.id}`}
                  className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-emerald-300 transition hover:text-emerald-200"
                >
                  Fiche et plan
                  <ChevronRight className="size-4" strokeWidth={2.25} aria-hidden />
                </Link>
              </div>
            ) : (
              <div className="rounded-xl border border-white/10 bg-white/[0.07] p-4 backdrop-blur-sm sm:p-5">
                <div className="flex items-start gap-3">
                  <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-white/10 text-white ring-1 ring-white/15">
                    <Mountain className="size-5 opacity-90" strokeWidth={2} aria-hidden />
                  </span>
                  <div>
                    <p className="text-lg font-bold text-white">Aucune course à venir</p>
                    <p className="mt-1 text-sm leading-relaxed text-zinc-300">
                      Utilise le bouton « Nouvelle course » ci-dessus pour ajouter ton prochain objectif.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
