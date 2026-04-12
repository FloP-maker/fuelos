"use client";

import type { CSSProperties } from "react";
import { Plus } from "lucide-react";

export type RacesPageHeroProps = {
  onAddRace: () => void;
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

export function RacesPageHero({ onAddRace }: RacesPageHeroProps) {
  return (
    <section className="races-page-hero" aria-labelledby="races-hero-title">
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

      <div className="races-page-hero__inner">
        <div className="races-page-hero__left">
          <div className="races-page-hero__copy">
            <h1 id="races-hero-title" style={titleStyle}>
              <span aria-hidden>🏔️ </span>
              Mes courses
            </h1>
            <p style={subtitleStyle}>
              Prochain objectif, charge et récup : lecture rapide, comme un jalon en tête de tableau de bord.
            </p>
          </div>
        </div>

        <button
          type="button"
          className="races-page-hero__cta"
          onClick={onAddRace}
        >
          <Plus size={18} strokeWidth={2.25} aria-hidden />
          Nouvelle course
        </button>
      </div>
    </section>
  );
}
