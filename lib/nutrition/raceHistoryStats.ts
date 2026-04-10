import type { RaceEvent, RaceSport } from "@/types/race";

export type HistoryAggregate = {
  raceCount: number;
  avgNutritionScore: number;
  topProduct: { productId: string; name: string; units: number } | null;
  dominantSport: RaceSport | null;
};

export function aggregateRaceHistory(races: RaceEvent[]): HistoryAggregate {
  if (races.length === 0) {
    return {
      raceCount: 0,
      avgNutritionScore: 0,
      topProduct: null,
      dominantSport: null,
    };
  }

  const scoreSum = races.reduce((a, r) => a + r.nutritionScore, 0);
  const bySport = new Map<RaceSport, number>();
  const productUnits = new Map<string, { name: string; units: number }>();

  for (const r of races) {
    bySport.set(r.sport, (bySport.get(r.sport) ?? 0) + 1);
    for (const p of r.actualNutrition.takenProducts) {
      const cur = productUnits.get(p.productId) ?? { name: p.name, units: 0 };
      cur.units += Math.max(0, p.quantity);
      cur.name = p.name || cur.name;
      productUnits.set(p.productId, cur);
    }
  }

  let dominantSport: RaceSport | null = null;
  let domCount = 0;
  for (const [sp, c] of bySport) {
    if (c > domCount) {
      domCount = c;
      dominantSport = sp;
    }
  }

  let topProduct: HistoryAggregate["topProduct"] = null;
  for (const [productId, v] of productUnits) {
    if (!topProduct || v.units > topProduct.units) {
      topProduct = { productId, name: v.name, units: v.units };
    }
  }

  return {
    raceCount: races.length,
    avgNutritionScore: Math.round(scoreSum / races.length),
    topProduct,
    dominantSport,
  };
}
