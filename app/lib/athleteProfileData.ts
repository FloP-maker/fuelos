import type { AthleteProfile } from "@/app/lib/types";

function isRecord(v: unknown): v is Record<string, unknown> {
  return v !== null && typeof v === "object" && !Array.isArray(v);
}

/** Valide et normalise le JSON `data` d’un profil stocké (API / DB). */
export function athleteProfileFromJson(raw: unknown): AthleteProfile | null {
  if (!isRecord(raw)) return null;

  const weight = Number(raw.weight);
  const age = Number(raw.age);
  if (!Number.isFinite(weight) || weight < 25 || weight > 250) return null;
  if (!Number.isFinite(age) || age < 10 || age > 120) return null;

  if (raw.gender !== "M" && raw.gender !== "F") return null;

  const sweatRate = Number(raw.sweatRate);
  if (!Number.isFinite(sweatRate) || sweatRate < 0 || sweatRate > 6) return null;

  const gi = raw.giTolerance;
  if (gi !== "sensitive" && gi !== "normal" && gi !== "robust") return null;

  const allergies = Array.isArray(raw.allergies)
    ? raw.allergies.filter((x): x is string => typeof x === "string")
    : [];

  let preferredProducts: AthleteProfile["preferredProducts"];
  if (raw.preferredProducts !== undefined) {
    if (!isRecord(raw.preferredProducts)) return null;
    const pp = raw.preferredProducts;
    const gels = Array.isArray(pp.gels) ? pp.gels.filter((x): x is string => typeof x === "string") : [];
    const drinks = Array.isArray(pp.drinks) ? pp.drinks.filter((x): x is string => typeof x === "string") : [];
    const bars = Array.isArray(pp.bars) ? pp.bars.filter((x): x is string => typeof x === "string") : [];
    const realFood = Array.isArray(pp.realFood)
      ? pp.realFood.filter((x): x is string => typeof x === "string")
      : [];
    preferredProducts = { gels, drinks, bars, realFood };
  }

  let avoidProducts: string[] | undefined;
  if (raw.avoidProducts !== undefined) {
    if (!Array.isArray(raw.avoidProducts)) return null;
    avoidProducts = raw.avoidProducts.filter((x): x is string => typeof x === "string");
  }

  let tastePreferences: AthleteProfile["tastePreferences"];
  if (raw.tastePreferences !== undefined) {
    if (!isRecord(raw.tastePreferences)) return null;
    const tp = raw.tastePreferences;
    const sweetness = tp.sweetness;
    if (sweetness !== "low" && sweetness !== "medium" && sweetness !== "high") return null;
    const flavors = Array.isArray(tp.flavors)
      ? tp.flavors.filter((x): x is string => typeof x === "string")
      : [];
    tastePreferences = { sweetness, flavors };
  }

  const out: AthleteProfile = {
    weight,
    age,
    gender: raw.gender,
    sweatRate,
    giTolerance: gi,
    allergies,
  };
  if (preferredProducts) out.preferredProducts = preferredProducts;
  if (avoidProducts?.length) out.avoidProducts = avoidProducts;
  if (tastePreferences) out.tastePreferences = tastePreferences;
  return out;
}
