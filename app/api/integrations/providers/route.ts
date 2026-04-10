import { NextResponse } from "next/server";

import { requireUserId } from "@/lib/api/requireUser";
import { prisma } from "@/lib/prisma";

const PROVIDERS = ["strava", "garmin", "wahoo"] as const;

export async function GET() {
  const gate = await requireUserId();
  if (!gate.ok) return gate.res;
  const tokens = await prisma.providerToken.findMany({
    where: { userId: gate.userId, provider: { in: [...PROVIDERS] } },
  });
  const byProvider = new Map(tokens.map((t) => [t.provider, t]));
  const now = Date.now();
  return NextResponse.json({
    providers: PROVIDERS.map((provider) => {
      const token = byProvider.get(provider);
      const expired = token?.expiresAt ? token.expiresAt.getTime() <= now : false;
      return {
        provider,
        connected: !!token && !expired,
        needsReconnect: !!token && expired,
        athleteName: token?.athleteName ?? null,
        lastSyncAt: token?.updatedAt ?? null,
      };
    }),
  });
}
