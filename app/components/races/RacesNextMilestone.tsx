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
      className="races-next-milestone-card__ring"
      aria-label={`${displayDays} jours avant la course, environ ${Math.round(p * 100)} % de la période de préparation écoulée`}
    >
      <svg viewBox="0 0 120 120" aria-hidden>
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
      <div className="races-next-milestone-card__ring-inner">
        <span className="races-next-milestone-card__ring-days">{displayDays}</span>
        <span className="races-next-milestone-card__ring-unit">jours</span>
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
    <div className="races-next-milestone">
      {nextRace && days != null ? (
        <div className="races-next-milestone-card">
          <div className="races-next-milestone-card__main">
            <div className="races-next-milestone-card__stack">
              <div className="races-section-eyebrow">Prochain objectif</div>
              <div className="races-next-milestone-card__title-row">
                <Mountain className="races-next-milestone-card__title-icon" strokeWidth={2.25} aria-hidden />
                <div className="races-next-milestone-card__title">{nextRace.name}</div>
              </div>
            </div>

            <div className="races-next-milestone-card__progress-block">
              <p className="races-next-milestone-card__prep-caption">
                Progression préparation · {daysRem}j restants sur ~{windowDays}j
              </p>
              <div
                className="races-next-milestone-card__prep-track"
                role="progressbar"
                aria-valuenow={Math.round(approach * 100)}
                aria-valuemin={0}
                aria-valuemax={100}
                aria-label="Progression préparation"
              >
                <div
                  className="races-next-milestone-card__prep-fill"
                  style={{
                    width: `${Math.round(approach * 100)}%`,
                    backgroundColor: barFill,
                  }}
                />
              </div>
            </div>

            <p className="races-next-milestone-card__reco">{heroNutritionRecommendation(days)}</p>
            <Link href={`/races/${nextRace.id}`} className="races-next-milestone-card__link">
              Voir mon plan nutritionnel →
            </Link>
          </div>

          <PrepCountdownRing daysRemaining={days} progress={approach} />
        </div>
      ) : (
        <div className="races-next-milestone-card races-next-milestone-card--empty">
          <span className="races-next-milestone-card__empty-icon" aria-hidden>
            <Mountain strokeWidth={2} />
          </span>
          <div className="races-next-milestone-card__main">
            <div className="races-next-milestone-card__empty-title">Aucune course à venir</div>
            <p className="races-next-milestone-card__empty-copy">
              Utilise le bouton « Nouvelle course » en haut de page pour ajouter ton prochain objectif.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
