import type { ProviderToken } from "@prisma/client";

import { disconnectProvider, getProviderToken, upsertProviderToken } from "@/lib/integrations/providerTokens";
import { getCachedActivity, upsertCachedActivity } from "@/lib/integrations/cache";
import { ensureEnv } from "@/lib/integrations/config";
import { gradientPercent, summarizeTrack, toPaceMinKmFromSpeedMs } from "@/lib/integrations/utils";
import type { ActivityDetail, ActivityProvider, ActivitySummary, GPXPoint, GPXTrack } from "@/types/integrations";

const STRAVA_BASE = "https://www.strava.com/api/v3";

function mapSport(type: string): string {
  const lowered = type.toLowerCase();
  if (lowered.includes("run")) return "running";
  if (lowered.includes("ride")) return "cycling";
  if (lowered.includes("trail")) return "trail";
  if (lowered.includes("swim")) return "swimming";
  return lowered || "other";
}

function mapSummary(raw: Record<string, unknown>): ActivitySummary {
  const averageSpeed = typeof raw.average_speed === "number" ? raw.average_speed : null;
  return {
    id: String(raw.id ?? ""),
    provider: "strava",
    name: typeof raw.name === "string" ? raw.name : "Activity",
    sport: mapSport(typeof raw.type === "string" ? raw.type : "other"),
    startDate: new Date(typeof raw.start_date === "string" ? raw.start_date : Date.now()),
    durationMin: Math.round(((raw.moving_time as number) ?? 0) / 60),
    distanceKm: ((raw.distance as number) ?? 0) / 1000,
    elevationGainM: (raw.total_elevation_gain as number) ?? 0,
    avgHeartRate: (raw.average_heartrate as number) ?? null,
    maxHeartRate: (raw.max_heartrate as number) ?? null,
    avgPaceMinKm: toPaceMinKmFromSpeedMs(averageSpeed),
    avgPowerW: (raw.average_watts as number) ?? null,
    calories: (raw.calories as number) ?? null,
    thumbnailUrl: (raw.photos as { primary?: { urls?: { "100"?: string } } })?.primary?.urls?.["100"] ?? null,
  };
}

async function refreshIfNeeded(conn: ProviderToken): Promise<ProviderToken> {
  if (!conn.expiresAt || conn.expiresAt.getTime() > Date.now() + 5 * 60_000) return conn;
  const body = new URLSearchParams({
    client_id: ensureEnv("STRAVA_CLIENT_ID"),
    client_secret: ensureEnv("STRAVA_CLIENT_SECRET"),
    grant_type: "refresh_token",
    refresh_token: conn.refreshToken ?? "",
  });
  const res = await fetch("https://www.strava.com/oauth/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
  });
  if (!res.ok) throw new Error("Failed to refresh Strava token");
  const json = (await res.json()) as {
    access_token: string;
    refresh_token?: string;
    expires_at: number;
    athlete?: { id?: number; firstname?: string; lastname?: string };
  };
  return upsertProviderToken({
    userId: conn.userId,
    provider: "strava",
    accessToken: json.access_token,
    refreshToken: json.refresh_token ?? conn.refreshToken,
    expiresAt: new Date(json.expires_at * 1000),
    athleteId: json.athlete?.id ? String(json.athlete.id) : conn.athleteId,
    athleteName: json.athlete
      ? `${json.athlete.firstname ?? ""} ${json.athlete.lastname ?? ""}`.trim()
      : conn.athleteName,
    scope: conn.scope,
  });
}

export async function getStravaClient(userId: string): Promise<(path: string, init?: RequestInit) => Promise<Response>> {
  const token = await getProviderToken(userId, "strava");
  if (!token) throw new Error("Strava is not connected");
  const valid = await refreshIfNeeded(token);
  return async (path: string, init?: RequestInit) => {
    const url = path.startsWith("http") ? path : `${STRAVA_BASE}${path.startsWith("/") ? "" : "/"}${path}`;
    return fetch(url, {
      ...init,
      headers: {
        Accept: "application/json",
        Authorization: `Bearer ${valid.accessToken}`,
        ...init?.headers,
      },
    });
  };
}

export const stravaProvider: ActivityProvider = {
  name: "strava",
  async isConnected(userId) {
    return (await getProviderToken(userId, "strava")) != null;
  },
  async getRecentActivities(userId, limit) {
    const client = await getStravaClient(userId);
    const res = await client(`/athlete/activities?per_page=${Math.max(1, Math.min(limit, 50))}`);
    if (!res.ok) throw new Error("Unable to fetch Strava activities");
    const items = (await res.json()) as Array<Record<string, unknown>>;
    return items.map(mapSummary);
  },
  async getActivityDetail(userId, activityId) {
    const cached = await getCachedActivity(userId, "strava", activityId);
    if (cached?.detail) return cached.detail;

    const client = await getStravaClient(userId);
    const detailRes = await client(`/activities/${activityId}?include_all_efforts=false`);
    if (!detailRes.ok) throw new Error("Unable to fetch Strava activity detail");
    const raw = (await detailRes.json()) as Record<string, unknown>;
    const summary = mapSummary(raw);
    const splitsRaw = Array.isArray(raw.splits_metric) ? raw.splits_metric : [];
    const splits = splitsRaw.map((s, idx) => {
      const split = s as Record<string, unknown>;
      const elev = (split.elevation_difference as number) ?? 0;
      const distance = (split.distance as number) ?? 1000;
      const grad = (elev / Math.max(1, distance)) * 100;
      const choMultiplier = grad < -5 ? 0.7 : grad < 0 ? 0.85 : grad < 3 ? 1 : grad < 8 ? 1.2 : grad < 15 ? 1.4 : 1.6;
      return {
        kmMark: idx + 1,
        paceMinKm: toPaceMinKmFromSpeedMs((split.average_speed as number) ?? 0) ?? 0,
        heartRate: (split.average_heartrate as number) ?? null,
        elevationM: elev,
        gradientPercent: grad,
        cumulativeElevationGainM: Math.max(0, elev),
        estimatedChoNeedG: 70 * choMultiplier,
      };
    });
    const detail: ActivityDetail = {
      ...summary,
      splits,
      heartRateZones: null,
      gpxTrack: null,
      weatherAtStart: null,
      rawProviderData: raw,
    };
    await upsertCachedActivity({ userId, provider: "strava", activityId, summary, detail });
    return detail;
  },
  async getGPXTrack(userId, activityId) {
    const cached = await getCachedActivity(userId, "strava", activityId);
    if (cached?.gpxTrack) return cached.gpxTrack;
    const client = await getStravaClient(userId);
    const res = await client(`/activities/${activityId}/streams?keys=latlng,altitude,time,distance`);
    if (!res.ok) throw new Error("Unable to fetch Strava streams");
    const streams = (await res.json()) as Array<{ type: string; data: unknown[] }>;
    const byType = new Map(streams.map((s) => [s.type, s.data]));
    const latlng = (byType.get("latlng") ?? []) as [number, number][];
    const altitude = (byType.get("altitude") ?? []) as number[];
    const time = (byType.get("time") ?? []) as number[];
    const distance = (byType.get("distance") ?? []) as number[];
    const points: GPXPoint[] = [];
    for (let i = 0; i < latlng.length; i += 1) {
      const [lat, lon] = latlng[i];
      const elevationM = altitude[i] ?? 0;
      const distanceFromStartM = distance[i] ?? 0;
      const prev = points[points.length - 1];
      points.push({
        lat,
        lon,
        elevationM,
        timestampMs: (time[i] ?? 0) * 1000,
        distanceFromStartM,
        gradientPercent: prev ? gradientPercent(elevationM - prev.elevationM, distanceFromStartM - prev.distanceFromStartM) : null,
      });
    }
    const track: GPXTrack = summarizeTrack(points);
    const detail = cached?.detail ?? null;
    const summary = detail ?? cached?.summary;
    if (summary) {
      await upsertCachedActivity({
        userId,
        provider: "strava",
        activityId,
        summary,
        detail,
        gpxTrack: track,
      });
    }
    return track;
  },
  async disconnect(userId) {
    await disconnectProvider(userId, "strava");
  },
};
