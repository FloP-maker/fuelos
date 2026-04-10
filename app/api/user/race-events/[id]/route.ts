import { NextResponse } from "next/server";
import { requireUserId } from "@/lib/api/requireUser";
import { prisma } from "@/lib/prisma";
import {
  coerceRaceEventPayload,
  raceEventFromJson,
  raceEventToJson,
} from "@/lib/nutrition/raceHistory";
import { syncDefaultProfileRaceMemoryForUser } from "@/lib/server/syncRaceMemoryProfile";

type RouteCtx = { params: Promise<{ id: string }> };

export async function GET(_req: Request, ctx: RouteCtx) {
  const gate = await requireUserId();
  if (!gate.ok) return gate.res;
  const { id } = await ctx.params;

  const row = await prisma.raceEvent.findFirst({
    where: { id, userId: gate.userId },
  });
  if (!row) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const p = raceEventFromJson(row.payload);
  if (!p) {
    return NextResponse.json({ error: "Corrupt payload" }, { status: 500 });
  }
  const race = p.id === row.id ? p : { ...p, id: row.id };
  return NextResponse.json({ race });
}

export async function PATCH(req: Request, ctx: RouteCtx) {
  const gate = await requireUserId();
  if (!gate.ok) return gate.res;
  const { id } = await ctx.params;

  const existing = await prisma.raceEvent.findFirst({
    where: { id, userId: gate.userId },
  });
  if (!existing) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const now = new Date().toISOString();
  const prev = raceEventFromJson(existing.payload);
  const patch = body && typeof body === "object" ? (body as Record<string, unknown>) : null;
  const merged =
    prev && patch
      ? {
          ...raceEventToJson(prev),
          ...patch,
          id,
          userId: gate.userId,
          createdAt: prev.createdAt.toISOString(),
          updatedAt: now,
        }
      : null;

  const race = coerceRaceEventPayload(merged, { userId: gate.userId, id });
  if (!race) {
    return NextResponse.json({ error: "Invalid race payload" }, { status: 400 });
  }

  const persisted = { ...race, id, createdAt: race.createdAt, updatedAt: new Date(now) };
  const jsonPayload = raceEventToJson(persisted);

  await prisma.raceEvent.update({
    where: { id },
    data: {
      raceDate: persisted.date,
      nutritionScore: persisted.nutritionScore,
      payload: jsonPayload as object,
    },
  });

  await syncDefaultProfileRaceMemoryForUser(gate.userId).catch(() => {});

  return NextResponse.json({ race: persisted });
}

export async function DELETE(_req: Request, ctx: RouteCtx) {
  const gate = await requireUserId();
  if (!gate.ok) return gate.res;
  const { id } = await ctx.params;

  const row = await prisma.raceEvent.findFirst({
    where: { id, userId: gate.userId },
  });
  if (!row) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  await prisma.raceEvent.delete({ where: { id } });
  await syncDefaultProfileRaceMemoryForUser(gate.userId).catch(() => {});

  return NextResponse.json({ ok: true });
}
