import type { EventDetails, FuelPlan } from "@/app/lib/types";
import type { ProductItem, RaceEvent, RaceSport, RaceWeatherCondition } from "@/types/race";

function parseLeadingNumber(q: string): number {
  const m = /^(\d+(\.\d+)?)/.exec(String(q).trim());
  return m ? Number(m[1]) : 1;
}

function eventWeatherToCondition(
  event: EventDetails,
  tempFallback: number,
  humidityFallback: number
): RaceWeatherCondition {
  const w = (event.weather ?? "").toLowerCase();
  if (/pluie|rain|storm/.test(w)) return "pluie";
  if (/chaud|chaleur|hot|heat|canicule/.test(w)) return "chaleur";
  if (/froid|cold|gel|neige/.test(w)) return "froid";
  if (/nuage|cloud|couvert|overcast/.test(w)) return "nuageux";
  if (tempFallback >= 28 && (event.weatherHumidityPct ?? humidityFallback) < 40) return "chaleur";
  if (tempFallback <= 8) return "froid";
  if ((event.weatherHumidityPct ?? humidityFallback) > 85) return "nuageux";
  return "soleil";
}

export function mapEventSportToRaceSport(sport: string): RaceSport {
  const s = sport.toLowerCase();
  if (s.includes("trail") || s.includes("ultra")) return "trail";
  if (s.includes("tri")) return "triathlon";
  if (s.includes("vélo") || s.includes("velo") || s.includes("cycl") || s.includes("bike")) return "cyclisme";
  if (s.includes("marathon")) return "marathon";
  return "autre";
}

export function plannedNutritionFromFuelPlan(
  plan: FuelPlan,
  event: EventDetails
): RaceEvent["plannedNutrition"] {
  const durationMin = Math.max(1, Math.round(event.targetTime * 60));
  const dist = Math.max(0.001, event.distance);
  const totalProducts: ProductItem[] = (plan.timeline ?? []).map((item) => {
    const km = Math.min(
      dist,
      Math.max(0, (item.timeMin / durationMin) * dist)
    );
    return {
      productId: item.productId,
      name: item.product,
      quantity: parseLeadingNumber(item.quantity),
      takenAtKm: km,
    };
  });
  return {
    choPerHour: plan.choPerHour,
    sodiumPerHour: plan.sodiumPerHour,
    fluidPerHour: plan.waterPerHour,
    totalProducts,
  };
}

export function readWeatherFromEvent(
  event: EventDetails
): { tempC: number; humidity: number; conditions: RaceWeatherCondition } {
  const tempC =
    event.weatherAuto?.tempC ??
    (typeof event.latitude === "number" ? 18 : 18);
  const humidity =
    event.weatherHumidityPct ??
    event.weatherAuto?.humidityPct ??
    50;
  return {
    tempC,
    humidity,
    conditions: eventWeatherToCondition(event, tempC, humidity),
  };
}

export function parseActivePlanBundle(
  raw: unknown
): { plan: FuelPlan; event: EventDetails } | null {
  if (!raw || typeof raw !== "object") return null;
  const o = raw as Record<string, unknown>;
  const plan = o.plan;
  const event = o.event;
  if (!plan || typeof plan !== "object" || !event || typeof event !== "object") return null;
  const p = plan as Record<string, unknown>;
  const e = event as Record<string, unknown>;
  const cho = Number(p.choPerHour);
  const water = Number(p.waterPerHour);
  const na = Number(p.sodiumPerHour);
  const distance = Number(e.distance);
  const targetTime = Number(e.targetTime);
  if (![cho, water, na, distance, targetTime].every((n) => Number.isFinite(n))) return null;
  if (!Array.isArray(p.timeline)) return null;
  return { plan: plan as FuelPlan, event: event as EventDetails };
}