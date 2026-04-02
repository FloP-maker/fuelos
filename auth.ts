import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import Resend from "next-auth/providers/resend";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { prisma } from "@/lib/prisma";

const googleConfigured =
  Boolean(process.env.AUTH_GOOGLE_ID) && Boolean(process.env.AUTH_GOOGLE_SECRET);

const resendConfigured = Boolean(process.env.AUTH_RESEND_KEY);

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(prisma),
  providers: [
    ...(googleConfigured
      ? [
          Google({
            clientId: process.env.AUTH_GOOGLE_ID!,
            clientSecret: process.env.AUTH_GOOGLE_SECRET!,
          }),
        ]
      : []),
    ...(resendConfigured
      ? [
          Resend({
            apiKey: process.env.AUTH_RESEND_KEY!,
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
