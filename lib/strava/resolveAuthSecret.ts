/** Même secret que Auth.js pour signer le state OAuth (pas de nouvelle variable obligatoire). */
export function resolveAuthSecretForStravaState(): string {
  const s =
    process.env.AUTH_SECRET?.trim() ||
    process.env.NEXTAUTH_SECRET?.trim() ||
    process.env.STRAVA_OAUTH_STATE_SECRET?.trim();
  if (s) return s;
  if (process.env.NODE_ENV !== "production") {
    return "fuelos-dev-only-strava-state";
  }
  throw new Error("AUTH_SECRET requis pour signer le state Strava OAuth");
}
