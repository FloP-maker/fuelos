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

/** Pourcentage de respect du plan (nutrition / hydratation exécutée vs prescrite). */
export type AdherencePct = 80 | 90 | 100;

export interface GlycogenPoint {
  timeMin: number;
  /** Glycogène musculaire modélisé restant (g). */
  glycogenG: number;
  /** 0–100 % des réserves initiales. */
  pctOfInitial: number;
}

export interface FuelScoreBreakdownItem {
  label: string;
  score: number;
  weight: number;
}

/** Fuel Score et glycogène pour un niveau d’exécution donné (80 / 90 / 100 % du plan). */
export interface FuelAdherenceScenario {
  adherencePct: AdherencePct;
  /** Facteur appliqué aux apports (CHO timeline, eau/h, Na⁺/h). */
  executionFactor: number;
  fuelScore: number;
  fuelScoreBreakdown: FuelScoreBreakdownItem[];
  glycogenEndG: number;
  glycogenEndPct: number;
  glycogenSeries: GlycogenPoint[];
}

export interface ScienceMetricsResult {
  /** Toujours 3 scénarios : 80 %, 90 %, 100 % de respect du plan. */
  fuelScenarios: FuelAdherenceScenario[];
  /** Raccourci : scénario 100 % (exécution complète du plan). */
  fuelScore: number;
  fuelScoreBreakdown: FuelScoreBreakdownItem[];
  glycogenInitialG: number;
  glycogenEndG: number;
  glycogenEndPct: number;
  glycogenSeries: GlycogenPoint[];
  energySplitChoPct: number;
  energySplitFatPct: number;
  relativeIntensity: number;
  /** Ratio eau/h du plan (100 %) vs besoin estimé. */
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
 * Intensité relative 0.32–1 (allure + dénivelé / km), alignée sur le modèle « science ».
 * À utiliser côté moteur de plan pour moduler les cibles CHO.
 */
export function computeRelativeIntensity(profile: AthleteProfile, event: EventDetails): number {
  return intensityContext(profile, event).relativeIntensity;
}

function intensityContext(profile: AthleteProfile, event: EventDetails) {
  const durationMin = Math.max(15, event.targetTime * 60);
  const speedKmh = event.distance / Math.max(0.1, event.targetTime);
  const elevPerKm = event.distance > 0 ? event.elevationGain / event.distance : 0;
  const elevBoost = clamp(elevPerKm / 80, 0, 0.22);
  const sportFactor =
    event.sport.toLowerCase().includes("cycl") || event.sport.toLowerCase().includes("vélo") ? 0.92 : 1;
  const refSpeed = 11;
  const relativeIntensity = clamp((speedKmh / refSpeed) * sportFactor + elevBoost, 0.32, 1);
  const initialGlycogenG = clamp(10 * profile.weight + 40, 320, 620);
  const baseOxGPerHour = profile.weight * (0.35 + 1.25 * relativeIntensity);
  return { durationMin, relativeIntensity, initialGlycogenG, baseOxGPerHour };
}

function simulateGlycogenSeries(
  plan: FuelPlan,
  durationMin: number,
  initialGlycogenG: number,
  baseOxGPerHour: number,
  choIntakeFactor: number
): { series: GlycogenPoint[]; endG: number; endPct: number } {
  const series: GlycogenPoint[] = [];
  let g = initialGlycogenG;

  for (let t0 = 0; t0 < durationMin; t0 += 15) {
    const t1 = t0 + 15;
    const cho15 = choIntakeInWindow(plan.timeline, t0, t1) * choIntakeFactor;
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
  return { series, endG, endPct };
}

/**
 * Sous-scores 0–1 : courbes assouplies pour rester pédagogiques sur des plans réels
 * (sans saturer à 0 dès qu’un seul indicateur est strict).
 */
function subscoresFromExecution(
  effectiveChoPerHour: number,
  hydrationRatio: number,
  glycogenEndPct: number,
  effectiveSodiumPerHour: number,
  naTarget: number
) {
  const choScore = clamp((effectiveChoPerHour - 18) / 57, 0, 1);
  const hydScore = clamp((hydrationRatio - 0.28) / 0.62, 0, 1);
  const glyScore = clamp((glycogenEndPct + 10) / 68, 0, 1);
  const naScore = clamp(effectiveSodiumPerHour / (naTarget * 1.32), 0, 1);
  return { choScore, hydScore, glyScore, naScore };
}

function weightedFuelScore(components: ReturnType<typeof subscoresFromExecution>): number {
  const weights = { cho: 0.34, hyd: 0.22, gly: 0.28, na: 0.16 };
  return Math.round(
    100 *
      (weights.cho * components.choScore +
        weights.hyd * components.hydScore +
        weights.gly * components.glyScore +
        weights.na * components.naScore)
  );
}

function breakdownFromComponents(components: ReturnType<typeof subscoresFromExecution>): FuelScoreBreakdownItem[] {
  const weights = { cho: 0.34, hyd: 0.22, gly: 0.28, na: 0.16 };
  return [
    { label: "Apport glucidique (CHO/h)", score: Math.round(100 * components.choScore), weight: weights.cho },
    { label: "Hydratation vs sueur estimée", score: Math.round(100 * components.hydScore), weight: weights.hyd },
    { label: "Glycogène résiduel modélisé", score: Math.round(100 * components.glyScore), weight: weights.gly },
    { label: "Sodium / contexte météo", score: Math.round(100 * components.naScore), weight: weights.na },
  ];
}

function scenarioForAdherence(
  adherencePct: AdherencePct,
  executionFactor: number,
  plan: FuelPlan,
  profile: AthleteProfile,
  event: EventDetails,
  ctx: ReturnType<typeof intensityContext>,
  sweatNeedMlPerH: number,
  naTarget: number
): FuelAdherenceScenario {
  const { series, endG, endPct } = simulateGlycogenSeries(
    plan,
    ctx.durationMin,
    ctx.initialGlycogenG,
    ctx.baseOxGPerHour,
    executionFactor
  );

  const choH = plan.choPerHour * executionFactor;
  const waterH = plan.waterPerHour * executionFactor;
  const naH = plan.sodiumPerHour * executionFactor;
  const hydrationRatio = waterH / sweatNeedMlPerH;

  const comp = subscoresFromExecution(choH, hydrationRatio, endPct, naH, naTarget);
  const fuelScore = clamp(weightedFuelScore(comp), 0, 100);

  return {
    adherencePct,
    executionFactor,
    fuelScore,
    fuelScoreBreakdown: breakdownFromComponents(comp),
    glycogenEndG: endG,
    glycogenEndPct: endPct,
    glycogenSeries: series,
  };
}

/**
 * Modèle éducatif simplifié (non clinique) : intensité relative, dépense glucidique,
 * épargne du glycogène par apports exogènes. Les ordres de grandeur s’inspirent de la
 * littérature endurance (oxydation CHO exogène, taux de glycogénolyse selon l’intensité).
 *
 * **Fuel Score** : trois valeurs selon que l’athlète exécute **80 %**, **90 %** ou **100 %**
 * des apports prescrits (glucides sur la timeline, eau/h, sodium/h).
 */
export function computeScienceMetrics(
  profile: AthleteProfile,
  event: EventDetails,
  plan: FuelPlan
): ScienceMetricsResult {
  const ctx = intensityContext(profile, event);
  const sweatNeedMlPerH = Math.max(400, profile.sweatRate * 1000);
  const hydrationAdequacyRatio = plan.waterPerHour / sweatNeedMlPerH;
  const naTarget = event.weather.includes("Chaud") || event.weather.includes("chaud") ? 700 : 450;

  const energySplitChoPct = Math.round(
    100 * clamp(0.38 + 0.5 * ctx.relativeIntensity, 0.38, 0.92)
  );
  const energySplitFatPct = 100 - energySplitChoPct;

  const fuelScenarios: FuelAdherenceScenario[] = [
    scenarioForAdherence(80, 0.8, plan, profile, event, ctx, sweatNeedMlPerH, naTarget),
    scenarioForAdherence(90, 0.9, plan, profile, event, ctx, sweatNeedMlPerH, naTarget),
    scenarioForAdherence(100, 1, plan, profile, event, ctx, sweatNeedMlPerH, naTarget),
  ];

  const full = fuelScenarios[2];

  return {
    fuelScenarios,
    fuelScore: full.fuelScore,
    fuelScoreBreakdown: full.fuelScoreBreakdown,
    glycogenInitialG: ctx.initialGlycogenG,
    glycogenEndG: full.glycogenEndG,
    glycogenEndPct: full.glycogenEndPct,
    glycogenSeries: full.glycogenSeries,
    energySplitChoPct,
    energySplitFatPct,
    relativeIntensity: ctx.relativeIntensity,
    hydrationAdequacyRatio,
  };
}

export function getFuelScenario(
  metrics: ScienceMetricsResult,
  pct: AdherencePct
): FuelAdherenceScenario {
  const s = metrics.fuelScenarios.find((x) => x.adherencePct === pct);
  return s ?? metrics.fuelScenarios[2];
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
