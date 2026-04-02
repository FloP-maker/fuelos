import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUserId } from "@/lib/api/requireUser";

export async function GET() {
  const gate = await requireUserId();
  if (!gate.ok) return gate.res;

  const snap = await prisma.planSnapshot.findFirst({
    where: { userId: gate.userId, isActive: true },
    orderBy: { updatedAt: "desc" },
  });

  if (!snap) return NextResponse.json({ snapshot: null });
  return NextResponse.json({ snapshot: snap });
}

/** Remplace le JSON du plan marqué actif (ex. variant météo Race Mode). */
export async function PATCH(req: Request) {
  const gate = await requireUserId();
  if (!gate.ok) return gate.res;

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const rec = body as { payload?: unknown };
  if (rec.payload === undefined || typeof rec.payload !== "object") {
    return NextResponse.json({ error: "payload (object) is required" }, { status: 400 });
  }

  const snap = await prisma.planSnapshot.findFirst({
    where: { userId: gate.userId, isActive: true },
    orderBy: { updatedAt: "desc" },
  });

  if (!snap) {
    return NextResponse.json({ error: "No active plan" }, { status: 404 });
  }

  const updated = await prisma.planSnapshot.update({
    where: { id: snap.id },
    data: { payload: rec.payload as object },
  });

  return NextResponse.json({ snapshot: updated });
}
