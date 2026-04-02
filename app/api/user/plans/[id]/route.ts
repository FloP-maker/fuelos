import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUserId } from "@/lib/api/requireUser";

type RouteContext = { params: Promise<{ id: string }> };

export async function PATCH(req: Request, ctx: RouteContext) {
  const gate = await requireUserId();
  if (!gate.ok) return gate.res;

  const { id } = await ctx.params;

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const rec = body as {
    title?: string | null;
    payload?: unknown;
    setActive?: boolean;
  };

  const existing = await prisma.planSnapshot.findFirst({
    where: { id, userId: gate.userId },
  });
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const updated = await prisma.$transaction(async (tx) => {
    if (rec.setActive === true) {
      await tx.planSnapshot.updateMany({
        where: { userId: gate.userId },
        data: { isActive: false },
      });
    }

    return tx.planSnapshot.update({
      where: { id },
      data: {
        ...(rec.title !== undefined ? { title: rec.title?.trim() || null } : {}),
        ...(rec.payload !== undefined && typeof rec.payload === "object"
          ? { payload: rec.payload as object }
          : {}),
        ...(rec.setActive === true ? { isActive: true } : {}),
      },
    });
  });

  return NextResponse.json({ snapshot: updated });
}

export async function DELETE(_req: Request, ctx: RouteContext) {
  const gate = await requireUserId();
  if (!gate.ok) return gate.res;

  const { id } = await ctx.params;

  const existing = await prisma.planSnapshot.findFirst({
    where: { id, userId: gate.userId },
  });
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  await prisma.planSnapshot.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
