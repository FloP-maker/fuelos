import type { RaceEntry } from "@/lib/types/race";

export type RaceNutritionListStatus = "complete" | "partial" | "empty";

function readFuelPlanChoSodium(race: RaceEntry): {
  choPerHour: number | null;
  sodiumPerHour: number | null;
} {
  const raw = race.planSnapshot?.fuelPlan;
  if (!raw || typeof raw !== "object") {
    return { choPerHour: null, sodiumPerHour: null };
  }
  const o = raw as Record<string, unknown>;
  const cho = Number(o.choPerHour);
  const sodium = Number(o.sodiumPerHour);
  return {
    choPerHour: Number.isFinite(cho) && cho > 0 ? cho : null,
    sodiumPerHour: Number.isFinite(sodium) && sodium > 0 ? sodium : null,
  };
}

/**
 * Pastille liste « Mes courses » : distance (km) sur la fiche course, glucides et sodium cibles depuis le plan lié (`fuelPlan`).
 */
export function getRaceNutritionListStatus(race: RaceEntry): RaceNutritionListStatus {
  const hasDistance = typeof race.distance === "number" && race.distance > 0;
  const { choPerHour, sodiumPerHour } = readFuelPlanChoSodium(race);
  const filled = (hasDistance ? 1 : 0) + (choPerHour != null ? 1 : 0) + (sodiumPerHour != null ? 1 : 0);
  if (filled === 3) return "complete";
  if (filled === 0) return "empty";
  return "partial";
}
