import { getValidStravaConnection } from "./token";

export async function stravaApiFetch(
  userId: string,
  path: string,
  init?: RequestInit
): Promise<Response> {
  const conn = await getValidStravaConnection(userId);
  if (!conn) {
    return new Response(JSON.stringify({ error: "Strava non connecté" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }
  const url = path.startsWith("http")
    ? path
    : `https://www.strava.com/api/v3${path.startsWith("/") ? "" : "/"}${path}`;
  return fetch(url, {
    ...init,
    headers: {
      Authorization: `Bearer ${conn.accessToken}`,
      Accept: "application/json",
      ...init?.headers,
    },
  });
}
