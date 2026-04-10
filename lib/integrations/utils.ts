import type { GPXPoint, GPXTrack } from "@/types/integrations";

export function toPaceMinKmFromSpeedMs(speedMs: number | null | undefined): number | null {
  if (!speedMs || speedMs <= 0) return null;
  return 1000 / (speedMs * 60);
}

export function gradientPercent(deltaElevationM: number, deltaDistanceM: number): number | null {
  if (!Number.isFinite(deltaDistanceM) || deltaDistanceM <= 0) return null;
  return (deltaElevationM / deltaDistanceM) * 100;
}

export function summarizeTrack(points: GPXPoint[]): GPXTrack {
  let gain = 0;
  let loss = 0;
  let minElevationM = Number.POSITIVE_INFINITY;
  let maxElevationM = Number.NEGATIVE_INFINITY;
  for (let i = 0; i < points.length; i += 1) {
    const p = points[i];
    minElevationM = Math.min(minElevationM, p.elevationM);
    maxElevationM = Math.max(maxElevationM, p.elevationM);
    if (i > 0) {
      const prev = points[i - 1];
      const delta = p.elevationM - prev.elevationM;
      if (delta > 0) gain += delta;
      if (delta < 0) loss += Math.abs(delta);
    }
  }
  const totalDistanceKm = points.length > 0 ? (points[points.length - 1].distanceFromStartM || 0) / 1000 : 0;
  return {
    points,
    totalDistanceKm,
    totalElevationGainM: gain,
    totalElevationLossM: loss,
    maxElevationM: Number.isFinite(maxElevationM) ? maxElevationM : 0,
    minElevationM: Number.isFinite(minElevationM) ? minElevationM : 0,
  };
}
