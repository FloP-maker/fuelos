"use client";

import type { CSSProperties } from "react";
import { Plus } from "lucide-react";

export type RacesPageHeroProps = {
  onAddRace: () => void;
};

const heroShell: CSSProperties = {
  position: "relative",
  height: "220px",
  overflow: "hidden",
  borderRadius: 0,
  background: "linear-gradient(160deg, #1a2e1a 0%, #2d4a2d 60%, #1a2535 100%)",
};

const mountainsSvg: CSSProperties = {
  position: "absolute",
  bottom: 0,
  left: 0,
  width: "100%",
  height: "42%",
  opacity: 0.4,
  zIndex: 1,
  pointerEvents: "none",
};

const contentBlock: CSSProperties = {
  position: "absolute",
  bottom: "2rem",
  left: "2rem",
  zIndex: 2,
  maxWidth: "min(28rem, calc(100% - 9rem))",
  paddingRight: "0.5rem",
};

const titleStyle: CSSProperties = {
  margin: 0,
  color: "#ffffff",
  fontSize: "2rem",
  fontWeight: 800,
  lineHeight: 1.1,
};

const subtitleStyle: CSSProperties = {
  marginTop: "0.25rem",
  marginBottom: 0,
  color: "rgba(255, 255, 255, 0.65)",
  fontSize: "0.875rem",
  lineHeight: 1.35,
};

const buttonStyle: CSSProperties = {
  position: "absolute",
  top: "1.5rem",
  right: "1.5rem",
  zIndex: 2,
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  gap: "0.35rem",
  background: "#ffffff",
  color: "#2d6a4f",
  border: "none",
  borderRadius: "20px",
  padding: "0.5rem 1.25rem",
  fontWeight: 600,
  cursor: "pointer",
  fontSize: "0.875rem",
};

export function RacesPageHero({ onAddRace }: RacesPageHeroProps) {
  return (
    <section style={heroShell} aria-labelledby="races-hero-title">
      <svg
        style={mountainsSvg}
        viewBox="0 0 1200 200"
        preserveAspectRatio="none"
        aria-hidden
      >
        <path
          fill="#0f1f0f"
          d="M0 200 L0 120 L180 40 L320 95 L480 25 L620 80 L780 15 L920 70 L1080 30 L1200 90 L1200 200 Z"
        />
        <path
          fill="#0f1f0f"
          d="M0 200 L0 150 L220 85 L400 130 L560 60 L720 110 L900 50 L1040 95 L1200 75 L1200 200 Z"
        />
      </svg>

      <div style={contentBlock}>
        <h1 id="races-hero-title" style={titleStyle}>
          <span aria-hidden>🏔️ </span>
          Mes courses
        </h1>
        <p style={subtitleStyle}>
          Prochain objectif, charge et récup : lecture rapide, comme un jalon en tête de tableau de bord.
        </p>
      </div>

      <button type="button" style={buttonStyle} onClick={onAddRace}>
        <Plus size={18} strokeWidth={2.25} aria-hidden />
        Nouvelle course
      </button>
    </section>
  );
}
