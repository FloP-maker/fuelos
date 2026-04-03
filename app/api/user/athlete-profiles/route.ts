import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUserId } from "@/lib/api/requireUser";
import { athleteProfileFromJson } from "@/app/lib/athleteProfileData";

export async function GET() {
  const gate = await requireUserId();
  if (!gate.ok) return gate.res;

  const rows = await prisma.storedAthleteProfile.findMany({
    where: { userId: gate.userId },
    orderBy: [{ isDefault: "desc" }, { updatedAt: "desc" }],
  });

  return NextResponse.json({ profiles: rows });
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
    name?: unknown;
    data?: unknown;
    isDefault?: unknown;
  };

  const name = typeof rec.name === "string" ? rec.name.trim() : "";
  if (!name || name.length > 120) {
    return NextResponse.json({ error: "name is required (max 120 chars)" }, { status: 400 });
  }

  const data = athleteProfileFromJson(rec.data);
  if (!data) {
    return NextResponse.json({ error: "Invalid profile data" }, { status: 400 });
  }

  const setDefault = rec.isDefault === true;

  const existingCount = await prisma.storedAthleteProfile.count({
    where: { userId: gate.userId },
  });
  const shouldDefault = setDefault || existingCount === 0;

  const created = await prisma.$transaction(async (tx) => {
    if (shouldDefault) {
      await tx.storedAthleteProfile.updateMany({
        where: { userId: gate.userId },
        data: { isDefault: false },
      });
    }
    return tx.storedAthleteProfile.create({
      data: {
        userId: gate.userId,
        name,
        data: data as object,
        isDefault: shouldDefault,
      },
    });
  });

  return NextResponse.json({ profile: created });
}
