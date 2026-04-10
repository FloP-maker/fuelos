import { NextRequest, NextResponse } from "next/server";

import { appUrl, ensureEnv } from "@/lib/integrations/config";
import { verifyProviderOAuthState } from "@/lib/integrations/oauthState";
import { upsertProviderToken } from "@/lib/integrations/providerTokens";

export async function GET(req: NextRequest) {
  const code = req.nextUrl.searchParams.get("code");
  const state = req.nextUrl.searchParams.get("state");
  if (!code || !state) {
    return NextResponse.redirect(`${appUrl()}/profil/integrations?integration=wahoo&status=error`);
  }
  const parsedState = verifyProviderOAuthState(state);
  if (!parsedState || parsedState.provider !== "wahoo") {
    return NextResponse.redirect(`${appUrl()}/profil/integrations?integration=wahoo&status=badstate`);
  }
  const body = new URLSearchParams({
    grant_type: "authorization_code",
    code,
    client_id: ensureEnv("WAHOO_CLIENT_ID"),
    client_secret: ensureEnv("WAHOO_CLIENT_SECRET"),
    redirect_uri: `${appUrl()}/api/integrations/wahoo/callback`,
  });
  const tokenRes = await fetch("https://api.wahooligan.com/oauth/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
  });
  if (!tokenRes.ok) {
    return NextResponse.redirect(`${appUrl()}/profil/integrations?integration=wahoo&status=token_error`);
  }
  const token = (await tokenRes.json()) as {
    access_token: string;
    refresh_token?: string;
    expires_in?: number;
    scope?: string;
  };
  await upsertProviderToken({
    userId: parsedState.userId,
    provider: "wahoo",
    accessToken: token.access_token,
    refreshToken: token.refresh_token ?? null,
    expiresAt: token.expires_in ? new Date(Date.now() + token.expires_in * 1000) : null,
    scope: token.scope ?? "workouts_read",
  });
  return NextResponse.redirect(`${appUrl()}/profil/integrations?integration=wahoo&status=success`);
}
