import type { RaceEvent } from "@/types/race";
import type { DropZone, NutritionPatterns, PlannedIntake } from "@/types/race-session";

function isMissedOrSkipped(i: PlannedIntake): boolean {
  return i.status === "skipped" || i.status === "pending";
}

function delayMinutes(i: PlannedIntake): number | null {
  if (i.status !== "taken" && i.status !== "modified" && i.status !== "delayed" && i.status !== "vomited") {
    return null;
  }
  const taken = i.actualIntake?.takenAtMin;
  if (taken == null) return null;
  return Math.max(0, taken - i.scheduledAtMin);
}

function bucketStartKm(km: number): number {
  return Math.floor(km / 10) * 10;
}

/**
 * Analyse multi-courses à partir des `intakeTimeline` présentes sur les {@link RaceEvent}.
 */
export function detectPatterns(races: RaceEvent[], minRaces: number = 3): NutritionPatterns | null {
  const withTimeline = races.filter((r) => (r.intakeTimeline?.length ?? 0) > 0);
  if (withTimeline.length < minRaces) return null;

  const dropZones = computeDropZones(withTimeline, minRaces);
  const worstIntakeType = computeWorstIntakeType(withTimeline);
  const avgDelayMin = computeAvgDelay(withTimeline);
  const vomitCorrelations = computeVomitCorrelations(withTimeline);
  const bestConditions = computeBestConditions(races);

  return {
    dropZones,
    worstIntakeType,
    avgDelayMin,
    vomitCorrelations,
    bestConditions,
    lastUpdatedAt: new Date(),
  };
}

function computeDropZones(races: RaceEvent[], minRaces: number): DropZone[] {
  /** bucket -> list of per-race skip rate (0–1) for intakes in bucket */
  const bucketRates = new Map<number, number[]>();

  for (const race of races) {
    const intakes = race.intakeTimeline ?? [];
    if (intakes.length === 0) continue;
    const byBucket = new Map<number, { total: number; bad: number }>();
    for (const i of intakes) {
      const b = bucketStartKm(i.scheduledAtKm);
      const cur = byBucket.get(b) ?? { total: 0, bad: 0 };
      cur.total += 1;
      if (isMissedOrSkipped(i)) cur.bad += 1;
      byBucket.set(b, cur);
    }
    for (const [b, { total, bad }] of byBucket) {
      if (total <= 0) continue;
      const rate = bad / total;
      const list = bucketRates.get(b) ?? [];
      list.push(rate);
      bucketRates.set(b, list);
    }
  }

  const out: DropZone[] = [];
  const halfDistances = races.map((r) => r.distanceKm / 2);

  for (const [kmStart, rates] of bucketRates) {
    const badRaces = rates.filter((r) => r > 0.4).length;
    if (badRaces < minRaces) continue;
    const skipRatePercent = (rates.reduce((a, x) => a + x, 0) / rates.length) * 100;

    const avgHalf = halfDistances.reduce((a, x) => a + x, 0) / halfDistances.length;
    const likelyInSecondHalf = kmStart >= avgHalf * 0.85;

    const giLow = races.filter((r) => (r.intakeTimeline?.length ?? 0) > 0 && r.giLog.overallScore < 3);
    const likelyGi = giLow.length >= minRaces;

    let likelyCause = "terrain";
    if (likelyInSecondHalf) likelyCause = "fatigue";
    if (likelyGi) likelyCause = "problèmes gastro-intestinaux";

    out.push({
      kmStart,
      kmEnd: kmStart + 10,
      skipRatePercent: Math.round(skipRatePercent),
      occurrenceCount: badRaces,
      likelyCause,
    });
  }

  return out.sort((a, b) => b.skipRatePercent - a.skipRatePercent).slice(0, 6);
}

function computeWorstIntakeType(races: RaceEvent[]): string {
  const byType = new Map<string, { n: number; skip: number; giBad: number }>();
  for (const race of races) {
    for (const i of race.intakeTimeline ?? []) {
      const cur = byType.get(i.intakeType) ?? { n: 0, skip: 0, giBad: 0 };
      cur.n += 1;
      if (isMissedOrSkipped(i)) cur.skip += 1;
      const g = i.actualIntake?.giReaction;
      if (g === "moderate" || g === "severe") cur.giBad += 1;
      byType.set(i.intakeType, cur);
    }
  }
  let worst = "";
  let score = -1;
  for (const [type, { n, skip, giBad }] of byType) {
    if (n <= 0) continue;
    const s = skip / n + giBad / n;
    if (s > score) {
      score = s;
      worst = type;
    }
  }
  return worst;
}

function computeAvgDelay(races: RaceEvent[]): number {
  const vals: number[] = [];
  for (const race of races) {
    for (const i of race.intakeTimeline ?? []) {
      const d = delayMinutes(i);
      if (d != null) vals.push(d);
    }
  }
  if (vals.length === 0) return 0;
  return vals.reduce((a, b) => a + b, 0) / vals.length;
}

function computeVomitCorrelations(races: RaceEvent[]): string[] {
  const out: string[] = [];
  const barVomit = races.some((r) =>
    (r.intakeTimeline ?? []).some((i) => i.status === "vomited" && i.intakeType === "barre")
  );
  if (barVomit) {
    out.push("Vomissements associés à des barres énergétiques relevés sur plusieurs sorties.");
  }
  const gelVomit = races.some((r) =>
    (r.intakeTimeline ?? []).some((i) => i.status === "vomited" && i.intakeType === "gel")
  );
  if (gelVomit) {
    out.push("Tolérance fragile aux gels notée après prise.");
  }
  return out;
}

function computeBestConditions(races: RaceEvent[]): string {
  const byCond = new Map<string, { sum: number; n: number }>();
  for (const r of races) {
    const k = r.weather.conditions;
    const cur = byCond.get(k) ?? { sum: 0, n: 0 };
    cur.sum += r.nutritionScore;
    cur.n += 1;
    byCond.set(k, cur);
  }
  let best = "";
  let bestAvg = -1;
  for (const [cond, { sum, n }] of byCond) {
    if (n <= 0) continue;
    const avg = sum / n;
    if (avg > bestAvg) {
      bestAvg = avg;
      best = cond;
    }
  }
  return best || "—";
}

export function computeTemporalDriftInsight(races: RaceEvent[]): string | null {
  /** Trois phases de course (0–33%, 33–66%, 66–100%) : retard moyen. */
  const bucketDelay: number[][] = [[], [], []];
  for (const race of races) {
    const durH = race.durationMin / 60;
    for (const i of race.intakeTimeline ?? []) {
      const phase = i.scheduledAtMin / Math.max(durH, 1e-6) / 60;
      const b = phase < 0.33 ? 0 : phase < 0.66 ? 1 : 2;
      const d = delayMinutes(i);
      if (d != null) bucketDelay[b].push(d);
    }
  }
  const avg = bucketDelay.map((xs) => (xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : 0));
  if (avg[0] <= 2 && avg[2] >= 8) {
    return "Tu décroches de ton plan en 2ème partie de course (retards plus longs en fin d’effort).";
  }
  return null;
}

/**
 * Phrases actionnables à partir des agrégats {@link NutritionPatterns}.
 */
export function generatePatternInsights(
  patterns: NutritionPatterns,
  opts?: { raceCount?: number; raceIds?: string[]; races?: RaceEvent[] }
): string[] {
  void opts?.raceIds;
  const n = opts?.raceCount ?? 0;
  const sentences: string[] = [];

  const allRaces = opts?.races;
  const withT = allRaces?.filter((r) => (r.intakeTimeline?.length ?? 0) > 0) ?? [];
  if (withT.length >= 3) {
    const drift = computeTemporalDriftInsight(withT);
    if (drift) sentences.push(drift);
  }
  if (allRaces && allRaces.length >= 4) {
    const heat = heatNutritionGapInsight(allRaces);
    if (heat) sentences.push(heat);
  }

  for (const z of patterns.dropZones.slice(0, 2)) {
    sentences.push(
      `Sur tes courses analysées, beaucoup de prises sautées entre le km ${z.kmStart} et ${z.kmEnd} (≈${z.skipRatePercent}% de saut). Piste : ${z.likelyCause} — privilégier des formats liquides sur cette portion.`
    );
  }

  if (patterns.worstIntakeType && patterns.worstIntakeType !== "autre") {
    sentences.push(
      `Le type « ${patterns.worstIntakeType} » est souvent lié à des écarts ou inconforts — varier la texture (gel / boisson) peut aider.`
    );
  }

  if (patterns.avgDelayMin >= 4) {
    sentences.push(
      `Retard moyen de ${patterns.avgDelayMin.toFixed(1)} min sur les prises : programme des rappels un peu avant l’heure cible.`
    );
  }

  for (const v of patterns.vomitCorrelations) {
    sentences.push(v);
  }

  if (patterns.bestConditions && patterns.bestConditions !== "—") {
    sentences.push(
      `Tes scores nutritionnels sont les plus stables en conditions « ${patterns.bestConditions} » — calque tes repères sur ce profil de journée.`
    );
  }

  if (n >= 3) {
    sentences.push(`Analyse basée sur ${n} courses avec suivi détaillé des prises.`);
  }

  return sentences.slice(0, 8);
}

/** Variante heat — compare scores chaud vs tempéré. À combiner avec detectPatterns côté appelant. */
export function heatNutritionGapInsight(races: RaceEvent[]): string | null {
  const hot = races.filter((r) => r.weather.conditions === "chaleur" || r.weather.tempC > 25);
  const mild = races.filter((r) => r.weather.conditions !== "chaleur" && r.weather.tempC <= 25);
  if (hot.length < 2 || mild.length < 2) return null;
  const avgHot = hot.reduce((a, r) => a + r.nutritionScore, 0) / hot.length;
  const avgMild = mild.reduce((a, r) => a + r.nutritionScore, 0) / mild.length;
  if (avgMild - avgHot < 15) return null;
  return `Par temps chaud, ton score nutritionnel moyen est de ${Math.round(avgHot)}/100 contre ${Math.round(avgMild)}/100 en conditions plus douces. Augmente la part sodium d’environ 20% sur les sorties caniculaires.`;
}
