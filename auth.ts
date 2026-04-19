import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import Apple from "next-auth/providers/apple";
import Credentials from "next-auth/providers/credentials";
import Resend from "next-auth/providers/resend";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { prisma } from "@/lib/prisma";
import { verifyPassword } from "@/lib/passwordCredentials";

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

/** Prend en charge les noms courants (Auth.js, ancien NextAuth, Google, Resend, Apple). */
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
  appleId:
    process.env.AUTH_APPLE_ID ||
    process.env.APPLE_ID ||
    process.env.APPLE_CLIENT_ID,
  appleSecret:
    process.env.AUTH_APPLE_SECRET ||
    process.env.APPLE_SECRET ||
    process.env.APPLE_CLIENT_SECRET,
};

const googleConfigured = Boolean(env.googleId?.trim()) && Boolean(env.googleSecret?.trim());

const resendConfigured = Boolean(env.resendKey?.trim());

const appleConfigured = Boolean(env.appleId?.trim()) && Boolean(env.appleSecret?.trim());

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
    ...(appleConfigured
      ? [
          Apple({
            clientId: env.appleId!.trim(),
            clientSecret: env.appleSecret!.trim(),
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
    Credentials({
      id: "credentials",
      name: "E-mail et mot de passe",
      credentials: {
        email: { label: "E-mail", type: "email" },
        password: { label: "Mot de passe", type: "password" },
      },
      async authorize(credentials) {
        const email =
          typeof credentials?.email === "string"
            ? credentials.email.trim().toLowerCase()
            : "";
        const password =
          typeof credentials?.password === "string" ? credentials.password : "";
        if (!email || !password) return null;

        const user = await prisma.user.findUnique({
          where: { email },
          select: {
            id: true,
            email: true,
            name: true,
            image: true,
            passwordHash: true,
          },
        });
        if (!user?.passwordHash) return null;
        if (!verifyPassword(password, user.passwordHash)) return null;

        return {
          id: user.id,
          email: user.email ?? undefined,
          name: user.name ?? undefined,
          image: user.image ?? undefined,
        };
      },
    }),
  ],
  session: {
    // JWT : aligné sur le flux « credentials » d’Auth.js (cookie chiffré) ; OAuth / lien magique aussi.
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60,
    updateAge: 24 * 60 * 60,
  },
  trustHost: true,
  callbacks: {
    jwt({ token, user }) {
      if (user?.id) {
        token.sub = user.id;
        token.id = user.id;
      }
      return token;
    },
    session({ session, token }) {
      if (session.user) {
        const id = (token.sub ?? token.id) as string | undefined;
        if (id) session.user.id = id;
      }
      return session;
    },
  },
});
