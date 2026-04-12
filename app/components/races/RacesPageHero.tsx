"use client";

import { Plus } from "lucide-react";

export type RacesPageHeroProps = {
  onAddRace: () => void;
};

export function RacesPageHero({ onAddRace }: RacesPageHeroProps) {
  return (
    <section
      className="relative h-[160px] overflow-hidden rounded-2xl border border-white/10 shadow-[0_20px_50px_-20px_rgba(0,0,0,0.45)] md:h-[200px]"
      aria-labelledby="races-hero-title"
      style={{
        background: "linear-gradient(135deg, #1a2e1a 0%, #2d4a2d 50%, #1a1a2e 100%)",
      }}
    >
      <svg
        className="pointer-events-none absolute inset-x-0 bottom-0 z-[1] h-[42%] w-full md:h-[38%]"
        viewBox="0 0 1200 200"
        preserveAspectRatio="none"
        aria-hidden
      >
        <path
          fill="#0f1f0f"
          fillOpacity={0.6}
          d="M0 200 L0 120 L180 40 L320 95 L480 25 L620 80 L780 15 L920 70 L1080 30 L1200 90 L1200 200 Z"
        />
        <path
          fill="#0f1f0f"
          fillOpacity={0.6}
          d="M0 200 L0 150 L220 85 L400 130 L560 60 L720 110 L900 50 L1040 95 L1200 75 L1200 200 Z"
        />
      </svg>

      <div className="pointer-events-none absolute inset-0 z-[2]">
        <div className="absolute bottom-5 left-4 max-w-[calc(100%-9rem)] sm:bottom-6 sm:left-7 md:left-9">
          <h1
            id="races-hero-title"
            className="text-2xl font-extrabold leading-tight tracking-tight text-white"
          >
            <span className="select-none" aria-hidden>
              🏔️{" "}
            </span>
            Mes courses
          </h1>
          <p className="mt-2 max-w-[400px] text-[0.9rem] leading-snug" style={{ color: "#a0b8a0" }}>
            Prochain objectif, charge et récup : lecture rapide, comme un jalon en tête de tableau de bord.
          </p>
        </div>
      </div>

      <button
        type="button"
        onClick={onAddRace}
        className="absolute right-[1.5rem] top-[1.5rem] z-[3] inline-flex h-10 max-h-10 shrink-0 items-center justify-center gap-1.5 rounded-full bg-emerald-950 px-4 text-sm font-semibold text-emerald-50 shadow-sm ring-1 ring-emerald-800/80 transition hover:bg-emerald-900 hover:ring-emerald-700/60"
      >
        <Plus className="size-4 shrink-0 opacity-95" strokeWidth={2.5} aria-hidden />
        Nouvelle course
      </button>
    </section>
  );
}
