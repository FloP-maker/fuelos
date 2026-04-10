import { NextRequest, NextResponse } from "next/server";

import { appUrl, ensureEnv } from "@/lib/integrations/config";
import { upsertProviderToken } from "@/lib/integrations/providerTokens";
import { verifyProviderOAuthState } from "@/lib/integrations/oauthState";
import { prisma } from "@/lib/prisma";

function redirectToProfile(status: string) {
  return NextResponse.redirect(`${appUrl()}/profil/integrations?integration=strava&status=${status}`);
}

export async function GET(req: NextRequest) {
  const err = req.nextUrl.searchParams.get("error");
  const code = req.nextUrl.searchParams.get("code");
  const state = req.nextUrl.searchParams.get("state");

  if (err === "access_denied") {
    return redirectToProfile("denied");
  }

  if (err) {
    return redirectToProfile("error");
  }

  if (!code || !state) {
    return redirectToProfile("error");
  }

  const parsed = verifyProviderOAuthState(state);
  if (!parsed || parsed.provider !== "strava") return redirectToProfile("badstate");

  try {
    const body = new URLSearchParams({
      client_id: ensureEnv("STRAVA_CLIENT_ID"),
      client_secret: ensureEnv("STRAVA_CLIENT_SECRET"),
      code,
      grant_type: "authorization_code",
      redirect_uri: `${appUrl()}/api/integrations/strava/callback`,
    });
    const tokenRes = await fetch("https://www.strava.com/oauth/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body,
    });
    if (!tokenRes.ok) return redirectToProfile("token_error");
    const tokens = (await tokenRes.json()) as {
      access_token: string;
      refresh_token: string;
      expires_at: number;
      athlete?: { id?: number; firstname?: string; lastname?: string };
      scope?: string;
    };
    const athleteId = tokens.athlete?.id ? String(tokens.athlete.id) : null;
    const athleteName = tokens.athlete
      ? `${tokens.athlete.firstname ?? ""} ${tokens.athlete.lastname ?? ""}`.trim()
      : null;
    await upsertProviderToken({
      userId: parsed.userId,
      provider: "strava",
      accessToken: tokens.access_token,
      refreshToken: tokens.refresh_token,
      expiresAt: new Date(tokens.expires_at * 1000),
      athleteId,
      athleteName,
      scope: tokens.scope ?? null,
    });

    // Backward compatibility for existing routes still reading strava_connections.
    await prisma.stravaConnection.upsert({
      where: { userId: parsed.userId },
      create: {
        userId: parsed.userId,
        athleteId: athleteId ?? "0",
        accessToken: tokens.access_token,
        refreshToken: tokens.refresh_token,
        expiresAt: new Date(tokens.expires_at * 1000),
      },
      update: {
        athleteId: athleteId ?? "0",
        accessToken: tokens.access_token,
        refreshToken: tokens.refresh_token,
        expiresAt: new Date(tokens.expires_at * 1000),
      },
    });
  } catch {
    return redirectToProfile("token_error");
  }

  return redirectToProfile("success");
}
