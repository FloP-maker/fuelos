// ============ CORE TYPES ============

export interface AthleteProfile {
  weight: number;          // kg
  age: number;
  gender: "M" | "F";
  sweatRate: number;       // L/h
  giTolerance: "sensitive" | "normal" | "robust";
  allergies: string[];     // e.g. ["gluten", "dairy"]
  
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
}

export interface EventDetails {
  sport: string;
  distance: number;        // km
  elevationGain: number;   // m D+
  targetTime: number;      // hours
  weather: string;
  elevation: string;
  
  // 🆕 NOUVELLES PROPRIÉTÉS - Ravitaillements
  aidStations?: AidStation[];  // Checkpoints avec ravitaillements
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
}

export interface ShoppingItem {
  productId: string;
  quantity: number;
  
  // 🆕 NOUVELLE PROPRIÉTÉ
  source?: "personal" | "aid-station"; // Pour distinguer ce qu'il faut acheter vs ce qui sera fourni
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

export interface Product {
  id: string;
  name: string;
  brand: string;
  category: "gel" | "drink" | "bar" | "chew" | "real-food" | "electrolyte";
  cho_per_unit: number;
  water_per_unit?: number;
  sodium_per_unit?: number;
  calories_per_unit: number;
  price_per_unit: number;
  weight_g: number;
  allergens: string[];
  diet_tags: string[];
  description?: string;
  sweetness?: "low" | "medium" | "high";
  flavors?: string[];
  texture?: "liquid" | "gel" | "chewy" | "solid";
  caffeineContent?: number;
  recommended_for?: string[];
  
  // 🆕 SOURCES/CRÉDIBILITÉ
  productUrl?: string;        // Lien vers la page produit officielle
  nutritionSource?: string;   // Source des données nutritionnelles
  imageUrl?: string;          // Photo produit (API/scraping/manual)
}