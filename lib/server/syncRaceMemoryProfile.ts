import { athleteProfileFromJson } from "@/app/lib/athleteProfileData";
import { prisma } from "@/lib/prisma";
import { mergeRaceMemoryIntoProfile, raceEventFromJson } from "@/lib/nutrition/raceHistory";
import { detectPatterns } from "@/lib/nutrition/patterns";
import type { RaceEvent } from "@/types/race";

export async function syncDefaultProfileRaceMemoryForUser(userId: string): Promise<void> {
  const defaultProf = await prisma.storedAthleteProfile.findFirst({
    where: { userId, isDefault: true },
  });
  if (!defaultProf) return;

  const profile = athleteProfileFromJson(defaultProf.data);
  if (!profile) return;

  const rows = await prisma.raceEvent.findMany({
    where: { userId },
    orderBy: { raceDate: "desc" },
    take: 24,
  });

  const races = rows
    .map((r) => raceEventFromJson(r.payload))
    .filter((x) => x !== null);

  if (races.length === 0) {
    const { raceMemory: _omit, ...rest } = profile;
    void _omit;
    await prisma.storedAthleteProfile.update({
      where: { id: defaultProf.id },
      data: { data: rest as object },
    });
    return;
  }

  const updated = mergeRaceMemoryIntoProfile(profile, races, 5);

  const typedRaces = races as RaceEvent[];
  const patterns = detectPatterns(typedRaces, 3);
  const withPatterns =
    patterns != null
      ? {
          ...updated,
          patterns: {
            ...patterns,
            lastUpdatedAt: patterns.lastUpdatedAt.toISOString(),
          },
        }
      : updated;

  await prisma.storedAthleteProfile.update({
    where: { id: defaultProf.id },
    data: { data: withPatterns as object },
  });
}
