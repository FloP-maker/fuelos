/** URL publique de l’app (OAuth redirect). */
export function appBaseUrl(): string {
  const u =
    process.env.NEXTAUTH_URL?.trim() ||
    process.env.AUTH_URL?.trim() ||
    process.env.VERCEL_URL?.trim();
  if (u) {
    if (u.startsWith("http")) return u.replace(/\/$/, "");
    return `https://${u.replace(/\/$/, "")}`;
  }
  return "http://localhost:3000";
}

export function stravaEnv(): {
  clientId: string;
  clientSecret: string;
} | null {
  const clientId = process.env.STRAVA_CLIENT_ID?.trim();
  const clientSecret = process.env.STRAVA_CLIENT_SECRET?.trim();
  if (!clientId || !clientSecret) return null;
  return { clientId, clientSecret };
}

export function stravaRedirectUri(): string {
  return `${appBaseUrl()}/api/integrations/strava/callback`;
}
