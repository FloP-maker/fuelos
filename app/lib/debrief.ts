'use client';

import type { AthleteProfile, EventDetails, FuelPlan, RaceState, TimelineItem } from './types';

/** Snapshot du plan nutritionnel tel que stocké au moment du débrief (fuelos_active_plan ou plan courant). */
export type DebriefPlanSnapshot = {
  choPerHour: number;
  waterPerHour: number;
  sodiumPerHour: number;
  totalPlanCHO: number;
  timelineCount: number;
  sport?: string;
  distance?: number;
  targetTime?: number;
};

export type PlanFollowed = 'yes' | 'partial' | 'no';
export type EnergyLevel = 'good' | 'ok' | 'bad';

export type DebriefFeedback = {
  stomachScore: number | null;
  planFollowed: PlanFollowed | null;
  planDeviationReason: string;
  autoInsight: string;
};

export type StoredDebrief = {
  cloudId?: string;
  plan: FuelPlan | null;
  profile: AthleteProfile | null;
  event: EventDetails | null;
  raceState?: Partial<RaceState> | null;
  finishedAt?: string;
  savedAt?: string;
  feedback?: DebriefFeedback | null;
  energyLevel?: EnergyLevel | null;
  notes?: string;
  compliance?: number;
  planSnapshot?: DebriefPlanSnapshot | null;
  /** CHO réel estimé (g/h) : prises enregistrées ou approximation compliance × CHO planifié. */
  actualChoPerHour?: number | null;
};

export const DEFAULT_RACE_STATE: Pick<RaceState, 'consumedItems' | 'deviations' | 'elapsedMs'> = {
  consumedItems: [],
  deviations: [],
  elapsedMs: 0,
};

export const DEFAULT_DEBRIEF_FEEDBACK: DebriefFeedback = {
  stomachScore: null,
  planFollowed: null,
  planDeviationReason: '',
  autoInsight: '',
};

export function normalizeDebrief(input: StoredDebrief): StoredDebrief {
  const legacyFeedback = (input.feedback ?? {}) as DebriefFeedback & { note?: string };
  const normalized = {
    ...input,
    raceState: {
      ...DEFAULT_RACE_STATE,
      ...(input?.raceState ?? {}),
    },
    finishedAt: input?.finishedAt ?? input?.savedAt ?? new Date(0).toISOString(),
    feedback: {
      ...DEFAULT_DEBRIEF_FEEDBACK,
      ...legacyFeedback,
    },
    energyLevel: input?.energyLevel ?? null,
    notes: input?.notes ?? legacyFeedback.note ?? '',
  };
  return {
    ...normalized,
    compliance: normalized.compliance ?? computeCompliance(normalized),
  };
}

export function computeCompliance(debrief: StoredDebrief): number {
  const timelineLen = debrief.plan?.timeline?.length ?? 0;
  const consumed = debrief.raceState?.consumedItems?.length ?? 0;
  if (timelineLen <= 0) return 0;
  return Math.round((consumed / timelineLen) * 100);
}

export function buildDebriefPlanSnapshot(
  fuelPlan: FuelPlan,
  event: EventDetails | null | undefined
): DebriefPlanSnapshot {
  const timeline = fuelPlan.timeline ?? [];
  return {
    choPerHour: fuelPlan.choPerHour,
    waterPerHour: fuelPlan.waterPerHour,
    sodiumPerHour: fuelPlan.sodiumPerHour,
    totalPlanCHO: timeline.reduce((sum, t) => sum + (t.cho || 0), 0),
    timelineCount: timeline.length,
    sport: event?.sport,
    distance: event?.distance,
    targetTime: event?.targetTime,
  };
}

/**
 * Bundle tel que sérialisé dans localStorage["fuelos_active_plan"] (voir plan/page).
 */
export function activeFuelPlanFromStoredBundle(bundle: unknown): {
  fuelPlan: FuelPlan;
  event: EventDetails | null;
} | null {
  if (!bundle || typeof bundle !== 'object') return null;
  const b = bundle as {
    fuelPlan?: FuelPlan;
    altFuelPlan?: FuelPlan;
    racePlanVariant?: string;
    event?: EventDetails | null;
  };
  const plan =
    b.racePlanVariant === 'alt' && b.altFuelPlan != null ? b.altFuelPlan : b.fuelPlan;
  if (!plan || !Array.isArray(plan.timeline)) return null;
  return { fuelPlan: plan, event: b.event ?? null };
}

export function computeDebriefActualChoPerHour(args: {
  planSnapshot: DebriefPlanSnapshot | null | undefined;
  compliance: number;
  consumedItemIndices: number[];
  timeline: TimelineItem[] | undefined;
  elapsedMs: number;
}): number {
  const { planSnapshot, compliance, consumedItemIndices, timeline, elapsedMs } = args;
  const hours = elapsedMs / 3600000;
  if (consumedItemIndices.length > 0 && hours > 0) {
    const totalCho = consumedItemIndices.reduce((s, idx) => s + (timeline?.[idx]?.cho ?? 0), 0);
    return Math.round(totalCho / hours);
  }
  if (planSnapshot != null) {
    return Math.round(planSnapshot.choPerHour * (compliance / 100));
  }
  return 0;
}

export function computeChoPerHour(debrief: StoredDebrief): number {
  const elapsedMs = Math.max(1, debrief.raceState?.elapsedMs ?? 0);
  const elapsedHours = elapsedMs / 3600000;
  if (elapsedHours <= 0) return 0;
  const timeline = debrief.plan?.timeline ?? [];
  const consumedIds = new Set(debrief.raceState?.consumedItems ?? []);
  const cho = timeline.reduce((sum, item, index) => (consumedIds.has(index) ? sum + (item.cho ?? 0) : sum), 0);
  return Math.round(cho / elapsedHours);
}

export function isDebriefCompleted(debrief: StoredDebrief): boolean {
  return Boolean(
    debrief.feedback?.stomachScore &&
      debrief.feedback?.planFollowed &&
      debrief.energyLevel
  );
}

export function buildAutoInsight(debrief: StoredDebrief): string {
  const stomachScore = debrief.feedback?.stomachScore ?? 0;
  const planFollowed = debrief.feedback?.planFollowed;
  const compliance = debrief.compliance ?? computeCompliance(debrief);
  const energyLevel = debrief.energyLevel;
  const choPerHour = debrief.plan?.choPerHour ?? 0;

  if (stomachScore <= 2 && compliance >= 80) {
    return `Ton plan était bien suivi mais ton estomac a souffert. Envisage de réduire à ${Math.max(
      10,
      choPerHour - 10
    )}g CHO/h sur ta prochaine course.`;
  }
  if (stomachScore >= 4 && compliance >= 80) {
    return `Excellente tolérance digestive sur ce plan. Tu pourrais tester ${
      choPerHour + 5
    }g CHO/h sur ta prochaine sortie longue.`;
  }
  if (compliance < 60 && planFollowed === 'no') {
    return "Moins de 60% du plan suivi. Si c'est intentionnel, pense à ajuster le plan avant ta prochaine course pour qu'il corresponde mieux.";
  }
  if (energyLevel === 'bad' && compliance >= 70) {
    return 'Tu as bien mangé mais manqué d’énergie. Vérifie le timing : les prises étaient peut-être trop espacées en fin de course.';
  }
  return 'Débrief enregistré. Continue à documenter tes courses pour affiner ton profil nutritionnel.';
}

export function stomachEmoji(score: number | null): string {
  if (score === 1) return '🤢';
  if (score === 2) return '😣';
  if (score === 3) return '😐';
  if (score === 4) return '🙂';
  if (score === 5) return '😄';
  return '—';
}

export function insightTone(insight: string): 'good' | 'warn' {
  if (insight.includes('Excellente')) return 'good';
  return 'warn';
}
