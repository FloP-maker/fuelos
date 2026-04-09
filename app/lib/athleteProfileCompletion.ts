import type { AthleteProfile } from "./types";

/** Score 0–100 pour motiver le remplissage (obligatoires + optionnels avancés). */
export function computeAthleteProfileCompletionPercent(p: AthleteProfile): number {
  let score = 0;

  if (p.experienceLevel) score += 10;
  if (p.primaryDiscipline) score += 8;
  if (p.seasonGoal) score += 8;

  if (Number.isFinite(p.weight) && p.weight >= 25 && p.weight <= 250) score += 10;
  if (Number.isFinite(p.age) && p.age >= 10 && p.age <= 120) score += 8;
  if (p.gender === "M" || p.gender === "F") score += 4;

  if (Number.isFinite(p.sweatRate) && p.sweatRate > 0) score += 10;
  if (p.giTolerance === "sensitive" || p.giTolerance === "normal" || p.giTolerance === "robust") score += 10;

  const ftp = p.ftpWatts;
  const vo2 = p.vo2maxMlMinKg;
  if ((Number.isFinite(ftp) && ftp! > 0) || (Number.isFinite(vo2) && vo2! > 0)) score += 8;
  if (Number.isFinite(p.sweatSodiumMgPerL) && p.sweatSodiumMgPerL! > 0) score += 8;
  if (typeof p.toleranceHistory === "string" && p.toleranceHistory.trim().length > 0) score += 6;
  if (Number.isFinite(p.raceWeightKg) && p.raceWeightKg! > 0) score += 6;

  const pp = p.preferredProducts;
  const prefCount =
    (pp?.gels?.length ?? 0) + (pp?.drinks?.length ?? 0) + (pp?.bars?.length ?? 0) + (pp?.realFood?.length ?? 0);
  if (prefCount > 0) score += 8;

  return Math.min(100, Math.round(score));
}
