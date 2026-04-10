import { NextResponse } from "next/server";

import { requireUserId } from "@/lib/api/requireUser";
import { appUrl, ensureEnv } from "@/lib/integrations/config";
import { signProviderOAuthState } from "@/lib/integrations/oauthState";

export async function GET() {
  const gate = await requireUserId();
  if (!gate.ok) return gate.res;
  const clientId = ensureEnv("WAHOO_CLIENT_ID");
  const state = signProviderOAuthState(gate.userId, "wahoo");
  const url = new URL("https://api.wahooligan.com/oauth/authorize");
  url.searchParams.set("client_id", clientId);
  url.searchParams.set("response_type", "code");
  url.searchParams.set("scope", "workouts_read");
  url.searchParams.set("redirect_uri", `${appUrl()}/api/integrations/wahoo/callback`);
  url.searchParams.set("state", state);
  return NextResponse.redirect(url.toString());
}
