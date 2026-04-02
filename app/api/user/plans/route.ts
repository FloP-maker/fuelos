import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUserId } from "@/lib/api/requireUser";

export async function GET() {
  const gate = await requireUserId();
  if (!gate.ok) return gate.res;

  const snapshots = await prisma.planSnapshot.findMany({
    where: { userId: gate.userId },
    orderBy: { updatedAt: "desc" },
    select: {
      id: true,
      title: true,
      isActive: true,
      createdAt: true,
      updatedAt: true,
      payload: true,
    },
  });

  return NextResponse.json({ snapshots });
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

  const rec = body as {
    payload?: unknown;
    title?: string | null;
    setActive?: boolean;
  };

  if (rec.payload === undefined || typeof rec.payload !== "object") {
    return NextResponse.json({ error: "payload (object) is required" }, { status: 400 });
  }

  const setActive = rec.setActive !== false;

  const created = await prisma.$transaction(async (tx) => {
    if (setActive) {
      await tx.planSnapshot.updateMany({
        where: { userId: gate.userId },
        data: { isActive: false },
      });
    }
    return tx.planSnapshot.create({
      data: {
        userId: gate.userId,
        title: rec.title?.trim() || null,
        payload: rec.payload as object,
        isActive: setActive,
      },
    });
  });

  return NextResponse.json({ snapshot: created });
}
