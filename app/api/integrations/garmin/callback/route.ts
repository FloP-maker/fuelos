import { OAuth } from "oauth";
import { NextRequest, NextResponse } from "next/server";

import { appUrl } from "@/lib/integrations/config";
import { upsertProviderToken } from "@/lib/integrations/providerTokens";
import { verifyProviderOAuthState } from "@/lib/integrations/oauthState";

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

export async function GET(req: NextRequest) {
  const oauthToken = req.nextUrl.searchParams.get("oauth_token");
  const verifier = req.nextUrl.searchParams.get("oauth_verifier");
  const state = req.nextUrl.searchParams.get("state");
  if (!oauthToken || !verifier || !state) {
    return NextResponse.redirect(`${appUrl()}/profil/integrations?integration=garmin&status=error`);
  }
  const parsedState = verifyProviderOAuthState(state);
  if (!parsedState || parsedState.provider !== "garmin") {
    return NextResponse.redirect(`${appUrl()}/profil/integrations?integration=garmin&status=badstate`);
  }
  const tmpCookie = req.cookies.get("garmin_oauth_tmp")?.value;
  if (!tmpCookie) {
    return NextResponse.redirect(`${appUrl()}/profil/integrations?integration=garmin&status=expired`);
  }
  const tmp = JSON.parse(tmpCookie) as { state: string; oauthToken: string; oauthTokenSecret: string };
  if (tmp.state !== state || tmp.oauthToken !== oauthToken) {
    return NextResponse.redirect(`${appUrl()}/profil/integrations?integration=garmin&status=badstate`);
  }
  const client = oauthClient();
  const finalTokens = await new Promise<{ accessToken: string; accessSecret: string }>((resolve, reject) => {
    client.getOAuthAccessToken(
      oauthToken,
      tmp.oauthTokenSecret,
      verifier,
      (
        error: Error | { statusCode: number; data?: unknown } | null,
        accessToken: string,
        accessSecret: string
      ) => {
        if (error) reject(error);
        else resolve({ accessToken, accessSecret });
      }
    );
  });
  await upsertProviderToken({
    userId: parsedState.userId,
    provider: "garmin",
    accessToken: finalTokens.accessToken,
    oauthTokenSecret: finalTokens.accessSecret,
    refreshToken: null,
    expiresAt: null,
  });
  const res = NextResponse.redirect(`${appUrl()}/profil/integrations?integration=garmin&status=success`);
  res.cookies.delete("garmin_oauth_tmp");
  return res;
}
