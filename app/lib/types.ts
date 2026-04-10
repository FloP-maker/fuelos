import type { AthleteRaceMemory } from "@/types/race";

// ============ CORE TYPES ============

/** Pilote l’UX profil (guidé vs avancé) — stocké avec le profil. */
export type ExperienceLevel = "beginner" | "intermediate" | "advanced" | "elite";

/** Discipline principale — influence copy et futurs réglages moteur. */
export type PrimaryDiscipline = "trail" | "road" | "ultra" | "triathlon" | "cycling" | "other";

/** Ambition de saison — pour contextualiser le plan (logique future). */
export type SeasonGoal = "finisher" | "performance" | "podium";

export interface AthleteProfile {
  experienceLevel: ExperienceLevel;
  primaryDiscipline: PrimaryDiscipline;
  seasonGoal: SeasonGoal;

  weight: number;          // kg
  age: number;
  gender: "M" | "F";
  sweatRate: number;       // L/h
  giTolerance: "sensitive" | "normal" | "robust";
  allergies: string[];     // e.g. ["gluten", "dairy"]

  /** FTP estimé (W) — optionnel, profils expérimentés. */
  ftpWatts?: number;
  /** VO2max estimé (ml/min/kg) — optionnel. */
  vo2maxMlMinKg?: number;
  /** Sodium dans la sueur (mg/L), ex. test Precision Hydration. */
  sweatSodiumMgPerL?: number;
  /** Retours terrain (crampes, nausées…) — texte libre. */
  toleranceHistory?: string;
  /** Poids « jour de course » cible (kg), si différent du poids courant. */
  raceWeightKg?: number;

  /** Après l’assistant débutant 4 questions, affiche le formulaire profil complet. */
  profileGuidedOnboardingDone?: boolean;

  /** Insights agrégés (profil nutrition appris, sync cloud). */
  learnedInsights?: {
    id: string;
    type: "warning" | "positive" | "suggestion";
    title: string;
    body: string;
    actionLabel?: string;
    actionHref?: string;
    generatedAt: string;
    basedOnDebriefs: number;
  }[];
  
  // 🆕 NOUVELLES PROPRIÉTÉS - Préférences
  preferredProducts?: {
    gels?: string[];       // IDs de gels préférés
    drinks?: string[];     // IDs de boissons préférées
    bars?: string[];       // IDs de barres préférées
    realFood?: string[];   // IDs d'aliments solides préférés
  };
  avoidProducts?: string[]; // IDs de produits à éviter
  tastePreferences?: {
    sweetness: "low" | "medium" | "high";
    flavors: string[];     // ["citrus", "neutral", "fruity", "salty"]
  };

  /** Agrégats issus des courses sauvegardées (mémoire nutritionnelle). */
  raceMemory?: AthleteRaceMemory;

  /** Patterns multi-courses (détection après ≥3 courses avec suivi détaillé). */
  patterns?: import("@/types/race-session").NutritionPatterns;
}

/** Parcours issu d’un GPX (coords MapLibre / GeoJSON : [lng, lat]) */
export interface CourseGeometry {
  coordinates: [number, number][];
  elevationM: number[];
  cumulativeKm: number[];
}

export interface WeatherAutoMeta {
  tempC: number;
  humidityPct: number;
  fetchedAt: string;
}

/** Métadonnées si l’événement a été prérempli depuis une activité Strava. */
export interface StravaImportMeta {
  activityId: number;
  name: string;
  startDate: string;
  avgHr?: number;
  maxHr?: number;
}

export interface EventDetails {
  sport: string;
  distance: number;        // km
  elevationGain: number;   // m D+
  targetTime: number;      // hours
  weather: string;
  elevation: string;

  /** Préremplissage Strava (affichage + traçabilité). */
  stravaImport?: StravaImportMeta;
  
  // 🆕 NOUVELLES PROPRIÉTÉS - Ravitaillements
  aidStations?: AidStation[];  // Checkpoints avec ravitaillements

  /** Lieu (recherche Open-Meteo / affichage) */
  placeName?: string;
  latitude?: number;
  longitude?: number;
  /** Fuseau IANA du lieu (ex. Europe/Paris) — renvoyé par le géocodage */
  raceTimezone?: string;
  /** Valeur champ datetime-local (heure locale du parcours de préférence) */
  raceStartAt?: string;
  /** Humidité relative % (météo auto ou saisie) */
  weatherHumidityPct?: number;
  weatherAuto?: WeatherAutoMeta;
  courseGeometry?: CourseGeometry;
  /** Si true et qu’un GPX est chargé, décale les prises « perso » vers le créneau le plus favorable (plat/descente) dans la même heure. */
  adjustIntakesToCourse?: boolean;
}

// 🆕 NOUVEAU TYPE - Ravitaillement fixe
export interface AidStation {
  distanceKm: number;          // Position sur le parcours
  name?: string;               // "Ravito 1", "Col du Tourmalet", etc.
  availableProducts: string[]; // IDs des produits disponibles
  mandatory?: boolean;         // Si true, force l'utilisation de ces produits
  estimatedTimeMin?: number;   // Temps estimé d'arrivée (calculé automatiquement)
}

export interface TimelineItem {
  timeMin: number;         // minutes from start
  product: string;         // product name
  productId: string;
  quantity: string;        // "1 gel", "500ml", etc.
  type: "gel" | "drink" | "bar" | "chew" | "real-food";
  cho: number;             // g carbs
  water?: number;          // ml
  sodium?: number;         // mg
  alert?: string;          // optional note
  
  // 🆕 NOUVELLES PROPRIÉTÉS
  source?: "personal" | "aid-station"; // Origine du produit
  aidStationName?: string;             // Nom du ravito si applicable
  choTarget?: number;                  // Objectif CHO/h à ce moment (pour charge progressive)
  /** Renseigné à la génération pour total kcal fiable (produits custom / hors catalogue). */
  caloriesPerUnit?: number;
}

export interface ShoppingItem {
  productId: string;
  quantity: number;
  
  // 🆕 NOUVELLE PROPRIÉTÉ
  source?: "personal" | "aid-station"; // Pour distinguer ce qu'il faut acheter vs ce qui sera fourni
}

/** Repères Na⁺ / K⁺ / Mg (affichage plan — les apports réels passent par la timeline). */
export interface ElectrolyteStrategy {
  sodiumMgPerHour: number;
  potassiumMgPerHourHint: number;
  magnesiumMgPerHourHint: number;
  bulletPoints: string[];
}

export interface FuelPlan {
  choPerHour: number;
  waterPerHour: number;    // ml/h
  sodiumPerHour: number;   // mg/h
  totalCalories: number;
  timeline: TimelineItem[];
  shoppingList: ShoppingItem[];
  warnings: string[];
  
  // 🆕 NOUVELLES PROPRIÉTÉS
  choStrategy?: ChoStrategy;  // Stratégie de charge glucidique
  estimatedCost?: number;     // Coût total des produits à acheter (EUR)
  electrolyteStrategy?: ElectrolyteStrategy;
}

/** Résultat de generateFuelPlan : plan principal + variante météo optionnelle */
export interface FuelPlanGenerationResult {
  mainPlan: FuelPlan;
  altPlan?: FuelPlan;
  altPlanLabel?: string;
  /** Texte pédagogique (chiffres sweat rate, eau/h, sodium/h) pour infobulle */
  altPlanExplanation?: string;
}

// 🆕 NOUVEAU TYPE - Stratégie de charge glucidique
export interface ChoStrategy {
  type: "constant" | "progressive" | "custom";
  phases: ChoPhase[];
}

export interface ChoPhase {
  startTimeMin: number;    // Minute de début
  endTimeMin: number;      // Minute de fin
  choPerHour: number;      // g CHO/h pendant cette phase
  description: string;     // "Phase d'échauffement", "Montée en charge", etc.
}

export interface Product {
  id: string;
  name: string;
  brand: string;
  category: "gel" | "drink" | "bar" | "chew" | "real-food" | "electrolyte";
  cho_per_unit: number;    // g carbs per serving
  water_per_unit?: number; // ml per serving
  sodium_per_unit?: number;// mg sodium per serving
  calories_per_unit: number;
  price_per_unit: number;  // EUR
  weight_g: number;        // grams per unit
  allergens: string[];
  diet_tags: string[];     // ["vegan", "gluten-free", etc.]
  description?: string;

  // 🆕 NOUVELLES PROPRIÉTÉS
  sweetness?: "low" | "medium" | "high";
  flavors?: string[];           // ["citrus", "neutral", "cola", etc.]
  texture?: "liquid" | "gel" | "chewy" | "solid"; // Pour la tolérance GI
  caffeineContent?: number;     // mg de caféine (si applicable)
  recommended_for?: string[];   // ["long-distance", "high-intensity", "sensitive-stomach"]

  // 🆕 SOURCES/CRÉDIBILITÉ
  productUrl?: string;        // Lien vers la page produit officielle
  nutritionSource?: string;   // Source des données nutritionnelles
  imageUrl?: string;          // Photo produit (API/scraping/manual)
}

export interface SavedPlan {
  plan: FuelPlan;
  profile: AthleteProfile;
  event: EventDetails;
  savedAt: string;
}

export interface RaceState {
  status: "idle" | "running" | "paused" | "finished";
  startTime: number | null;       // Date.now() when started
  elapsedMs: number;              // ms since start (updated on pause)
  currentItemIndex: number;
  consumedItems: number[];        // indices of consumed timeline items
  deviations: string[];
}
