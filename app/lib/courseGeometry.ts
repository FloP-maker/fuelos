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

/**
 * Points [lng, lat] du tracé du départ jusqu’à `km` (km cumulés), pour dessiner la portion parcourue.
 */
export function lineCoordsUpToKm(geo: CourseGeometry, km: number): [number, number][] {
  const coords = geo.coordinates;
  const kms = geo.cumulativeKm;
  if (coords.length < 2 || kms.length < 2) return [];

  const maxKm = kms[kms.length - 1] ?? 0;
  const target = Math.max(0, Math.min(km, maxKm));
  const out: [number, number][] = [coords[0]!];

  for (let i = 0; i < kms.length - 1; i++) {
    const k0 = kms[i]!;
    const k1 = kms[i + 1]!;
    const A = coords[i]!;
    const B = coords[i + 1]!;
    if (k1 <= target + 1e-9) {
      out.push(B);
      continue;
    }
    if (target <= k0 + 1e-9) break;
    if (target < k1) {
      const t = k1 > k0 ? (target - k0) / (k1 - k0) : 0;
      out.push([A[0] + t * (B[0] - A[0]), A[1] + t * (B[1] - A[1])]);
      break;
    }
  }

  return out;
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

/**
 * Projection du point (lng, lat) sur le tracé : distance cumulée (km) et écart au tracé (km, Haversine).
 * Segments interpolés en coordonnées plate (lng/lat) — suffisant pour le survol carte.
 */
export function nearestPointOnCourse(
  geo: CourseGeometry,
  lng: number,
  lat: number
): { km: number; distanceKm: number } {
  const coords = geo.coordinates;
  const kms = geo.cumulativeKm;
  if (coords.length < 2) return { km: 0, distanceKm: Infinity };

  const P: [number, number] = [lng, lat];
  let bestKm = 0;
  let bestD = Infinity;

  for (let i = 0; i < coords.length - 1; i++) {
    const A = coords[i]!;
    const B = coords[i + 1]!;
    const k0 = kms[i]!;
    const k1 = kms[i + 1]!;

    const abx = B[0] - A[0];
    const aby = B[1] - A[1];
    const apx = P[0] - A[0];
    const apy = P[1] - A[1];
    const segLen2 = abx * abx + aby * aby;
    let t = 0;
    if (segLen2 > 1e-20) {
      t = (apx * abx + apy * aby) / segLen2;
      t = Math.max(0, Math.min(1, t));
    }
    const clng = A[0] + t * abx;
    const clat = A[1] + t * aby;
    const d = haversineKm(P, [clng, clat]);
    if (d < bestD) {
      bestD = d;
      bestKm = k0 + t * (k1 - k0);
    }
  }

  return { km: bestKm, distanceKm: bestD };
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

const DEFAULT_GRADIENT_WINDOW_KM = 0.2;

/**
 * Pente moyenne % sur une fenêtre symétrique autour de `km` (montée positive, descente négative).
 * Utile pour placer les prises sur replats ou descentes.
 */
export function gradientPercentAtKm(
  geo: CourseGeometry,
  km: number,
  windowKm: number = DEFAULT_GRADIENT_WINDOW_KM
): number {
  const maxKm = geo.cumulativeKm[geo.cumulativeKm.length - 1] ?? 0;
  if (maxKm <= 0) return 0;
  const half = Math.max(0.02, windowKm);
  const k0 = Math.max(0, km - half);
  const k1 = Math.min(maxKm, km + half);
  const runM = (k1 - k0) * 1000;
  if (runM < 1) return 0;
  const e0 = elevationAtDistanceKm(geo, k0);
  const e1 = elevationAtDistanceKm(geo, k1);
  return ((e1 - e0) / runM) * 100;
}

/** km le long du parcours pour une répartition uniforme du temps (allure constante). */
export function distanceKmAtRaceTime(
  timeMin: number,
  durationMin: number,
  totalDistanceKm: number
): number {
  if (durationMin <= 0 || totalDistanceKm <= 0) return 0;
  const t = Math.max(0, Math.min(1, timeMin / durationMin));
  return t * totalDistanceKm;
}

/** Courbe temps cumulé ↔ km : les montées « coûtent » plus de minutes que le plat / la descente. */
export type TimeDistancePacing = {
  km: number[];
  cumTimeMin: number[];
};

function paceMultiplierFromGradient(gradientPercent: number): number {
  if (gradientPercent >= 0) {
    return 1 + Math.min(3, gradientPercent / 7);
  }
  return Math.max(0.72, 1 + gradientPercent / 20);
}

/**
 * Répartition du temps de course le long du tracé (somme des durées segment = `totalDurationMin`).
 * Hypothèse : allure liée à la pente locale (trail / route); modèle simple, pas une prédiction météo.
 */
export function buildTimeDistancePacing(
  geo: CourseGeometry,
  totalDurationMin: number
): TimeDistancePacing | null {
  const n = geo.cumulativeKm.length;
  if (n < 2 || totalDurationMin <= 0) return null;

  const km: number[] = [geo.cumulativeKm[0]!];
  const rawEffort: number[] = [0];
  let acc = 0;

  for (let i = 0; i < n - 1; i++) {
    const dK = geo.cumulativeKm[i + 1]! - geo.cumulativeKm[i]!;
    if (dK < 1e-9) continue;
    const kmMid = geo.cumulativeKm[i]! + dK * 0.5;
    const win = Math.min(0.12, Math.max(0.03, dK * 0.35));
    const g = gradientPercentAtKm(geo, kmMid, win);
    acc += dK * paceMultiplierFromGradient(g);
    km.push(geo.cumulativeKm[i + 1]!);
    rawEffort.push(acc);
  }

  if (acc < 1e-9 || km.length < 2) return null;

  const scale = totalDurationMin / acc;
  const cumTimeMin = rawEffort.map((e) => e * scale);
  return { km, cumTimeMin };
}

/** Position km à l’instant `timeMin` en suivant la courbe d’effort `pacing`. */
export function distanceKmAtRaceTimePaced(
  timeMin: number,
  pacing: TimeDistancePacing,
  durationMin: number
): number {
  const t = Math.max(0, Math.min(durationMin, timeMin));
  const { km, cumTimeMin } = pacing;
  const last = cumTimeMin.length - 1;
  if (t <= cumTimeMin[0]!) return km[0]!;
  if (t >= cumTimeMin[last]!) return km[last]!;

  let lo = 0;
  let hi = last;
  while (lo + 1 < hi) {
    const mid = (lo + hi) >> 1;
    if (cumTimeMin[mid]! <= t) lo = mid;
    else hi = mid;
  }
  const i = hi;
  const t0 = cumTimeMin[i - 1]!;
  const t1 = cumTimeMin[i]!;
  const k0 = km[i - 1]!;
  const k1 = km[i]!;
  if (t1 <= t0) return k1;
  const u = (t - t0) / (t1 - t0);
  return k0 + u * (k1 - k0);
}
