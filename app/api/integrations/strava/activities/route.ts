import { NextRequest, NextResponse } from "next/server";

import { requireUserId } from "@/lib/api/requireUser";
import { stravaApiFetch } from "@/lib/strava/fetchApi";
import type { StravaActivityPayload } from "@/lib/strava/mapActivity";

function normalize(raw: unknown): StravaActivityPayload | null {
  if (!raw || typeof raw !== "object") return null;
  const o = raw as Record<string, unknown>;
  const id = typeof o.id === "number" ? o.id : null;
  if (id == null) return null;
  return {
    id,
    name: typeof o.name === "string" ? o.name : "Activité",
    distance: typeof o.distance === "number" ? o.distance : 0,
    moving_time: typeof o.moving_time === "number" ? o.moving_time : 0,
    total_elevation_gain:
      typeof o.total_elevation_gain === "number" ? o.total_elevation_gain : 0,
    type: typeof o.type === "string" ? o.type : "Workout",
    start_date:
      typeof o.start_date === "string"
        ? o.start_date
        : new Date().toISOString(),
    average_heartrate:
      typeof o.average_heartrate === "number"
        ? o.average_heartrate
        : undefined,
    max_heartrate:
      typeof o.max_heartrate === "number" ? o.max_heartrate : undefined,
  };
}

export async function GET(req: NextRequest) {
  const gate = await requireUserId();
  if (!gate.ok) return gate.res;

  const perPage = Math.min(
    50,
    Math.max(5, Number(req.nextUrl.searchParams.get("per_page")) || 25)
  );

  const path = `/athlete/activities?per_page=${perPage}&page=1`;
  const res = await stravaApiFetch(gate.userId, path);
  if (!res.ok) {
    const text = await res.text();
    return NextResponse.json(
      { error: "Strava indisponible", detail: text.slice(0, 200) },
      { status: res.status === 401 ? 401 : 502 }
    );
  }

  const data = (await res.json()) as unknown;
  if (!Array.isArray(data)) {
    return NextResponse.json({ activities: [] });
  }

  const activities = data
    .map(normalize)
    .filter((x): x is StravaActivityPayload => x != null);

  return NextResponse.json({ activities });
}
