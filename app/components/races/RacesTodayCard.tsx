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
    <div
      className="races-today-card rounded-2xl bg-[color-mix(in_srgb,var(--color-bg-card)_92%,var(--color-bg-subtle))] px-4 py-4 dark:bg-[color-mix(in_srgb,var(--color-bg-card)_88%,var(--color-bg))]"
      aria-label="Aujourd’hui"
    >
      <div className="mb-3 flex items-center gap-2.5">
        <span className="races-today-card__live-dot" aria-hidden />
        <span className="races-section-eyebrow">Aujourd&apos;hui</span>
      </div>

      <div className="flex flex-row flex-wrap gap-3">
        {/* Course */}
        <div className="races-today-card__mic races-today-card__mic--1 flex min-h-[118px] min-w-[min(100%,220px)] flex-1 flex-col gap-2.5 border border-[rgba(220,38,38,0.22)] bg-[#fff1f0] dark:border-red-500/28 dark:bg-red-950/25">
          <div className="flex min-h-[22px] items-center justify-between gap-2">
            <div className="flex min-w-0 items-center gap-2">
              <Flag
                className="size-4 shrink-0 text-red-600/90 dark:text-red-400"
                strokeWidth={2.25}
                aria-hidden
              />
              <span className="text-[10px] font-bold uppercase tracking-[0.06em] text-red-900/80 dark:text-red-200/90">
                Course
              </span>
            </div>
            <span className="inline-flex min-h-[22px] shrink-0 items-center justify-end">
              {nextRace && courseBadgeLabel(nextRace) ? (
                <span className="rounded-md bg-red-600/10 px-1.5 py-0.5 text-[10px] font-semibold tabular-nums text-red-800/90 dark:bg-red-500/15 dark:text-red-200">
                  {courseBadgeLabel(nextRace)}
                </span>
              ) : null}
            </span>
          </div>
          <p className="text-[13px] font-semibold leading-relaxed text-[#1a1a1a] dark:text-[var(--color-text)]">
            {nextRace ? courseHeadline(nextRace) : "Aucune course planifiée"}
          </p>
        </div>

        {/* Nutrition */}
        <div className="races-today-card__mic races-today-card__mic--2 flex min-h-[118px] min-w-[min(100%,220px)] flex-1 flex-col gap-2.5 border border-[rgba(245,158,11,0.22)] bg-[#fffbeb] dark:border-amber-500/28 dark:bg-amber-950/20">
          <div className="flex min-h-[22px] items-center justify-between gap-2">
            <div className="flex min-w-0 items-center gap-2">
              <NutritionIcon
                className="size-4 shrink-0 text-amber-600/90 dark:text-amber-400"
                strokeWidth={2.25}
                aria-hidden
              />
              <span className="text-[10px] font-bold uppercase tracking-[0.06em] text-amber-900/80 dark:text-amber-200/90">
                Nutrition
              </span>
            </div>
            <span className="min-w-[2.5rem]" aria-hidden />
          </div>
          <p className="text-[13px] font-semibold leading-relaxed text-[#1a1a1a] dark:text-[var(--color-text)]">{nutritionLine}</p>
        </div>

        {/* Hydratation */}
        <div className="races-today-card__mic races-today-card__mic--3 flex min-h-[118px] min-w-[min(100%,220px)] flex-1 flex-col gap-2.5 border border-[rgba(59,130,246,0.22)] bg-[#eff6ff] dark:border-sky-500/28 dark:bg-sky-950/25">
          <div className="flex min-h-[22px] items-center justify-between gap-2">
            <div className="flex min-w-0 items-center gap-2">
              <Droplets
                className="size-4 shrink-0 text-sky-600/90 dark:text-sky-400"
                strokeWidth={2.25}
                aria-hidden
              />
              <span className="text-[10px] font-bold uppercase tracking-[0.06em] text-sky-900/80 dark:text-sky-200/90">
                Hydratation
              </span>
            </div>
            <span className="min-w-[2.5rem]" aria-hidden />
          </div>
          <p className="text-[13px] font-semibold leading-relaxed text-[#1a1a1a] dark:text-[var(--color-text)]">{action}</p>
        </div>
      </div>
    </div>
  );
}
