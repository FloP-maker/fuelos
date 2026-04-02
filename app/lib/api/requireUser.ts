import { auth } from "@/auth";
import { NextResponse } from "next/server";

export async function requireUserId(): Promise<
  | { ok: true; userId: string }
  | { ok: false; res: NextResponse }
> {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) {
    return { ok: false, res: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };
  }
  return { ok: true, userId };
}
