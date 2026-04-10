import { OAuth } from "oauth";
import { NextResponse } from "next/server";

import { requireUserId } from "@/lib/api/requireUser";
import { signProviderOAuthState } from "@/lib/integrations/oauthState";

function oauthClient() {
  return new OAuth(
    "https://connectapi.garmin.com/oauth-service/oauth/request_token",
    "https://connectapi.garmin.com/oauth-service/oauth/access_token",
    process.env.GARMIN_CONSUMER_KEY ?? "",
    process.env.GARMIN_CONSUMER_SECRET ?? "",
    "1.0",
    null,
    "HMAC-SHA1"
  );
}

export async function GET() {
  const gate = await requireUserId();
  if (!gate.ok) return gate.res;
  const state = signProviderOAuthState(gate.userId, "garmin");
  const client = oauthClient();
  const token = await new Promise<{ oauthToken: string; oauthTokenSecret: string }>((resolve, reject) => {
    client.getOAuthRequestToken(
      { oauth_callback: "oob", state },
      (
        error: Error | { statusCode: number; data?: unknown } | null,
        oauthToken: string,
        oauthTokenSecret: string
      ) => {
        if (error) reject(error);
        else resolve({ oauthToken, oauthTokenSecret });
      }
    );
  });
  const url = new URL("https://connect.garmin.com/oauthConfirm");
  url.searchParams.set("oauth_token", token.oauthToken);
  url.searchParams.set("state", state);
  const res = NextResponse.redirect(url.toString());
  res.cookies.set(
    "garmin_oauth_tmp",
    JSON.stringify({
      state,
      oauthToken: token.oauthToken,
      oauthTokenSecret: token.oauthTokenSecret,
    }),
    { httpOnly: true, secure: true, sameSite: "lax", path: "/", maxAge: 10 * 60 }
  );
  return res;
}
