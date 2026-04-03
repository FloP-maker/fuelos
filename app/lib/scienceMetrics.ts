import type { AthleteProfile, EventDetails, FuelPlan, TimelineItem } from "./types";

/** ID de métrique affichée dans la Vue Science (navigation latérale). */
export type ScienceMetricId =
  | "fuel-score"
  | "glycogen-balance"
  | "glycogen-curve"
  | "energy-split"
  | "cho-rate"
  | "hydration"
  | "sodium";

export interface GlycogenPoint {
  timeMin: number;
  /** Glycogène musculaire modélisé restant (g). */
  glycogenG: number;
  /** 0–100 % des réserves initiales. */
  pctOfInitial: number;
}

export interface ScienceMetricsResult {
  fuelScore: number;
  fuelScoreBreakdown: { label: string; score: number; weight: number }[];
  glycogenInitialG: number;
  glycogenEndG: number;
  glycogenEndPct: number;
  glycogenSeries: GlycogenPoint[];
  energySplitChoPct: number;
  energySplitFatPct: number;
  relativeIntensity: number;
  hydrationAdequacyRatio: number;
}

function clamp(n: number, lo: number, hi: number): number {
  return Math.min(hi, Math.max(lo, n));
}

function choIntakeInWindow(items: TimelineItem[], t0: number, t1: number): number {
  return items
    .filter((it) => it.timeMin >= t0 && it.timeMin < t1)
    .reduce((s, it) => s + it.cho, 0);
}

/**
 * Modèle éducatif simplifié (non clinique) : intensité relative, dépense glucidique,
 * épargne du glycogène par apports exogènes. Les ordres de grandeur s’inspirent de la
 * littérature endurance (oxydation CHO exogène, taux de glycogénolyse selon l’intensité).
 */
export function computeScienceMetrics(
  profile: AthleteProfile,
  event: EventDetails,
  plan: FuelPlan
): ScienceMetricsResult {
  const durationMin = Math.max(15, event.targetTime * 60);
  const speedKmh = event.distance / Math.max(0.1, event.targetTime);
  const elevPerKm = event.distance > 0 ? event.elevationGain / event.distance : 0;
  const elevBoost = clamp(elevPerKm / 80, 0, 0.22);
  const sportFactor =
    event.sport.toLowerCase().includes("cycl") || event.sport.toLowerCase().includes("vélo")
      ? 0.92
      : 1;

  const refSpeed = 11;
  const relativeIntensity = clamp((speedKmh / refSpeed) * sportFactor + elevBoost, 0.32, 1);

  /** Réserves « utiles » modélisées (g), ordre de grandeur 8–12 g/kg masse chez l’entraîné. */
  const initialGlycogenG = clamp(10 * profile.weight + 40, 320, 620);

  /** g glycogène « brûlés » par heure sans apport (monte avec l’intensité). */
  const baseOxGPerHour = profile.weight * (0.35 + 1.25 * relativeIntensity);

  const series: GlycogenPoint[] = [];
  let g = initialGlycogenG;

  for (let t0 = 0; t0 < durationMin; t0 += 15) {
    const t1 = t0 + 15;
    const cho15 = choIntakeInWindow(plan.timeline, t0, t1);
    const baseBurn = (baseOxGPerHour / 4) * (g / initialGlycogenG) ** 0.35;
    const sparing = clamp((cho15 / 22) * 0.88, 0, 0.92);
    const net = baseBurn * (1 - sparing);
    g = Math.max(0, g - net);
    const lastT = Math.min(t1, durationMin);
    series.push({
      timeMin: lastT,
      glycogenG: g,
      pctOfInitial: initialGlycogenG > 0 ? (100 * g) / initialGlycogenG : 0,
    });
  }

  const endG = series[series.length - 1]?.glycogenG ?? g;
  const endPct = initialGlycogenG > 0 ? (100 * endG) / initialGlycogenG : 0;

  /** Part métabolique estimée (substrats oxydés), concept « crossover » simplifié. */
  const energySplitChoPct = Math.round(100 * clamp(0.38 + 0.5 * relativeIntensity, 0.38, 0.92));
  const energySplitFatPct = 100 - energySplitChoPct;

  const sweatNeedMlPerH = Math.max(400, profile.sweatRate * 1000);
  const hydrationAdequacyRatio = plan.waterPerHour / sweatNeedMlPerH;

  const choScore = clamp((plan.choPerHour - 35) / 55, 0, 1);
  const hydScore = clamp((hydrationAdequacyRatio - 0.55) / 0.45, 0, 1);
  const glycScore = clamp((endPct - 12) / 55, 0, 1);
  const naTarget = event.weather.includes("Chaud") || event.weather.includes("chaud") ? 700 : 450;
  const naScore = clamp(plan.sodiumPerHour / (naTarget * 1.48), 0, 1);

  const weights = { cho: 0.34, hyd: 0.22, gly: 0.28, na: 0.16 };
  const fuelScore = Math.round(
    100 *
      (weights.cho * choScore + weights.hyd * hydScore + weights.gly * glycScore + weights.na * naScore)
  );

  return {
    fuelScore: clamp(fuelScore, 0, 100),
    fuelScoreBreakdown: [
      { label: "Apport glucidique (CHO/h)", score: Math.round(100 * choScore), weight: weights.cho },
      { label: "Hydratation vs sueur estimée", score: Math.round(100 * hydScore), weight: weights.hyd },
      { label: "Glycogène résiduel modélisé", score: Math.round(100 * glycScore), weight: weights.gly },
      { label: "Sodium / contexte météo", score: Math.round(100 * naScore), weight: weights.na },
    ],
    glycogenInitialG: initialGlycogenG,
    glycogenEndG: endG,
    glycogenEndPct: endPct,
    glycogenSeries: series,
    energySplitChoPct,
    energySplitFatPct,
    relativeIntensity,
    hydrationAdequacyRatio,
  };
}

export const SCIENCE_SOURCES = {
  jeukendrupCHO:
    "Jeukendrup A.E. (2014). A step towards personalized sports nutrition: carbohydrate intake during exercise. Sports Medicine, 44(S1), S25–S33.",
  burkeGlycogen:
    "Burke L.M. et al. (2011). Carbohydrates for training and competition. Journal of Sports Sciences, 29(sup1), S17–S27.",
  acsmFluid:
    "Sawka M.N. et al. (2007). American College of Sports Medicine position stand: exercise and fluid replacement. Medicine & Science in Sports & Exercise, 39(2), 377–390.",
  vanLoonSubstrate:
    "van Loon L.J.C. et al. (2001). The effects of carbohydrate ingestion on substrate metabolism during prolonged exercise. Metabolism, 50(11), 1262–1270.",
} as const;
