import type { EventDetails, FuelPlan, TimelineItem } from "@/app/lib/types";
import type { ProductItem } from "@/types/race";
import type {
  ActualIntake,
  IntakeStatus,
  IntakeType,
  LiveStats,
  PlannedIntake,
  RaceSession,
} from "@/types/race-session";

const MISSED_GRACE_MIN = 15;
const DELAYED_THRESHOLD_MIN = 10;

function newIntakeId(): string {
  try {
    return globalThis.crypto?.randomUUID?.() ?? `pi_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
  } catch {
    return `pi_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
  }
}

function parseQuantityLabel(q: string): number {
  const m = /^(\d+(\.\d+)?)/.exec(String(q).trim());
  return m ? Number(m[1]) : 1;
}

export function timelineTypeToIntakeType(type: TimelineItem["type"]): IntakeType {
  switch (type) {
    case "gel":
      return "gel";
    case "bar":
      return "barre";
    case "drink":
      return "boisson";
    case "real-food":
      return "solide";
    case "chew":
      return "autre";
    default:
      return "autre";
  }
}

function scheduledKmForMinute(timeMin: number, event: EventDetails): number {
  const totalMin = Math.max(1, event.targetTime * 60);
  const dist = Math.max(0, event.distance);
  return (timeMin / totalMin) * dist;
}

export function productItemFromTimelineItem(item: TimelineItem, scheduledAtKm: number): ProductItem {
  return {
    productId: item.productId,
    name: item.product,
    quantity: parseQuantityLabel(item.quantity),
    takenAtKm: scheduledAtKm,
  };
}

/**
 * Construit les prises à partir du plan actif (mode course).
 */
export function buildPlannedIntakesFromPlan(
  plan: FuelPlan,
  event: EventDetails,
  raceEventId: string,
  userId: string
): PlannedIntake[] {
  void userId;
  const withIdx = plan.timeline.map((item, origIdx) => ({ item, origIdx }));
  const sorted = [...withIdx].sort((a, b) => a.item.timeMin - b.item.timeMin);

  return sorted.map(({ item, origIdx }) => {
    const scheduledAtKm = scheduledKmForMinute(item.timeMin, event);
    const product = productItemFromTimelineItem(item, scheduledAtKm);
    return {
      id: newIntakeId(),
      raceEventId: raceEventId || "local",
      scheduledAtMin: item.timeMin,
      scheduledAtKm,
      product,
      choG: Math.max(0, item.cho),
      sodiumMg: Math.max(0, item.sodium ?? 0),
      fluidMl: Math.max(0, item.water ?? 0),
      intakeType: timelineTypeToIntakeType(item.type),
      status: "pending" as const,
      actualIntake: null,
      timelineIndex: origIdx,
    };
  });
}

export function isAssimilated(status: IntakeStatus): boolean {
  return status === "taken" || status === "modified" || status === "delayed";
}

function choAssimilatedFromIntake(i: PlannedIntake): number {
  if (i.status === "vomited" || i.status === "skipped") return 0;
  if (!isAssimilated(i.status)) return 0;
  if (i.actualIntake) return Math.max(0, i.actualIntake.choG);
  return Math.max(0, i.choG);
}

function sodiumAssimilatedFromIntake(i: PlannedIntake): number {
  if (i.status === "vomited" || i.status === "skipped") return 0;
  if (!isAssimilated(i.status)) return 0;
  if (i.actualIntake) return Math.max(0, i.actualIntake.sodiumMg);
  return Math.max(0, i.sodiumMg);
}

function fluidAssimilatedFromIntake(i: PlannedIntake): number {
  if (i.status === "vomited" || i.status === "skipped") return 0;
  if (!isAssimilated(i.status)) return 0;
  if (i.actualIntake) return Math.max(0, i.actualIntake.fluidMl);
  return Math.max(0, i.fluidMl);
}

function takenAtMinForIntake(i: PlannedIntake): number | null {
  if (i.actualIntake) return i.actualIntake.takenAtMin;
  if (isAssimilated(i.status)) return i.scheduledAtMin;
  return null;
}

/**
 * Recalcule les stats live (fenêtre CHO/h = 60 min glissantes sur prises assimilées).
 */
export function recalculateLiveStats(session: RaceSession, opts?: { force?: boolean }): LiveStats {
  const nowMin = session.currentMin;
  const windowStart = Math.max(0, nowMin - 60);
  let choWindow = 0;
  for (const i of session.intakes) {
    const t = takenAtMinForIntake(i);
    if (t == null) continue;
    if (i.status === "vomited") continue;
    if (t < windowStart || t > nowMin) continue;
    choWindow += choAssimilatedFromIntake(i);
  }
  const choPerHourCurrent = nowMin >= 60 ? choWindow : choWindow / Math.max(nowMin / 60, 1 / 60);

  let choTotalG = 0;
  let sodiumTotalMg = 0;
  let fluidTotalMl = 0;
  let intakesTaken = 0;
  let intakesSkipped = 0;
  let intakesMissed = 0;

  for (const i of session.intakes) {
    choTotalG += choAssimilatedFromIntake(i);
    sodiumTotalMg += sodiumAssimilatedFromIntake(i);
    fluidTotalMl += fluidAssimilatedFromIntake(i);
    if (i.status === "taken" || i.status === "modified" || i.status === "delayed") intakesTaken += 1;
    if (i.status === "skipped") intakesSkipped += 1;
    if (
      i.status === "pending" &&
      nowMin > i.scheduledAtMin + MISSED_GRACE_MIN
    ) {
      intakesMissed += 1;
    }
  }

  const elapsedH = Math.max(nowMin / 60, 0);
  const plannedTotalCho = session.plannedChoPerHour * elapsedH;
  const deficitChoG = plannedTotalCho - choTotalG;

  void opts;
  return {
    choTotalG,
    choPerHourCurrent,
    sodiumTotalMg,
    fluidTotalMl,
    intakesTaken,
    intakesSkipped,
    intakesMissed,
    deficitChoG,
  };
}

function resolveStatusAfterAction(
  action: IntakeStatus,
  scheduledAtMin: number,
  takenAtMin: number
): IntakeStatus {
  if (action === "vomited") return "vomited";
  if (action === "skipped") return "skipped";
  if (action === "modified") return "modified";
  if (action === "taken") {
    if (takenAtMin - scheduledAtMin > DELAYED_THRESHOLD_MIN) return "delayed";
    return "taken";
  }
  return action;
}

export type ProcessIntakeActionInput = {
  intakeId: string;
  action: IntakeStatus;
  currentMin: number;
  currentKm: number;
  actualIntake?: Partial<ActualIntake> | null;
};

/**
 * Applique une action sur une prise et retourne la liste mise à jour.
 */
export function processIntakeAction(
  intakes: PlannedIntake[],
  input: ProcessIntakeActionInput
): PlannedIntake[] {
  return intakes.map((row) => {
    if (row.id !== input.intakeId) return row;
    const allowFromNonPending = input.action === "vomited" && (row.status === "taken" || row.status === "modified" || row.status === "delayed");
    if (row.status !== "pending" && !allowFromNonPending) return row;

    const takenAtMin = input.actualIntake?.takenAtMin ?? input.currentMin;
    const takenAtKm = input.actualIntake?.takenAtKm ?? input.currentKm;
    const nextStatus = resolveStatusAfterAction(input.action, row.scheduledAtMin, takenAtMin);

    const baseProduct = input.actualIntake?.product ?? row.product;
    const choG = input.actualIntake?.choG ?? row.choG;
    const sodiumMg = input.actualIntake?.sodiumMg ?? row.sodiumMg;
    const fluidMl = input.actualIntake?.fluidMl ?? row.fluidMl;
    const note = input.actualIntake?.note ?? "";
    const giReaction = input.actualIntake?.giReaction ?? "none";

    const actual: ActualIntake | null =
      nextStatus === "skipped"
        ? null
        : {
            takenAtMin,
            takenAtKm,
            product: { ...baseProduct },
            choG,
            sodiumMg,
            fluidMl,
            note,
            giReaction,
          };

    return {
      ...row,
      status: nextStatus,
      actualIntake: actual,
    };
  });
}

export function deficitAlertTriggered(liveStats: LiveStats, plannedChoPerHour: number): boolean {
  if (plannedChoPerHour <= 0) return false;
  return liveStats.deficitChoG > 20;
}

export function attachRecalculatedSession(session: RaceSession, forceStats: boolean): RaceSession {
  const now = Date.now();
  const shouldRecompute =
    forceStats || now - session.lastStatsComputeMs >= 10_000 || session.lastStatsComputeMs === 0;
  const liveStats = shouldRecompute
    ? recalculateLiveStats(session)
    : session.liveStats;
  return {
    ...session,
    liveStats,
    lastStatsComputeMs: shouldRecompute ? now : session.lastStatsComputeMs,
  };
}
