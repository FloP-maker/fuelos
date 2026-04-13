"use client";

import { Plus } from "lucide-react";

export type RacesPageHeroProps = {
  onAddRace: () => void;
};

export function RacesPageHero({ onAddRace }: RacesPageHeroProps) {
  return (
    <section className="races-page-hero" aria-labelledby="races-hero-title">
      <svg viewBox="0 0 1200 200" preserveAspectRatio="none" aria-hidden>
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
            <h1 id="races-hero-title">Mes courses</h1>
          </div>
          <button type="button" className="races-page-hero__cta shrink-0" onClick={() => onAddRace()}>
            <Plus size={18} strokeWidth={2.25} aria-hidden />
            Nouvelle course
          </button>
        </div>
      </div>
    </section>
  );
}
