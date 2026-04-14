import { auth } from "@/auth";
import { pathnameRequiresAuthentication } from "@/lib/authRequiredRoutes";
import { NextResponse } from "next/server";

export default auth((req) => {
  const { pathname } = req.nextUrl;
  if (!pathnameRequiresAuthentication(pathname)) {
    return NextResponse.next();
  }
  if (req.auth) {
    return NextResponse.next();
  }
  const signIn = new URL("/api/auth/signin", req.nextUrl.origin);
  signIn.searchParams.set("callbackUrl", `${pathname}${req.nextUrl.search}`);
  return NextResponse.redirect(signIn);
});

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
