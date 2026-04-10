/**
 * Types temps réel — mode course, rapport Prévu/Réel, patterns multi-courses.
 */

import type { ProductItem } from "@/types/race";

export type IntakeStatus =
  | "pending"
  | "taken"
  | "skipped"
  | "modified"
  | "vomited"
  | "delayed";

export type IntakeType =
  | "gel"
  | "barre"
  | "boisson"
  | "eau"
  | "solide"
  | "electrolyte"
  | "autre";

export type GiReaction = "none" | "mild" | "moderate" | "severe";

export interface ActualIntake {
  takenAtMin: number;
  takenAtKm: number;
  product: ProductItem;
  choG: number;
  sodiumMg: number;
  fluidMl: number;
  note: string;
  giReaction: GiReaction;
}

export interface PlannedIntake {
  id: string;
  raceEventId: string;
  scheduledAtMin: number;
  scheduledAtKm: number;
  product: ProductItem;
  choG: number;
  sodiumMg: number;
  fluidMl: number;
  intakeType: IntakeType;
  status: IntakeStatus;
  actualIntake: ActualIntake | null;
  /** Index FuelPlan.timeline — suivi avec l’UI mode course historique. */
  timelineIndex?: number;
}

export interface LiveStats {
  choTotalG: number;
  choPerHourCurrent: number;
  sodiumTotalMg: number;
  fluidTotalMl: number;
  intakesTaken: number;
  intakesSkipped: number;
  intakesMissed: number;
  deficitChoG: number;
}

export interface IntakeAction {
  intakeId: string;
  action: IntakeStatus;
  /** Snapshot sérialisé (peut être partiel avant normalisation serveur). */
  actualIntake?: Partial<ActualIntake>;
  timestamp: Date;
  synced: boolean;
}

export type RaceSessionClientStatus = "active" | "paused" | "finished";

export interface RaceSession {
  id: string;
  raceEventId: string;
  userId: string;
  startedAt: Date;
  status: RaceSessionClientStatus;
  currentKm: number;
  currentMin: number;
  intakes: PlannedIntake[];
  liveStats: LiveStats;
  offlineBuffer: IntakeAction[];
  /** CHO/h cible issu du plan (déficit cumulé). */
  plannedChoPerHour: number;
  /** Dernière mise à jour des stats lourdes (fenêtre 10s). */
  lastStatsComputeMs: number;
  networkOnline: boolean;
}

export interface DropZone {
  kmStart: number;
  kmEnd: number;
  skipRatePercent: number;
  occurrenceCount: number;
  likelyCause: string;
}

/** Agrégats appris sur plusieurs courses (`AthleteProfile.patterns`). */
export interface NutritionPatterns {
  dropZones: DropZone[];
  worstIntakeType: string;
  avgDelayMin: number;
  vomitCorrelations: string[];
  bestConditions: string;
  lastUpdatedAt: Date;
}

export type AthletePatterns = NutritionPatterns;
