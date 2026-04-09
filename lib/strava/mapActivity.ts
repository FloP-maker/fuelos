import type { EventDetails, PrimaryDiscipline, StravaImportMeta } from "@/app/lib/types";

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

/** Infère la discipline FuelOS à partir des activités Strava récentes (types dominants). */
export function inferPrimaryDisciplineFromStravaActivities(
  activities: { type: string; distance: number; total_elevation_gain: number }[]
): PrimaryDiscipline | null {
  if (!activities.length) return null;
  const counts = new Map<string, number>();
  for (const a of activities) {
    const t = (a.type || "").toLowerCase();
    counts.set(t, (counts.get(t) ?? 0) + 1);
  }
  const dominant = [...counts.entries()].sort((x, y) => y[1] - x[1])[0]?.[0] ?? "";

  if (
    dominant === "ride" ||
    dominant === "virtualride" ||
    dominant === "ebikeride" ||
    dominant === "emountainbikeride"
  ) {
    return "cycling";
  }
  if (dominant === "trailrun" || dominant === "hike" || dominant === "walk") return "trail";
  if (dominant === "swim") return "triathlon";
  if (dominant === "run" || dominant === "virtualrun") {
    const runs = activities.filter((x) => {
      const t = x.type.toLowerCase();
      return t === "run" || t === "virtualrun";
    });
    const avgElev = runs.length
      ? runs.reduce((s, r) => s + (r.total_elevation_gain || 0), 0) / runs.length
      : 0;
    return avgElev > 350 ? "trail" : "road";
  }
  if (activities.some((a) => a.type.toLowerCase() === "swim") && activities.some((a) => /run|ride/i.test(a.type))) {
    return "triathlon";
  }
  return "other";
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
