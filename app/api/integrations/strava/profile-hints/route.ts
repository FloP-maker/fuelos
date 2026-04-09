import { NextResponse } from "next/server";

import { requireUserId } from "@/lib/api/requireUser";
import { stravaApiFetch } from "@/lib/strava/fetchApi";
import { inferPrimaryDisciplineFromStravaActivities } from "@/lib/strava/mapActivity";

export async function GET() {
  const gate = await requireUserId();
  if (!gate.ok) return gate.res;

  const athleteRes = await stravaApiFetch(gate.userId, "/athlete");
  if (!athleteRes.ok) {
    const text = await athleteRes.text();
    return NextResponse.json(
      { error: "Strava indisponible", detail: text.slice(0, 200) },
      { status: athleteRes.status === 401 ? 401 : 502 }
    );
  }

  const athlete = (await athleteRes.json()) as Record<string, unknown>;
  const weightRaw = athlete.weight;
  const weightKg =
    typeof weightRaw === "number" && Number.isFinite(weightRaw) && weightRaw > 30 && weightRaw < 200
      ? Math.round(weightRaw * 10) / 10
      : undefined;

  const actsRes = await stravaApiFetch(gate.userId, "/athlete/activities?per_page=40&page=1");
  let suggestedDiscipline: ReturnType<typeof inferPrimaryDisciplineFromStravaActivities> = null;
  if (actsRes.ok) {
    const arr = (await actsRes.json()) as unknown;
    if (Array.isArray(arr)) {
      const normalized = arr
        .map((raw) => {
          if (!raw || typeof raw !== "object") return null;
          const o = raw as Record<string, unknown>;
          return {
            type: typeof o.type === "string" ? o.type : "Workout",
            distance: typeof o.distance === "number" ? o.distance : 0,
            total_elevation_gain: typeof o.total_elevation_gain === "number" ? o.total_elevation_gain : 0,
          };
        })
        .filter((x): x is NonNullable<typeof x> => x != null);
      suggestedDiscipline = inferPrimaryDisciplineFromStravaActivities(normalized);
    }
  }

  return NextResponse.json({
    weightKg,
    suggestedDiscipline,
    firstname: typeof athlete.firstname === "string" ? athlete.firstname : null,
  });
}
