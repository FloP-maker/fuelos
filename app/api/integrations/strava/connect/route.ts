import { NextResponse } from "next/server";

import { requireUserId } from "@/lib/api/requireUser";
import { stravaEnv, stravaRedirectUri } from "@/lib/strava/config";
import { signStravaOAuthState } from "@/lib/strava/oauthState";

export async function GET() {
  const gate = await requireUserId();
  if (!gate.ok) return gate.res;

  const env = stravaEnv();
  if (!env) {
    return NextResponse.json(
      { error: "Strava non configuré (STRAVA_CLIENT_ID / STRAVA_CLIENT_SECRET)" },
      { status: 503 }
    );
  }

  const state = signStravaOAuthState(gate.userId);
  const redirectUri = stravaRedirectUri();
  const url = new URL("https://www.strava.com/oauth/authorize");
  url.searchParams.set("client_id", env.clientId);
  url.searchParams.set("redirect_uri", redirectUri);
  url.searchParams.set("response_type", "code");
  url.searchParams.set("approval_prompt", "force");
  url.searchParams.set("scope", "read,activity:read_all");
  url.searchParams.set("state", state);

  return NextResponse.redirect(url.toString());
}
