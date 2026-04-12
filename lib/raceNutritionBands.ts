import type { RaceEntry } from "@/lib/types/race";

export const DEFAULT_NUTRITION_CHARGE_DAYS_BEFORE = 5;
export const DEFAULT_NUTRITION_RECOVERY_DAYS_AFTER = 4;

export type NutritionBandKind = "charge" | "recovery";

export type NutritionBand = {
  id: string;
  raceId: string;
  raceName: string;
  kind: NutritionBandKind;
  startKey: string;
  endKey: string;
  label: string;
  barClass: string;
};

export type CalendarCell = {
  key: string;
  day: number;
  inMonth: boolean;
};

function pad2(n: number): string {
  return String(n).padStart(2, "0");
}

export function dateKeyFromDate(d: Date): string {
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
}

/** Grille fixe 6×7 (lun → dim), avec jours du mois précédent / suivant. */
export function buildSixWeekGrid(year: number, monthIndex: number): CalendarCell[] {
  const first = new Date(year, monthIndex, 1);
  const startOffset = (first.getDay() + 6) % 7;
  const cursor = new Date(year, monthIndex, 1 - startOffset);
  const out: CalendarCell[] = [];
  for (let i = 0; i < 42; i++) {
    const key = dateKeyFromDate(cursor);
    const inMonth = cursor.getMonth() === monthIndex && cursor.getFullYear() === year;
    out.push({ key, day: cursor.getDate(), inMonth });
    cursor.setDate(cursor.getDate() + 1);
  }
  return out;
}

export function addDaysIso(iso: string, delta: number): string {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso.trim());
  if (!m) return iso;
  const dt = new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
  dt.setDate(dt.getDate() + delta);
  return dateKeyFromDate(dt);
}

/** Lundi (ISO semaine) de la semaine calendaire qui contient `d` (heure locale). */
export function isoMondayOfContainingWeek(d: Date): string {
  const dt = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  const dow = dt.getDay();
  const offset = dow === 0 ? -6 : 1 - dow;
  dt.setDate(dt.getDate() + offset);
  return dateKeyFromDate(dt);
}

const CHARGE_CLASS =
  "border border-[color-mix(in_srgb,var(--color-accent)_28%,transparent)] bg-[color-mix(in_srgb,var(--color-accent)_12%,var(--color-bg-elevated))] text-[var(--color-text)]";
const RECOVERY_CLASS =
  "border border-[var(--color-border-subtle)] bg-[color-mix(in_srgb,var(--color-text-muted)_8%,var(--color-bg-elevated))] text-[var(--color-text-muted)]";

/** Jours de charge effectifs (0 = désactivé). */
export function getEffectiveNutritionChargeDaysBefore(r: RaceEntry): number {
  const v = r.nutritionChargeDaysBefore;
  if (v === 0) return 0;
  if (v == null || !Number.isFinite(v)) return DEFAULT_NUTRITION_CHARGE_DAYS_BEFORE;
  return Math.min(21, Math.max(1, Math.floor(v)));
}

/** Jours de récup effectifs après J (0 = désactivé). */
export function getEffectiveNutritionRecoveryDaysAfter(r: RaceEntry): number {
  const v = r.nutritionRecoveryDaysAfter;
  if (v === 0) return 0;
  if (v == null || !Number.isFinite(v)) return DEFAULT_NUTRITION_RECOVERY_DAYS_AFTER;
  return Math.min(21, Math.max(1, Math.floor(v)));
}

function chargeDays(r: RaceEntry): number {
  return getEffectiveNutritionChargeDaysBefore(r);
}

function recoveryDays(r: RaceEntry): number {
  return getEffectiveNutritionRecoveryDaysAfter(r);
}

export type NutritionDayCellTint = "race" | "charge" | "recovery";

const TINT_PRIO: Record<NutritionDayCellTint, number> = {
  race: 3,
  charge: 2,
  recovery: 1,
};

/**
 * Teinte par jour pour le calendrier : jour J (prioritaire), charge J−n…J−1, récup J+1…J+n.
 * Fenêtres charge/récup ignorées si les jours effectifs sont 0 sur la fiche.
 */
export function nutritionDayTintsFromRaces(races: RaceEntry[]): Map<string, NutritionDayCellTint> {
  const out = new Map<string, NutritionDayCellTint>();
  const put = (key: string, tint: NutritionDayCellTint) => {
    const cur = out.get(key);
    if (!cur || TINT_PRIO[tint] > TINT_PRIO[cur]) out.set(key, tint);
  };
  for (const r of races) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(r.date)) continue;
    put(r.date, "race");
    const n = getEffectiveNutritionChargeDaysBefore(r);
    for (let i = -n; i <= -1; i++) {
      put(addDaysIso(r.date, i), "charge");
    }
    const m = getEffectiveNutritionRecoveryDaysAfter(r);
    for (let j = 1; j <= m; j++) {
      put(addDaysIso(r.date, j), "recovery");
    }
  }
  return out;
}

/** Différence en jours calendaires entre deux clés ISO `YYYY-MM-DD` (to − from). */
export function calendarDaysBetweenIso(fromKey: string, toKey: string): number {
  const a = /^(\d{4})-(\d{2})-(\d{2})$/.exec(fromKey.trim());
  const b = /^(\d{4})-(\d{2})-(\d{2})$/.exec(toKey.trim());
  if (!a || !b) return 0;
  const ta = Date.UTC(Number(a[1]), Number(a[2]) - 1, Number(a[3])) / 86_400_000;
  const tb = Date.UTC(Number(b[1]), Number(b[2]) - 1, Number(b[3])) / 86_400_000;
  return Math.round(tb - ta);
}

export type NutritionCalendarPhase = "preparation" | "charge" | "course" | "recovery";

/**
 * Phase nutritionnelle du jour (fenêtres charge J−n…J−1 et récup J+1…J+m).
 * Si la charge est désactivée (0), la phase « charge » n’existe pas.
 */
export function getNutritionCalendarPhase(
  r: RaceEntry,
  now: Date = new Date()
): NutritionCalendarPhase | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(r.date)) return null;
  const todayKey = dateKeyFromDate(now);
  const n = getEffectiveNutritionChargeDaysBefore(r);
  const m = getEffectiveNutritionRecoveryDaysAfter(r);

  const chargeStart = n > 0 ? addDaysIso(r.date, -n) : null;
  const chargeEnd = n > 0 ? addDaysIso(r.date, -1) : null;
  const recoveryStart = m > 0 ? addDaysIso(r.date, 1) : null;
  const recoveryEnd = m > 0 ? addDaysIso(r.date, m) : null;

  if (m > 0 && recoveryStart && recoveryEnd && todayKey >= recoveryStart && todayKey <= recoveryEnd) {
    return "recovery";
  }
  if (todayKey === r.date) {
    return "course";
  }
  if (n > 0 && chargeStart && chargeEnd && todayKey >= chargeStart && todayKey <= chargeEnd) {
    return "charge";
  }
  if (todayKey < r.date) {
    return "preparation";
  }
  return null;
}

/** Bandeaux charge (J−n…J−1) et récup (J+1…J+n) pour une course. */
export function nutritionBandsForRace(r: RaceEntry): NutritionBand[] {
  const out: NutritionBand[] = [];
  if (!/^\d{4}-\d{2}-\d{2}$/.test(r.date)) return out;

  const pre = chargeDays(r);
  if (pre > 0) {
    const startKey = addDaysIso(r.date, -pre);
    const endKey = addDaysIso(r.date, -1);
    if (startKey <= endKey) {
      out.push({
        id: `${r.id}-charge`,
        raceId: r.id,
        raceName: r.name,
        kind: "charge",
        startKey,
        endKey,
        label: (r.nutritionChargeLabel?.trim() || "Charge nutrition").slice(0, 28),
        barClass: CHARGE_CLASS,
      });
    }
  }

  const post = recoveryDays(r);
  if (post > 0) {
    const startKey = addDaysIso(r.date, 1);
    const endKey = addDaysIso(r.date, post);
    if (startKey <= endKey) {
      out.push({
        id: `${r.id}-recovery`,
        raceId: r.id,
        raceName: r.name,
        kind: "recovery",
        startKey,
        endKey,
        label: (r.nutritionRecoveryLabel?.trim() || "Récup post-course").slice(0, 28),
        barClass: RECOVERY_CLASS,
      });
    }
  }

  return out;
}

export function nutritionBandsFromRaces(races: RaceEntry[]): NutritionBand[] {
  const list: NutritionBand[] = [];
  for (const r of races) {
    list.push(...nutritionBandsForRace(r));
  }
  return list.sort((a, b) => {
    const c = a.startKey.localeCompare(b.startKey);
    if (c !== 0) return c;
    return a.id.localeCompare(b.id);
  });
}

export type PlacedBand = {
  band: NutritionBand;
  startCol: number;
  endCol: number;
  lane: number;
};

/** Place les bandeaux sur une ligne de 7 jours (clés ISO croissantes). */
export function layoutBandsInWeek(weekKeys: string[], bands: NutritionBand[]): PlacedBand[] {
  if (weekKeys.length !== 7) return [];
  const weekMin = weekKeys[0];
  const weekMax = weekKeys[6];

  type Raw = { band: NutritionBand; startCol: number; endCol: number };
  const raw: Raw[] = [];

  for (const band of bands) {
    if (band.endKey < weekMin || band.startKey > weekMax) continue;
    const startKey = band.startKey > weekMin ? band.startKey : weekMin;
    const endKey = band.endKey < weekMax ? band.endKey : weekMax;
    const startCol = weekKeys.indexOf(startKey);
    const endCol = weekKeys.indexOf(endKey);
    if (startCol < 0 || endCol < 0 || startCol > endCol) continue;
    raw.push({ band, startCol, endCol });
  }

  raw.sort((a, b) => a.startCol - b.startCol || a.endCol - b.endCol);

  const lanesEnd: number[] = [];
  const placed: PlacedBand[] = [];

  for (const r of raw) {
    let lane = 0;
    while (lane < lanesEnd.length) {
      if (r.startCol > lanesEnd[lane]) break;
      lane++;
    }
    if (lane === lanesEnd.length) lanesEnd.push(r.endCol);
    else lanesEnd[lane] = r.endCol;
    placed.push({ band: r.band, startCol: r.startCol, endCol: r.endCol, lane });
  }

  return placed;
}
