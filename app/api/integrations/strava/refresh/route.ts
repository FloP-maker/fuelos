import { NextResponse } from "next/server";

import { requireUserId } from "@/lib/api/requireUser";
import { getProviderToken, upsertProviderToken } from "@/lib/integrations/providerTokens";
import { ensureEnv } from "@/lib/integrations/config";

export async function POST() {
  const gate = await requireUserId();
  if (!gate.ok) return gate.res;

  const current = await getProviderToken(gate.userId, "strava");
  if (!current) return NextResponse.json({ error: "Strava non connecté" }, { status: 404 });

  const thresholdMs = Date.now() + 5 * 60_000;
  if (current.expiresAt && current.expiresAt.getTime() > thresholdMs) {
    return NextResponse.json({ refreshed: false, expiresAt: current.expiresAt.toISOString() });
  }

  const body = new URLSearchParams({
    client_id: ensureEnv("STRAVA_CLIENT_ID"),
    client_secret: ensureEnv("STRAVA_CLIENT_SECRET"),
    grant_type: "refresh_token",
    refresh_token: current.refreshToken ?? "",
  });
  const res = await fetch("https://www.strava.com/oauth/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
  });
  if (!res.ok) return NextResponse.json({ error: "Refresh token failed" }, { status: 502 });
  const json = (await res.json()) as {
    access_token: string;
    refresh_token?: string;
    expires_at: number;
  };
  const updated = await upsertProviderToken({
    userId: gate.userId,
    provider: "strava",
    accessToken: json.access_token,
    refreshToken: json.refresh_token ?? current.refreshToken,
    expiresAt: new Date(json.expires_at * 1000),
    athleteId: current.athleteId,
    athleteName: current.athleteName,
    scope: current.scope,
  });
  return NextResponse.json({ refreshed: true, expiresAt: updated.expiresAt?.toISOString() ?? null });
}
