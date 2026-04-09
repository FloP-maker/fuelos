import type {
  AthleteProfile,
  ExperienceLevel,
  PrimaryDiscipline,
  SeasonGoal,
} from "@/app/lib/types";

function isRecord(v: unknown): v is Record<string, unknown> {
  return v !== null && typeof v === "object" && !Array.isArray(v);
}

function parseExperienceLevel(v: unknown): ExperienceLevel | undefined {
  if (v === "beginner" || v === "intermediate" || v === "advanced" || v === "elite") return v;
  return undefined;
}

function parsePrimaryDiscipline(v: unknown): PrimaryDiscipline | undefined {
  if (
    v === "trail" ||
    v === "road" ||
    v === "ultra" ||
    v === "triathlon" ||
    v === "cycling" ||
    v === "other"
  ) {
    return v;
  }
  return undefined;
}

function parseSeasonGoal(v: unknown): SeasonGoal | undefined {
  if (v === "finisher" || v === "performance" || v === "podium") return v;
  return undefined;
}

function parseOptionalPositiveNumber(v: unknown, max: number): number | undefined {
  const n = Number(v);
  if (!Number.isFinite(n) || n <= 0 || n > max) return undefined;
  return n;
}

const defaultPreferred = {
  gels: [] as string[],
  drinks: [] as string[],
  bars: [] as string[],
  realFood: [] as string[],
};

/** Profil par défaut (nouveau compte / brouillon). */
export function defaultAthleteProfile(): AthleteProfile {
  return {
    experienceLevel: "intermediate",
    primaryDiscipline: "trail",
    seasonGoal: "finisher",
    weight: 70,
    age: 35,
    gender: "M",
    sweatRate: 1.0,
    giTolerance: "normal",
    allergies: [],
    avoidProducts: [],
    preferredProducts: { ...defaultPreferred },
    tastePreferences: { sweetness: "medium", flavors: [] },
  };
}

/**
 * Fusionne un profil partiel (localStorage, migration) avec les défauts,
 * y compris les champs ajoutés après coup.
 */
export function mergeStoredAthleteProfile(stored: Partial<AthleteProfile> | null | undefined): AthleteProfile {
  const base = defaultAthleteProfile();
  if (!stored || typeof stored !== "object") return base;

  const ppIn = stored.preferredProducts;
  const preferredProducts = {
    gels: Array.isArray(ppIn?.gels) ? ppIn!.gels!.filter((x): x is string => typeof x === "string") : base.preferredProducts!.gels,
    drinks: Array.isArray(ppIn?.drinks)
      ? ppIn!.drinks!.filter((x): x is string => typeof x === "string")
      : base.preferredProducts!.drinks,
    bars: Array.isArray(ppIn?.bars) ? ppIn!.bars!.filter((x): x is string => typeof x === "string") : base.preferredProducts!.bars,
    realFood: Array.isArray(ppIn?.realFood)
      ? ppIn!.realFood!.filter((x): x is string => typeof x === "string")
      : base.preferredProducts!.realFood,
  };

  const tpIn = stored.tastePreferences;
  const sweetness =
    tpIn?.sweetness === "low" || tpIn?.sweetness === "medium" || tpIn?.sweetness === "high"
      ? tpIn.sweetness
      : base.tastePreferences!.sweetness;
  const flavors = Array.isArray(tpIn?.flavors)
    ? tpIn!.flavors.filter((x): x is string => typeof x === "string")
    : base.tastePreferences!.flavors;

  const weight =
    typeof stored.weight === "number" && Number.isFinite(stored.weight) ? stored.weight : base.weight;
  const age = typeof stored.age === "number" && Number.isFinite(stored.age) ? stored.age : base.age;
  const sweatRate =
    typeof stored.sweatRate === "number" && Number.isFinite(stored.sweatRate) ? stored.sweatRate : base.sweatRate;

  const gi =
    stored.giTolerance === "sensitive" || stored.giTolerance === "normal" || stored.giTolerance === "robust"
      ? stored.giTolerance
      : base.giTolerance;

  const allergies = Array.isArray(stored.allergies)
    ? stored.allergies.filter((x): x is string => typeof x === "string")
    : base.allergies;

  const avoidProducts = Array.isArray(stored.avoidProducts)
    ? stored.avoidProducts.filter((x): x is string => typeof x === "string")
    : base.avoidProducts;

  const ftpWatts = parseOptionalPositiveNumber(stored.ftpWatts, 650);
  const vo2maxMlMinKg = parseOptionalPositiveNumber(stored.vo2maxMlMinKg, 95);
  const sweatSodiumMgPerL = parseOptionalPositiveNumber(stored.sweatSodiumMgPerL, 4000);
  const raceWeightKg = parseOptionalPositiveNumber(stored.raceWeightKg, 250);
  const toleranceHistory =
    typeof stored.toleranceHistory === "string" ? stored.toleranceHistory.slice(0, 4000) : undefined;

  const out: AthleteProfile = {
    ...base,
    experienceLevel: parseExperienceLevel(stored.experienceLevel) ?? base.experienceLevel,
    primaryDiscipline: parsePrimaryDiscipline(stored.primaryDiscipline) ?? base.primaryDiscipline,
    seasonGoal: parseSeasonGoal(stored.seasonGoal) ?? base.seasonGoal,
    weight,
    age,
    gender: stored.gender === "F" ? "F" : stored.gender === "M" ? "M" : base.gender,
    sweatRate,
    giTolerance: gi,
    allergies,
    avoidProducts,
    preferredProducts,
    tastePreferences: { sweetness, flavors },
  };
  if (ftpWatts !== undefined) out.ftpWatts = ftpWatts;
  if (vo2maxMlMinKg !== undefined) out.vo2maxMlMinKg = vo2maxMlMinKg;
  if (sweatSodiumMgPerL !== undefined) out.sweatSodiumMgPerL = sweatSodiumMgPerL;
  if (raceWeightKg !== undefined) out.raceWeightKg = raceWeightKg;
  if (toleranceHistory !== undefined && toleranceHistory.length > 0) out.toleranceHistory = toleranceHistory;
  if (stored.profileGuidedOnboardingDone === true) out.profileGuidedOnboardingDone = true;
  return out;
}

/** Valide et normalise le JSON `data` d’un profil stocké (API / DB). */
export function athleteProfileFromJson(raw: unknown): AthleteProfile | null {
  if (!isRecord(raw)) return null;

  const weight = Number(raw.weight);
  const age = Number(raw.age);
  if (!Number.isFinite(weight) || weight < 25 || weight > 250) return null;
  if (!Number.isFinite(age) || age < 10 || age > 120) return null;

  if (raw.gender !== "M" && raw.gender !== "F") return null;

  const sweatRate = Number(raw.sweatRate);
  if (!Number.isFinite(sweatRate) || sweatRate < 0 || sweatRate > 6) return null;

  const gi = raw.giTolerance;
  if (gi !== "sensitive" && gi !== "normal" && gi !== "robust") return null;

  const allergies = Array.isArray(raw.allergies)
    ? raw.allergies.filter((x): x is string => typeof x === "string")
    : [];

  let preferredProducts: AthleteProfile["preferredProducts"];
  if (raw.preferredProducts !== undefined) {
    if (!isRecord(raw.preferredProducts)) return null;
    const pp = raw.preferredProducts;
    const gels = Array.isArray(pp.gels) ? pp.gels.filter((x): x is string => typeof x === "string") : [];
    const drinks = Array.isArray(pp.drinks) ? pp.drinks.filter((x): x is string => typeof x === "string") : [];
    const bars = Array.isArray(pp.bars) ? pp.bars.filter((x): x is string => typeof x === "string") : [];
    const realFood = Array.isArray(pp.realFood)
      ? pp.realFood.filter((x): x is string => typeof x === "string")
      : [];
    preferredProducts = { gels, drinks, bars, realFood };
  }

  let avoidProducts: string[] | undefined;
  if (raw.avoidProducts !== undefined) {
    if (!Array.isArray(raw.avoidProducts)) return null;
    avoidProducts = raw.avoidProducts.filter((x): x is string => typeof x === "string");
  }

  let tastePreferences: AthleteProfile["tastePreferences"];
  if (raw.tastePreferences !== undefined) {
    if (!isRecord(raw.tastePreferences)) return null;
    const tp = raw.tastePreferences;
    const sweetness = tp.sweetness;
    if (sweetness !== "low" && sweetness !== "medium" && sweetness !== "high") return null;
    const flavors = Array.isArray(tp.flavors)
      ? tp.flavors.filter((x): x is string => typeof x === "string")
      : [];
    tastePreferences = { sweetness, flavors };
  }

  const experienceLevel = parseExperienceLevel(raw.experienceLevel) ?? "intermediate";
  const primaryDiscipline = parsePrimaryDiscipline(raw.primaryDiscipline) ?? "trail";
  const seasonGoal = parseSeasonGoal(raw.seasonGoal) ?? "finisher";

  const out: AthleteProfile = {
    experienceLevel,
    primaryDiscipline,
    seasonGoal,
    weight,
    age,
    gender: raw.gender,
    sweatRate,
    giTolerance: gi,
    allergies,
  };
  if (preferredProducts) out.preferredProducts = preferredProducts;
  if (avoidProducts?.length) out.avoidProducts = avoidProducts;
  if (tastePreferences) out.tastePreferences = tastePreferences;

  const ftpWatts = parseOptionalPositiveNumber(raw.ftpWatts, 650);
  const vo2maxMlMinKg = parseOptionalPositiveNumber(raw.vo2maxMlMinKg, 95);
  const sweatSodiumMgPerL = parseOptionalPositiveNumber(raw.sweatSodiumMgPerL, 4000);
  const raceWeightKg = parseOptionalPositiveNumber(raw.raceWeightKg, 250);
  if (ftpWatts !== undefined) out.ftpWatts = ftpWatts;
  if (vo2maxMlMinKg !== undefined) out.vo2maxMlMinKg = vo2maxMlMinKg;
  if (sweatSodiumMgPerL !== undefined) out.sweatSodiumMgPerL = sweatSodiumMgPerL;
  if (raceWeightKg !== undefined) out.raceWeightKg = raceWeightKg;
  if (typeof raw.toleranceHistory === "string") {
    out.toleranceHistory = raw.toleranceHistory.slice(0, 4000);
  }
  if (raw.profileGuidedOnboardingDone === true) {
    out.profileGuidedOnboardingDone = true;
  }

  return out;
}
