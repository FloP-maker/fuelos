import { createHmac, timingSafeEqual } from "crypto";

import { resolveAuthSecretForStravaState } from "./resolveAuthSecret";

/** State signé (userId + expiration ~10 min) pour le callback OAuth Strava. */
export function signStravaOAuthState(userId: string): string {
  const secret = resolveAuthSecretForStravaState();
  const exp = Date.now() + 10 * 60_000;
  const payload = Buffer.from(
    JSON.stringify({ userId, exp }),
    "utf8"
  ).toString("base64url");
  const sig = createHmac("sha256", secret).update(payload).digest("base64url");
  return `${payload}.${sig}`;
}

export function verifyStravaOAuthState(state: string | null): { userId: string } | null {
  if (!state || !state.includes(".")) return null;
  const secret = resolveAuthSecretForStravaState();
  const lastDot = state.lastIndexOf(".");
  const payload = state.slice(0, lastDot);
  const sig = state.slice(lastDot + 1);
  const expected = createHmac("sha256", secret).update(payload).digest("base64url");
  try {
    const a = Buffer.from(sig, "base64url");
    const b = Buffer.from(expected, "base64url");
    if (a.length !== b.length || !timingSafeEqual(a, b)) return null;
  } catch {
    return null;
  }
  try {
    const data = JSON.parse(Buffer.from(payload, "base64url").toString("utf8")) as {
      userId?: string;
      exp?: number;
    };
    if (!data.userId || typeof data.exp !== "number") return null;
    if (Date.now() > data.exp) return null;
    return { userId: data.userId };
  } catch {
    return null;
  }
}
