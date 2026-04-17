/**
 * Préfixes d’URL réservés aux utilisateurs connectés.
 * Doit rester aligné avec `middleware.ts` (matcher) et avec les entrées « compte » du header.
 *
 * Le middleware Edge ne charge pas `auth`/Prisma : il vérifie seulement la présence du cookie
 * de session (`lib/middlewareSessionCookie.ts`). Les routes API refusent toujours sans session valide.
 */
export const AUTH_REQUIRED_PATH_PREFIXES = [
  "/prep",
  "/race",
  "/history",
  "/mes-plans-courses",
  "/races",
] as const;

export function pathnameRequiresAuthentication(pathname: string): boolean {
  return AUTH_REQUIRED_PATH_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`)
  );
}
