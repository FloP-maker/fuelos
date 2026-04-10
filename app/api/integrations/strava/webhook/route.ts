import { createHmac, timingSafeEqual } from "crypto";
import { NextRequest, NextResponse } from "next/server";

function verifySignature(body: string, signatureHeader: string | null): boolean {
  if (!signatureHeader) return false;
  const expected = createHmac("sha256", process.env.STRAVA_CLIENT_SECRET ?? "")
    .update(body)
    .digest("hex");
  const payload = signatureHeader.replace("sha256=", "");
  try {
    const a = Buffer.from(payload, "hex");
    const b = Buffer.from(expected, "hex");
    return a.length === b.length && timingSafeEqual(a, b);
  } catch {
    return false;
  }
}

export async function GET(req: NextRequest) {
  const mode = req.nextUrl.searchParams.get("hub.mode");
  const token = req.nextUrl.searchParams.get("hub.verify_token");
  const challenge = req.nextUrl.searchParams.get("hub.challenge");
  if (mode !== "subscribe" || token !== (process.env.STRAVA_VERIFY_TOKEN ?? "")) {
    return NextResponse.json({ error: "invalid webhook challenge" }, { status: 403 });
  }
  return NextResponse.json({ "hub.challenge": challenge ?? "" });
}

export async function POST(req: NextRequest) {
  const body = await req.text();
  if (!verifySignature(body, req.headers.get("x-hub-signature"))) {
    return NextResponse.json({ error: "invalid signature" }, { status: 401 });
  }
  const event = JSON.parse(body) as {
    object_type?: string;
    aspect_type?: string;
    object_id?: number;
  };
  // Async-by-design: we acknowledge quickly and process later.
  if (event.object_type === "activity" && event.aspect_type === "create") {
    // TODO: push a background job that links this activity to a RaceEvent (+/- 4h).
  }
  return NextResponse.json({ ok: true });
}
