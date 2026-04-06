import { NextRequest, NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { appBaseUrl } from "@/lib/strava/config";
import { verifyStravaOAuthState } from "@/lib/strava/oauthState";
import { exchangeStravaCode } from "@/lib/strava/token";

function redirectToPlan(query: string) {
  return NextResponse.redirect(`${appBaseUrl()}/plan?step=event${query}`);
}

export async function GET(req: NextRequest) {
  const err = req.nextUrl.searchParams.get("error");
  const code = req.nextUrl.searchParams.get("code");
  const state = req.nextUrl.searchParams.get("state");

  if (err === "access_denied") {
    return redirectToPlan("&strava=denied");
  }

  if (err) {
    return redirectToPlan("&strava=error");
  }

  if (!code || !state) {
    return redirectToPlan("&strava=error");
  }

  const parsed = verifyStravaOAuthState(state);
  if (!parsed) {
    return redirectToPlan("&strava=badstate");
  }

  try {
    const tokens = await exchangeStravaCode(code);
    await prisma.stravaConnection.upsert({
      where: { userId: parsed.userId },
      create: {
        userId: parsed.userId,
        athleteId: tokens.athleteId,
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
        expiresAt: tokens.expiresAt,
      },
      update: {
        athleteId: tokens.athleteId,
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
        expiresAt: tokens.expiresAt,
      },
    });
  } catch {
    return redirectToPlan("&strava=token_error");
  }

  return redirectToPlan("&strava=connected");
}
