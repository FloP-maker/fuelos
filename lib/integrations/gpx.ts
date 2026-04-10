import { XMLParser } from "fast-xml-parser";

import type { RaceEvent } from "@/types/race";
import type { ElevationAnalysis, ElevationSegment, GPXPoint, GPXTrack } from "@/types/integrations";
import { gradientPercent, summarizeTrack } from "@/lib/integrations/utils";

type NutritionPlan = {
  choPerHour: number;
  sodiumPerHour: number;
  fluidPerHour: number;
  timeline?: Array<{ timeMin: number; cho?: number; sodium?: number; fluid?: number }>;
  planSource?: string;
} & Record<string, unknown>;

function toArray<T>(value: T | T[] | undefined): T[] {
  if (!value) return [];
  return Array.isArray(value) ? value : [value];
}

function choMultiplierForGradient(grad: number): number {
  if (grad < -5) return 0.7;
  if (grad < 0) return 0.85;
  if (grad < 3) return 1;
  if (grad < 8) return 1.2;
  if (grad < 15) return 1.4;
  return 1.6;
}

export function parseGPXFile(gpxString: string): GPXTrack {
  const parser = new XMLParser({ ignoreAttributes: false, attributeNamePrefix: "" });
  const parsed = parser.parse(gpxString) as {
    gpx?: { trk?: { trkseg?: { trkpt?: Array<{ lat?: string; lon?: string; ele?: string; time?: string }> } } };
  };
  const trkpt = toArray(parsed.gpx?.trk?.trkseg?.trkpt);
  const points: GPXPoint[] = [];
  for (let i = 0; i < trkpt.length; i += 1) {
    const p = trkpt[i];
    const lat = Number(p.lat);
    const lon = Number(p.lon);
    if (!Number.isFinite(lat) || !Number.isFinite(lon)) continue;
    const elevationM = Number(p.ele ?? 0);
    const timestampMs = p.time ? new Date(p.time).getTime() : Date.now() + i * 1000;
    const prev = points[points.length - 1];
    // Distance is approximated point-to-point when GPX has no cumulative distance.
    const distanceFromStartM = prev
      ? prev.distanceFromStartM + haversineM(prev.lat, prev.lon, lat, lon)
      : 0;
    points.push({
      lat,
      lon,
      elevationM,
      timestampMs,
      distanceFromStartM,
      gradientPercent: prev
        ? gradientPercent(elevationM - prev.elevationM, distanceFromStartM - prev.distanceFromStartM)
        : null,
    });
  }
  return summarizeTrack(points);
}

function haversineM(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371_000;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  return 2 * R * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export function analyzeElevationProfile(track: GPXTrack): ElevationAnalysis {
  const byKm = new Map<number, GPXPoint[]>();
  for (const p of track.points) {
    const km = Math.floor(p.distanceFromStartM / 1000);
    const list = byKm.get(km) ?? [];
    list.push(p);
    byKm.set(km, list);
  }
  const segments: ElevationSegment[] = [];
  let totalClimbingM = 0;
  let totalDescendingM = 0;
  let hardestKm = 0;
  let hardestGain = 0;
  const segmentChoMultipliers: number[] = [];
  const kms = [...byKm.keys()].sort((a, b) => a - b);
  for (const km of kms) {
    const pts = byKm.get(km) ?? [];
    if (pts.length < 2) continue;
    const first = pts[0];
    const last = pts[pts.length - 1];
    const delta = last.elevationM - first.elevationM;
    const distM = Math.max(1, last.distanceFromStartM - first.distanceFromStartM);
    const avgGradientPercent = (delta / distM) * 100;
    const choMultiplier = choMultiplierForGradient(avgGradientPercent);
    const type: ElevationSegment["type"] =
      avgGradientPercent > 3 ? "climb" : avgGradientPercent < -3 ? "descent" : "flat";
    if (delta > 0) {
      totalClimbingM += delta;
      if (delta > hardestGain) {
        hardestGain = delta;
        hardestKm = km + 1;
      }
    } else {
      totalDescendingM += Math.abs(delta);
    }
    segments.push({
      kmStart: km,
      kmEnd: km + 1,
      type,
      avgGradientPercent,
      elevationDeltaM: delta,
      choMultiplier,
    });
    segmentChoMultipliers.push(choMultiplier);
  }
  const count = Math.max(1, segments.length);
  const climbingPercent = (segments.filter((s) => s.type === "climb").length / count) * 100;
  const descendingPercent = (segments.filter((s) => s.type === "descent").length / count) * 100;
  const flatPercent = 100 - climbingPercent - descendingPercent;
  return {
    segments,
    totalClimbingM,
    totalDescendingM,
    climbingPercent,
    descendingPercent,
    flatPercent,
    hardestKm,
    segmentChoMultipliers,
  };
}

export function recalculatePlanFromGPX(plan: NutritionPlan, analysis: ElevationAnalysis): NutritionPlan {
  const baseCho = plan.choPerHour;
  const adjustedCho = analysis.segmentChoMultipliers.map((m) => Math.round(baseCho * m));
  const avgCho = adjustedCho.length > 0 ? adjustedCho.reduce((a, b) => a + b, 0) / adjustedCho.length : baseCho;
  const timeline = (plan.timeline ?? []).map((item) => {
    const km = Math.floor((item.timeMin / 60) * 10); // rough pacing fallback
    const mult = analysis.segmentChoMultipliers[Math.min(km, analysis.segmentChoMultipliers.length - 1)] ?? 1;
    return { ...item, cho: Math.round((item.cho ?? baseCho / 3) * mult) };
  });
  return {
    ...plan,
    choPerHour: Math.round(avgCho),
    timeline,
    planSource: "gpx-adjusted",
  };
}

export function recalculatePostRace(raceEvent: RaceEvent, activityDetail: ActivityDetailLike): RaceEvent {
  const nextDuration = Math.max(1, Math.round(activityDetail.durationMin));
  const nextElevation = Math.max(0, Math.round(activityDetail.elevationGainM));
  const plannedCho = raceEvent.plannedNutrition.choPerHour;
  const ratio = raceEvent.elevationGainM > 0 ? nextElevation / raceEvent.elevationGainM : 1;
  const adjustedCho = Math.round(plannedCho * (0.85 + 0.15 * ratio));
  const insight = `Le dénivelé réel (+${nextElevation}m) était ${Math.round(
    Math.abs((ratio - 1) * 100)
  )}% ${ratio >= 1 ? "supérieur" : "inférieur"} au plan (+${raceEvent.elevationGainM}m). Tes besoins glucidiques étaient proches de ${adjustedCho}g/h (plan initial: ${plannedCho}g/h).`;
  return {
    ...raceEvent,
    durationMin: nextDuration,
    elevationGainM: nextElevation,
    nutritionScore: Math.max(0, Math.min(100, Math.round(raceEvent.nutritionScore - Math.abs(adjustedCho - plannedCho) * 0.4))),
    insights: [insight, ...raceEvent.insights],
  };
}

type ActivityDetailLike = {
  durationMin: number;
  elevationGainM: number;
};
