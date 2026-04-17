"use client";

import { useMemo, useState } from "react";
import { Header } from "../components/Header";
import { parseGpxDocument, type ParsedGpx } from "../lib/gpx";
import { useProfile } from "@/hooks/useProfile";

type CourseZone = {
  id: string;
  type: "climb" | "flat" | "downhill";
  startKm: number;
  endKm: number;
  avgSlopePct: number;
  targetPaceMinPerKm: number;
  scienceWhy: string;
};

function paceLabel(value: number): string {
  const mm = Math.floor(value);
  const ss = Math.round((value - mm) * 60);
  return `${String(mm).padStart(2, "0")}:${String(ss).padStart(2, "0")} /km`;
}

function zoneLabel(type: CourseZone["type"]): string {
  if (type === "climb") return "Montée";
  if (type === "downhill") return "Descente";
  return "Plat / roulant";
}

function computeZones(gpx: ParsedGpx, baselinePaceMinPerKm: number): CourseZone[] {
  const km = gpx.geometry.cumulativeKm;
  const ele = gpx.geometry.elevationM;
  if (km.length < 3 || ele.length < 3) return [];

  const points: { type: CourseZone["type"]; startKm: number; endKm: number; slope: number }[] = [];
  for (let i = 1; i < km.length; i += 1) {
    const dKm = km[i] - km[i - 1];
    if (dKm <= 0) continue;
    const dM = ele[i] - ele[i - 1];
    const slopePct = dM / (dKm * 1000) * 100;
    const type: CourseZone["type"] = slopePct > 3 ? "climb" : slopePct < -2 ? "downhill" : "flat";
    points.push({ type, startKm: km[i - 1], endKm: km[i], slope: slopePct });
  }

  if (!points.length) return [];
  const merged: CourseZone[] = [];
  let current = { ...points[0], totalSlope: points[0].slope, count: 1 };

  const pushCurrent = () => {
    const avgSlope = current.totalSlope / current.count;
    const paceFactor = current.type === "climb" ? 1.18 : current.type === "downhill" ? 0.92 : 1;
    merged.push({
      id: `${current.type}-${current.startKm.toFixed(1)}`,
      type: current.type,
      startKm: current.startKm,
      endKm: current.endKm,
      avgSlopePct: avgSlope,
      targetPaceMinPerKm: baselinePaceMinPerKm * paceFactor,
      scienceWhy:
        current.type === "climb"
          ? "En montée, le coût énergétique grimpe: ralentir l'allure limite la dérive cardiaque et préserve les glucides."
          : current.type === "downhill"
            ? "En descente, l'effort cardio baisse: on peut reprendre du temps sans surconsommation glucidique."
            : "Sur le plat, une allure stable optimise l'économie de course et la régularité des apports nutritionnels.",
    });
  };

  for (let i = 1; i < points.length; i += 1) {
    const p = points[i];
    if (p.type === current.type) {
      current.endKm = p.endKm;
      current.totalSlope += p.slope;
      current.count += 1;
      continue;
    }
    pushCurrent();
    current = { ...p, totalSlope: p.slope, count: 1 };
  }
  pushCurrent();

  return merged
    .filter((z) => z.endKm - z.startKm >= 0.4)
    .slice(0, 8);
}

export default function SimpleRacePlanPage() {
  const { profile } = useProfile();
  const [uploadedGpx, setUploadedGpx] = useState<ParsedGpx | null>(null);
  const [status, setStatus] = useState<"idle" | "analyzing" | "ready">("idle");
  const [error, setError] = useState<string | null>(null);
  const [planGenerated, setPlanGenerated] = useState(false);

  const baselinePace = typeof profile.runnerThresholdPaceMinPerKm === "number"
    ? profile.runnerThresholdPaceMinPerKm * 1.1
    : 6.0;

  const zones = useMemo(
    () => (uploadedGpx ? computeZones(uploadedGpx, baselinePace) : []),
    [uploadedGpx, baselinePace]
  );

  const onFile = async (file: File | null) => {
    if (!file) return;
    setError(null);
    setPlanGenerated(false);
    setStatus("analyzing");
    try {
      const text = await file.text();
      const parsed = parseGpxDocument(text);
      if (!parsed) {
        setError("GPX invalide: impossible de lire le parcours.");
        setStatus("idle");
        return;
      }
      window.setTimeout(() => {
        setUploadedGpx(parsed);
        setStatus("ready");
      }, 2000);
    } catch {
      setError("Erreur lors de la lecture du GPX.");
      setStatus("idle");
    }
  };

  return (
    <div className="fuel-page">
      <Header />
      <main className="fuel-main" style={{ paddingTop: 18 }}>
        <section className="fuel-card" style={{ padding: 20 }}>
          <p className="fuel-badge" style={{ marginBottom: 10 }}>Workflow simplifié</p>
          <h1 className="font-display" style={{ margin: 0, fontSize: "clamp(1.5rem, 3.7vw, 2rem)" }}>
            Ton plan course en 3 actions
          </h1>
          <p style={{ marginTop: 8, color: "var(--color-text-muted)" }}>
            Upload GPX, lecture du profil de course en 2 secondes, puis génération d&apos;un plan d&apos;allure par zone avec explications scientifiques.
          </p>
        </section>

        <section className="fuel-card" style={{ marginTop: 12, padding: 20 }}>
          <h2 className="font-display" style={{ margin: 0, fontSize: 18 }}>1) Upload GPX</h2>
          <label style={{ display: "block", marginTop: 10 }}>
            <input
              type="file"
              accept=".gpx,application/gpx+xml,application/xml,text/xml"
              onChange={(e) => void onFile(e.target.files?.[0] ?? null)}
              className="fuel-input-compact"
              style={{ width: "100%", padding: "10px 12px" }}
            />
          </label>
          {status === "analyzing" ? (
            <p style={{ marginTop: 10, fontWeight: 700, color: "var(--color-primary)" }}>
              Analyse du profil de course... (2s)
            </p>
          ) : null}
          {error ? (
            <p style={{ marginTop: 10, color: "var(--color-danger)", fontWeight: 700 }}>{error}</p>
          ) : null}
        </section>

        {status === "ready" && uploadedGpx ? (
          <section className="fuel-card" style={{ marginTop: 12, padding: 20 }}>
            <h2 className="font-display" style={{ margin: 0, fontSize: 18 }}>2) Profil de course détecté</h2>
            <div style={{ display: "grid", gap: 10, gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", marginTop: 12 }}>
              <div className="fuel-card" style={{ padding: 12 }}>
                <p style={{ margin: 0, color: "var(--color-text-muted)", fontSize: 12 }}>Distance</p>
                <p style={{ margin: "4px 0 0", fontWeight: 900, fontSize: 20 }}>{uploadedGpx.distanceKm.toFixed(1)} km</p>
              </div>
              <div className="fuel-card" style={{ padding: 12 }}>
                <p style={{ margin: 0, color: "var(--color-text-muted)", fontSize: 12 }}>Dénivelé positif</p>
                <p style={{ margin: "4px 0 0", fontWeight: 900, fontSize: 20 }}>{Math.round(uploadedGpx.elevationGainM)} m D+</p>
              </div>
              <div className="fuel-card" style={{ padding: 12 }}>
                <p style={{ margin: 0, color: "var(--color-text-muted)", fontSize: 12 }}>Zones clés</p>
                <p style={{ margin: "4px 0 0", fontWeight: 900, fontSize: 20 }}>{zones.length}</p>
              </div>
            </div>

            <button
              type="button"
              className="fuel-cta"
              style={{ marginTop: 14, width: "100%" }}
              onClick={() => setPlanGenerated(true)}
            >
              Générer mon plan de course
            </button>
          </section>
        ) : null}

        {planGenerated && zones.length > 0 ? (
          <section className="fuel-card" style={{ marginTop: 12, padding: 20 }}>
            <h2 className="font-display" style={{ margin: 0, fontSize: 18 }}>
              3) Résultat: allure cible par zone + science
            </h2>
            <div style={{ marginTop: 12, display: "grid", gap: 10 }}>
              {zones.map((zone) => (
                <article key={zone.id} className="fuel-card" style={{ padding: 12 }}>
                  <p style={{ margin: 0, fontSize: 12, color: "var(--color-text-muted)" }}>
                    {zoneLabel(zone.type)} · km {zone.startKm.toFixed(1)} → {zone.endKm.toFixed(1)} · pente moyenne {zone.avgSlopePct.toFixed(1)}%
                  </p>
                  <p style={{ margin: "6px 0 0", fontSize: 18, fontWeight: 900 }}>
                    Allure cible: {paceLabel(zone.targetPaceMinPerKm)}
                  </p>
                  <p style={{ margin: "6px 0 0", color: "var(--color-text-muted)", lineHeight: 1.5 }}>
                    {zone.scienceWhy}
                  </p>
                </article>
              ))}
            </div>
          </section>
        ) : null}
      </main>
    </div>
  );
}
