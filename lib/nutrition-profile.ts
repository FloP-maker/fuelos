import type { StoredDebrief } from "@/app/lib/debrief";
import type { RaceEntry } from "@/lib/types/race";
import { getDaysUntilRace } from "@/lib/races";

/** Alias pour la signature demandée : mêmes champs que les débriefs stockés. */
export type Debrief = StoredDebrief;

export type InsightCard = {
  id: string;
  type: "warning" | "positive" | "suggestion";
  title: string;
  body: string;
  actionLabel?: string;
  actionHref?: string;
  generatedAt: string;
  basedOnDebriefs: number;
};

export type NextRaceReco = {
  raceId: string;
  raceName: string;
  daysUntil: number;
  message: string;
  actionLabel: string;
  actionHref: string;
};

export type LearnedNutritionProfile = {
  computedAt: string;
  debriefCount: number;
  avgPlanChoPerHour: number | null;
  avgActualChoPerHour: number | null;
  choComplianceRatio: number | null;
  choTrend: "under" | "on_target" | "over" | null;
  avgStomachScore: number | null;
  stomachScoreHistory: number[];
  stomachTrend: "improving" | "stable" | "declining" | null;
  caffeineCorrelation: "negative" | "neutral" | "positive" | null;
  avgEnergyScore: number | null;
  energyTrend: "improving" | "stable" | "declining" | null;
  mostUsedProducts: string[];
  problematicProducts: string[];
  insights: InsightCard[];
  nextRaceRecommendation: NextRaceReco | null;
};

function roundTo5(n: number): number {
  return Math.round(n / 5) * 5;
}

function mean(nums: number[]): number | null {
  if (nums.length === 0) return null;
  return nums.reduce((a, b) => a + b, 0) / nums.length;
}

function getPlanCho(d: StoredDebrief): number | null {
  const fromPlan = d.plan?.choPerHour;
  if (fromPlan != null && Number.isFinite(fromPlan)) return fromPlan;
  const fromSnap = d.planSnapshot?.choPerHour;
  if (fromSnap != null && Number.isFinite(fromSnap)) return fromSnap;
  return null;
}

function timelineOf(d: StoredDebrief) {
  return d.plan?.timeline ?? [];
}

function itemIsCaffeinated(item: { product?: string; alert?: string }): boolean {
  const alert = item.alert ?? "";
  const product = (item.product ?? "").toLowerCase();
  if (alert.includes("caféine") || alert.includes("cafeine")) return true;
  if (product.includes("caf")) return true;
  return false;
}

function debriefHasCaffeine(d: StoredDebrief): boolean {
  return timelineOf(d).some(itemIsCaffeinated);
}

function trendFromSeries(scores: number[]): "improving" | "stable" | "declining" | null {
  if (scores.length < 3) return null;
  const firstTwo = scores.slice(0, 2);
  const lastTwo = scores.slice(-2);
  const firstAvg = mean(firstTwo)!;
  const lastAvg = mean(lastTwo)!;
  if (lastAvg > firstAvg + 0.5) return "improving";
  if (lastAvg < firstAvg - 0.5) return "declining";
  return "stable";
}

function choTrendFromRatio(ratio: number | null): LearnedNutritionProfile["choTrend"] {
  if (ratio == null || !Number.isFinite(ratio)) return null;
  if (ratio < 0.75) return "under";
  if (ratio <= 0.95) return "on_target";
  return "over";
}

function insightTypeRank(t: InsightCard["type"]): number {
  if (t === "warning") return 0;
  if (t === "suggestion") return 1;
  return 2;
}

const STOMACH_EMOJI_CEIL = ["🤢", "🙁", "😐", "🙂", "😄"] as const;

export function stomachEmojiFromRoundedScore(score: number): string {
  const s = Math.min(5, Math.max(1, Math.round(score)));
  return STOMACH_EMOJI_CEIL[s - 1] ?? "😐";
}

export function computeNutritionProfile(debriefs: Debrief[], races: RaceEntry[]): LearnedNutritionProfile {
  const nowIso = new Date().toISOString();

  const validDebriefs = debriefs
    .filter(
      (d) =>
        d.feedback?.stomachScore != null &&
        getPlanCho(d) != null &&
        d.compliance != null &&
        Number.isFinite(d.compliance)
    )
    .sort((a, b) => {
      const ta = new Date(a.finishedAt ?? a.savedAt ?? 0).getTime();
      const tb = new Date(b.finishedAt ?? b.savedAt ?? 0).getTime();
      return ta - tb;
    });

  const debriefCount = validDebriefs.length;

  const planChos = validDebriefs.map((d) => getPlanCho(d)!).filter((x) => Number.isFinite(x));
  const actualChos = validDebriefs.map((d) => {
    const p = getPlanCho(d)!;
    return Math.round((p * (d.compliance ?? 0)) / 100);
  });

  const avgPlanChoPerHour = mean(planChos);
  const avgActualChoPerHour = mean(actualChos.map(Number));

  const choComplianceRatio =
    avgPlanChoPerHour != null && avgPlanChoPerHour > 0 && avgActualChoPerHour != null
      ? avgActualChoPerHour / avgPlanChoPerHour
      : null;

  const choTrend = choTrendFromRatio(choComplianceRatio);

  const stomachScores = validDebriefs.map((d) => d.feedback!.stomachScore!);
  const avgStomachScore = mean(stomachScores);
  const stomachScoreHistory = [...stomachScores];
  const stomachTrend = trendFromSeries(stomachScores);

  let caffeineCorrelation: LearnedNutritionProfile["caffeineCorrelation"] = null;
  if (validDebriefs.length >= 2) {
    const withCaf = validDebriefs.filter(debriefHasCaffeine);
    const sansCaf = validDebriefs.filter((d) => !debriefHasCaffeine(d));
    if (withCaf.length >= 1 && sansCaf.length >= 1) {
      const avgAvec = mean(withCaf.map((d) => d.feedback!.stomachScore!))!;
      const avgSans = mean(sansCaf.map((d) => d.feedback!.stomachScore!))!;
      if (avgAvec < avgSans - 0.5) caffeineCorrelation = "negative";
      else if (avgAvec > avgSans + 0.5) caffeineCorrelation = "positive";
      else caffeineCorrelation = "neutral";
    }
  }

  const energyMap = { good: 3, ok: 2, bad: 1 } as const;
  const energyScores: number[] = [];
  for (const d of validDebriefs) {
    if (d.energyLevel && d.energyLevel in energyMap) {
      energyScores.push(energyMap[d.energyLevel]);
    }
  }
  const avgEnergyScore = mean(energyScores);
  const energyTrend = trendFromSeries(energyScores);

  const productIdFreq = new Map<string, number>();
  for (const d of validDebriefs) {
    for (const item of timelineOf(d)) {
      const id = item.productId?.trim();
      if (!id) continue;
      productIdFreq.set(id, (productIdFreq.get(id) ?? 0) + 1);
    }
  }
  const sortedIds = [...productIdFreq.entries()].sort((a, b) => b[1] - a[1]);
  const mostUsedProducts = sortedIds.filter(([, c]) => c >= 2).map(([id]) => id).slice(0, 3);

  const badProductIds = new Set<string>();
  for (const d of validDebriefs) {
    if ((d.feedback?.stomachScore ?? 99) > 2) continue;
    for (const item of timelineOf(d)) {
      const id = item.productId?.trim();
      if (id) badProductIds.add(id);
    }
  }
  const mostSet = new Set(mostUsedProducts);
  const problematicProducts = [...badProductIds].filter((id) => mostSet.has(id));

  type Cand = { insight: InsightCard; ruleOrder: number };
  const candidates: Cand[] = [];
  const n = debriefCount;
  const avgPlan = avgPlanChoPerHour;
  const avgActual = avgActualChoPerHour;
  const avgStom = avgStomachScore;

  const pctUnder =
    choComplianceRatio != null && Number.isFinite(choComplianceRatio)
      ? Math.round((1 - choComplianceRatio) * 100)
      : 0;

  const avgCompliancePct = mean(validDebriefs.map((d) => d.compliance ?? 0));

  if (choComplianceRatio != null && choComplianceRatio < 0.7 && n >= 2 && avgPlan != null && avgActual != null) {
    const suggested = Math.max(10, roundTo5(avgActual));
    candidates.push({
      ruleOrder: 1,
      insight: {
        id: "cho_chronically_low",
        type: "warning",
        title: "CHO réel systématiquement bas",
        body: `Ton apport réel (~${Math.round(avgActual)}g/h) est ${pctUnder}% sous le plan (${Math.round(avgPlan)}g/h) en moyenne. Envisage de réduire ton plan à ${suggested}g/h pour qu'il reflète ta réalité terrain.`,
        actionLabel: "Ajuster mon plan →",
        actionHref: "/plan",
        generatedAt: nowIso,
        basedOnDebriefs: debriefCount,
      },
    });
  }

  if (
    choComplianceRatio != null &&
    choComplianceRatio >= 0.8 &&
    avgStom != null &&
    avgStom >= 3.5 &&
    n >= 2 &&
    avgPlan != null
  ) {
    const low = Math.min(90, roundTo5(avgPlan + 5));
    const high = Math.min(90, roundTo5(avgPlan + 10));
    candidates.push({
      ruleOrder: 2,
      insight: {
        id: "cho_on_target_upgrade",
        type: "positive",
        title: "Bonne tolérance — potentiel à exploiter",
        body: `Tu suis ton plan à ${Math.round(avgCompliancePct ?? 0)}% avec un estomac à ${avgStom.toFixed(1)}/5. Tu pourrais progressivement tester ${low} ou ${high}g CHO/h sur tes sorties longues d'entraînement.`,
        actionLabel: "Voir mon plan →",
        actionHref: "/plan?step=plan",
        generatedAt: nowIso,
        basedOnDebriefs: debriefCount,
      },
    });
  }

  if (caffeineCorrelation === "negative" && n >= 2) {
    const withCaf = validDebriefs.filter(debriefHasCaffeine);
    const sansCaf = validDebriefs.filter((d) => !debriefHasCaffeine(d));
    const scoreAvec = mean(withCaf.map((d) => d.feedback!.stomachScore!)) ?? 0;
    const scoreSans = mean(sansCaf.map((d) => d.feedback!.stomachScore!)) ?? 0;
    candidates.push({
      ruleOrder: 3,
      insight: {
        id: "caffeine_negative",
        type: "warning",
        title: "Caféine et estomac : corrélation à surveiller",
        body: `Avec produits caféinés, ton score estomac est en moyenne ${scoreAvec.toFixed(1)}/5, contre ${scoreSans.toFixed(1)}/5 sans caféine. Teste un plan sans caféine pour isoler la cause.`,
        actionLabel: "Filtrer le catalogue →",
        actionHref: "/produits",
        generatedAt: nowIso,
        basedOnDebriefs: debriefCount,
      },
    });
  }

  if (stomachTrend === "improving" && stomachScores.length > 0) {
    const firstScore = stomachScores[0];
    const lastScore = stomachScores[stomachScores.length - 1];
    candidates.push({
      ruleOrder: 4,
      insight: {
        id: "stomach_improving",
        type: "positive",
        title: "Ton intestin progresse 📈",
        body: `Ton score estomac est passé de ${firstScore}/5 à ${lastScore}/5 sur tes ${stomachScores.length} dernières courses. L'entraînement nutritionnel fonctionne.`,
        generatedAt: nowIso,
        basedOnDebriefs: debriefCount,
      },
    });
  }

  if (stomachTrend === "declining" && stomachScores.length > 0) {
    const firstScore = stomachScores[0];
    const lastScore = stomachScores[stomachScores.length - 1];
    candidates.push({
      ruleOrder: 5,
      insight: {
        id: "stomach_declining",
        type: "warning",
        title: "Inconforts digestifs récurrents",
        body: `Ton score estomac baisse (${firstScore}/5 → ${lastScore}/5). Vérifie la densité glucidique de tes produits ou réduis le CHO/h.`,
        actionLabel: "Voir mon profil →",
        actionHref: "/plan",
        generatedAt: nowIso,
        basedOnDebriefs: debriefCount,
      },
    });
  }

  if (avgEnergyScore != null && avgEnergyScore <= 1.5 && n >= 2) {
    candidates.push({
      ruleOrder: 6,
      insight: {
        id: "low_energy_pattern",
        type: "suggestion",
        title: "Fatigue récurrente en course",
        body: `Énergie basse sur ${n} courses. Si la compliance est correcte, vérifie le timing des prises : la première devrait être à T+20-30 min max.`,
        actionLabel: "Voir mon plan →",
        actionHref: "/plan?step=plan",
        generatedAt: nowIso,
        basedOnDebriefs: debriefCount,
      },
    });
  }

  if (n === 1) {
    candidates.push({
      ruleOrder: 7,
      insight: {
        id: "single_debrief_encourage",
        type: "suggestion",
        title: "1 course documentée — continue !",
        body: `Chaque débrief enrichit ton profil. À partir de 3 courses, FuelOS pourra identifier tes patterns nutritionnels personnels.`,
        generatedAt: nowIso,
        basedOnDebriefs: debriefCount,
      },
    });
  }

  candidates.sort((a, b) => {
    const dr = insightTypeRank(a.insight.type) - insightTypeRank(b.insight.type);
    if (dr !== 0) return dr;
    return a.ruleOrder - b.ruleOrder;
  });
  const insights = candidates.slice(0, 5).map((c) => c.insight);

  let nextRaceRecommendation: NextRaceReco | null = null;
  if (Array.isArray(races) && races.length > 0) {
    const inWindow = races
      .map((r) => ({ r, daysUntil: getDaysUntilRace(r) }))
      .filter(({ daysUntil }) => daysUntil >= 10 && daysUntil <= 60)
      .sort((a, b) => a.daysUntil - b.daysUntil);

    const pick = inWindow[0];
    if (pick) {
      const { r: race, daysUntil } = pick;
      const avgForTarget = avgPlanChoPerHour ?? null;
      const targetCHO = avgForTarget != null ? Math.min(avgForTarget + 5, 90) : 60;

      if (daysUntil >= 30 && daysUntil <= 60) {
        nextRaceRecommendation = {
          raceId: race.id,
          raceName: race.name,
          daysUntil,
          message: `Ta prochaine course (${race.name}) est dans ${daysUntil} jours. C'est le moment idéal pour entraîner ton intestin : vise ${Math.round(targetCHO)}g CHO/h sur tes 2-3 prochaines sorties longues.`,
          actionLabel: "Voir la fiche course",
          actionHref: `/races/${race.id}`,
        };
      } else if (daysUntil >= 10 && daysUntil <= 29) {
        nextRaceRecommendation = {
          raceId: race.id,
          raceName: race.name,
          daysUntil,
          message: `Il reste ${daysUntil} jours avant ${race.name}. Maintiens tes habitudes nutritionnelles d'entraînement et affine ton plan si besoin.`,
          actionLabel: "Voir la fiche course",
          actionHref: `/races/${race.id}`,
        };
      }
    }
  }

  return {
    computedAt: nowIso,
    debriefCount,
    avgPlanChoPerHour,
    avgActualChoPerHour,
    choComplianceRatio,
    choTrend,
    avgStomachScore,
    stomachScoreHistory,
    stomachTrend,
    caffeineCorrelation,
    avgEnergyScore,
    energyTrend,
    mostUsedProducts,
    problematicProducts,
    insights,
    nextRaceRecommendation,
  };
}
