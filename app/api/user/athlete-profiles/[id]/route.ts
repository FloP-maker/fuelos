import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUserId } from "@/lib/api/requireUser";
import { athleteProfileFromJson } from "@/app/lib/athleteProfileData";

type RouteCtx = { params: Promise<{ id: string }> };

export async function PATCH(req: Request, ctx: RouteCtx) {
  const gate = await requireUserId();
  if (!gate.ok) return gate.res;

  const { id } = await ctx.params;

  const existing = await prisma.storedAthleteProfile.findFirst({
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

  const rec = body as {
    name?: unknown;
    data?: unknown;
    isDefault?: unknown;
  };

  const updates: { name?: string; data?: object; isDefault?: boolean } = {};

  if (rec.name !== undefined) {
    if (typeof rec.name !== "string") {
      return NextResponse.json({ error: "name must be a string" }, { status: 400 });
    }
    const name = rec.name.trim();
    if (!name || name.length > 120) {
      return NextResponse.json({ error: "name invalid" }, { status: 400 });
    }
    updates.name = name;
  }

  if (rec.data !== undefined) {
    const data = athleteProfileFromJson(rec.data);
    if (!data) {
      return NextResponse.json({ error: "Invalid profile data" }, { status: 400 });
    }
    updates.data = data as object;
  }

  if (rec.isDefault === true) {
    updates.isDefault = true;
  }

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: "No valid fields to update" }, { status: 400 });
  }

  const updated = await prisma.$transaction(async (tx) => {
    if (updates.isDefault) {
      await tx.storedAthleteProfile.updateMany({
        where: { userId: gate.userId },
        data: { isDefault: false },
      });
    }
    return tx.storedAthleteProfile.update({
      where: { id },
      data: updates,
    });
  });

  return NextResponse.json({ profile: updated });
}

export async function DELETE(_req: Request, ctx: RouteCtx) {
  const gate = await requireUserId();
  if (!gate.ok) return gate.res;

  const { id } = await ctx.params;

  const row = await prisma.storedAthleteProfile.findFirst({
    where: { id, userId: gate.userId },
  });
  if (!row) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  await prisma.$transaction(async (tx) => {
    await tx.storedAthleteProfile.delete({ where: { id } });
    if (row.isDefault) {
      const next = await tx.storedAthleteProfile.findFirst({
        where: { userId: gate.userId },
        orderBy: { updatedAt: "desc" },
      });
      if (next) {
        await tx.storedAthleteProfile.update({
          where: { id: next.id },
          data: { isDefault: true },
        });
      }
    }
  });

  return NextResponse.json({ ok: true });
}
