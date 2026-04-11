export type RaceStatus = "upcoming" | "active" | "completed" | "cancelled";

export interface RaceEntry {
  // Identité
  id: string; // "race_" + Date.now() + random suffix
  createdAt: string; // ISO string
  updatedAt: string; // ISO string

  // Infos saisies par l'utilisateur
  name: string; // obligatoire
  date: string; // "YYYY-MM-DD", obligatoire
  startTime?: string; // "HH:MM", optionnel
  sport: string; // "Trail" | "Route" | "Ultra" | "Triathlon" | "Vélo"
  distance: number; // km
  elevationGain?: number; // m D+, optionnel
  location?: string;
  websiteUrl?: string;
  notes?: string;

  /**
   * Charge nutritionnelle avant le jour J : du J−n au J−1 (inclus).
   * `undefined` → valeur par défaut (voir lib/raceNutritionBands). `0` → désactivé.
   */
  nutritionChargeDaysBefore?: number;
  /** Récupération après la course : du J+1 au J+n (inclus). `undefined` → défaut. `0` → désactivé. */
  nutritionRecoveryDaysAfter?: number;
  /** Texte court sur le bandeau « charge » (ex. « Charge CHO »). */
  nutritionChargeLabel?: string;
  /** Texte court sur le bandeau « récup ». */
  nutritionRecoveryLabel?: string;

  /** Phase / compte à rebours : dériver via `getRacePhase` (date + heure de départ + débrief), jamais persister. */

  // Plan lié
  planLinkedAt?: string;
  planSnapshot?: {
    fuelPlan: object;
    altFuelPlan?: object;
    altPlanLabel?: string;
    event: object;
    profile: object;
  };

  // Débrief lié
  debriefLinkedAt?: string;
  debriefSnapshot?: object;
}

export type RacePhase =
  | "far"
  | "prep"
  | "charge"
  | "race_day"
  | "past"
  | "done";
