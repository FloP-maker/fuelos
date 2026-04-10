import { NextRequest, NextResponse } from "next/server";

import { requireUserId } from "@/lib/api/requireUser";
import { providers } from "@/lib/integrations/providers";
import type { ActivityProviderName } from "@/types/integrations";

function resolveProvider(raw: string): ActivityProviderName | null {
  if (raw === "strava" || raw === "garmin" || raw === "wahoo") return raw;
  return null;
}

export async function POST(req: NextRequest, ctx: { params: Promise<{ provider: string }> }) {
  const gate = await requireUserId();
  if (!gate.ok) return gate.res;
  const { provider: raw } = await ctx.params;
  const provider = resolveProvider(raw);
  if (!provider) return NextResponse.json({ error: "Unknown provider" }, { status: 400 });
  const body = (await req.json().catch(() => null)) as { activityId?: string } | null;
  if (!body?.activityId) return NextResponse.json({ error: "activityId is required" }, { status: 400 });
  const detail = await providers[provider].getActivityDetail(gate.userId, body.activityId);
  const gpxTrack = await providers[provider].getGPXTrack(gate.userId, body.activityId);
  return NextResponse.json({ detail, gpxTrack });
}
