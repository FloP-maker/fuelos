"use client";

import Link from "next/link";
import { Droplets, Mountain } from "lucide-react";
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

function phaseForDaysLeft(daysLeft: number): { label: string; color: string } {
  if (daysLeft > 56) return { label: "Base", color: "#2563eb" };
  if (daysLeft > 28) return { label: "Build", color: "#eab308" };
  if (daysLeft > 10) return { label: "Peak", color: "#dc2626" };
  return { label: "Taper", color: "#16a34a" };
}

function phaseKeyForDaysLeft(daysLeft: number): "base" | "build" | "peak" | "taper" {
  if (daysLeft > 56) return "base";
  if (daysLeft > 28) return "build";
  if (daysLeft > 10) return "peak";
  return "taper";
}

function estimateTargetHours(race: RaceEntry): number | null {
  const d = typeof race.distance === "number" ? race.distance : 0;
  if (d <= 0) return null;
  const elev = typeof race.elevationGain === "number" ? race.elevationGain : 0;
  const sport = race.sport.toLowerCase();
  let h = d / 9.5;
  if (sport.includes("trail") || sport.includes("ultra")) h = d / 7 + elev / 700;
  else if (sport.includes("triathlon")) h = d / 8.5 + elev / 1200;
  else if (sport.includes("velo")) h = d / 25 + elev / 1500;
  if (!Number.isFinite(h) || h <= 0) return null;
  return Math.max(1, Math.round(h));
}

function estimateSessionsRemaining(daysRemaining: number): number {
  return Math.max(1, Math.round(daysRemaining / 3));
}

function PrepSupportRing({ daysRemaining, progress }: { daysRemaining: number; progress: number }) {
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
  const phase = phaseForDaysLeft(daysRemaining);
  const stroke = phase.color;
  const sessionsRemaining = estimateSessionsRemaining(Math.max(0, daysRemaining));

  return (
    <div
      className="races-next-milestone-card__ring"
      aria-label={`${sessionsRemaining} séances estimées restantes, phase ${phase.label}`}
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
        <span className="races-next-milestone-card__ring-days">{sessionsRemaining}</span>
        <span className="races-next-milestone-card__ring-unit">séances</span>
        <span className="races-next-milestone-card__ring-phase" style={{ color: phase.color }}>
          {phase.label}
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
  const prepProgressPct = Math.round(approach * 100);
  const phaseKey = phaseKeyForDaysLeft(daysRem);
  const estimatedHours = nextRace ? estimateTargetHours(nextRace) : null;
  const metricsLine = nextRace
    ? [
        typeof nextRace.distance === "number" && nextRace.distance > 0 ? `${nextRace.distance} km` : null,
        typeof nextRace.elevationGain === "number" && nextRace.elevationGain > 0
          ? `${Math.round(nextRace.elevationGain).toLocaleString("fr-FR")} D+`
          : null,
        estimatedHours ? `~${estimatedHours}h estimées` : null,
      ]
        .filter(Boolean)
        .join(" · ")
    : "";

  return (
    <div className="races-next-milestone">
      {nextRace && days != null ? (
        <div className="races-next-milestone-card">
          <div className="races-next-milestone-card__main">
            <div className="races-next-milestone-card__stack">
              <div className="races-section-eyebrow">Prochain objectif</div>
              <div className="races-next-milestone-card__title-row">
                <Mountain className="races-next-milestone-card__title-icon" strokeWidth={2.25} aria-hidden />
                <div>
                  <div className="races-next-milestone-card__title">{nextRace.name}</div>
                  {metricsLine ? <p className="races-next-milestone-card__metrics">{metricsLine}</p> : null}
                </div>
              </div>
            </div>

            <div className="races-next-milestone-card__progress-block">
              <p className="races-next-milestone-card__prep-caption">
                Progression préparation · {daysRem}j restants sur ~{windowDays}j
                <span className="races-next-milestone-card__prep-percent">{prepProgressPct}%</span>
              </p>
              <div
                className="races-next-milestone-card__prep-track"
                role="progressbar"
                aria-valuenow={prepProgressPct}
                aria-valuemin={0}
                aria-valuemax={100}
                aria-label="Progression préparation"
              >
                <div
                  className="races-next-milestone-card__prep-fill"
                  style={{
                    width: `${prepProgressPct}%`,
                  }}
                />
              </div>
              <div className="races-next-milestone-card__prep-legend" aria-hidden>
                {[
                  ["Base", "#2563eb"],
                  ["Build", "#eab308"],
                  ["Peak", "#dc2626"],
                  ["Taper", "#16a34a"],
                ].map(([label, color]) => (
                  <span key={label} className="races-next-milestone-card__prep-legend-item">
                    <span className="races-next-milestone-card__prep-legend-dot" style={{ backgroundColor: color }} />
                    {label}
                  </span>
                ))}
              </div>
            </div>

            <div className="races-next-milestone-card__reco">
              <Droplets size={16} aria-hidden />
              <div>
                <p className="races-next-milestone-card__reco-title">Conseil du moment</p>
                <p className="races-next-milestone-card__reco-copy">{heroNutritionRecommendation(days)}</p>
                <Link href={`/plan?phase=${phaseKey}&raceId=${nextRace.id}`} className="races-next-milestone-card__reco-link">
                  Voir mon plan nutrition pour cette phase →
                </Link>
              </div>
            </div>
          </div>

          <PrepSupportRing daysRemaining={days} progress={approach} />
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
