const WEATHER_BUCKETS = [
  { max: 10, label: "Froid (<10°C)" as const },
  { max: 20, label: "Tempéré (10-20°C)" as const },
  { max: 30, label: "Chaud (20-30°C)" as const },
  { max: Infinity, label: "Très chaud (>30°C)" as const },
];

export function weatherCategoryFromTempC(tempC: number): string {
  for (const b of WEATHER_BUCKETS) {
    if (tempC < b.max) return b.label;
  }
  return "Très chaud (>30°C)";
}

export type GeocodeHit = {
  name: string;
  latitude: number;
  longitude: number;
  admin1?: string;
  country?: string;
  timezone?: string;
};

export async function geocodePlace(query: string): Promise<GeocodeHit | null> {
  const q = query.trim();
  if (q.length < 2) return null;

  const url = new URL("https://geocoding-api.open-meteo.com/v1/search");
  url.searchParams.set("name", q);
  url.searchParams.set("count", "5");
  url.searchParams.set("language", "fr");
  url.searchParams.set("format", "json");

  const res = await fetch(url.toString());
  if (!res.ok) return null;
  const data = (await res.json()) as {
    results?: Array<{
      name: string;
      latitude: number;
      longitude: number;
      admin1?: string;
      country?: string;
      timezone?: string;
    }>;
  };
  const hit = data.results?.[0];
  if (!hit) return null;

  return {
    name: hit.name,
    latitude: hit.latitude,
    longitude: hit.longitude,
    admin1: hit.admin1,
    country: hit.country,
    timezone: hit.timezone,
  };
}

export type MeteoSnapshot = {
  tempC: number;
  humidityPct: number;
  timeUtc: string;
};

/** Valeur par défaut pour champ datetime-local (~2 semaines, 07:00). */
export function defaultRaceStartLocal(): string {
  const d = new Date();
  d.setDate(d.getDate() + 14);
  d.setHours(7, 0, 0, 0);
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}`;
}
