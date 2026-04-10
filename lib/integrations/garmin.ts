import { OAuth } from "oauth";

import { disconnectProvider, getProviderToken } from "@/lib/integrations/providerTokens";
import { parseFitToPoints } from "@/lib/integrations/fit";
import { summarizeTrack } from "@/lib/integrations/utils";
import type { ActivityDetail, ActivityProvider, ActivitySummary } from "@/types/integrations";

function oauthClient() {
  return new OAuth(
    "https://connectapi.garmin.com/oauth-service/oauth/request_token",
    "https://connectapi.garmin.com/oauth-service/oauth/access_token",
    process.env.GARMIN_CONSUMER_KEY ?? "",
    process.env.GARMIN_CONSUMER_SECRET ?? "",
    "1.0",
    null,
    "HMAC-SHA1"
  );
}

function mapSummary(raw: Record<string, unknown>): ActivitySummary {
  return {
    id: String(raw.activityId ?? ""),
    provider: "garmin",
    name: typeof raw.activityName === "string" ? raw.activityName : "Garmin activity",
    sport: typeof raw.activityType === "string" ? raw.activityType.toLowerCase() : "other",
    startDate: new Date(((raw.startTimeInSeconds as number) ?? 0) * 1000),
    durationMin: ((raw.durationInSeconds as number) ?? 0) / 60,
    distanceKm: ((raw.distanceInMeters as number) ?? 0) / 1000,
    elevationGainM: (raw.totalElevationGainInMeters as number) ?? 0,
    avgHeartRate: (raw.averageHeartRateInBeatsPerMinute as number) ?? null,
    maxHeartRate: (raw.maxHeartRateInBeatsPerMinute as number) ?? null,
    avgPaceMinKm: (raw.averagePaceInMinutesPerKilometer as number) ?? null,
    avgPowerW: (raw.averageBikePowerInWatts as number) ?? null,
    calories: (raw.activeKilocalories as number) ?? null,
    thumbnailUrl: null,
  };
}

export const garminProvider: ActivityProvider = {
  name: "garmin",
  async isConnected(userId) {
    return (await getProviderToken(userId, "garmin")) != null;
  },
  async getRecentActivities(userId, limit) {
    const token = await getProviderToken(userId, "garmin");
    if (!token) throw new Error("Garmin is not connected");
    const client = oauthClient();
    const end = Math.floor(Date.now() / 1000);
    const start = end - 30 * 24 * 60 * 60;
    const url = `https://apis.garmin.com/wellness-api/rest/activities?uploadStartTimeInSeconds=${start}&uploadEndTimeInSeconds=${end}`;
    const body = await new Promise<string>((resolve, reject) => {
      client.get(
        url,
        token.accessToken,
        token.oauthTokenSecret ?? "",
        (
          error: { statusCode: number; data?: unknown } | null,
          data: string | Buffer | undefined
        ) => {
          if (error) reject(error);
          else resolve(String(data ?? ""));
        }
      );
    });
    const json = JSON.parse(body) as Array<Record<string, unknown>>;
    return json.slice(0, limit).map(mapSummary);
  },
  async getActivityDetail(userId, activityId) {
    const rows = await this.getRecentActivities(userId, 100);
    const summary = rows.find((r) => r.id === activityId);
    if (!summary) throw new Error("Garmin activity not found");
    const detail: ActivityDetail = {
      ...summary,
      splits: [],
      heartRateZones: null,
      gpxTrack: null,
      weatherAtStart: null,
      rawProviderData: { providerActivityId: activityId },
    };
    return detail;
  },
  async getGPXTrack(userId, activityId) {
    const token = await getProviderToken(userId, "garmin");
    if (!token) throw new Error("Garmin is not connected");
    const client = oauthClient();
    const url = `https://apis.garmin.com/download-service/files/activity/${activityId}`;
    const fitData = await new Promise<Buffer>((resolve, reject) => {
      client.get(
        url,
        token.accessToken,
        token.oauthTokenSecret ?? "",
        (
          error: { statusCode: number; data?: unknown } | null,
          data: string | Buffer | undefined
        ) => {
          if (error) reject(error);
          else resolve(Buffer.isBuffer(data) ? data : Buffer.from(String(data ?? ""), "binary"));
        }
      );
    });
    const points = await parseFitToPoints(
      fitData.buffer.slice(fitData.byteOffset, fitData.byteOffset + fitData.byteLength) as ArrayBuffer
    );
    return summarizeTrack(points);
  },
  async disconnect(userId) {
    await disconnectProvider(userId, "garmin");
  },
};
