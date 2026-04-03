import type {
  AthleteProfile,
  EventDetails,
  FuelPlan,
  FuelPlanGenerationResult,
  Product,
  TimelineItem,
} from "./types";
import { generateFuelPlan } from "./fuelEngine";
import { setEngineProductOverlay } from "./products";

// ============ CALCULATION ENGINE ============

/**
 * Main calculation entry point — plan principal + variante météo (chaud/froid) si applicable.
 * `customProducts` : fusionnés dans la résolution `getProductById` le temps du calcul (SSR : ne pas passer).
 */
export function calculateFuelPlan(
  profile: AthleteProfile,
  event: EventDetails,
  customProducts?: Product[]
): FuelPlanGenerationResult {
  let appliedOverlay = false;
  try {
    if (customProducts && customProducts.length > 0) {
      setEngineProductOverlay(customProducts);
      appliedOverlay = true;
    }
    return generateFuelPlan(profile, event);
  } finally {
    if (appliedOverlay) setEngineProductOverlay(null);
  }
}

// ============ UTILITY FUNCTIONS (conservées) ============

/**
 * Format elapsed time in HH:MM:SS
 */
export function formatTime(ms: number): string {
  const totalSeconds = Math.floor(ms / 1000);
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = totalSeconds % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

/**
 * Find next upcoming item in timeline given elapsed time in minutes
 */
export function getNextItems(timeline: TimelineItem[], elapsedMin: number): {
  overdue: TimelineItem[];
  next: TimelineItem | null;
  upcoming: TimelineItem[];
} {
  const overdue = timeline.filter(item => item.timeMin <= elapsedMin);
  const future = timeline.filter(item => item.timeMin > elapsedMin);
  return {
    overdue,
    next: future[0] || null,
    upcoming: future.slice(1, 4),
  };
}