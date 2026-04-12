"use client";

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
      return "Ajoute une collation glucidée dense après chaque séance de plus d'1 h (ex. banane + compote).";
    case "course":
      return "Hydrate-toi toutes les 15–20 min en séance : vise +400 à 600 ml/h si tu le supportes bien.";
    case "recovery":
      return "Buve 250–300 ml à plusieurs reprises dans la journée, sans attendre d'avoir soif.";
  }
}

function courseLine(race: RaceEntry): string {
  const d = getDaysUntilRace(race);
  if (d <= 0) return `Course : ${race.name} — aujourd’hui`;
  if (d === 1) return `Course : ${race.name} — demain`;
  return `Course : ${race.name} — dans ${d} jours`;
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
  const shortReco = phase ? phaseShortReco(phase) : "—";
  const action = phase ? phaseActionDuJour(phase) : "Ajoute une course à venir pour recevoir des repères du jour.";

  return (
    <div
      className="relative z-[1] mb-3 rounded-2xl border border-[var(--fuel-card-border)] border-l-4 border-l-[var(--color-primary)] bg-[var(--fuel-card-surface)] px-6 py-5 shadow-[var(--fuel-card-shadow)] sm:mb-4"
      aria-label="Aujourd’hui"
    >
      <p className="text-[11px] font-semibold uppercase tracking-wide text-[var(--color-text-muted)]">Aujourd’hui</p>
      <div className="mt-2 space-y-2 text-xs leading-relaxed text-[var(--color-text)]">
        <p>
          <span aria-hidden>🎯 </span>
          {nextRace ? courseLine(nextRace) : "Course : —"}
        </p>
        <p>
          <span aria-hidden>🍌 </span>
          Phase : {phase ? `${phaseLabel} — ${shortReco}` : "—"}
        </p>
        <p>
          <span aria-hidden>💧 </span>
          Action du jour : {action}
        </p>
      </div>
    </div>
  );
}
