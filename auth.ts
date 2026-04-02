import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import Resend from "next-auth/providers/resend";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { prisma } from "@/lib/prisma";

const DEV_AUTH_SECRET_FALLBACK =
  "fuelos-dev-only-insecure-secret-do-not-use-in-production";

function resolveAuthSecret(): string | undefined {
  const fromEnv =
    process.env.AUTH_SECRET?.trim() || process.env.NEXTAUTH_SECRET?.trim();
  if (fromEnv) return fromEnv;
  // En `next dev`, Auth.js exige un secret : valeur locale uniquement (jamais en build prod).
  if (process.env.NODE_ENV !== "production") {
    console.warn(
      "[auth] AUTH_SECRET absent : utilisation d’un secret de développement. Pour la prod, définissez AUTH_SECRET (openssl rand -base64 32)."
    );
    return DEV_AUTH_SECRET_FALLBACK;
  }
  return undefined;
}

/** Prend en charge les noms Courants (Auth.js, ancien NextAuth, Google, Resend). */
const env = {
  googleId:
    process.env.AUTH_GOOGLE_ID ||
    process.env.AUTH_GOOGLE_CLIENT_ID ||
    process.env.GOOGLE_CLIENT_ID ||
    process.env.GOOGLE_ID,
  googleSecret:
    process.env.AUTH_GOOGLE_SECRET ||
    process.env.AUTH_GOOGLE_CLIENT_SECRET ||
    process.env.GOOGLE_CLIENT_SECRET ||
    process.env.GOOGLE_SECRET,
  resendKey: process.env.AUTH_RESEND_KEY || process.env.RESEND_API_KEY,
};

const googleConfigured = Boolean(env.googleId?.trim()) && Boolean(env.googleSecret?.trim());

const resendConfigured = Boolean(env.resendKey?.trim());

export const { handlers, auth, signIn, signOut } = NextAuth({
  secret: resolveAuthSecret(),
  adapter: PrismaAdapter(prisma),
  providers: [
    ...(googleConfigured
      ? [
          Google({
            clientId: env.googleId!.trim(),
            clientSecret: env.googleSecret!.trim(),
          }),
        ]
      : []),
    ...(resendConfigured
      ? [
          Resend({
            apiKey: env.resendKey!.trim(),
            from:
              process.env.AUTH_EMAIL_FROM ?? "FuelOS <onboarding@resend.dev>",
          }),
        ]
      : []),
  ],
  session: { strategy: "database" },
  trustHost: true,
  callbacks: {
    session({ session, user }) {
      if (session.user) session.user.id = user.id;
      return session;
    },
  },
});
