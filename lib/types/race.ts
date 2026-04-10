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
