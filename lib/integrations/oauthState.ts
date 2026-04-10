import { createHmac, timingSafeEqual } from "crypto";

import { resolveAuthSecretForStravaState } from "@/lib/strava/resolveAuthSecret";
import type { ActivityProviderName } from "@/types/integrations";

type StatePayload = { userId: string; provider: ActivityProviderName; exp: number };

export function signProviderOAuthState(
  userId: string,
  provider: ActivityProviderName
): string {
  const exp = Date.now() + 10 * 60_000;
  const payload: StatePayload = { userId, provider, exp };
  const encoded = Buffer.from(JSON.stringify(payload), "utf8").toString("base64url");
  const signature = createHmac("sha256", resolveAuthSecretForStravaState())
    .update(encoded)
    .digest("base64url");
  return `${encoded}.${signature}`;
}

export function verifyProviderOAuthState(state: string | null): StatePayload | null {
  if (!state || !state.includes(".")) return null;
  const [encoded, signature] = state.split(".");
  const expected = createHmac("sha256", resolveAuthSecretForStravaState())
    .update(encoded)
    .digest("base64url");
  try {
    const a = Buffer.from(signature, "base64url");
    const b = Buffer.from(expected, "base64url");
    if (a.length !== b.length || !timingSafeEqual(a, b)) return null;
    const parsed = JSON.parse(Buffer.from(encoded, "base64url").toString("utf8")) as StatePayload;
    if (!parsed.userId || !parsed.provider || typeof parsed.exp !== "number") return null;
    if (Date.now() > parsed.exp) return null;
    return parsed;
  } catch {
    return null;
  }
}
