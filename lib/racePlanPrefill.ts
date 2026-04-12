import type { RaceEntry } from "@/lib/types/race";
import type { FuelOsUserProfile } from "@/lib/fuelOsUserProfile";
import { mergeFuelOsIntoAthlete } from "@/lib/fuelOsUserProfile";
import { defaultAthleteProfile } from "@/app/lib/athleteProfileData";

const PLAN_SPORTS = new Set([
  "Course à pied",
  "Trail",
  "Cyclisme",
  "Triathlon",
  "Ultra-trail",
]);

/** Mappe la discipline du modal « Nouvelle course » vers les libellés du planificateur. */
export function mapRaceDisciplineToPlanSport(discipline: string): string {
  const d = discipline.trim();
  if (d === "Route") return "Course à pied";
  if (d === "Trail") return "Trail";
  if (d === "Ultra") return "Ultra-trail";
  if (d === "Triathlon") return "Triathlon";
  if (d === "Vélo") return "Cyclisme";
  return "Trail";
}

/** Chemin du wizard plan avec préremplissage (profil FuelOS + course). */
export function buildPlanWizardUrlFromRace(race: RaceEntry, fuelProfile: FuelOsUserProfile): string {
  const sport = mapRaceDisciplineToPlanSport(race.sport);
  const planSport = PLAN_SPORTS.has(sport) ? sport : "Trail";
  const athlete = mergeFuelOsIntoAthlete(fuelProfile, defaultAthleteProfile());

  const q = new URLSearchParams();
  q.set("onboarding", "1");
  q.set("sport", planSport);

  const dist = typeof race.distance === "number" && race.distance > 0 ? race.distance : 42;
  q.set("distance", String(dist));

  if (typeof race.elevationGain === "number" && race.elevationGain >= 0) {
    q.set("elevationGain", String(race.elevationGain));
  }

  if (typeof athlete.weight === "number" && athlete.weight > 0) {
    q.set("weight", String(athlete.weight));
  }
  if (typeof athlete.sweatRate === "number" && athlete.sweatRate > 0) {
    q.set("sweatRate", String(athlete.sweatRate));
  }
  if (athlete.giTolerance === "sensitive" || athlete.giTolerance === "normal" || athlete.giTolerance === "robust") {
    q.set("giTolerance", athlete.giTolerance);
  }

  return `/plan?${q.toString()}`;
}
