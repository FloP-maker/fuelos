import type { RaceEvent } from "@/types/race";
import type { PlannedIntake } from "@/types/race-session";

/** Totaux et deltas pour le tableau récap (rapport post-course). */
export type PlannedVsActualSummary = {
  choPlannedG: number;
  choActualG: number;
  sodiumPlannedMg: number;
  sodiumActualMg: number;
  fluidPlannedMl: number;
  fluidActualMl: number;
  intakesPlanned: number;
  intakesTakenOrModified: number;
  intakesModified: number;
  intakesVomited: number;
};

// Re-export assimilated logic without circular deps — duplicate minimal:
function choAssimilated(i: PlannedIntake): number {
  if (i.status === "vomited" || i.status === "skipped") return 0;
  if (i.status === "taken" || i.status === "modified" || i.status === "delayed") {
    if (i.actualIntake) return Math.max(0, i.actualIntake.choG);
    return Math.max(0, i.choG);
  }
  return 0;
}

function sodiumAssimilated(i: PlannedIntake): number {
  if (i.status === "vomited" || i.status === "skipped") return 0;
  if (i.status === "taken" || i.status === "modified" || i.status === "delayed") {
    if (i.actualIntake) return Math.max(0, i.actualIntake.sodiumMg);
    return Math.max(0, i.sodiumMg);
  }
  return 0;
}

function fluidAssimilated(i: PlannedIntake): number {
  if (i.status === "vomited" || i.status === "skipped") return 0;
  if (i.status === "taken" || i.status === "modified" || i.status === "delayed") {
    if (i.actualIntake) return Math.max(0, i.actualIntake.fluidMl);
    return Math.max(0, i.fluidMl);
  }
  return 0;
}

export function summarizePlannedVsActual(intakes: PlannedIntake[]): PlannedVsActualSummary {
  let choPlannedG = 0;
  let sodiumPlannedMg = 0;
  let fluidPlannedMl = 0;
  let choActualG = 0;
  let sodiumActualMg = 0;
  let fluidActualMl = 0;
  let intakesTakenOrModified = 0;
  let intakesModified = 0;
  let intakesVomited = 0;

  for (const i of intakes) {
    choPlannedG += i.choG;
    sodiumPlannedMg += i.sodiumMg;
    fluidPlannedMl += i.fluidMl;
    choActualG += choAssimilated(i);
    sodiumActualMg += sodiumAssimilated(i);
    fluidActualMl += fluidAssimilated(i);
    if (i.status === "taken" || i.status === "modified" || i.status === "delayed") intakesTakenOrModified += 1;
    if (i.status === "modified") intakesModified += 1;
    if (i.status === "vomited") intakesVomited += 1;
  }

  return {
    choPlannedG,
    choActualG,
    sodiumPlannedMg,
    sodiumActualMg,
    fluidPlannedMl,
    fluidActualMl,
    intakesPlanned: intakes.length,
    intakesTakenOrModified,
    intakesModified,
    intakesVomited,
  };
}

export type PhaseSlice = {
  label: string;
  compliancePct: number;
  giNotes: string;
  badge: "good" | "mid" | "bad";
};

export function phaseAnalysis(race: RaceEvent, intakes: PlannedIntake[]): PhaseSlice[] {
  const d = Math.max(0.001, race.distanceKm);
  const ranges = [
    { label: "0–33 %", start: 0, end: d * 0.33 },
    { label: "33–66 %", start: d * 0.33, end: d * 0.66 },
    { label: "66–100 %", start: d * 0.66, end: d },
  ] as const;

  return ranges.map(({ label, start, end }) => {
    const inPhase = intakes.filter((i) => i.scheduledAtKm >= start && i.scheduledAtKm < end);
    const ok = inPhase.filter((i) => i.status === "taken" || i.status === "modified" || i.status === "delayed");
    const compliancePct =
      inPhase.length === 0 ? 100 : Math.round((ok.length / inPhase.length) * 100);
    const badGi = inPhase.filter(
      (i) => i.actualIntake?.giReaction === "moderate" || i.actualIntake?.giReaction === "severe"
    );
    const giNotes =
      badGi.length > 0
        ? `${badGi.length} signalement(s) GI modéré/sévère`
        : race.giLog.notes.slice(0, 80) || "RAS";
    let badge: PhaseSlice["badge"] = "good";
    if (compliancePct < 50) badge = "bad";
    else if (compliancePct < 75) badge = "mid";
    return { label, compliancePct, giNotes, badge };
  });
}

type CumulativePoint = { km: number; plannedChoPerH: number; actualChoPerH: number };

/** Courbes CHO/h cumulées (approximation par km) pour le graphique. */
export function cumulativeChoPerKmSeries(
  intakes: PlannedIntake[],
  distanceKm: number,
  durationMin: number
): CumulativePoint[] {
  const d = Math.max(distanceKm, 1);
  const hours = Math.max(durationMin / 60, 0.01);
  const steps = 24;
  const out: CumulativePoint[] = [];
  for (let s = 0; s <= steps; s++) {
    const km = (s / steps) * d;
    const plannedCum = intakes
      .filter((i) => i.scheduledAtKm <= km)
      .reduce((a, i) => a + i.choG, 0);
    const actualCum = intakes
      .filter((i) => i.scheduledAtKm <= km)
      .reduce((a, i) => a + choAssimilated(i), 0);
    out.push({
      km,
      plannedChoPerH: plannedCum / hours,
      actualChoPerH: actualCum / hours,
    });
  }
  return out;
}
