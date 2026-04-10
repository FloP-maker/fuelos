import { randomUUID } from "crypto";
import { NextResponse } from "next/server";
import { requireUserId } from "@/lib/api/requireUser";
import { prisma } from "@/lib/prisma";
import {
  coerceRaceEventPayload,
  raceEventFromJson,
  raceEventToJson,
} from "@/lib/nutrition/raceHistory";
import { syncDefaultProfileRaceMemoryForUser } from "@/lib/server/syncRaceMemoryProfile";

export async function GET() {
  const gate = await requireUserId();
  if (!gate.ok) return gate.res;

  const rows = await prisma.raceEvent.findMany({
    where: { userId: gate.userId },
    orderBy: { raceDate: "desc" },
  });

  const races = rows
    .map((row) => {
      const p = raceEventFromJson(row.payload);
      if (!p) return null;
      if (p.id !== row.id) {
        return { ...p, id: row.id };
      }
      return p;
    })
    .filter((x): x is NonNullable<typeof x> => x !== null);

  return NextResponse.json({ races });
}

export async function POST(req: Request) {
  const gate = await requireUserId();
  if (!gate.ok) return gate.res;

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const id = randomUUID();
  const now = new Date().toISOString();
  const merged =
    body && typeof body === "object"
      ? {
          ...(body as Record<string, unknown>),
          id,
          userId: gate.userId,
          createdAt: now,
          updatedAt: now,
        }
      : null;

  const race = coerceRaceEventPayload(merged, { userId: gate.userId, id });
  if (!race) {
    return NextResponse.json({ error: "Invalid race payload" }, { status: 400 });
  }

  const persisted = { ...race, id };
  const jsonPayload = raceEventToJson(persisted);

  await prisma.raceEvent.create({
    data: {
      id,
      userId: gate.userId,
      raceDate: persisted.date,
      nutritionScore: persisted.nutritionScore,
      payload: jsonPayload as object,
    },
  });

  await syncDefaultProfileRaceMemoryForUser(gate.userId).catch(() => {
    /* profil absent ou données partielles */
  });

  return NextResponse.json({ race: persisted });
}
