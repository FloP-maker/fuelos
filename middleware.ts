import { hasLikelySessionCookie } from "@/lib/middlewareSessionCookie";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/**
 * Garde « compte » sans importer `@/auth` (évite Prisma + >1 Mo sur Edge / Vercel).
 * Les pages et API continuent de valider la session côté serveur.
 */
export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Auth endpoints and public legal pages stay accessible without session.
  if (
    pathname.startsWith("/api/auth") ||
    pathname === "/legal" ||
    pathname === "/privacy"
  ) {
    return NextResponse.next();
  }

  const hasSession = hasLikelySessionCookie(req);

  // Logged user: root path is just an entrypoint to race plans.
  if (pathname === "/" && hasSession) {
    return NextResponse.redirect(new URL("/mes-plans-courses", req.nextUrl.origin));
  }

  // Guest can only stay on root login page (plus legal/privacy handled above).
  if (pathname === "/" && !hasSession) {
    return NextResponse.next();
  }

  if (hasSession) {
    const allowedWhenSignedIn = (p: string) =>
      p === "/mes-plans-courses" ||
      p.startsWith("/mes-plans-courses/") ||
      p === "/profil" ||
      p.startsWith("/profil/") ||
      p === "/race" ||
      p.startsWith("/race/") ||
      p === "/legal" ||
      p === "/privacy";

    if (!allowedWhenSignedIn(pathname)) {
      return NextResponse.redirect(new URL("/mes-plans-courses", req.nextUrl.origin));
    }
    return NextResponse.next();
  }

  return NextResponse.redirect(new URL("/", req.nextUrl.origin));
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|sw.js|manifest.webmanifest|icons/|api/).*)",
  ],
};
