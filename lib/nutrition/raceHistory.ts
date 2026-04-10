import type { AthleteProfile } from "@/app/lib/types";
import type {
  AthleteRaceMemory,
  GISymptomType,
  RaceEvent,
  RaceWeatherCondition,
} from "@/types/race";
import type {
  ActualIntake,
  IntakeStatus,
  IntakeType,
  PlannedIntake,
} from "@/types/race-session";

/** Sous-scores 0–100 (avant pondération affichée en %). */
export type NutritionScoreBreakdown = {
  choCompliance: number;
  intakeCompliance: number;
  giComfort: number;
  /** Score global 0–100 arrondi (identique à {@link scoreNutrition} pour le même événement). */
  total: number;
};

export function sumProductQuantities(products: { quantity: number }[]): number {
  return products.reduce((a, p) => a + Math.max(0, p.quantity), 0);
}

function choDeviationScore(actual: number, planned: number): number {
  if (!Number.isFinite(actual) || !Number.isFinite(planned)) return 0;
  const base = planned > 1e-6 ? planned : actual;
  if (base < 1e-6) return 100;
  const pct = (Math.abs(actual - planned) / base) * 100;
  if (pct <= 10) return 100;
  if (pct <= 20) return 70;
  if (pct <= 30) return 40;
  return 10;
}

function intakeRatioScore(race: RaceEvent): number {
  const planned = sumProductQuantities(race.plannedNutrition.totalProducts);
  const taken = sumProductQuantities(race.actualNutrition.takenProducts);
  if (planned <= 0) {
    if (race.actualNutrition.missedIntakes <= 0) return 100;
    return Math.max(0, 100 - race.actualNutrition.missedIntakes * 10);
  }
  const ratio = Math.min(1.5, taken / planned);
  return Math.min(100, ratio * 100);
}

function giScoreFromRace(race: RaceEvent): number {
  const g = race.giLog.overallScore;
  if (g < 1 || g > 5) return 0;
  return (g / 5) * 100;
}

export function scoreNutritionBreakdown(race: RaceEvent): NutritionScoreBreakdown {
  const cho = choDeviationScore(
    race.actualNutrition.choPerHour,
    race.plannedNutrition.choPerHour
  );
  const intake = intakeRatioScore(race);
  const gi = giScoreFromRace(race);
  const total = Math.round(cho * 0.4 + intake * 0.3 + gi * 0.3);
  return {
    choCompliance: cho,
    intakeCompliance: intake,
    giComfort: gi,
    total,
  };
}

export function scoreNutrition(race: RaceEvent): number {
  return scoreNutritionBreakdown(race).total;
}

export function finalizeRaceEventScores(race: RaceEvent): RaceEvent {
  const nutritionScore = scoreNutrition(race);
  const insights = generateInsights({ ...race, nutritionScore });
  return {
    ...race,
    nutritionScore,
    insights,
  };
}

export function generateInsights(race: RaceEvent): string[] {
  const out: string[] = [];
  const halfMissed = race.actualNutrition.missedIntakesSecondHalf ?? 0;
  if (halfMissed > 3) {
    out.push("Tu as tendance à décrocher de ton plan après la mi-course.");
  }

  if (race.giLog.overallScore < 3 && race.actualNutrition.choPerHour > 80) {
    out.push(
      "Tes problèmes GI coïncident avec un apport glucidique élevé — essaie de viser vers 70 g/h."
    );
  }

  const plannedNa = race.plannedNutrition.sodiumPerHour;
  if (
    plannedNa > 1e-6 &&
    race.actualNutrition.sodiumPerHour < plannedNa * 0.8
  ) {
    out.push("Déficit sodium sur cette course — risque de crampes en prolongation.");
  }

  if (race.nutritionScore > 85) {
    out.push("Excellent respect du plan nutritionnel — utilise ce protocole comme référence.");
  }

  if (race.actualNutrition.missedIntakes > 3 && halfMissed <= 3) {
    out.push("Plusieurs prises prévues n’ont pas été effectuées — vérifie l’accessibilité des produits en course.");
  }

  if (out.length < 2) {
    if (race.nutritionScore >= 60 && race.nutritionScore <= 80) {
      out.push("Bon équilibre global : quelques ajustements fins peuvent encore gagner en confort.");
    } else if (race.nutritionScore < 60) {
      out.push("Marge de progression sur la régularité des apports et l’alignement avec le plan.");
    } else {
      out.push("Continue à croiser météo et ressenti GI pour affiner ton prochain protocole.");
    }
  }

  return out.slice(0, 4);
}

function mean(nums: number[]): number | undefined {
  if (nums.length === 0) return undefined;
  return nums.reduce((a, b) => a + b, 0) / nums.length;
}

export function lastNRaces(races: RaceEvent[], n: number): RaceEvent[] {
  return [...races]
    .filter((r) => r.date instanceof Date && !Number.isNaN(r.date.getTime()))
    .sort((a, b) => b.date.getTime() - a.date.getTime())
    .slice(0, n);
}

export function computeAthleteRaceMemory(
  races: RaceEvent[],
  window = 5
): AthleteRaceMemory {
  const slice = lastNRaces(races, window);

  const compliances = slice.map((r) => {
    const p = sumProductQuantities(r.plannedNutrition.totalProducts);
    const t = sumProductQuantities(r.actualNutrition.takenProducts);
    if (p <= 0) return undefined;
    return Math.min(1.5, t / p);
  });

  const complianceVals = compliances.filter((x): x is number => x !== undefined);

  return {
    avgChoTolerance: mean(slice.map((r) => r.actualNutrition.choPerHour)),
    avgSodiumNeed: mean(slice.map((r) => r.actualNutrition.sodiumPerHour)),
    giTendencies: buildGiTendencies(slice),
    avgIntakeComplianceRate:
      complianceVals.length > 0 ? mean(complianceVals) : undefined,
    conditionPerformanceMap: buildConditionMap(slice),
  };
}

export function mergeRaceMemoryIntoProfile(
  profile: AthleteProfile,
  races: RaceEvent[],
  window = 5
): AthleteProfile {
  const nextMemory = computeAthleteRaceMemory(races, window);
  return {
    ...profile,
    raceMemory: { ...profile.raceMemory, ...nextMemory },
  };
}

function buildGiTendencies(
  races: RaceEvent[]
): Partial<Record<GISymptomType, number>> | undefined {
  const counts: Partial<Record<GISymptomType, number>> = {};
  for (const r of races) {
    for (const s of r.giLog.symptoms) {
      if (s.type === "aucun") continue;
      counts[s.type] = (counts[s.type] ?? 0) + 1;
    }
  }
  return Object.keys(counts).length ? counts : undefined;
}

function buildConditionMap(
  races: RaceEvent[]
):
  | Partial<Record<RaceWeatherCondition, { count: number; avgNutritionScore: number }>>
  | undefined {
  const acc: Partial<
    Record<RaceWeatherCondition, { count: number; sum: number }>
  > = {};
  for (const r of races) {
    const k = r.weather.conditions;
    const cur = acc[k] ?? { count: 0, sum: 0 };
    cur.count += 1;
    cur.sum += r.nutritionScore;
    acc[k] = cur;
  }
  const out: Partial<
    Record<RaceWeatherCondition, { count: number; avgNutritionScore: number }>
  > = {};
  for (const k of Object.keys(acc) as RaceWeatherCondition[]) {
    const v = acc[k]!;
    out[k] = {
      count: v.count,
      avgNutritionScore: v.sum / v.count,
    };
  }
  return Object.keys(out).length ? out : undefined;
}

/**
 * Met à jour les agrégats `raceMemory` du profil à partir des N dernières courses (par défaut 5).
 * Fonction pure — la persistance reste côté API / client.
 */
export function updateAthleteProfile(
  userId: string,
  profile: AthleteProfile,
  race: RaceEvent,
  allRacesForUser: RaceEvent[],
  options?: { window?: number }
): AthleteProfile {
  void userId;
  const window = options?.window ?? 5;
  const withCurrent = allRacesForUser.some((x) => x.id === race.id)
    ? allRacesForUser
    : [...allRacesForUser, race];
  return mergeRaceMemoryIntoProfile(profile, withCurrent, window);
}

type JsonRace = Omit<RaceEvent, "createdAt" | "updatedAt" | "date"> & {
  createdAt: string;
  updatedAt: string;
  date: string;
};

export function raceEventToJson(race: RaceEvent): JsonRace {
  return {
    ...race,
    createdAt: race.createdAt.toISOString(),
    updatedAt: race.updatedAt.toISOString(),
    date: race.date.toISOString(),
  };
}

const SPORT_SET = new Set<RaceEvent["sport"]>([
  "trail",
  "marathon",
  "triathlon",
  "cyclisme",
  "autre",
]);

const WEATHER_SET = new Set<RaceEvent["weather"]["conditions"]>([
  "soleil",
  "nuageux",
  "pluie",
  "chaleur",
  "froid",
]);

const INTAKE_STATUS_SET = new Set<IntakeStatus>([
  "pending",
  "taken",
  "skipped",
  "modified",
  "vomited",
  "delayed",
]);

const INTAKE_TYPE_SET = new Set<IntakeType>([
  "gel",
  "barre",
  "boisson",
  "eau",
  "solide",
  "electrolyte",
  "autre",
]);

const GI_REACTION_SET = new Set<ActualIntake["giReaction"]>([
  "none",
  "mild",
  "moderate",
  "severe",
]);

function parseActualIntake(raw: unknown): ActualIntake | null {
  if (!raw || typeof raw !== "object") return null;
  const x = raw as Record<string, unknown>;
  const takenAtMin = Number(x.takenAtMin);
  const takenAtKm = Number(x.takenAtKm);
  const choG = Number(x.choG);
  const sodiumMg = Number(x.sodiumMg);
  const fluidMl = Number(x.fluidMl);
  const note = typeof x.note === "string" ? x.note : "";
  const giReaction = x.giReaction;
  const prod = x.product;
  if (!prod || typeof prod !== "object") return null;
  const p = prod as Record<string, unknown>;
  if (typeof p.productId !== "string" || typeof p.name !== "string") return null;
  const quantity = Number(p.quantity);
  const takenAtKmP = Number(p.takenAtKm);
  if (![takenAtMin, takenAtKm, choG, sodiumMg, fluidMl, quantity, takenAtKmP].every((n) => Number.isFinite(n))) {
    return null;
  }
  if (!GI_REACTION_SET.has(giReaction as ActualIntake["giReaction"])) return null;
  return {
    takenAtMin,
    takenAtKm,
    choG,
    sodiumMg,
    fluidMl,
    note,
    giReaction: giReaction as ActualIntake["giReaction"],
    product: {
      productId: p.productId,
      name: p.name,
      quantity,
      takenAtKm: takenAtKmP,
    },
  };
}

function parseIntakeTimeline(raw: unknown): PlannedIntake[] | undefined {
  if (!Array.isArray(raw)) return undefined;
  const out: PlannedIntake[] = [];
  for (const item of raw) {
    if (!item || typeof item !== "object") continue;
    const x = item as Record<string, unknown>;
    const id = x.id;
    const raceEventId = x.raceEventId;
    const scheduledAtMin = Number(x.scheduledAtMin);
    const scheduledAtKm = Number(x.scheduledAtKm);
    const choG = Number(x.choG);
    const sodiumMg = Number(x.sodiumMg);
    const fluidMl = Number(x.fluidMl);
    const status = x.status;
    const intakeType = x.intakeType;
    const product = x.product;
    if (typeof id !== "string" || typeof raceEventId !== "string") continue;
    if (!INTAKE_STATUS_SET.has(status as IntakeStatus)) continue;
    if (!INTAKE_TYPE_SET.has(intakeType as IntakeType)) continue;
    if (!product || typeof product !== "object") continue;
    const p = product as Record<string, unknown>;
    if (typeof p.productId !== "string" || typeof p.name !== "string") continue;
    const quantity = Number(p.quantity);
    const takenAtKmP = Number(p.takenAtKm);
    if (
      ![scheduledAtMin, scheduledAtKm, choG, sodiumMg, fluidMl, quantity, takenAtKmP].every((n) =>
        Number.isFinite(n)
      )
    ) {
      continue;
    }
    const actualRaw = x.actualIntake;
    const actualIntake =
      actualRaw === null || actualRaw === undefined ? null : parseActualIntake(actualRaw);
    if (actualRaw != null && actualIntake === null) continue;
    const timelineIndexRaw = x.timelineIndex;
    const timelineIndex =
      timelineIndexRaw === undefined ? undefined : Number(timelineIndexRaw);
    if (timelineIndex !== undefined && !Number.isFinite(timelineIndex)) continue;

    out.push({
      id,
      raceEventId,
      scheduledAtMin,
      scheduledAtKm,
      choG,
      sodiumMg,
      fluidMl,
      intakeType: intakeType as IntakeType,
      status: status as IntakeStatus,
      product: {
        productId: p.productId,
        name: p.name,
        quantity,
        takenAtKm: takenAtKmP,
      },
      actualIntake,
      ...(timelineIndex !== undefined ? { timelineIndex: Math.floor(timelineIndex) } : {}),
    });
  }
  return out.length > 0 ? out : undefined;
}

/**
 * Accepte un JSON client (dates en string ISO) et produit un {@link RaceEvent} normalisé.
 * Retourne null si la charge utile est incohérente.
 */
export function coerceRaceEventPayload(
  raw: unknown,
  opts: { userId: string; id: string }
): RaceEvent | null {
  if (!raw || typeof raw !== "object") return null;
  const o = raw as Record<string, unknown>;
  const merged = {
    ...o,
    id: opts.id,
    userId: opts.userId,
  };

  const base = raceEventFromJson(merged);
  if (!base) return null;
  if (!SPORT_SET.has(base.sport)) return null;
  if (!WEATHER_SET.has(base.weather.conditions)) return null;
  return finalizeRaceEventScores(base);
}

export function raceEventFromJson(raw: unknown): RaceEvent | null {
  if (!raw || typeof raw !== "object") return null;
  const o = raw as Record<string, unknown>;
  const id = o.id;
  const userId = o.userId;
  if (typeof id !== "string" || typeof userId !== "string") return null;

  const date = o.date;
  const createdAt = o.createdAt;
  const updatedAt = o.updatedAt;
  const d =
    typeof date === "string"
      ? new Date(date)
      : date instanceof Date
        ? date
        : null;
  const c =
    typeof createdAt === "string"
      ? new Date(createdAt)
      : createdAt instanceof Date
        ? createdAt
        : null;
  const u =
    typeof updatedAt === "string"
      ? new Date(updatedAt)
      : updatedAt instanceof Date
        ? updatedAt
        : null;
  if (!d || !c || !u) return null;

  const name = o.name;
  const sport = o.sport;
  if (typeof name !== "string" || typeof sport !== "string") return null;

  const distanceKm = Number(o.distanceKm);
  const elevationGainM = Number(o.elevationGainM);
  const durationMin = Number(o.durationMin);
  if (![distanceKm, elevationGainM, durationMin].every((n) => Number.isFinite(n) && n >= 0)) {
    return null;
  }

  const weather = o.weather;
  if (!weather || typeof weather !== "object") return null;
  const w = weather as Record<string, unknown>;
  const tempC = Number(w.tempC);
  const humidity = Number(w.humidity);
  const conditions = w.conditions;
  if (!Number.isFinite(tempC) || !Number.isFinite(humidity)) return null;
  if (typeof conditions !== "string") return null;

  const plannedNutrition = o.plannedNutrition;
  const actualNutrition = o.actualNutrition;
  const giLog = o.giLog;
  if (!plannedNutrition || typeof plannedNutrition !== "object") return null;
  if (!actualNutrition || typeof actualNutrition !== "object") return null;
  if (!giLog || typeof giLog !== "object") return null;

  const parseProducts = (v: unknown): RaceEvent["plannedNutrition"]["totalProducts"] => {
    if (!Array.isArray(v)) return [];
    return v
      .map((p) => {
        if (!p || typeof p !== "object") return null;
        const x = p as Record<string, unknown>;
        if (typeof x.productId !== "string" || typeof x.name !== "string") return null;
        const quantity = Number(x.quantity);
        const takenAtKm = Number(x.takenAtKm);
        if (!Number.isFinite(quantity) || !Number.isFinite(takenAtKm)) return null;
        return { productId: x.productId, name: x.name, quantity, takenAtKm };
      })
      .filter((x): x is NonNullable<typeof x> => x !== null);
  };

  const pn = plannedNutrition as Record<string, unknown>;
  const choP = Number(pn.choPerHour);
  const soP = Number(pn.sodiumPerHour);
  const flP = Number(pn.fluidPerHour);
  if (![choP, soP, flP].every((n) => Number.isFinite(n) && n >= 0)) return null;

  const an = actualNutrition as Record<string, unknown>;
  const choA = Number(an.choPerHour);
  const soA = Number(an.sodiumPerHour);
  const flA = Number(an.fluidPerHour);
  const missed = Number(an.missedIntakes);
  if (![choA, soA, flA].every((n) => Number.isFinite(n) && n >= 0)) return null;
  if (!Number.isFinite(missed) || missed < 0) return null;
  const missedSecond =
    an.missedIntakesSecondHalf === undefined
      ? undefined
      : Number(an.missedIntakesSecondHalf);
  if (
    missedSecond !== undefined &&
    (!Number.isFinite(missedSecond) || missedSecond < 0)
  ) {
    return null;
  }

  const g = giLog as Record<string, unknown>;
  const overallScore = Number(g.overallScore);
  const notes = typeof g.notes === "string" ? g.notes : "";
  if (!Number.isFinite(overallScore) || overallScore < 1 || overallScore > 5) return null;
  const symptomsRaw = g.symptoms;
  const symptoms: RaceEvent["giLog"]["symptoms"] = Array.isArray(symptomsRaw)
    ? symptomsRaw
        .map((s) => {
          if (!s || typeof s !== "object") return null;
          const z = s as Record<string, unknown>;
          const type = z.type;
          const severity = Number(z.severity);
          const kmMark = Number(z.kmMark);
          const note = typeof z.note === "string" ? z.note : "";
          if (typeof type !== "string") return null;
          if (severity !== 1 && severity !== 2 && severity !== 3) return null;
          if (!Number.isFinite(kmMark)) return null;
          return {
            type: type as RaceEvent["giLog"]["symptoms"][number]["type"],
            severity: severity as 1 | 2 | 3,
            kmMark,
            note,
          };
        })
        .filter((x): x is NonNullable<typeof x> => x !== null)
    : [];

  const nutritionScore = Number(o.nutritionScore);
  const insightsRaw = o.insights;
  const insights = Array.isArray(insightsRaw)
    ? insightsRaw.filter((x): x is string => typeof x === "string")
    : [];

  const intakeTimeline = parseIntakeTimeline(o.intakeTimeline);

  return {
    id,
    userId,
    createdAt: c,
    updatedAt: u,
    name,
    sport: sport as RaceEvent["sport"],
    date: d,
    distanceKm,
    elevationGainM,
    durationMin,
    weather: { tempC, humidity, conditions: conditions as RaceEvent["weather"]["conditions"] },
    plannedNutrition: {
      choPerHour: choP,
      sodiumPerHour: soP,
      fluidPerHour: flP,
      totalProducts: parseProducts(pn.totalProducts),
    },
    actualNutrition: {
      choPerHour: choA,
      sodiumPerHour: soA,
      fluidPerHour: flA,
      takenProducts: parseProducts(an.takenProducts),
      missedIntakes: missed,
      ...(missedSecond !== undefined ? { missedIntakesSecondHalf: missedSecond } : {}),
    },
    giLog: {
      overallScore: overallScore as 1 | 2 | 3 | 4 | 5,
      symptoms,
      notes,
    },
    nutritionScore: Number.isFinite(nutritionScore) ? Math.round(nutritionScore) : 0,
    insights,
    ...(intakeTimeline ? { intakeTimeline } : {}),
  };
}
