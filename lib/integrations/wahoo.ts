import { disconnectProvider, getProviderToken } from "@/lib/integrations/providerTokens";
import { parseFitToPoints } from "@/lib/integrations/fit";
import { summarizeTrack } from "@/lib/integrations/utils";
import type { ActivityDetail, ActivityProvider, ActivitySummary } from "@/types/integrations";

function mapSummary(raw: Record<string, unknown>): ActivitySummary {
  const workout = (raw.workout_summary as Record<string, unknown>) ?? {};
  return {
    id: String(raw.id ?? ""),
    provider: "wahoo",
    name: typeof raw.name === "string" ? raw.name : "Wahoo workout",
    sport: typeof raw.sport === "string" ? raw.sport.toLowerCase() : "other",
    startDate: new Date(typeof raw.started_at === "string" ? raw.started_at : Date.now()),
    durationMin: ((workout.duration_seconds as number) ?? 0) / 60,
    distanceKm: ((workout.distance_meters as number) ?? 0) / 1000,
    elevationGainM: (workout.ascent_accum as number) ?? 0,
    avgHeartRate: (workout.heart_rate_avg as number) ?? null,
    maxHeartRate: (workout.heart_rate_max as number) ?? null,
    avgPaceMinKm: null,
    avgPowerW: (workout.power_avg as number) ?? null,
    calories: (workout.kilojoules as number) ?? null,
    thumbnailUrl: null,
  };
}

async function wahooFetch(userId: string, path: string, init?: RequestInit): Promise<Response> {
  const token = await getProviderToken(userId, "wahoo");
  if (!token) throw new Error("Wahoo is not connected");
  const response = await fetch(`https://api.wahooligan.com${path}`, {
    ...init,
    headers: {
      Accept: "application/json",
      Authorization: `Bearer ${token.accessToken}`,
      ...init?.headers,
    },
  });
  return response;
}

export const wahooProvider: ActivityProvider = {
  name: "wahoo",
  async isConnected(userId) {
    return (await getProviderToken(userId, "wahoo")) != null;
  },
  async getRecentActivities(userId, limit) {
    const res = await wahooFetch(userId, `/v1/workouts?per_page=${Math.max(1, Math.min(limit, 50))}`);
    if (!res.ok) throw new Error("Unable to fetch Wahoo workouts");
    const json = (await res.json()) as { workouts?: Array<Record<string, unknown>> };
    return (json.workouts ?? []).map(mapSummary);
  },
  async getActivityDetail(userId, activityId) {
    const res = await wahooFetch(userId, `/v1/workouts/${activityId}`);
    if (!res.ok) throw new Error("Unable to fetch Wahoo workout detail");
    const raw = (await res.json()) as Record<string, unknown>;
    const summary = mapSummary(raw);
    const detail: ActivityDetail = {
      ...summary,
      splits: [],
      heartRateZones: null,
      gpxTrack: null,
      weatherAtStart: null,
      rawProviderData: raw,
    };
    return detail;
  },
  async getGPXTrack(userId, activityId) {
    const res = await wahooFetch(userId, `/v1/workouts/${activityId}/workout_file`);
    if (!res.ok) throw new Error("Unable to fetch Wahoo FIT");
    const fitArrayBuffer = await res.arrayBuffer();
    const points = await parseFitToPoints(fitArrayBuffer);
    return summarizeTrack(points);
  },
  async disconnect(userId) {
    await disconnectProvider(userId, "wahoo");
  },
};
