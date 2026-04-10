export type ActivityProviderName = "strava" | "garmin" | "wahoo";

export interface ActivityProvider {
  name: ActivityProviderName;
  isConnected(userId: string): Promise<boolean>;
  getRecentActivities(userId: string, limit: number): Promise<ActivitySummary[]>;
  getActivityDetail(userId: string, activityId: string): Promise<ActivityDetail>;
  getGPXTrack(userId: string, activityId: string): Promise<GPXTrack>;
  disconnect(userId: string): Promise<void>;
}

export interface ActivitySummary {
  id: string;
  provider: ActivityProviderName;
  name: string;
  sport: string;
  startDate: Date;
  durationMin: number;
  distanceKm: number;
  elevationGainM: number;
  avgHeartRate: number | null;
  maxHeartRate: number | null;
  avgPaceMinKm: number | null;
  avgPowerW: number | null;
  calories: number | null;
  thumbnailUrl: string | null;
}

export interface ActivitySplit {
  kmMark: number;
  paceMinKm: number;
  heartRate: number | null;
  elevationM: number;
  gradientPercent: number;
  cumulativeElevationGainM: number;
  estimatedChoNeedG: number;
}

export interface HRZoneData {
  zones: Array<{ zone: string; lowerBpm: number; upperBpm: number; durationSec: number }>;
}

export interface WeatherData {
  temperatureC: number | null;
  humidityPercent: number | null;
  windKph: number | null;
  condition: string | null;
}

export interface GPXPoint {
  lat: number;
  lon: number;
  elevationM: number;
  timestampMs: number;
  distanceFromStartM: number;
  gradientPercent: number | null;
}

export interface GPXTrack {
  points: GPXPoint[];
  totalDistanceKm: number;
  totalElevationGainM: number;
  totalElevationLossM: number;
  maxElevationM: number;
  minElevationM: number;
}

export interface ActivityDetail extends ActivitySummary {
  splits: ActivitySplit[];
  heartRateZones: HRZoneData | null;
  gpxTrack: GPXTrack | null;
  weatherAtStart: WeatherData | null;
  rawProviderData: Record<string, unknown>;
}

export interface ElevationSegment {
  kmStart: number;
  kmEnd: number;
  type: "climb" | "descent" | "flat";
  avgGradientPercent: number;
  elevationDeltaM: number;
  choMultiplier: number;
}

export interface ElevationAnalysis {
  segments: ElevationSegment[];
  totalClimbingM: number;
  totalDescendingM: number;
  climbingPercent: number;
  descendingPercent: number;
  flatPercent: number;
  hardestKm: number;
  segmentChoMultipliers: number[];
}
