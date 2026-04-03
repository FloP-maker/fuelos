import type { CourseGeometry } from "./types";

const EARTH_R_KM = 6371;

function haversineKm(a: [number, number], b: [number, number]): number {
  const [lng1, lat1] = a;
  const [lng2, lat2] = b;
  const toR = (d: number) => (d * Math.PI) / 180;
  const dLat = toR(lat2 - lat1);
  const dLng = toR(lng2 - lng1);
  const s1 = Math.sin(dLat / 2);
  const s2 = Math.sin(dLng / 2);
  const q = s1 * s1 + Math.cos(toR(lat1)) * Math.cos(toR(lat2)) * s2 * s2;
  return 2 * EARTH_R_KM * Math.asin(Math.min(1, Math.sqrt(q)));
}

/** D+ cumulé (somme des Δaltitude positives entre points consécutifs). */
export function elevationGainFromProfile(elevationM: number[]): number {
  let gain = 0;
  for (let i = 1; i < elevationM.length; i++) {
    const d = elevationM[i]! - elevationM[i - 1]!;
    if (d > 0) gain += d;
  }
  return Math.round(gain);
}

export function buildCourseGeometryFromLngLatEle(
  points: { lng: number; lat: number; ele: number }[]
): CourseGeometry | null {
  if (points.length < 2) return null;

  const coordinates: [number, number][] = points.map((p) => [p.lng, p.lat]);
  const elevationM = points.map((p) => p.ele);
  const cumulativeKm: number[] = [0];
  let cum = 0;
  for (let i = 1; i < coordinates.length; i++) {
    cum += haversineKm(coordinates[i - 1]!, coordinates[i]!);
    cumulativeKm.push(cum);
  }

  return { coordinates, elevationM, cumulativeKm };
}

/** Réduit le nombre de points (échantillonnage régulier) pour lien de partage ou perf. */
export function downsampleCourseGeometry(geo: CourseGeometry, maxPoints: number): CourseGeometry {
  const n = geo.coordinates.length;
  if (n <= maxPoints || maxPoints < 2) return geo;

  const last = n - 1;
  const step = last / (maxPoints - 1);
  const coordinates: [number, number][] = [];
  const elevationM: number[] = [];
  const cumulativeKm: number[] = [];

  for (let i = 0; i < maxPoints; i++) {
    const idx = Math.round(i * step);
    const j = Math.min(idx, last);
    coordinates.push(geo.coordinates[j]!);
    elevationM.push(geo.elevationM[j]!);
    cumulativeKm.push(geo.cumulativeKm[j]!);
  }

  return { coordinates, elevationM, cumulativeKm };
}

/** Position [lng, lat] à une distance donnée le long du parcours (km). */
export function positionAtDistanceKm(geo: CourseGeometry, km: number): [number, number] {
  const maxKm = geo.cumulativeKm[geo.cumulativeKm.length - 1] ?? 0;
  const target = Math.max(0, Math.min(km, maxKm));
  let i = 0;
  while (i < geo.cumulativeKm.length - 1 && geo.cumulativeKm[i + 1]! < target) {
    i++;
  }
  const k0 = geo.cumulativeKm[i]!;
  const k1 = geo.cumulativeKm[i + 1] ?? k0;
  const t = k1 > k0 ? (target - k0) / (k1 - k0) : 0;
  const [lng0, lat0] = geo.coordinates[i]!;
  const [lng1, lat1] = geo.coordinates[i + 1] ?? geo.coordinates[i]!;
  return [lng0 + t * (lng1 - lng0), lat0 + t * (lat1 - lat0)];
}

/** Altitude approximative à une distance km (interpolation linéaire). */
export function elevationAtDistanceKm(geo: CourseGeometry, km: number): number {
  const maxKm = geo.cumulativeKm[geo.cumulativeKm.length - 1] ?? 0;
  const target = Math.max(0, Math.min(km, maxKm));
  let i = 0;
  while (i < geo.cumulativeKm.length - 1 && geo.cumulativeKm[i + 1]! < target) {
    i++;
  }
  const k0 = geo.cumulativeKm[i]!;
  const k1 = geo.cumulativeKm[i + 1] ?? k0;
  const t = k1 > k0 ? (target - k0) / (k1 - k0) : 0;
  const e0 = geo.elevationM[i]!;
  const e1 = geo.elevationM[i + 1] ?? e0;
  return e0 + t * (e1 - e0);
}
