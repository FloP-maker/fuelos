import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import type { ActivityDetail, ActivityProviderName, ActivitySummary, GPXTrack } from "@/types/integrations";

const ONE_DAY_MS = 24 * 60 * 60 * 1000;

export async function getCachedActivity(
  userId: string,
  provider: ActivityProviderName,
  activityId: string
): Promise<{ summary: ActivitySummary | null; detail: ActivityDetail | null; gpxTrack: GPXTrack | null } | null> {
  const row = await prisma.cachedActivity.findUnique({
    where: { userId_provider_providerActivityId: { userId, provider, providerActivityId: activityId } },
  });
  if (!row) return null;
  const fresh = row.fetchedAt.getTime() > Date.now() - ONE_DAY_MS;
  if (!fresh) return null;
  return {
    summary: row.summary as unknown as ActivitySummary,
    detail: (row.detail as unknown as ActivityDetail | null) ?? null,
    gpxTrack: (row.gpxTrack as unknown as GPXTrack | null) ?? null,
  };
}

export async function upsertCachedActivity(args: {
  userId: string;
  provider: ActivityProviderName;
  activityId: string;
  summary: ActivitySummary;
  detail?: ActivityDetail | null;
  gpxTrack?: GPXTrack | null;
}) {
  const { userId, provider, activityId, summary, detail = null, gpxTrack = null } = args;
  await prisma.cachedActivity.upsert({
    where: { userId_provider_providerActivityId: { userId, provider, providerActivityId: activityId } },
    create: {
      userId,
      provider,
      providerActivityId: activityId,
      summary: summary as unknown as object,
      detail: detail ? (detail as unknown as object) : Prisma.JsonNull,
      gpxTrack: gpxTrack ? (gpxTrack as unknown as object) : Prisma.JsonNull,
      fetchedAt: new Date(),
    },
    update: {
      summary: summary as unknown as object,
      detail: detail ? (detail as unknown as object) : Prisma.JsonNull,
      gpxTrack: gpxTrack ? (gpxTrack as unknown as object) : Prisma.JsonNull,
      fetchedAt: new Date(),
    },
  });
}
