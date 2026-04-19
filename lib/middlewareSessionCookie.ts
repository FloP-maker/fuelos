import type { NextRequest } from "next/server";

/**
 * Détecte un cookie de session Auth.js / NextAuth sans importer Prisma (middleware Edge).
 * Couvre : `authjs.session-token`, préfixes `__Secure-` / `__Host-`, cookies fragmentés `.0`, `.1`, …
 * et l’ancien nom `next-auth.session-token`.
 * @see https://authjs.dev/guides/upgrade-to-v5
 */
const SESSION_COOKIE_RE =
  /^(?:__Secure-|__Host-)?authjs\.session-token(?:\.\d+)?$|^(?:__Secure-|__Host-)?next-auth\.session-token(?:\.\d+)?$/;

export function hasLikelySessionCookie(req: NextRequest): boolean {
  for (const { name, value } of req.cookies.getAll()) {
    if (SESSION_COOKIE_RE.test(name) && typeof value === "string" && value.length > 0) {
      return true;
    }
  }
  return false;
}
