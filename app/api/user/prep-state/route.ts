import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUserId } from "@/lib/api/requireUser";

export async function GET() {
  const gate = await requireUserId();
  if (!gate.ok) return gate.res;

  const row = await prisma.prepState.findUnique({
    where: { userId: gate.userId },
    select: { state: true, updatedAt: true },
  });

  return NextResponse.json({ prepState: row?.state ?? null, updatedAt: row?.updatedAt ?? null });
}

/** Upsert complet de l'état PREP pour l'utilisateur connecté. */
export async function PATCH(req: Request) {
  const gate = await requireUserId();
  if (!gate.ok) return gate.res;

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const rec = body as { prepState?: unknown };
  if (rec.prepState === undefined || rec.prepState === null || typeof rec.prepState !== "object") {
    return NextResponse.json({ error: "prepState (object) is required" }, { status: 400 });
  }

  const saved = await prisma.prepState.upsert({
    where: { userId: gate.userId },
    update: { state: rec.prepState as object },
    create: { userId: gate.userId, state: rec.prepState as object },
    select: { state: true, updatedAt: true },
  });

  return NextResponse.json({ prepState: saved.state, updatedAt: saved.updatedAt });
}
