/**
 * Préfixes d’URL réservés aux utilisateurs connectés.
 * Doit rester aligné avec `middleware.ts` (matcher) et avec les entrées « compte » du header.
 */
export const AUTH_REQUIRED_PATH_PREFIXES = [
  "/prep",
  "/race",
  "/history",
  "/races",
  "/analyses",
  "/learn",
] as const;

export function pathnameRequiresAuthentication(pathname: string): boolean {
  return AUTH_REQUIRED_PATH_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`)
  );
}
