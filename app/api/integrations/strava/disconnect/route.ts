import { NextResponse } from "next/server";

import { requireUserId } from "@/lib/api/requireUser";
import { prisma } from "@/lib/prisma";

export async function POST() {
  const gate = await requireUserId();
  if (!gate.ok) return gate.res;

  await prisma.stravaConnection.deleteMany({ where: { userId: gate.userId } });
  return NextResponse.json({ ok: true });
}
