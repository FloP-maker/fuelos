import type { StravaConnection } from "@prisma/client";

import { prisma } from "@/lib/prisma";

import { stravaEnv, stravaRedirectUri } from "./config";

export async function getStravaConnection(
  userId: string
): Promise<StravaConnection | null> {
  return prisma.stravaConnection.findUnique({ where: { userId } });
}

type TokenJson = {
  access_token: string;
  refresh_token?: string;
  expires_at: number;
  expires_in?: number;
  athlete?: { id?: number };
};

async function postToken(body: URLSearchParams): Promise<TokenJson> {
  const env = stravaEnv();
  if (!env) throw new Error("Strava non configuré");
  const res = await fetch("https://www.strava.com/oauth/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
  });
  const data = (await res.json().catch(() => null)) as unknown;
  if (!res.ok) {
    const msg =
      data && typeof data === "object" && data !== null && "message" in data
        ? String((data as { message: unknown }).message)
        : `HTTP ${res.status}`;
    throw new Error(msg);
  }
  return data as TokenJson;
}

export async function exchangeStravaCode(code: string): Promise<{
  accessToken: string;
  refreshToken: string;
  expiresAt: Date;
  athleteId: string;
}> {
  const env = stravaEnv();
  if (!env) throw new Error("Strava non configuré");
  const body = new URLSearchParams({
    client_id: env.clientId,
    client_secret: env.clientSecret,
    code,
    grant_type: "authorization_code",
  });
  const redirectUri = stravaRedirectUri();
  body.set("redirect_uri", redirectUri);

  const t = await postToken(body);
  const refreshToken = t.refresh_token?.trim();
  if (!refreshToken) {
    throw new Error("Strava n’a pas renvoyé de refresh_token");
  }
  let athleteId = t.athlete?.id != null ? String(t.athlete.id) : null;
  if (athleteId == null) {
    const athleteRes = await fetch("https://www.strava.com/api/v3/athlete", {
      headers: { Authorization: `Bearer ${t.access_token}` },
    });
    const athlete = (await athleteRes.json().catch(() => null)) as {
      id?: number;
    } | null;
    athleteId = athlete?.id != null ? String(athlete.id) : "0";
  }

  const expiresAt =
    typeof t.expires_at === "number"
      ? new Date(t.expires_at * 1000)
      : new Date(Date.now() + (t.expires_in ?? 21600) * 1000);

  return {
    accessToken: t.access_token,
    refreshToken,
    expiresAt,
    athleteId: athleteId ?? "0",
  };
}

export async function refreshStravaTokens(
  conn: StravaConnection
): Promise<StravaConnection> {
  const env = stravaEnv();
  if (!env) throw new Error("Strava non configuré");
  const body = new URLSearchParams({
    client_id: env.clientId,
    client_secret: env.clientSecret,
    refresh_token: conn.refreshToken,
    grant_type: "refresh_token",
  });
  const t = await postToken(body);
  const expiresAt =
    typeof t.expires_at === "number"
      ? new Date(t.expires_at * 1000)
      : new Date(Date.now() + (t.expires_in ?? 21600) * 1000);

  return prisma.stravaConnection.update({
    where: { id: conn.id },
    data: {
      accessToken: t.access_token,
      refreshToken: t.refresh_token?.trim() ? t.refresh_token : conn.refreshToken,
      expiresAt,
    },
  });
}

/** Accès valide (rafraîchit si expiration &lt; 2 min). */
export async function getValidStravaConnection(
  userId: string
): Promise<StravaConnection | null> {
  let conn = await getStravaConnection(userId);
  if (!conn) return null;
  const bufferMs = 120_000;
  if (conn.expiresAt.getTime() > Date.now() + bufferMs) return conn;
  try {
    conn = await refreshStravaTokens(conn);
  } catch {
    return null;
  }
  return conn;
}
