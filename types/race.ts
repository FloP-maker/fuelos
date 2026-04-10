/** Mémoire nutritionnelle — course complétée et enrichissement du profil. */

import type { PlannedIntake as LivePlannedIntake } from "@/types/race-session";

export type RaceSport = "trail" | "marathon" | "triathlon" | "cyclisme" | "autre";

export type RaceWeatherCondition =
  | "soleil"
  | "nuageux"
  | "pluie"
  | "chaleur"
  | "froid";

export type GISymptomType =
  | "nausées"
  | "crampes"
  | "ballonnements"
  | "vomissements"
  | "diarrhée"
  | "reflux"
  | "aucun";

export interface ProductItem {
  productId: string;
  name: string;
  quantity: number;
  takenAtKm: number;
}

export interface GISymptom {
  type: GISymptomType;
  severity: 1 | 2 | 3;
  kmMark: number;
  note: string;
}

export interface RaceEvent {
  id: string;
  userId: string;
  createdAt: Date;
  updatedAt: Date;

  name: string;
  sport: RaceSport;
  date: Date;
  distanceKm: number;
  elevationGainM: number;
  durationMin: number;
  weather: {
    tempC: number;
    humidity: number;
    conditions: RaceWeatherCondition;
  };

  plannedNutrition: {
    choPerHour: number;
    sodiumPerHour: number;
    fluidPerHour: number;
    totalProducts: ProductItem[];
  };

  actualNutrition: {
    choPerHour: number;
    sodiumPerHour: number;
    fluidPerHour: number;
    takenProducts: ProductItem[];
    missedIntakes: number;
    /** Renseigné au besoin pour l’insight « 2e moitié » (formulaire). */
    missedIntakesSecondHalf?: number;
  };

  giLog: {
    overallScore: 1 | 2 | 3 | 4 | 5;
    symptoms: GISymptom[];
    notes: string;
  };

  nutritionScore: number;
  insights: string[];

  /** Prises suivies en mode course (rapport Prévu vs Réel). */
  intakeTimeline?: LivePlannedIntake[];
}

/** Champs appris du terrain (pers. dans `AthleteProfile.raceMemory`). */
export interface AthleteRaceMemory {
  /** Moyenne glissante CHO/h réels (5 dernières courses). */
  avgChoTolerance?: number;
  /** Moyenne glissante sodium mg/h réels (5 dernières courses). */
  /** mg/h */
  avgSodiumNeed?: number;
  /** Fréquence par type de symptôme (sur les courses prises en compte). */
  giTendencies?: Partial<Record<GISymptomType, number>>;
  /** 0–1 : prises réelles / prises planifiées en moyenne. */
  avgIntakeComplianceRate?: number;
  /**
   * Par condition météo : moyenne du score nutritionnel ({@link RaceEvent.nutritionScore})
   * et nombre d’échantillons.
   */
  conditionPerformanceMap?: Partial<
    Record<
      RaceWeatherCondition,
      {
        count: number;
        avgNutritionScore: number;
      }
    >
  >;
}
