import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUserId } from "@/lib/api/requireUser";

const DEFAULT_LIMIT = 100;

export async function GET(req: Request) {
  const gate = await requireUserId();
  if (!gate.ok) return gate.res;

  const { searchParams } = new URL(req.url);
  const limit = Math.min(
    Math.max(Number(searchParams.get("limit") || DEFAULT_LIMIT), 1),
    500
  );

  const rows = await prisma.raceDebrief.findMany({
    where: { userId: gate.userId },
    orderBy: { finishedAt: "desc" },
    take: limit,
  });

  return NextResponse.json({ debriefs: rows });
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

  const rec = body as { payload?: unknown; finishedAt?: string };

  if (rec.payload === undefined || typeof rec.payload !== "object") {
    return NextResponse.json({ error: "payload (object) is required" }, { status: 400 });
  }

  const finishedAt = rec.finishedAt ? new Date(rec.finishedAt) : new Date();
  if (Number.isNaN(finishedAt.getTime())) {
    return NextResponse.json({ error: "finishedAt must be a valid ISO date" }, { status: 400 });
  }

  const row = await prisma.raceDebrief.create({
    data: {
      userId: gate.userId,
      payload: rec.payload as object,
      finishedAt,
    },
  });

  return NextResponse.json({ debrief: row });
}

export async function PATCH(req: Request) {
  const gate = await requireUserId();
  if (!gate.ok) return gate.res;

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const rec = body as { id?: string; payload?: unknown };
  if (!rec.id || typeof rec.id !== "string") {
    return NextResponse.json({ error: "id (string) is required" }, { status: 400 });
  }
  if (rec.payload === undefined || typeof rec.payload !== "object") {
    return NextResponse.json({ error: "payload (object) is required" }, { status: 400 });
  }

  const row = await prisma.raceDebrief.findFirst({
    where: { id: rec.id, userId: gate.userId },
    select: { id: true },
  });
  if (!row) {
    return NextResponse.json({ error: "Debrief not found" }, { status: 404 });
  }

  const updated = await prisma.raceDebrief.update({
    where: { id: rec.id },
    data: { payload: rec.payload as object },
  });

  return NextResponse.json({ debrief: updated });
}
