"use client";

import Link from "next/link";
import { ChevronRight, Mountain } from "lucide-react";
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
      className="relative mb-5 overflow-hidden rounded-2xl border border-white/10 shadow-[0_20px_50px_-20px_rgba(0,0,0,0.45)] md:mb-6"
      aria-labelledby="races-hero-title"
    >
      {/* Fond montagne / trail : dégradés + silhouette */}
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

      <div className="relative px-4 py-8 sm:px-8 sm:py-10 md:px-10 md:py-12">
        <div className="flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-2xl">
            <h1
              id="races-hero-title"
              className="flex flex-wrap items-center gap-2 font-display text-3xl font-bold tracking-tight text-white sm:text-4xl md:text-[2.35rem]"
            >
              <span className="select-none" aria-hidden>
                🏔️
              </span>
              Mes courses
            </h1>
            <p className="mt-2 max-w-lg text-sm leading-relaxed text-zinc-300 sm:text-base">
              Prochain objectif, charge et récup : tout se lit d’un coup d’œil comme sur Strava ou Garmin Connect.
            </p>
          </div>

          <div className="w-full max-w-xl lg:shrink-0 lg:pb-0.5">
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
                      Ajoute ton prochain objectif pour afficher le compte à rebours ici.
                    </p>
                    <button
                      type="button"
                      onClick={onAddRace}
                      className="mt-4 rounded-xl bg-white px-4 py-2.5 text-sm font-semibold text-slate-900 transition hover:bg-zinc-100"
                    >
                      Ajouter une course
                    </button>
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
