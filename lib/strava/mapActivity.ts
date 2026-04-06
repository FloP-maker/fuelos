import type { EventDetails, StravaImportMeta } from "@/app/lib/types";

/** Réponse normalisée côté API (liste ou détail). */
export type StravaActivityPayload = {
  id: number;
  name: string;
  distance: number;
  moving_time: number;
  total_elevation_gain: number;
  type: string;
  start_date: string;
  average_heartrate?: number;
  max_heartrate?: number;
};

const ELEVATION_LABELS = [
  "Plat (0-500m D+)",
  "Vallonné (500-1500m D+)",
  "Montagneux (1500-3000m D+)",
  "Alpin (>3000m D+)",
] as const;

export function elevationGainToTerrainCategory(gainM: number): string {
  if (gainM <= 500) return ELEVATION_LABELS[0];
  if (gainM <= 1500) return ELEVATION_LABELS[1];
  if (gainM <= 3000) return ELEVATION_LABELS[2];
  return ELEVATION_LABELS[3];
}

export function stravaTypeToSport(type: string, elevationGainM: number): string {
  const t = type.toLowerCase();
  if (
    t === "ride" ||
    t === "virtualride" ||
    t === "ebikeride" ||
    t === "emountainbikeride"
  ) {
    return "Cyclisme";
  }
  if (t === "trailrun") return "Trail";
  if (t === "run" || t === "virtualrun") {
    return elevationGainM > 600 ? "Trail" : "Course à pied";
  }
  if (t === "hike" || t === "walk") return "Trail";
  if (t === "swim") return "Triathlon";
  if (t === "workout" || t === "weighttraining") return "Course à pied";
  return "Course à pied";
}

export function stravaActivityToEventPatch(
  a: StravaActivityPayload,
  prev: Pick<EventDetails, "weather">
): Partial<EventDetails> {
  const distanceKm = a.distance / 1000;
  const elevationGain = Math.round(a.total_elevation_gain ?? 0);
  const movingSec = a.moving_time ?? 0;
  const targetTime = Math.min(72, Math.max(0.25, movingSec / 3600));
  const sport = stravaTypeToSport(a.type, elevationGain);
  const elevation = elevationGainToTerrainCategory(elevationGain);

  const stravaImport: StravaImportMeta = {
    activityId: a.id,
    name: a.name,
    startDate: a.start_date,
    avgHr:
      typeof a.average_heartrate === "number"
        ? Math.round(a.average_heartrate)
        : undefined,
    maxHr:
      typeof a.max_heartrate === "number" ? Math.round(a.max_heartrate) : undefined,
  };

  return {
    distance: Math.round(distanceKm * 100) / 100,
    elevationGain,
    targetTime: Math.round(targetTime * 4) / 4,
    sport,
    elevation,
    weather: prev.weather,
    stravaImport,
  };
}
