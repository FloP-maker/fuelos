import type { RaceEntry, RacePhase } from "@/lib/types/race";

const STORAGE_KEY = "fuelos_races";
const ACTIVE_PLAN_KEY = "fuelos_active_plan";

function randomSuffix(): string {
  try {
    return crypto.randomUUID().replace(/-/g, "").slice(0, 8);
  } catch {
    return Math.random().toString(36).slice(2, 10);
  }
}

function parseRaceDateParts(dateStr: string): [number, number, number] | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dateStr.trim());
  if (!m) return null;
  const y = Number(m[1]);
  const mo = Number(m[2]);
  const d = Number(m[3]);
  if (!Number.isFinite(y) || !Number.isFinite(mo) || !Number.isFinite(d)) return null;
  return [y, mo, d];
}

function raceEndOfDayMs(y: number, mo: number, d: number): number {
  return new Date(y, mo - 1, d, 23, 59, 59, 999).getTime();
}

/** Instant à partir duquel la course est considérée comme passée (jour J avec heure, ou fin du jour J sinon). */
function racePastThresholdMs(race: RaceEntry): number {
  const parts = parseRaceDateParts(race.date);
  if (!parts) return Date.now();
  const [y, mo, d] = parts;
  if (!race.startTime?.trim()) {
    return raceEndOfDayMs(y, mo, d);
  }
  const tm = /^(\d{2}):(\d{2})$/.exec(race.startTime.trim());
  if (!tm) {
    return raceEndOfDayMs(y, mo, d);
  }
  const hh = Number(tm[1]);
  const mm = Number(tm[2]);
  return new Date(y, mo - 1, d, hh, mm, 0, 0).getTime();
}

/** Différence en jours calendaires (locale) entre aujourd’hui et le jour de course. */
export function getDaysUntilRace(race: RaceEntry): number {
  const parts = parseRaceDateParts(race.date);
  if (!parts) return 0;
  const [y, mo, d] = parts;
  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const raceDayStart = new Date(y, mo - 1, d).getTime();
  return Math.round((raceDayStart - todayStart) / 86_400_000);
}

const MS_PER_DAY = 86_400_000;

/**
 * Progression 0 → 1 vers le jour J : temps écoulé entre l’ajout de la course (`createdAt`)
 * et la date de l’événement. Repli : fenêtre de 150 jours avant la course si `createdAt` est absent ou trop tardif.
 * Utilisé pour une barre type « milestone » (Strava / Garmin).
 */
export function getRaceApproachProgress(race: RaceEntry): number {
  const parts = parseRaceDateParts(race.date);
  if (!parts) return 0;
  const [y, mo, d] = parts;
  const endMs = new Date(y, mo - 1, d, 12, 0, 0, 0).getTime();
  const createdMs = Date.parse(race.createdAt);
  const fallbackStart = endMs - 150 * MS_PER_DAY;
  const startMs =
    Number.isFinite(createdMs) && createdMs < endMs ? createdMs : fallbackStart;
  const span = Math.max(MS_PER_DAY, endMs - startMs);
  const raw = (Date.now() - startMs) / span;
  return Math.max(0, Math.min(1, raw));
}

export function getRacePhase(race: RaceEntry): RacePhase {
  if (race.debriefSnapshot != null && typeof race.debriefSnapshot === "object") {
    return "done";
  }

  const days = getDaysUntilRace(race);
  const now = Date.now();
  const pastAt = racePastThresholdMs(race);

  if (days < 0 || (days === 0 && now > pastAt)) {
    return "past";
  }

  if (days === 0) {
    return "race_day";
  }

  if (days >= 31) {
    return "far";
  }
  if (days >= 8) {
    return "prep";
  }
  if (days >= 1) {
    return "charge";
  }

  return "race_day";
}

export function getRaceCountdownLabel(race: RaceEntry): string {
  const phase = getRacePhase(race);
  const d = getDaysUntilRace(race);

  if (phase === "done") {
    if (d >= 0) return "Terminée";
    const abs = Math.abs(d);
    return abs === 1 ? "Il y a 1 jour" : `Il y a ${abs} jours`;
  }

  if (phase === "past") {
    const abs = Math.abs(d);
    if (d === 0) return "Aujourd'hui";
    return abs === 1 ? "Il y a 1 jour" : `Il y a ${abs} jours`;
  }

  if (phase === "race_day") {
    return "Aujourd'hui 🏁";
  }

  if (d > 7) {
    return `Dans ${d} jours`;
  }
  if (d >= 1) {
    return `Dans ${d} jours ⚡`;
  }

  return "Aujourd'hui 🏁";
}

function sortByDateAsc(a: RaceEntry, b: RaceEntry): number {
  return a.date.localeCompare(b.date);
}

function sortByDateDesc(a: RaceEntry, b: RaceEntry): number {
  return b.date.localeCompare(a.date);
}

export function loadRaces(): RaceEntry[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    const races = parsed.filter((r): r is RaceEntry => r != null && typeof r === "object" && "id" in r && "date" in r);
    return [...races].sort(sortByDateAsc);
  } catch {
    return [];
  }
}

export function saveRaces(races: RaceEntry[]): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(races));
  } catch {
    /* ignore */
  }
}

export function addRace(race: Omit<RaceEntry, "id" | "createdAt" | "updatedAt">): RaceEntry {
  const now = new Date().toISOString();
  const entry: RaceEntry = {
    ...race,
    id: `race_${Date.now()}_${randomSuffix()}`,
    createdAt: now,
    updatedAt: now,
  };
  const next = [...loadRaces(), entry].sort(sortByDateAsc);
  saveRaces(next);
  return entry;
}

export function updateRace(id: string, patch: Partial<RaceEntry>): RaceEntry | null {
  const races = loadRaces();
  const i = races.findIndex((r) => r.id === id);
  if (i < 0) return null;
  const updated: RaceEntry = {
    ...races[i],
    ...patch,
    id: races[i].id,
    createdAt: races[i].createdAt,
    updatedAt: new Date().toISOString(),
  };
  const next = [...races.slice(0, i), updated, ...races.slice(i + 1)];
  saveRaces(next);
  return updated;
}

export function deleteRace(id: string): void {
  saveRaces(loadRaces().filter((r) => r.id !== id));
}

export function linkPlanToRace(raceId: string): RaceEntry | null {
  if (typeof window === "undefined") return null;
  let raw: string | null;
  try {
    raw = localStorage.getItem(ACTIVE_PLAN_KEY);
  } catch {
    raw = null;
  }
  if (!raw) return null;

  let bundle: unknown;
  try {
    bundle = JSON.parse(raw) as unknown;
  } catch {
    return null;
  }
  if (!bundle || typeof bundle !== "object") return null;
  const b = bundle as Record<string, unknown>;
  const fuelPlan = b.fuelPlan;
  const event = b.event;
  const profile = b.profile;
  if (!fuelPlan || typeof fuelPlan !== "object") return null;
  if (!event || typeof event !== "object") return null;
  if (!profile || typeof profile !== "object") return null;

  const planSnapshot: RaceEntry["planSnapshot"] = {
    fuelPlan: fuelPlan as object,
    event: event as object,
    profile: profile as object,
  };
  if (b.altFuelPlan != null && typeof b.altFuelPlan === "object") {
    planSnapshot.altFuelPlan = b.altFuelPlan as object;
  }
  if (typeof b.altPlanLabel === "string") {
    planSnapshot.altPlanLabel = b.altPlanLabel;
  }

  return updateRace(raceId, {
    planSnapshot,
    planLinkedAt: new Date().toISOString(),
  });
}

export function linkDebriefToRace(raceId: string, debrief: object): RaceEntry | null {
  return updateRace(raceId, {
    debriefSnapshot: debrief,
    debriefLinkedAt: new Date().toISOString(),
  });
}

export function partitionRacesByUpcoming(races: RaceEntry[]): {
  upcoming: RaceEntry[];
  past: RaceEntry[];
} {
  const today = new Date();
  const y = today.getFullYear();
  const m = String(today.getMonth() + 1).padStart(2, "0");
  const d = String(today.getDate()).padStart(2, "0");
  const todayStr = `${y}-${m}-${d}`;
  const upcoming = races.filter((r) => r.date >= todayStr).sort(sortByDateAsc);
  const past = races.filter((r) => r.date < todayStr).sort(sortByDateDesc);
  return { upcoming, past };
}

/** Regroupe les courses par jour (`YYYY-MM-DD`), triées par heure de départ puis nom. */
export function groupRacesByDate(races: RaceEntry[]): Map<string, RaceEntry[]> {
  const m = new Map<string, RaceEntry[]>();
  for (const r of races) {
    if (typeof r.date !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(r.date)) continue;
    const list = m.get(r.date);
    if (list) list.push(r);
    else m.set(r.date, [r]);
  }
  for (const list of m.values()) {
    list.sort((a, b) => {
      const ta = a.startTime ?? "";
      const tb = b.startTime ?? "";
      if (ta !== tb) return ta.localeCompare(tb);
      return a.name.localeCompare(b.name, "fr");
    });
  }
  return m;
}
