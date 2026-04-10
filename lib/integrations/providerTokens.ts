import type { ProviderToken } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import type { ActivityProviderName } from "@/types/integrations";

export async function getProviderToken(
  userId: string,
  provider: ActivityProviderName
): Promise<ProviderToken | null> {
  return prisma.providerToken.findUnique({ where: { userId_provider: { userId, provider } } });
}

export async function upsertProviderToken(args: {
  userId: string;
  provider: ActivityProviderName;
  accessToken: string;
  refreshToken?: string | null;
  oauthTokenSecret?: string | null;
  expiresAt?: Date | null;
  athleteId?: string | null;
  athleteName?: string | null;
  scope?: string | null;
}): Promise<ProviderToken> {
  const {
    userId,
    provider,
    accessToken,
    refreshToken = null,
    oauthTokenSecret = null,
    expiresAt = null,
    athleteId = null,
    athleteName = null,
    scope = null,
  } = args;
  return prisma.providerToken.upsert({
    where: { userId_provider: { userId, provider } },
    create: {
      userId,
      provider,
      accessToken,
      refreshToken,
      oauthTokenSecret,
      expiresAt,
      athleteId,
      athleteName,
      scope,
    },
    update: {
      accessToken,
      refreshToken,
      oauthTokenSecret,
      expiresAt,
      athleteId,
      athleteName,
      scope,
    },
  });
}

export async function disconnectProvider(
  userId: string,
  provider: ActivityProviderName
): Promise<void> {
  await prisma.providerToken.deleteMany({ where: { userId, provider } });
}
