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

  // `npm run dev` — secret obligatoire pour Auth.js
  if (process.env.NODE_ENV !== "production") {
    console.warn(
      "[auth] AUTH_SECRET absent : secret de développement local. En prod : openssl rand -base64 32"
    );
    return DEV_AUTH_SECRET_FALLBACK;
  }

  // `next start` en local : NODE_ENV=production mais pas de variables Vercel — opt-in explicite
  if (process.env.AUTH_INSECURE_LOCAL_FALLBACK === "true") {
    console.warn(
      "[auth] AUTH_INSECURE_LOCAL_FALLBACK=true — réservé aux tests locaux (next start), jamais sur Internet."
    );
    return DEV_AUTH_SECRET_FALLBACK;
  }

  if (process.env.VERCEL) {
    console.error(
      "[auth] Variable AUTH_SECRET (ou NEXTAUTH_SECRET) manquante côté Vercel. Tableau de bord → Settings → Environment Variables : ajoutez-la pour Production et pour Preview, puis redeployez."
    );
  } else {
    console.error(
      "[auth] AUTH_SECRET manquant en production. Ajoutez-le au .env (openssl rand -base64 32) ou pour un test local avec next start uniquement : AUTH_INSECURE_LOCAL_FALLBACK=true."
    );
  }
  return undefined;
}

/** Prend en charge les noms courants (Auth.js, ancien NextAuth, Google, Resend). */
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
  debug: process.env.AUTH_DEBUG === "1",
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
  session: {
    strategy: "database",
    // Session persistante entre visites (30 jours), prolongée à l'usage.
    maxAge: 30 * 24 * 60 * 60,
    updateAge: 24 * 60 * 60,
  },
  trustHost: true,
  callbacks: {
    session({ session, user }) {
      if (session.user) session.user.id = user.id;
      return session;
    },
  },
});
