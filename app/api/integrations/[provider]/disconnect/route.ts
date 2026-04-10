import { NextResponse } from "next/server";

import { requireUserId } from "@/lib/api/requireUser";
import { providers } from "@/lib/integrations/providers";
import type { ActivityProviderName } from "@/types/integrations";

function resolveProvider(raw: string): ActivityProviderName | null {
  if (raw === "strava" || raw === "garmin" || raw === "wahoo") return raw;
  return null;
}

export async function POST(_req: Request, ctx: { params: Promise<{ provider: string }> }) {
  const gate = await requireUserId();
  if (!gate.ok) return gate.res;
  const { provider: raw } = await ctx.params;
  const provider = resolveProvider(raw);
  if (!provider) return NextResponse.json({ error: "Unknown provider" }, { status: 400 });
  await providers[provider].disconnect(gate.userId);
  return NextResponse.json({ ok: true });
}
