import { NextResponse } from "next/server";

type HourlyPayload = {
  hourly?: {
    time: string[];
    temperature_2m?: (number | null)[];
    relative_humidity_2m?: (number | null)[];
  };
  error?: boolean;
  reason?: string;
};

function parseRaceParts(isoLocal: string): { date: string; minutes: number } | null {
  const m = /^(\d{4}-\d{2}-\d{2})T(\d{2}):(\d{2})/.exec(isoLocal.trim());
  if (!m) return null;
  const date = m[1]!;
  const hh = Number(m[2]);
  const mm = Number(m[3]);
  if (!Number.isFinite(hh) || !Number.isFinite(mm)) return null;
  return { date, minutes: hh * 60 + mm };
}

function minutesFromTimeLabel(isoTime: string): number | null {
  const m = /T(\d{2}):(\d{2})/.exec(isoTime);
  if (!m) return null;
  return Number(m[1]) * 60 + Number(m[2]);
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const lat = Number(searchParams.get("latitude"));
  const lon = Number(searchParams.get("longitude"));
  const raceStartAt = searchParams.get("raceStartAt");

  if (!Number.isFinite(lat) || !Number.isFinite(lon)) {
    return NextResponse.json({ error: "latitude et longitude requis" }, { status: 400 });
  }

  const parts = raceStartAt ? parseRaceParts(raceStartAt) : null;
  if (!parts) {
    return NextResponse.json({ error: "raceStartAt invalide (attendu YYYY-MM-DDTHH:mm)" }, { status: 400 });
  }

  const url = new URL("https://api.open-meteo.com/v1/forecast");
  url.searchParams.set("latitude", String(lat));
  url.searchParams.set("longitude", String(lon));
  url.searchParams.set("hourly", "temperature_2m,relative_humidity_2m");
  url.searchParams.set("start_date", parts.date);
  url.searchParams.set("end_date", parts.date);
  url.searchParams.set("timezone", "auto");

  const res = await fetch(url.toString(), { next: { revalidate: 600 } });
  if (!res.ok) {
    return NextResponse.json({ error: "Open-Meteo indisponible" }, { status: 502 });
  }

  const body = (await res.json()) as HourlyPayload;
  const hourly = body.hourly;
  const times = hourly?.time;
  const temps = hourly?.temperature_2m;
  const hums = hourly?.relative_humidity_2m;

  if (!times?.length || !temps?.length) {
    return NextResponse.json({ error: "Pas de données horaires pour cette date" }, { status: 422 });
  }

  let bestI = 0;
  let bestDiff = Infinity;
  for (let i = 0; i < times.length; i++) {
    const mm = minutesFromTimeLabel(times[i]!);
    if (mm === null) continue;
    const diff = Math.abs(mm - parts.minutes);
    if (diff < bestDiff) {
      bestDiff = diff;
      bestI = i;
    }
  }

  const tempC = temps[bestI];
  const humidityPct = hums?.[bestI];
  if (tempC === null || tempC === undefined || !Number.isFinite(tempC)) {
    return NextResponse.json({ error: "Température manquante" }, { status: 422 });
  }

  return NextResponse.json({
    tempC,
    humidityPct:
      humidityPct !== null && humidityPct !== undefined && Number.isFinite(humidityPct)
        ? humidityPct
        : null,
    timeLocal: times[bestI],
  });
}
