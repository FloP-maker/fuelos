import type { CourseGeometry, EventDetails, TimelineItem } from "./types";
import {
  buildTimeDistancePacing,
  distanceKmAtRaceTime,
  distanceKmAtRaceTimePaced,
  elevationAtDistanceKm,
  gradientPercentAtKm,
} from "./courseGeometry";

const WEATHER_HOT = new Set(["Chaud (20-30°C)", "Très chaud (>30°C)"]);

/**
 * Ajoute sur chaque prise une justification liée au GPX (pente, phase, type de produit),
 * ancrée en physiologie de l’effort (perfusion splanchnique, oxydation CHO exogène, hydratation).
 * Appeler après `refineIntakeTimesForCourse` pour que l’heure corresponde au point du tracé.
 */
export function annotateTimelineWithGpxIntakeRationale(timeline: TimelineItem[], event: EventDetails): void {
  const geo = event.courseGeometry;
  if (!geo) return;

  const durationMin = Math.max(1, event.targetTime * 60);
  const distKm = event.distance;
  if (distKm <= 0) return;

  const pacing = buildTimeDistancePacing(geo, durationMin);
  const kmAtTime = (timeMin: number) =>
    pacing ? distanceKmAtRaceTimePaced(timeMin, pacing, durationMin) : distanceKmAtRaceTime(timeMin, durationMin, distKm);

  const maxKm = geo.cumulativeKm[geo.cumulativeKm.length - 1] ?? 0;
  const hot = WEATHER_HOT.has(event.weather);

  for (const item of timeline) {
    const text = buildRationaleLine(item, event, geo, durationMin, kmAtTime, maxKm, hot);
    if (!text) continue;
    if (item.alert?.trim()) {
      item.alert = `${text} · ${item.alert}`;
    } else {
      item.alert = text;
    }
  }
}

function buildRationaleLine(
  item: TimelineItem,
  event: EventDetails,
  geo: CourseGeometry,
  durationMin: number,
  kmAtTime: (t: number) => number,
  maxKm: number,
  hot: boolean
): string | null {
  const t = item.timeMin;
  const phase = t / durationMin;
  const km = kmAtTime(t);
  const g = gradientPercentAtKm(geo, km);
  const elev = Math.round(elevationAtDistanceKm(geo, km));
  const gStr = `${g >= 0 ? "+" : ""}${g.toFixed(1)}`;

  const kmAhead = Math.min(maxKm, km + 0.35);
  const gAhead = gradientPercentAtKm(geo, kmAhead);
  const beforeSteep = gAhead > 5 && g < 2.5;

  const loc = `Tracé ~${km.toFixed(1)} km, ≈${elev} m, pente locale ${gStr} %.`;

  if (item.source === "aid-station") {
    return (
      `${loc} Point de ravitaillement : recharge glucidique et hydrique sans transporter le poids sur tout le parcours ; ` +
      `prends le temps d’absorber avant les segments les plus exigeants (la montée augmente l’oxydation des CHO et la sollicitation digestif–musculaire).`
    );
  }

  if (item.source !== "personal") return null;

  const terrain =
    g <= -0.8
      ? "Passage descendant ou très plat : en général un peu moins de contrainte mécanique sur l’estomac et une perfusion intestinale relativement plus favorable qu’en forte côte — bon créneau pour absorber."
      : g >= 6
        ? "Forte montée : le travail isométrique du tronc et l’intensité relative réduisent le flux splanchnique — privilégie des volumes modérés, liquides ou semi‑liquides, et de l’eau avec les gels."
        : g >= 3
          ? "Montée modérée : l’oxydation glucidique augmente avec la charge ; ce carburant limite l’appel aux réserves de glycogène musculaire."
          : "Secteur plutôt roulant : utile pour fractionner les apports et rester sous le plafond d’oxydation intestinal individuel (souvent ~60–90 g/h selon entraînement et mélange glucose/fructose).";

  const phaseHint =
    phase < 0.22
      ? " Début d’épreuve : amorcer tôt le flux de CHO exogènes aide à préserver le glycogène plus tard (stratégie multi‑source / entraînement digestif)."
      : phase > 0.78
        ? " Fin d’épreuve : les stocks internes baissent ; le CHO buccal reste un levier majeur pour la performance musculaire et cognitive."
        : " Milieu de course : maintien d’un apport régulier pour éviter les creux de glycémie fonctionnelle et soutenir le rythme.";

  const climbAhead = beforeSteep
    ? " Le profil se redresse juste après : anticiper avec du CHO assimilable limite le déficit en tête de montée."
    : "";

  if (item.type === "drink" && (item.water ?? 0) > 0) {
    const hyd = hot
      ? " Boisson : par chaleur, fractionner soutient la volémie et la thermorégulation (sueur) ; l’eau seule ne remplace pas le sodium perdu."
      : " Boisson : l’apport conjoint sodium–glucose facilite l’absorption de l’eau au niveau intestinal (cotransport) — repère classique en nutrition d’endurance.";
    return clampText(`${loc} ${terrain}${phaseHint}${climbAhead}${hyd}`);
  }

  if (item.type === "gel" || item.type === "chew") {
    const gelExtra =
      g > 4
        ? " En côte, associer de l’eau au gel rapproche une dilution mieux tolérée qu’un concentré seul."
        : "";
    const cho =
      item.choTarget != null
        ? ` Cible horaire du plan ≈${item.choTarget} g CHO/h : cette prise contribue au quota sans saturer d’un coup.`
        : "";
    return clampText(`${loc} ${terrain}${phaseHint}${climbAhead}${gelExtra}${cho}`);
  }

  if (item.type === "bar" || item.type === "real-food") {
    const solid =
      g < 3
        ? " Aliment solide : la vidange gastrique est en général plus confortable quand la charge verticale reste modérée."
        : " Solide en terrain vallonné : mâcher vite et boire un peu aide à fluidifier le bol et à limiter l’inconfort digestif.";
    return clampText(`${loc} ${terrain}${phaseHint}${climbAhead}${solid}`);
  }

  return clampText(`${loc} ${terrain}${phaseHint}${climbAhead}`);
}

function clampText(s: string, max = 560): string {
  if (s.length <= max) return s;
  const cut = s.slice(0, max);
  const last = Math.max(cut.lastIndexOf("."), cut.lastIndexOf(" ;"));
  return (last > 280 ? cut.slice(0, last + 1) : cut).trim() + "…";
}
