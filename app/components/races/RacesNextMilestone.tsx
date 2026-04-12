"use client";

import type { CSSProperties } from "react";
import Link from "next/link";
import { Mountain } from "lucide-react";
import type { RaceEntry } from "@/lib/types/race";
import { getDaysUntilRace } from "@/lib/races";

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

const cardOuter: CSSProperties = {
  background: "white",
  borderRadius: 16,
  boxShadow: "0 2px 12px rgba(0,0,0,0.08)",
  padding: "24px",
  margin: 0,
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  gap: "1rem",
};

const labelStyle: CSSProperties = {
  fontSize: "0.75rem",
  fontWeight: 600,
  textTransform: "uppercase",
  letterSpacing: "0.08em",
  color: "#5a6a5a",
  marginBottom: "0.25rem",
};

const titleStyle: CSSProperties = {
  fontSize: "1.5rem",
  fontWeight: 800,
  color: "#1a1a1a",
};

const subtitleStyle: CSSProperties = {
  fontSize: "0.875rem",
  color: "#5a6a5a",
  marginTop: "0.25rem",
};

const linkStyle: CSSProperties = {
  color: "#2d6a4f",
  fontWeight: 600,
  fontSize: "0.875rem",
  marginTop: "0.75rem",
  display: "inline-block",
  textDecoration: "none",
};

const jBadgeStyle: CSSProperties = {
  background: "#2d6a4f",
  color: "white",
  fontSize: "1.75rem",
  fontWeight: 800,
  borderRadius: 12,
  padding: "1rem 1.25rem",
  textAlign: "center",
  lineHeight: 1,
  flexShrink: 0,
  minWidth: 80,
};

const emptyCardOuter: CSSProperties = {
  ...cardOuter,
  alignItems: "flex-start",
  justifyContent: "flex-start",
};

export function RacesNextMilestone({ nextRace }: RacesNextMilestoneProps) {
  const days = nextRace ? getDaysUntilRace(nextRace) : null;

  return (
    <div className="relative z-[1]">
      {nextRace && days != null ? (
        <div style={cardOuter}>
          <div style={{ minWidth: 0, flex: 1 }}>
            <div style={labelStyle}>Prochain objectif</div>
            <div style={titleStyle}>{nextRace.name}</div>
            <div style={subtitleStyle}>{heroNutritionRecommendation(days)}</div>
            <Link href={`/races/${nextRace.id}`} style={linkStyle}>
              Voir mon plan nutritionnel →
            </Link>
          </div>
          <div style={jBadgeStyle} aria-label={`Compte à rebours : ${countdownJLabel(days)}`}>
            {countdownJLabel(days)}
          </div>
        </div>
      ) : (
        <div style={emptyCardOuter}>
          <div style={{ display: "flex", alignItems: "flex-start", gap: "1rem" }}>
            <span
              style={{
                display: "flex",
                width: 56,
                height: 56,
                alignItems: "center",
                justifyContent: "center",
                borderRadius: 12,
                background: "#f0f4f1",
                color: "#1a1a1a",
                flexShrink: 0,
              }}
              aria-hidden
            >
              <Mountain className="size-7" strokeWidth={2} />
            </span>
            <div>
              <div style={{ ...titleStyle, fontSize: "1.25rem" }}>Aucune course à venir</div>
              <div style={subtitleStyle}>
                Utilise le bouton « Nouvelle course » en haut de page pour ajouter ton prochain objectif.
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
