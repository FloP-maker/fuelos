'use client';

import type { AthleteProfile, EventDetails, FuelPlan, RaceState } from './types';

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
