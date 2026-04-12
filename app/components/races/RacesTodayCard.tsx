"use client";

import type { CSSProperties } from "react";
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

const rootStyle: CSSProperties = {
  background: "#f0f7f4",
  borderLeft: "4px solid #2d6a4f",
  borderRadius: "0 12px 12px 0",
  padding: "1rem 1.25rem",
  margin: "0 1.5rem 1.5rem",
};

const labelStyle: CSSProperties = {
  fontSize: "0.6875rem",
  fontWeight: 600,
  textTransform: "uppercase",
  letterSpacing: "0.06em",
  color: "#5a6a5a",
  marginBottom: "0.35rem",
};

const lineStyle: CSSProperties = {
  fontSize: "0.8125rem",
  lineHeight: 1.45,
  color: "#1a1a1a",
};

export function RacesTodayCard({ nextRace }: RacesTodayCardProps) {
  const phase = nextRace ? resolvePhase(nextRace) : null;
  const phaseLabel = phase ? PHASE_LABEL[phase] : "—";
  const shortReco = phase ? phaseShortReco(phase) : "—";
  const action = phase ? phaseActionDuJour(phase) : "Ajoute une course à venir pour recevoir des repères du jour.";

  return (
    <div style={rootStyle} aria-label="Aujourd’hui">
      <p style={labelStyle}>Aujourd’hui</p>
      <div style={{ marginTop: "0.35rem", display: "flex", flexDirection: "column", gap: "0.5rem" }}>
        <p style={lineStyle}>
          <span aria-hidden>🎯 </span>
          {nextRace ? courseLine(nextRace) : "Course : —"}
        </p>
        <p style={lineStyle}>
          <span aria-hidden>🍌 </span>
          Phase : {phase ? `${phaseLabel} — ${shortReco}` : "—"}
        </p>
        <p style={lineStyle}>
          <span aria-hidden>💧 </span>
          Action du jour : {action}
        </p>
      </div>
    </div>
  );
}
