import type { AthleteProfile, ExperienceLevel, PrimaryDiscipline, SeasonGoal } from "@/app/lib/types";
import { defaultAthleteProfile, mergeStoredAthleteProfile } from "@/app/lib/athleteProfileData";
import { PRODUCTS } from "@/app/lib/products";

export const FUEL_OS_USER_PROFILE_KEY = "fuelos_user_profile_v1";

export type FuelOsMainSport = "trail" | "velo" | "triathlon" | "running";
export type FuelOsAthleticLevel = "debutant" | "intermediaire" | "elite";
export type FuelOsMainGoal = "performance" | "endurance" | "weight_loss" | "health";
export type FuelOsSex = "M" | "F" | "other";

export type FuelOsIntegrationId =
  | "strava"
  | "garmin"
  | "wahoo"
  | "apple_health"
  | "trainingpeaks";

export interface FuelOsUserProfile {
  version: 1;
  firstName: string;
  lastName: string;
  avatarDataUrl: string | null;
  mainSport: FuelOsMainSport;
  athleticLevel: FuelOsAthleticLevel;
  heightCm: number | null;
  weightKg: number | null;
  age: number | null;
  sex: FuelOsSex;
  sports: {
    trail: boolean;
    running: boolean;
    veloRoute: boolean;
    vtt: boolean;
    triathlon: boolean;
  };
  mainGoal: FuelOsMainGoal;
  ftpWatts: number | null;
  runnerVmaKmh: number | null;
  runnerThresholdPaceMinPerKm: number | null;
  sweatRateMlPerH: number | null;
  sodiumLossMgPerH: number | null;
  /** 0 = 100 % liquide, 100 = 100 % solide (préférence de forme). */
  digestiveLiquidSolidPct: number;
  dietVegetarian: boolean;
  dietVegan: boolean;
  dietGlutenFree: boolean;
  dietLactoseFree: boolean;
  dietNoCaffeine: boolean;
  allergenNotes: string;
  brandMaurten: boolean;
  brandSis: boolean;
  brandTailwind: boolean;
  brandNaak: boolean;
  brandOther: boolean;
  /** MVP : état fictif ou futur ; non utilisé pour OAuth. */
  integrationConnected: Partial<Record<FuelOsIntegrationId, boolean>>;
}

export function defaultFuelOsUserProfile(): FuelOsUserProfile {
  return {
    version: 1,
    firstName: "",
    lastName: "",
    avatarDataUrl: null,
    mainSport: "trail",
    athleticLevel: "intermediaire",
    heightCm: null,
    weightKg: null,
    age: null,
    sex: "M",
    sports: {
      trail: true,
      running: false,
      veloRoute: false,
      vtt: false,
      triathlon: false,
    },
    mainGoal: "endurance",
    ftpWatts: null,
    runnerVmaKmh: null,
    runnerThresholdPaceMinPerKm: null,
    sweatRateMlPerH: null,
    sodiumLossMgPerH: null,
    digestiveLiquidSolidPct: 35,
    dietVegetarian: false,
    dietVegan: false,
    dietGlutenFree: false,
    dietLactoseFree: false,
    dietNoCaffeine: false,
    allergenNotes: "",
    brandMaurten: false,
    brandSis: false,
    brandTailwind: false,
    brandNaak: false,
    brandOther: false,
    integrationConnected: {},
  };
}

function clamp(n: number, lo: number, hi: number): number {
  return Math.min(hi, Math.max(lo, n));
}

export function parseFuelOsUserProfile(raw: unknown): FuelOsUserProfile | null {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return null;
  const o = raw as Record<string, unknown>;
  if (o.version !== 1) return null;
  const base = defaultFuelOsUserProfile();
  const firstName = typeof o.firstName === "string" ? o.firstName.slice(0, 80) : base.firstName;
  const lastName = typeof o.lastName === "string" ? o.lastName.slice(0, 80) : base.lastName;
  const avatarDataUrl =
    typeof o.avatarDataUrl === "string" && o.avatarDataUrl.startsWith("data:image/")
      ? o.avatarDataUrl.slice(0, 1_200_000)
      : o.avatarDataUrl === null
        ? null
        : base.avatarDataUrl;
  const mainSport =
    o.mainSport === "trail" ||
    o.mainSport === "velo" ||
    o.mainSport === "triathlon" ||
    o.mainSport === "running"
      ? o.mainSport
      : base.mainSport;
  const athleticLevel =
    o.athleticLevel === "debutant" ||
    o.athleticLevel === "intermediaire" ||
    o.athleticLevel === "elite"
      ? o.athleticLevel
      : base.athleticLevel;
  const mainGoal =
    o.mainGoal === "performance" ||
    o.mainGoal === "endurance" ||
    o.mainGoal === "weight_loss" ||
    o.mainGoal === "health"
      ? o.mainGoal
      : base.mainGoal;
  const sex = o.sex === "F" || o.sex === "M" || o.sex === "other" ? o.sex : base.sex;
  const sportsIn = o.sports;
  const sports =
    sportsIn && typeof sportsIn === "object" && !Array.isArray(sportsIn)
      ? {
          trail: !!(sportsIn as Record<string, unknown>).trail,
          running: !!(sportsIn as Record<string, unknown>).running,
          veloRoute: !!(sportsIn as Record<string, unknown>).veloRoute,
          vtt: !!(sportsIn as Record<string, unknown>).vtt,
          triathlon: !!(sportsIn as Record<string, unknown>).triathlon,
        }
      : base.sports;
  const num = (v: unknown, max: number): number | null => {
    const n = Number(v);
    if (!Number.isFinite(n) || n <= 0 || n > max) return null;
    return n;
  };
  const integrationConnected: FuelOsUserProfile["integrationConnected"] = {};
  const ic = o.integrationConnected;
  if (ic && typeof ic === "object" && !Array.isArray(ic)) {
    const rec = ic as Record<string, unknown>;
    for (const k of [
      "strava",
      "garmin",
      "wahoo",
      "apple_health",
      "trainingpeaks",
    ] as FuelOsIntegrationId[]) {
      if (rec[k] === true) integrationConnected[k] = true;
    }
  }
  return {
    ...base,
    firstName,
    lastName,
    avatarDataUrl,
    mainSport,
    athleticLevel,
    mainGoal,
    sex,
    sports,
    heightCm: num(o.heightCm, 260),
    weightKg: num(o.weightKg, 250),
    age: num(o.age, 120),
    ftpWatts: num(o.ftpWatts, 650),
    runnerVmaKmh: num(o.runnerVmaKmh, 30),
    runnerThresholdPaceMinPerKm: num(o.runnerThresholdPaceMinPerKm, 20),
    sweatRateMlPerH: num(o.sweatRateMlPerH, 4000),
    sodiumLossMgPerH: num(o.sodiumLossMgPerH, 5000),
    digestiveLiquidSolidPct: clamp(
      Number(o.digestiveLiquidSolidPct) || base.digestiveLiquidSolidPct,
      0,
      100
    ),
    dietVegetarian: !!o.dietVegetarian,
    dietVegan: !!o.dietVegan,
    dietGlutenFree: !!o.dietGlutenFree,
    dietLactoseFree: !!o.dietLactoseFree,
    dietNoCaffeine: !!o.dietNoCaffeine,
    allergenNotes: typeof o.allergenNotes === "string" ? o.allergenNotes.slice(0, 2000) : base.allergenNotes,
    brandMaurten: !!o.brandMaurten,
    brandSis: !!o.brandSis,
    brandTailwind: !!o.brandTailwind,
    brandNaak: !!o.brandNaak,
    brandOther: !!o.brandOther,
    integrationConnected,
  };
}

function experienceFromLevel(l: FuelOsAthleticLevel): ExperienceLevel {
  if (l === "debutant") return "beginner";
  if (l === "intermediaire") return "intermediate";
  return "elite";
}

function disciplineFromMainSport(s: FuelOsMainSport): PrimaryDiscipline {
  if (s === "trail") return "trail";
  if (s === "velo") return "cycling";
  if (s === "triathlon") return "triathlon";
  return "road";
}

function seasonGoalFromMainGoal(g: FuelOsMainGoal): SeasonGoal {
  if (g === "performance") return "performance";
  if (g === "endurance") return "finisher";
  if (g === "weight_loss") return "finisher";
  return "finisher";
}

/** Préférence liquide/solide → tolérance GI catalogue (heuristique MVP). */
function giToleranceFromSlider(pctSolid: number): AthleteProfile["giTolerance"] {
  if (pctSolid <= 28) return "sensitive";
  if (pctSolid >= 72) return "robust";
  return "normal";
}

function collectPreferredGelIds(f: FuelOsUserProfile): string[] {
  const brands = new Set<string>();
  if (f.brandMaurten) brands.add("Maurten");
  if (f.brandSis) brands.add("Science in Sport");
  if (f.brandTailwind) brands.add("Tailwind");
  if (f.brandNaak) brands.add("Näak");
  if (brands.size === 0) return [];
  const ids: string[] = [];
  for (const p of PRODUCTS) {
    if (p.category !== "gel") continue;
    if (!brands.has(p.brand)) continue;
    ids.push(p.id);
    if (ids.length >= 16) break;
  }
  return ids;
}

function buildNutritionDietTags(f: FuelOsUserProfile): string[] | undefined {
  const tags: string[] = [];
  if (f.dietVegan) tags.push("vegan");
  if (f.dietGlutenFree) tags.push("gluten-free");
  if (tags.length === 0) return undefined;
  return tags;
}

function buildAllergies(f: FuelOsUserProfile): string[] {
  const set = new Set<string>();
  if (f.dietLactoseFree) set.add("lactose");
  const notes = f.allergenNotes
    .split(/[,;\n]+/)
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);
  for (const n of notes) set.add(n.slice(0, 48));
  return [...set];
}

export function mergeFuelOsIntoAthlete(
  f: FuelOsUserProfile,
  base: AthleteProfile
): AthleteProfile {
  const out: AthleteProfile = {
    ...base,
    experienceLevel: experienceFromLevel(f.athleticLevel),
    primaryDiscipline: disciplineFromMainSport(f.mainSport),
    seasonGoal: seasonGoalFromMainGoal(f.mainGoal),
    giTolerance: giToleranceFromSlider(f.digestiveLiquidSolidPct),
  };

  if (f.weightKg != null) out.weight = f.weightKg;
  if (f.age != null) out.age = Math.round(f.age);
  out.gender = f.sex === "F" ? "F" : "M";

  if (f.sweatRateMlPerH != null) {
    out.sweatRate = clamp(f.sweatRateMlPerH / 1000, 0.2, 4);
    if (f.sodiumLossMgPerH != null && out.sweatRate > 0) {
      const mgPerL = f.sodiumLossMgPerH / out.sweatRate;
      if (Number.isFinite(mgPerL) && mgPerL >= 200 && mgPerL <= 4500) {
        out.sweatSodiumMgPerL = Math.round(mgPerL);
      }
    }
  } else if (f.sodiumLossMgPerH != null && base.sweatRate > 0) {
    const mgPerL = f.sodiumLossMgPerH / base.sweatRate;
    if (Number.isFinite(mgPerL) && mgPerL >= 200 && mgPerL <= 4500) {
      out.sweatSodiumMgPerL = Math.round(mgPerL);
    }
  }

  if (f.ftpWatts != null) out.ftpWatts = Math.round(f.ftpWatts);
  else delete out.ftpWatts;
  if (f.runnerVmaKmh != null) out.runnerVmaKmh = Math.round(f.runnerVmaKmh * 10) / 10;
  else delete out.runnerVmaKmh;
  if (f.runnerThresholdPaceMinPerKm != null) {
    out.runnerThresholdPaceMinPerKm = Math.round(f.runnerThresholdPaceMinPerKm * 100) / 100;
  } else delete out.runnerThresholdPaceMinPerKm;

  const dietTags = buildNutritionDietTags(f);
  if (dietTags) out.nutritionDietTags = dietTags;
  else delete out.nutritionDietTags;

  if (f.dietNoCaffeine) out.preferCaffeineFree = true;
  else delete out.preferCaffeineFree;

  out.allergies = buildAllergies(f);

  const gels = collectPreferredGelIds(f);
  out.preferredProducts = {
    gels: gels.length > 0 ? gels : base.preferredProducts?.gels ?? [],
    drinks: base.preferredProducts?.drinks ?? [],
    bars: base.preferredProducts?.bars ?? [],
    realFood: base.preferredProducts?.realFood ?? [],
  };

  if (f.dietVegetarian && !f.dietVegan) {
    const h = out.toleranceHistory ? `${out.toleranceHistory}\n` : "";
    out.toleranceHistory = `${h}Préférence : végétarien (filtrage catalogue partiel en MVP).`.slice(0, 4000);
  }

  return out;
}

export function seedFuelOsFromAthlete(a: AthleteProfile): FuelOsUserProfile {
  const f = defaultFuelOsUserProfile();
  const level: FuelOsAthleticLevel =
    a.experienceLevel === "beginner"
      ? "debutant"
      : a.experienceLevel === "intermediate" || a.experienceLevel === "advanced"
        ? "intermediaire"
        : "elite";
  const mainSport: FuelOsMainSport =
    a.primaryDiscipline === "cycling"
      ? "velo"
      : a.primaryDiscipline === "triathlon"
        ? "triathlon"
        : a.primaryDiscipline === "trail" || a.primaryDiscipline === "ultra"
          ? "trail"
          : "running";
  const mainGoal: FuelOsMainGoal =
    a.seasonGoal === "performance"
      ? "performance"
      : a.seasonGoal === "podium"
        ? "performance"
        : "endurance";
  f.athleticLevel = level;
  f.mainSport = mainSport;
  f.mainGoal = mainGoal;
  f.weightKg = a.weight;
  f.age = a.age;
  f.sex = a.gender === "F" ? "F" : "M";
  f.sweatRateMlPerH = Math.round(a.sweatRate * 1000);
  if (a.sweatSodiumMgPerL != null && a.sweatRate > 0) {
    f.sodiumLossMgPerH = Math.round(a.sweatSodiumMgPerL * a.sweatRate);
  }
  f.ftpWatts = a.ftpWatts ?? null;
  f.runnerVmaKmh = a.runnerVmaKmh ?? null;
  f.runnerThresholdPaceMinPerKm = a.runnerThresholdPaceMinPerKm ?? null;
  if (a.giTolerance === "sensitive") f.digestiveLiquidSolidPct = 15;
  else if (a.giTolerance === "robust") f.digestiveLiquidSolidPct = 85;
  else f.digestiveLiquidSolidPct = 40;
  if (a.preferCaffeineFree) f.dietNoCaffeine = true;
  const tags = a.nutritionDietTags;
  if (tags?.includes("vegan")) f.dietVegan = true;
  if (tags?.includes("gluten-free")) f.dietGlutenFree = true;
  f.sports = {
    trail: mainSport === "trail",
    running: mainSport === "running",
    veloRoute: mainSport === "velo",
    vtt: false,
    triathlon: mainSport === "triathlon",
  };
  return f;
}

export function readFuelOsProfileFromStorage(): FuelOsUserProfile | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(FUEL_OS_USER_PROFILE_KEY);
    if (!raw) return null;
    return parseFuelOsUserProfile(JSON.parse(raw) as unknown);
  } catch {
    return null;
  }
}

export function writeFuelOsProfileToStorage(f: FuelOsUserProfile): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(FUEL_OS_USER_PROFILE_KEY, JSON.stringify(f));
  } catch {
    /* ignore */
  }
}

export function readAthleteProfileRaw(): AthleteProfile {
  if (typeof window === "undefined") return defaultAthleteProfile();
  try {
    const raw = window.localStorage.getItem("athlete-profile");
    if (!raw) return defaultAthleteProfile();
    return mergeStoredAthleteProfile(JSON.parse(raw) as Partial<AthleteProfile>);
  } catch {
    return defaultAthleteProfile();
  }
}

export function writeMergedAthleteToStorage(f: FuelOsUserProfile): void {
  if (typeof window === "undefined") return;
  const base = readAthleteProfileRaw();
  const merged = mergeFuelOsIntoAthlete(f, base);
  try {
    window.localStorage.setItem("athlete-profile", JSON.stringify(merged));
  } catch {
    /* ignore */
  }
}
