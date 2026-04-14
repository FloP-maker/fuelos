import { pathnameRequiresAuthentication } from "@/lib/authRequiredRoutes";
import { hasLikelySessionCookie } from "@/lib/middlewareSessionCookie";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/**
 * Garde « compte » sans importer `@/auth` (évite Prisma + >1 Mo sur Edge / Vercel).
 * Les pages et API continuent de valider la session côté serveur.
 */
export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  if (!pathnameRequiresAuthentication(pathname)) {
    return NextResponse.next();
  }
  if (hasLikelySessionCookie(req)) {
    return NextResponse.next();
  }
  const signIn = new URL("/api/auth/signin", req.nextUrl.origin);
  signIn.searchParams.set("callbackUrl", `${pathname}${req.nextUrl.search}`);
  return NextResponse.redirect(signIn);
}

export const config = {
  matcher: [
    "/prep",
    "/prep/:path*",
    "/race",
    "/race/:path*",
    "/history",
    "/history/:path*",
    "/races",
    "/races/:path*",
    "/analyses",
    "/analyses/:path*",
    "/learn",
    "/learn/:path*",
  ],
};
