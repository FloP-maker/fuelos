import { NextResponse } from "next/server";

import { requireUserId } from "@/lib/api/requireUser";
import { stravaEnv } from "@/lib/strava/config";
import { getStravaConnection } from "@/lib/strava/token";

export async function GET() {
  const gate = await requireUserId();
  if (!gate.ok) return gate.res;

  const configured = stravaEnv() != null;
  const row = await getStravaConnection(gate.userId);

  return NextResponse.json({
    configured,
    connected: row != null,
    athleteId: row?.athleteId ?? null,
  });
}
