import { buildCourseGeometryFromLngLatEle, elevationGainFromProfile } from "./courseGeometry";
import type { CourseGeometry } from "./types";

function parseNumber(el: Element | null): number | null {
  if (!el?.textContent) return null;
  const v = parseFloat(el.textContent.trim());
  return Number.isFinite(v) ? v : null;
}

export type ParsedGpx = {
  geometry: CourseGeometry;
  distanceKm: number;
  elevationGainM: number;
  name?: string;
};

/**
 * Parse un GPX (track ou route). Élévation : ele du fichier, sinon 0 (D+ peut être sous-estimé).
 */
export function parseGpxDocument(xml: string): ParsedGpx | null {
  const doc = new DOMParser().parseFromString(xml, "application/xml");
  const parseErr = doc.querySelector("parsererror");
  if (parseErr) return null;

  const trkName = doc.querySelector("trk > name")?.textContent?.trim();
  const rteName = doc.querySelector("rte > name")?.textContent?.trim();

  const segments: Element[] = [];
  doc.querySelectorAll("trk > trkseg").forEach((s) => segments.push(s));
  if (segments.length === 0 && doc.querySelector("trk > trkpt")) {
    const pseudo = doc.querySelector("trk");
    if (pseudo) segments.push(pseudo);
  }

  const points: { lng: number; lat: number; ele: number }[] = [];

  const pushPts = (ptElements: Iterable<Element>) => {
    for (const pt of ptElements) {
      const lat = parseFloat(pt.getAttribute("lat") || "");
      const lon = parseFloat(pt.getAttribute("lon") || "");
      if (!Number.isFinite(lat) || !Number.isFinite(lon)) continue;
      const ele = parseNumber(pt.querySelector("ele")) ?? 0;
      points.push({ lat, lng: lon, ele });
    }
  };

  if (segments.length > 0) {
    for (const seg of segments) {
      pushPts(seg.querySelectorAll("trkpt"));
    }
  }

  if (points.length < 2) {
    const rtePts = doc.querySelectorAll("rte > rtept");
    pushPts(rtePts);
  }

  if (points.length < 2) return null;

  const geometry = buildCourseGeometryFromLngLatEle(points);
  if (!geometry) return null;

  const distanceKm = geometry.cumulativeKm[geometry.cumulativeKm.length - 1] ?? 0;
  const elevationGainM = elevationGainFromProfile(geometry.elevationM);

  return {
    geometry,
    distanceKm: Math.round(distanceKm * 10) / 10,
    elevationGainM,
    name: trkName || rteName,
  };
}
