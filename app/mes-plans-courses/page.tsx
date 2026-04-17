"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Header } from "../components/Header";
import { parseGpxDocument, type ParsedGpx } from "../lib/gpx";
import { calculateFuelPlan } from "../lib/fuelCalculator";
import { mergeStoredAthleteProfile } from "../lib/athleteProfileData";
import type { EventDetails, Product } from "../lib/types";
import { defaultRaceStartLocal } from "../lib/meteo";

const CUSTOM_PRODUCTS_STORAGE_KEY = "fuelos_custom_products";

type CourseZone = {
  id: string;
  type: "climb" | "flat" | "downhill";
  startKm: number;
  endKm: number;
  avgSlopePct: number;
  scienceWhy: string;
};

function suggestTargetHours(distance: number): number {
  if (distance <= 10) return 1.0;
  if (distance <= 21) return 2.5;
  if (distance <= 42) return 4.5;
  if (distance <= 50) return 6.0;
  if (distance <= 80) return 10.0;
  return 16.0;
}

function formatHours(hours: number): string {
  if (hours < 1) return `${Math.round(hours * 60)} min`;
  const h = Math.floor(hours);
  const m = Math.round((hours - h) * 60);
  return m === 0 ? `${h}h` : `${h}h${m}`;
}

function computeZones(gpx: ParsedGpx): CourseZone[] {
  const km = gpx.geometry.cumulativeKm;
  const ele = gpx.geometry.elevationM;
  if (km.length < 3 || ele.length < 3) return [];
  const segments: { type: CourseZone["type"]; startKm: number; endKm: number; slope: number }[] = [];

  for (let i = 1; i < km.length; i += 1) {
    const dKm = km[i] - km[i - 1];
    if (dKm <= 0) continue;
    const slopePct = ((ele[i] - ele[i - 1]) / (dKm * 1000)) * 100;
    const type: CourseZone["type"] = slopePct > 3 ? "climb" : slopePct < -2 ? "downhill" : "flat";
    segments.push({ type, startKm: km[i - 1], endKm: km[i], slope: slopePct });
  }

  if (!segments.length) return [];
  const zones: CourseZone[] = [];
  let cur = { ...segments[0], sumSlope: segments[0].slope, count: 1 };
  const push = () => {
    zones.push({
      id: `${cur.type}-${cur.startKm.toFixed(1)}`,
      type: cur.type,
      startKm: cur.startKm,
      endKm: cur.endKm,
      avgSlopePct: cur.sumSlope / cur.count,
      scienceWhy:
        cur.type === "climb"
          ? "En montée, réduire l'intensité limite la dérive cardiaque et économise les glucides."
          : cur.type === "downhill"
            ? "En descente, le coût cardio baisse: c'est une fenêtre pour stabiliser l'hydratation et les prises."
            : "Sur le roulant, l'allure régulière améliore l'économie de course et la tolérance digestive.",
    });
  };

  for (let i = 1; i < segments.length; i += 1) {
    const s = segments[i];
    if (s.type === cur.type) {
      cur.endKm = s.endKm;
      cur.sumSlope += s.slope;
      cur.count += 1;
    } else {
      push();
      cur = { ...s, sumSlope: s.slope, count: 1 };
    }
  }
  push();

  return zones.filter((z) => z.endKm - z.startKm >= 0.5).slice(0, 8);
}

function elevationLabelFromGain(elevationGain: number): string {
  if (elevationGain <= 500) return "Plat (0-500m D+)";
  if (elevationGain <= 1500) return "Vallonné (500-1500m D+)";
  if (elevationGain <= 3000) return "Montagneux (1500-3000m D+)";
  return "Alpin (>3000m D+)";
}

export default function MesPlansCoursesPage() {
  const router = useRouter();
  const [status, setStatus] = useState<"idle" | "analyzing" | "ready">("idle");
  const [error, setError] = useState<string | null>(null);
  const [gpx, setGpx] = useState<ParsedGpx | null>(null);
  const [targetTimeHours, setTargetTimeHours] = useState<number>(6);
  const [weightKg, setWeightKg] = useState<number>(70);
  const [result, setResult] = useState<ReturnType<typeof calculateFuelPlan> | null>(null);
  const [generatedEvent, setGeneratedEvent] = useState<EventDetails | null>(null);

  const zones = useMemo(() => (gpx ? computeZones(gpx) : []), [gpx]);

  const onUploadGpx = async (file: File | null) => {
    if (!file) return;
    setError(null);
    setResult(null);
    setGeneratedEvent(null);
    setStatus("analyzing");
    try {
      const parsed = parseGpxDocument(await file.text());
      if (!parsed) {
        setStatus("idle");
        setError("GPX invalide: impossible de lire ce fichier.");
        return;
      }
      window.setTimeout(() => {
        setGpx(parsed);
        setTargetTimeHours(suggestTargetHours(parsed.distanceKm));
        setStatus("ready");
      }, 2000);
    } catch {
      setStatus("idle");
      setError("Erreur de lecture du GPX.");
    }
  };

  const onGenerateNutritionPlan = () => {
    if (!gpx) return;
    let customProducts: Product[] = [];
    try {
      const raw = localStorage.getItem(CUSTOM_PRODUCTS_STORAGE_KEY);
      if (raw) customProducts = JSON.parse(raw) as Product[];
    } catch {
      customProducts = [];
    }

    const baseProfile = mergeStoredAthleteProfile(undefined);
    const profile = { ...baseProfile, weight: weightKg };
    const event: EventDetails = {
      sport: "Trail",
      distance: gpx.distanceKm,
      elevationGain: Math.round(gpx.elevationGainM),
      targetTime: targetTimeHours,
      weather: "Tempéré (10-20°C)",
      elevation: elevationLabelFromGain(gpx.elevationGainM),
      aidStations: [],
      placeName: gpx.name ?? "Parcours GPX",
      raceStartAt: defaultRaceStartLocal(),
      courseGeometry: gpx.geometry,
    };

    const planResult = calculateFuelPlan(profile, event, customProducts);
    const bundle = {
      fuelPlan: planResult.mainPlan,
      altFuelPlan: planResult.altPlan,
      altPlanLabel: planResult.altPlanLabel,
      altPlanExplanation: planResult.altPlanExplanation,
      racePlanVariant: "main" as const,
      profile,
      event,
    };
    localStorage.setItem("fuelos_active_plan", JSON.stringify(bundle));
    setResult(planResult);
    setGeneratedEvent(event);
  };

  return (
    <div className="fuel-page">
      <Header />
      <main className="fuel-main" style={{ paddingTop: 18 }}>
        <section className="fuel-card" style={{ padding: 20 }}>
          <h1 className="font-display" style={{ margin: 0, fontSize: "clamp(1.4rem, 3.6vw, 2rem)" }}>
            Mes plans courses - Flow unique
          </h1>
          <p style={{ marginTop: 8, color: "var(--color-text-muted)", lineHeight: 1.55 }}>
            Upload GPX, paramètres minimaux, génération du plan nutrition, puis démarrage immédiat de la course.
          </p>
        </section>

        <section className="fuel-card" style={{ marginTop: 12, padding: 20 }}>
          <h2 className="font-display" style={{ margin: 0, fontSize: 18 }}>1) Upload GPX</h2>
          <input
            type="file"
            accept=".gpx,application/gpx+xml,application/xml,text/xml"
            onChange={(e) => void onUploadGpx(e.target.files?.[0] ?? null)}
            className="fuel-input-compact"
            style={{ marginTop: 10, width: "100%", padding: "10px 12px" }}
          />
          {status === "analyzing" ? (
            <p style={{ marginTop: 10, fontWeight: 700, color: "var(--color-primary)" }}>
              Analyse du GPX en cours... (2s)
            </p>
          ) : null}
          {error ? <p style={{ marginTop: 10, color: "var(--color-danger)", fontWeight: 700 }}>{error}</p> : null}
        </section>

        {status === "ready" && gpx ? (
          <>
            <section className="fuel-card" style={{ marginTop: 12, padding: 20 }}>
              <h2 className="font-display" style={{ margin: 0, fontSize: 18 }}>2) Paramètres minimaux</h2>
              <div style={{ display: "grid", gap: 10, gridTemplateColumns: "repeat(auto-fit, minmax(170px, 1fr))", marginTop: 12 }}>
                <label>
                  <span style={{ fontSize: 12, color: "var(--color-text-muted)", fontWeight: 700 }}>Objectif temps</span>
                  <input
                    type="number"
                    min={0.5}
                    step={0.1}
                    value={targetTimeHours}
                    onChange={(e) => setTargetTimeHours(Math.max(0.5, Number(e.target.value) || 0.5))}
                    className="fuel-input-compact"
                    style={{ width: "100%", marginTop: 6 }}
                  />
                </label>
                <label>
                  <span style={{ fontSize: 12, color: "var(--color-text-muted)", fontWeight: 700 }}>Poids (kg)</span>
                  <input
                    type="number"
                    min={35}
                    step={0.1}
                    value={weightKg}
                    onChange={(e) => setWeightKg(Math.max(35, Number(e.target.value) || 35))}
                    className="fuel-input-compact"
                    style={{ width: "100%", marginTop: 6 }}
                  />
                </label>
              </div>
              <button type="button" className="fuel-cta" style={{ marginTop: 14, width: "100%" }} onClick={onGenerateNutritionPlan}>
                Générer mon plan de course
              </button>
            </section>

            <section className="fuel-card" style={{ marginTop: 12, padding: 20 }}>
              <h2 className="font-display" style={{ margin: 0, fontSize: 18 }}>Profil de parcours</h2>
              <div style={{ display: "grid", gap: 10, gridTemplateColumns: "repeat(auto-fit, minmax(170px, 1fr))", marginTop: 12 }}>
                <div className="fuel-card" style={{ padding: 12 }}>
                  <p style={{ margin: 0, fontSize: 12, color: "var(--color-text-muted)" }}>Distance</p>
                  <p style={{ margin: "4px 0 0", fontSize: 20, fontWeight: 900 }}>{gpx.distanceKm.toFixed(1)} km</p>
                </div>
                <div className="fuel-card" style={{ padding: 12 }}>
                  <p style={{ margin: 0, fontSize: 12, color: "var(--color-text-muted)" }}>Dénivelé</p>
                  <p style={{ margin: "4px 0 0", fontSize: 20, fontWeight: 900 }}>{Math.round(gpx.elevationGainM)} m D+</p>
                </div>
                <div className="fuel-card" style={{ padding: 12 }}>
                  <p style={{ margin: 0, fontSize: 12, color: "var(--color-text-muted)" }}>Objectif</p>
                  <p style={{ margin: "4px 0 0", fontSize: 20, fontWeight: 900 }}>{formatHours(targetTimeHours)}</p>
                </div>
              </div>
              {!!zones.length && (
                <div style={{ marginTop: 10, display: "grid", gap: 8 }}>
                  {zones.map((z) => (
                    <article key={z.id} className="fuel-card" style={{ padding: 10 }}>
                      <p style={{ margin: 0, fontSize: 12, color: "var(--color-text-muted)" }}>
                        {z.type === "climb" ? "Montée" : z.type === "downhill" ? "Descente" : "Roulant"} · km {z.startKm.toFixed(1)} → {z.endKm.toFixed(1)} · pente {z.avgSlopePct.toFixed(1)}%
                      </p>
                      <p style={{ margin: "5px 0 0", fontSize: 13, color: "var(--color-text-muted)" }}>{z.scienceWhy}</p>
                    </article>
                  ))}
                </div>
              )}
            </section>
          </>
        ) : null}

        {result && generatedEvent ? (
          <section className="fuel-card" style={{ marginTop: 12, padding: 20 }}>
            <h2 className="font-display" style={{ margin: 0, fontSize: 18 }}>Plan nutrition généré</h2>
            <div style={{ display: "grid", gap: 10, gridTemplateColumns: "repeat(auto-fit, minmax(170px, 1fr))", marginTop: 12 }}>
              <div className="fuel-card" style={{ padding: 12 }}>
                <p style={{ margin: 0, fontSize: 12, color: "var(--color-text-muted)" }}>CHO / h</p>
                <p style={{ margin: "4px 0 0", fontSize: 20, fontWeight: 900 }}>{result.mainPlan.choPerHour} g</p>
              </div>
              <div className="fuel-card" style={{ padding: 12 }}>
                <p style={{ margin: 0, fontSize: 12, color: "var(--color-text-muted)" }}>Hydratation / h</p>
                <p style={{ margin: "4px 0 0", fontSize: 20, fontWeight: 900 }}>{result.mainPlan.waterPerHour} ml</p>
              </div>
              <div className="fuel-card" style={{ padding: 12 }}>
                <p style={{ margin: 0, fontSize: 12, color: "var(--color-text-muted)" }}>Sodium / h</p>
                <p style={{ margin: "4px 0 0", fontSize: 20, fontWeight: 900 }}>{result.mainPlan.sodiumPerHour} mg</p>
              </div>
            </div>

            <div style={{ marginTop: 12 }}>
              <p style={{ margin: 0, fontSize: 12, fontWeight: 800, color: "var(--color-text-muted)" }}>Premières prises recommandées</p>
              <div style={{ marginTop: 8, display: "grid", gap: 8 }}>
                {result.mainPlan.timeline.slice(0, 6).map((t, idx) => (
                  <article key={`${t.productId}-${idx}`} className="fuel-card" style={{ padding: 10 }}>
                    <p style={{ margin: 0, fontSize: 13, fontWeight: 700 }}>
                      T+{t.timeMin} min · {t.product} · {t.quantity}
                    </p>
                    <p style={{ margin: "4px 0 0", fontSize: 12, color: "var(--color-text-muted)" }}>
                      {t.cho}g CHO · {t.water ?? 0}ml · {t.sodium ?? 0}mg Na
                    </p>
                  </article>
                ))}
              </div>
            </div>

            <button
              type="button"
              className="fuel-cta"
              style={{ marginTop: 14, width: "100%" }}
              onClick={() => router.push("/race")}
            >
              Démarrer la course
            </button>
            <p style={{ marginTop: 8, fontSize: 12, color: "var(--color-text-muted)" }}>
              Le plan actif est déjà synchronisé pour le mode course.
            </p>
          </section>
        ) : null}
      </main>
    </div>
  );
}
