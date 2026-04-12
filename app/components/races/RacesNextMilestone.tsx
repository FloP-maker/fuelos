"use client";

import Link from "next/link";
import { Mountain } from "lucide-react";
import { useEffect, useState } from "react";
import type { RaceEntry } from "@/lib/types/race";
import { getDaysUntilRace, getRaceApproachProgress, getRacePrepWindowDays } from "@/lib/races";

export type RacesNextMilestoneProps = {
  nextRace: RaceEntry | null;
};

const RING_R = 46;
const RING_C = 2 * Math.PI * RING_R;

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

/** Vert #2d6a4f → orange #ea580c quand il reste &lt; 30 j. */
function accentForDaysLeft(daysLeft: number): string {
  if (daysLeft >= 30) return "#2d6a4f";
  const t = Math.max(0, Math.min(1, daysLeft / 30));
  const r2 = 234;
  const g2 = 88;
  const b2 = 12;
  const r1 = 45;
  const g1 = 106;
  const b1 = 79;
  const r = Math.round(r2 + t * (r1 - r2));
  const g = Math.round(g2 + t * (g1 - g2));
  const b = Math.round(b2 + t * (b1 - b2));
  return `rgb(${r},${g},${b})`;
}

function PrepCountdownRing({
  daysRemaining,
  progress,
}: {
  daysRemaining: number;
  progress: number;
}) {
  const [drawn, setDrawn] = useState(false);

  useEffect(() => {
    const reduced =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced) {
      setDrawn(true);
      return;
    }
    const id = requestAnimationFrame(() => setDrawn(true));
    return () => cancelAnimationFrame(id);
  }, []);

  const p = Math.max(0, Math.min(1, progress));
  const dashOffset = drawn ? RING_C * (1 - p) : RING_C;
  const stroke = accentForDaysLeft(daysRemaining);
  const displayDays = Math.max(0, daysRemaining);

  return (
    <div
      className="relative flex size-[118px] shrink-0 flex-col items-center justify-center"
      aria-label={`${displayDays} jours avant la course, environ ${Math.round(p * 100)} % de la période de préparation écoulée`}
    >
      <svg
        className="absolute inset-0 size-full -rotate-90 text-[rgba(0,0,0,0.08)] dark:text-white/10"
        viewBox="0 0 120 120"
        aria-hidden
      >
        <circle cx="60" cy="60" r={RING_R} fill="none" stroke="currentColor" strokeWidth="5" />
        <circle
          cx="60"
          cy="60"
          r={RING_R}
          fill="none"
          stroke={stroke}
          strokeWidth="5"
          strokeLinecap="round"
          strokeDasharray={RING_C}
          strokeDashoffset={dashOffset}
          style={{
            transition: "stroke-dashoffset 1s ease-out, stroke 0.35s ease",
          }}
        />
      </svg>
      <div className="relative z-10 flex flex-col items-center">
        <span className="text-[2rem] font-extrabold tabular-nums leading-none tracking-tight text-[#1a1a1a] dark:text-[var(--color-text)]">
          {displayDays}
        </span>
        <span className="mt-0.5 text-[11px] font-medium uppercase tracking-[0.12em] text-[var(--color-text-secondary)] dark:text-[var(--color-text-muted)]">
          jours
        </span>
      </div>
    </div>
  );
}

export function RacesNextMilestone({ nextRace }: RacesNextMilestoneProps) {
  const days = nextRace ? getDaysUntilRace(nextRace) : null;
  const approach = nextRace ? getRaceApproachProgress(nextRace) : 0;
  const windowDays = nextRace ? getRacePrepWindowDays(nextRace) : 120;
  const daysRem = days != null ? Math.max(0, days) : 0;
  const barFill = accentForDaysLeft(daysRem);

  return (
    <div className="races-next-milestone relative">
      {nextRace && days != null ? (
        <div className="races-next-milestone-card flex items-stretch gap-5 px-6 py-5 md:gap-6 md:px-7 md:py-6">
          <div className="flex min-w-0 flex-1 flex-col gap-4">
            <div className="flex flex-col gap-2">
              <div className="races-section-eyebrow">Prochain objectif</div>
              <div className="flex items-start gap-2.5">
                <Mountain
                  className="mt-0.5 size-6 shrink-0 text-[#2d6a4f] dark:text-[var(--color-primary-light)]"
                  strokeWidth={2.25}
                  aria-hidden
                />
                <div className="text-xl font-extrabold leading-snug tracking-tight text-[#1a1a1a] dark:text-[var(--color-text)] md:text-2xl">
                  {nextRace.name}
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <p className="text-[11px] font-medium leading-relaxed text-[#5a6a5a] dark:text-[var(--color-text-muted)] md:text-xs">
                Progression préparation · {daysRem}j restants sur ~{windowDays}j
              </p>
              <div
                className="h-1.5 w-full overflow-hidden rounded-full bg-[#dfe6df] dark:bg-white/10"
                role="progressbar"
                aria-valuenow={Math.round(approach * 100)}
                aria-valuemin={0}
                aria-valuemax={100}
                aria-label="Progression préparation"
              >
                <div
                  className="h-full rounded-full transition-[width] duration-300 ease-out"
                  style={{
                    width: `${Math.round(approach * 100)}%`,
                    backgroundColor: barFill,
                  }}
                />
              </div>
            </div>

            <p className="text-sm leading-relaxed text-[var(--color-text-secondary)]">{heroNutritionRecommendation(days)}</p>
            <Link
              href={`/races/${nextRace.id}`}
              className="inline-block text-sm font-semibold leading-snug text-[var(--color-primary)] no-underline dark:text-[var(--color-primary-light)]"
            >
              Voir mon plan nutritionnel →
            </Link>
          </div>

          <PrepCountdownRing daysRemaining={days} progress={approach} />
        </div>
      ) : (
        <div className="races-next-milestone-card flex items-start justify-start gap-4 px-6 py-5 md:px-7 md:py-6">
          <span
            className="flex size-14 shrink-0 items-center justify-center rounded-xl bg-[#e8ede9] text-[#1a1a1a] dark:bg-white/10 dark:text-[var(--color-text)]"
            aria-hidden
          >
            <Mountain className="size-7" strokeWidth={2} />
          </span>
          <div className="flex min-w-0 flex-1 flex-col gap-3">
            <div className="text-xl font-extrabold leading-snug text-[#1a1a1a] dark:text-[var(--color-text)] md:text-2xl">
              Aucune course à venir
            </div>
            <p className="text-sm leading-relaxed text-[#5a6a5a] dark:text-[var(--color-text-muted)]">
              Utilise le bouton « Nouvelle course » en haut de page pour ajouter ton prochain objectif.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
