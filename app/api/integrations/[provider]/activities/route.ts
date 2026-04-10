import { NextRequest, NextResponse } from "next/server";

import { requireUserId } from "@/lib/api/requireUser";
import { providers } from "@/lib/integrations/providers";
import type { ActivityProviderName } from "@/types/integrations";

function resolveProvider(raw: string): ActivityProviderName | null {
  if (raw === "strava" || raw === "garmin" || raw === "wahoo") return raw;
  return null;
}

export async function GET(req: NextRequest, ctx: { params: Promise<{ provider: string }> }) {
  const gate = await requireUserId();
  if (!gate.ok) return gate.res;
  const { provider: raw } = await ctx.params;
  const provider = resolveProvider(raw);
  if (!provider) return NextResponse.json({ error: "Unknown provider" }, { status: 400 });
  const limit = Number(req.nextUrl.searchParams.get("limit") ?? "20");
  const items = await providers[provider].getRecentActivities(gate.userId, limit);
  return NextResponse.json({ activities: items });
}
