import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthEnvDiagnostics } from "@/lib/authEnvDiagnostics";

function redactDbUrlMeta(raw: string | undefined) {
  if (!raw) return null;
  try {
    const url = new URL(raw);
    const sslmode = url.searchParams.get("sslmode");
    return {
      protocol: url.protocol.replace(":", ""),
      host: url.hostname,
      port: url.port || null,
      username: url.username || null,
      database: url.pathname.replace(/^\//, "") || null,
      sslmode,
    };
  } catch {
    return { parseError: true };
  }
}

/** Diagnostic runtime : présence env + tentative réelle d'accès DB (aucun secret renvoyé). */
export async function GET() {
  const env = getAuthEnvDiagnostics();
  const dbUrlMeta = redactDbUrlMeta(process.env.DATABASE_URL);
  const directUrlMeta = redactDbUrlMeta(process.env.DIRECT_URL);

  let dbConnectOk = false;
  let dbError: string | null = null;

  try {
    await prisma.$queryRaw`SELECT 1`;
    dbConnectOk = true;
  } catch (error) {
    dbError = error instanceof Error ? error.message : "Unknown database error";
  }

  return NextResponse.json({
    env,
    dbConnectOk,
    dbError,
    dbUrlMeta,
    directUrlMeta,
  });
}
