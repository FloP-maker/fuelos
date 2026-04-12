"use client";

import { Banana, Droplets, Flag, Zap } from "lucide-react";
import type { RaceEntry } from "@/lib/types/race";
import { getDaysUntilRace } from "@/lib/races";
import { getNutritionCalendarPhase, type NutritionCalendarPhase } from "@/lib/raceNutritionBands";

export type RacesTodayCardProps = {
  nextRace: RaceEntry | null;
};

const PHASE_LABEL: Record<NutritionCalendarPhase, string> = {
  preparation: "Préparation",
  charge: "Charge",
  course: "Course",
  recovery: "Récupération",
};

function phaseShortReco(phase: NutritionCalendarPhase): string {
  switch (phase) {
    case "preparation":
      return "Base glucidique régulière (5–7 g/kg/j).";
    case "charge":
      return "Densité glucidique prioritaire, fractionne les apports.";
    case "course":
      return "Sources digestes, rien de nouveau sous la ceinture.";
    case "recovery":
      return "Réhydratation douce + sodium modéré.";
  }
}

function phaseActionDuJour(phase: NutritionCalendarPhase): string {
  switch (phase) {
    case "preparation":
      return "Assure-toi de consommer 500 ml d'eau supplémentaire par heure d'entraînement aujourd'hui.";
    case "charge":
      return "Ajoute une collation glucidique dense après chaque séance de plus d'1 h (ex. banane + compote).";
    case "course":
      return "Hydrate-toi toutes les 15–20 min en séance : vise +400 à 600 ml/h si tu le supportes bien.";
    case "recovery":
      return "Buve 250–300 ml à plusieurs reprises dans la journée, sans attendre d'avoir soif.";
  }
}

function courseHeadline(race: RaceEntry): string {
  const d = getDaysUntilRace(race);
  if (d < 0) return `${race.name} — passée`;
  if (d === 0) return `${race.name} — aujourd'hui`;
  if (d === 1) return `${race.name} — demain`;
  return `${race.name} dans ${d} jours`;
}

function courseBadgeLabel(race: RaceEntry | null): string | null {
  if (!race) return null;
  const d = getDaysUntilRace(race);
  if (d < 0) return "Passée";
  if (d === 0) return "Jour J";
  return `${d}j`;
}

function resolvePhase(race: RaceEntry): NutritionCalendarPhase {
  const p = getNutritionCalendarPhase(race);
  if (p) return p;
  const d = getDaysUntilRace(race);
  if (d <= 0) return "course";
  if (d <= 5) return "charge";
  return "preparation";
}

export function RacesTodayCard({ nextRace }: RacesTodayCardProps) {
  const phase = nextRace ? resolvePhase(nextRace) : null;
  const phaseLabel = phase ? PHASE_LABEL[phase] : "—";
  const shortReco = phase ? phaseShortReco(phase) : "Ajoute une course pour voir ta phase nutritionnelle.";
  const action = phase
    ? phaseActionDuJour(phase)
    : "Ajoute une course à venir pour recevoir des repères du jour.";

  const nutritionLine = phase ? `${phaseLabel} — ${shortReco}` : shortReco;
  const NutritionIcon = phase === "charge" || phase === "course" ? Zap : Banana;

  return (
    <div className="races-today-card" aria-label="Aujourd’hui">
      <div className="races-today-card__header">
        <span className="races-today-card__live-dot" aria-hidden />
        <span className="races-section-eyebrow">Aujourd&apos;hui</span>
      </div>

      <div className="races-today-card__mic-row">
        {/* Course */}
        <div className="races-today-card__mic races-today-card__mic--1">
          <div className="races-today-card__mic-head">
            <div className="races-today-card__mic-title-group">
              <Flag className="races-today-card__mic-icon" strokeWidth={2.25} aria-hidden />
              <span className="races-today-card__mic-label">Course</span>
            </div>
            <span className="races-today-card__mic-badge-wrap">
              {nextRace && courseBadgeLabel(nextRace) ? (
                <span className="races-today-card__mic-badge">{courseBadgeLabel(nextRace)}</span>
              ) : null}
            </span>
          </div>
          <p className="races-today-card__mic-body">
            {nextRace ? courseHeadline(nextRace) : "Aucune course planifiée"}
          </p>
        </div>

        {/* Nutrition */}
        <div className="races-today-card__mic races-today-card__mic--2">
          <div className="races-today-card__mic-head">
            <div className="races-today-card__mic-title-group">
              <NutritionIcon className="races-today-card__mic-icon" strokeWidth={2.25} aria-hidden />
              <span className="races-today-card__mic-label">Nutrition</span>
            </div>
            <span className="races-today-card__mic-spacer" aria-hidden />
          </div>
          <p className="races-today-card__mic-body">{nutritionLine}</p>
        </div>

        {/* Hydratation */}
        <div className="races-today-card__mic races-today-card__mic--3">
          <div className="races-today-card__mic-head">
            <div className="races-today-card__mic-title-group">
              <Droplets className="races-today-card__mic-icon" strokeWidth={2.25} aria-hidden />
              <span className="races-today-card__mic-label">Hydratation</span>
            </div>
            <span className="races-today-card__mic-spacer" aria-hidden />
          </div>
          <p className="races-today-card__mic-body">{action}</p>
        </div>
      </div>
    </div>
  );
}
