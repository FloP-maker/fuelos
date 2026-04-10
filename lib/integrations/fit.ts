import FitParser from "fit-file-parser";

import type { GPXPoint } from "@/types/integrations";
import { gradientPercent } from "@/lib/integrations/utils";

type FitRecord = {
  timestamp?: Date | string;
  position_lat?: number;
  position_long?: number;
  altitude?: number;
  distance?: number;
};

export async function parseFitToPoints(buffer: ArrayBuffer): Promise<GPXPoint[]> {
  const parser = new FitParser({
    force: true,
    speedUnit: "m/s",
    lengthUnit: "m",
    elapsedRecordField: true,
    mode: "cascade",
  });
  const uint8 = new Uint8Array(buffer);
  const records = await new Promise<FitRecord[]>((resolve, reject) => {
    parser.parse(uint8.buffer, (error, data) => {
      if (error) {
        reject(new Error(error));
        return;
      }
      const parsed = data as { records?: FitRecord[] } | undefined;
      resolve(parsed?.records ?? []);
    });
  });
  const points: GPXPoint[] = [];
  for (let i = 0; i < records.length; i += 1) {
    const r = records[i];
    if (
      typeof r.position_lat !== "number" ||
      typeof r.position_long !== "number" ||
      typeof r.altitude !== "number"
    ) {
      continue;
    }
    const prev = points[points.length - 1];
    const dist = typeof r.distance === "number" ? r.distance : prev?.distanceFromStartM ?? 0;
    const grad = prev ? gradientPercent(r.altitude - prev.elevationM, dist - prev.distanceFromStartM) : null;
    points.push({
      lat: r.position_lat,
      lon: r.position_long,
      elevationM: r.altitude,
      timestampMs: r.timestamp ? new Date(r.timestamp).getTime() : Date.now(),
      distanceFromStartM: dist,
      gradientPercent: grad,
    });
  }
  return points;
}
