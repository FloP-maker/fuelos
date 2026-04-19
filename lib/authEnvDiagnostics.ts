/**
 * État des variables d’environnement pour l’auth (présence uniquement, jamais les valeurs).
 * Doit rester aligné avec la logique de `auth.ts`.
 */
export function getAuthEnvDiagnostics() {
  const googleId =
    process.env.AUTH_GOOGLE_ID ||
    process.env.AUTH_GOOGLE_CLIENT_ID ||
    process.env.GOOGLE_CLIENT_ID ||
    process.env.GOOGLE_ID;
  const googleSecret =
    process.env.AUTH_GOOGLE_SECRET ||
    process.env.AUTH_GOOGLE_CLIENT_SECRET ||
    process.env.GOOGLE_CLIENT_SECRET ||
    process.env.GOOGLE_SECRET;

  const hasAuthSecret = Boolean(
    process.env.AUTH_SECRET?.trim() || process.env.NEXTAUTH_SECRET?.trim()
  );
  const hasGoogleId = Boolean(googleId?.trim());
  const hasGoogleSecret = Boolean(googleSecret?.trim());
  const googleComplete = hasGoogleId && hasGoogleSecret;
  const hasDatabaseUrl = Boolean(process.env.DATABASE_URL?.trim());
  const providerCount = googleComplete ? 1 : 0;

  return {
    nodeEnv: process.env.NODE_ENV ?? "",
    vercel: Boolean(process.env.VERCEL),
    hasAuthSecret,
    hasDatabaseUrl,
    hasGoogleId,
    hasGoogleSecret,
    googleComplete,
    providerCount,
  };
}
