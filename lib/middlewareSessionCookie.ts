import type { NextRequest } from "next/server";

/**
 * Noms de cookies de session Auth.js / NextAuth (v4 compat).
 * Ne pas importer `auth` / Prisma dans le middleware Edge (limite ~1 Mo Vercel).
 * @see https://authjs.dev/guides/upgrade-to-v5
 */
const SESSION_COOKIE_NAMES = [
  "__Host-authjs.session-token",
  "__Secure-authjs.session-token",
  "authjs.session-token",
  "__Host-next-auth.session-token",
  "__Secure-next-auth.session-token",
  "next-auth.session-token",
] as const;

export function hasLikelySessionCookie(req: NextRequest): boolean {
  const jar = req.cookies;
  return SESSION_COOKIE_NAMES.some((name) => {
    const v = jar.get(name);
    return typeof v?.value === "string" && v.value.length > 0;
  });
}
