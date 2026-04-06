import { NextResponse } from "next/server";

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

export async function GET(
  _req: Request,
  ctx: { params: Promise<{ id: string }> }
) {
  const gate = await requireUserId();
  if (!gate.ok) return gate.res;

  const { id } = await ctx.params;
  const num = Number(id);
  if (!Number.isFinite(num)) {
    return NextResponse.json({ error: "id invalide" }, { status: 400 });
  }

  const res = await stravaApiFetch(gate.userId, `/activities/${num}`);
  if (!res.ok) {
    return NextResponse.json(
      { error: "Activité introuvable ou Strava indisponible" },
      { status: res.status === 404 ? 404 : 502 }
    );
  }

  const raw = await res.json();
  const activity = normalize(raw);
  if (!activity) {
    return NextResponse.json({ error: "Réponse Strava invalide" }, { status: 502 });
  }

  return NextResponse.json({ activity });
}
