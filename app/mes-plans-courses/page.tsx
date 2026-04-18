"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Header } from "../components/Header";
import { parseGpxDocument, type ParsedGpx } from "../lib/gpx";
import { calculateFuelPlan } from "../lib/fuelCalculator";
import { mergeStoredAthleteProfile } from "../lib/athleteProfileData";
import type { EventDetails } from "../lib/types";
import { defaultRaceStartLocal, reverseGeocodeClient, weatherCategoryFromTempC } from "../lib/meteo";

type SportChoice = "trail" | "running" | "cycling";

function suggestTargetHours(distance: number): number {
  if (distance <= 10) return 1;
  if (distance <= 21) return 2.5;
  if (distance <= 42) return 4.5;
  if (distance <= 60) return 7;
  if (distance <= 80) return 10;
  return 14;
}

function formatHours(hours: number): string {
  const whole = Math.floor(hours);
  const mins = Math.round((hours - whole) * 60);
  if (whole <= 0) return `${mins} min`;
  if (mins === 0) return `${whole}h`;
  return `${whole}h${String(mins).padStart(2, "0")}`;
}

function elevationLabelFromGain(elevationGain: number): string {
  if (elevationGain <= 500) return "Plat (0-500m D+)";
  if (elevationGain <= 1500) return "Vallonné (500-1500m D+)";
  if (elevationGain <= 3000) return "Montagneux (1500-3000m D+)";
  return "Alpin (>3000m D+)";
}

function isoDateFromLocalDateTime(localDateTime: string): string {
  const m = /^(\d{4}-\d{2}-\d{2})T\d{2}:\d{2}$/.exec(localDateTime);
  return m?.[1] ?? new Date().toISOString().slice(0, 10);
}

export default function MesPlansCoursesPage() {
  const router = useRouter();
  const [status, setStatus] = useState<"idle" | "analyzing" | "ready">("idle");
  const [error, setError] = useState<string | null>(null);
  const [parsedGpx, setParsedGpx] = useState<ParsedGpx | null>(null);
  const [targetTimeHours, setTargetTimeHours] = useState(6);
  const [eventDate, setEventDate] = useState(isoDateFromLocalDateTime(defaultRaceStartLocal()));
  const [sport, setSport] = useState<SportChoice>("trail");
  const [detectedPlace, setDetectedPlace] = useState<string | null>(null);
  const [detectedWeather, setDetectedWeather] = useState<{
    tempC: number;
    humidityPct: number | null;
    category: string;
  } | null>(null);
  const [weatherLoading, setWeatherLoading] = useState(false);
  const [result, setResult] = useState<ReturnType<typeof calculateFuelPlan> | null>(null);
  const [resultEvent, setResultEvent] = useState<EventDetails | null>(null);

  const sportLabel = sport === "trail" ? "Trail" : sport === "running" ? "Course à pied" : "Cyclisme";

  const onUploadGpx = async (file: File | null) => {
    if (!file) return;
    setError(null);
    setStatus("analyzing");
    setResult(null);
    setResultEvent(null);
    setDetectedWeather(null);
    setDetectedPlace(null);

    try {
      const text = await file.text();
      const parsed = parseGpxDocument(text);
      if (!parsed) {
        setStatus("idle");
        setError("GPX invalide: impossible de lire le parcours.");
        return;
      }

      window.setTimeout(async () => {
        setParsedGpx(parsed);
        setTargetTimeHours(suggestTargetHours(parsed.distanceKm));
        setStatus("ready");

        const firstPoint = parsed.geometry.coordinates[0];
        if (!firstPoint) return;
        const [longitude, latitude] = firstPoint;
        const place = await reverseGeocodeClient(latitude, longitude);
        if (place) setDetectedPlace(place);
      }, 2000);
    } catch {
      setStatus("idle");
      setError("Erreur lors de la lecture du GPX.");
    }
  };

  const onFetchWeather = async () => {
    if (!parsedGpx) return;
    const firstPoint = parsedGpx.geometry.coordinates[0];
    if (!firstPoint) {
      setError("Impossible de récupérer la position depuis ce GPX.");
      return;
    }
    const [longitude, latitude] = firstPoint;

    setWeatherLoading(true);
    setError(null);
    try {
      const raceStartAt = `${eventDate}T07:00`;
      const query = new URLSearchParams({
        latitude: String(latitude),
        longitude: String(longitude),
        raceStartAt,
      });
      const res = await fetch(`/api/meteo?${query.toString()}`);
      if (!res.ok) {
        const body = (await res.json().catch(() => null)) as { error?: string } | null;
        throw new Error(body?.error ?? "Météo indisponible");
      }
      const body = (await res.json()) as { tempC: number; humidityPct: number | null };
      setDetectedWeather({
        tempC: body.tempC,
        humidityPct: body.humidityPct,
        category: weatherCategoryFromTempC(body.tempC),
      });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur récupération météo.");
    } finally {
      setWeatherLoading(false);
    }
  };

  useEffect(() => {
    if (!parsedGpx) return;
    void onFetchWeather();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [parsedGpx, eventDate]);

  const onGeneratePlan = () => {
    if (!parsedGpx) return;
    const weather = detectedWeather?.category ?? "Tempéré (10-20°C)";
    const profile = mergeStoredAthleteProfile(undefined);
    const event: EventDetails = {
      sport: sportLabel,
      distance: parsedGpx.distanceKm,
      elevationGain: Math.round(parsedGpx.elevationGainM),
      targetTime: targetTimeHours,
      weather,
      elevation: elevationLabelFromGain(parsedGpx.elevationGainM),
      placeName: detectedPlace ?? parsedGpx.name ?? "Parcours GPX",
      raceStartAt: `${eventDate}T07:00`,
      courseGeometry: parsedGpx.geometry,
      adjustIntakesToCourse: true,
      aidStations: [],
    };

    const generated = calculateFuelPlan(profile, event, undefined);
    setResult(generated);
    setResultEvent(event);

    const bundle = {
      fuelPlan: generated.mainPlan,
      altFuelPlan: generated.altPlan,
      altPlanLabel: generated.altPlanLabel,
      altPlanExplanation: generated.altPlanExplanation,
      racePlanVariant: "main" as const,
      profile,
      event,
    };
    localStorage.setItem("fuelos_active_plan", JSON.stringify(bundle));
  };

  const canGenerate = status === "ready" && parsedGpx != null;

  const summary = useMemo(
    () =>
      parsedGpx
        ? {
            distance: `${parsedGpx.distanceKm.toFixed(1)} km`,
            dplus: `${Math.round(parsedGpx.elevationGainM)} m D+`,
            elevation: elevationLabelFromGain(parsedGpx.elevationGainM),
          }
        : null,
    [parsedGpx]
  );

  return (
    <div className="fuel-page">
      <Header sticky />
      <main className="fuel-main" style={{ paddingTop: 18 }}>
        <section className="fuel-card" style={{ padding: 20 }}>
          <h1 className="font-display" style={{ margin: 0, fontSize: "clamp(1.35rem, 3.3vw, 1.95rem)" }}>
            GPX -&gt; Plan nutrition -&gt; Race mode
          </h1>
          <p style={{ marginTop: 8, color: "var(--color-text-muted)", lineHeight: 1.55 }}>
            Flow unique: upload GPX, 3 questions, résultat immédiat, puis démarrage de la course.
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
              Extraction distance / D+ / profil... (2s)
            </p>
          ) : null}
          {error ? <p style={{ marginTop: 10, color: "var(--color-danger)", fontWeight: 700 }}>{error}</p> : null}
        </section>

        {canGenerate && parsedGpx && summary ? (
          <>
            <section className="fuel-card" style={{ marginTop: 12, padding: 20 }}>
              <h2 className="font-display" style={{ margin: 0, fontSize: 18 }}>2) 3 questions</h2>

              <div style={{ marginTop: 12, display: "grid", gap: 10, gridTemplateColumns: "repeat(auto-fit, minmax(170px, 1fr))" }}>
                <div className="fuel-card" style={{ padding: 12 }}>
                  <p style={{ margin: 0, fontSize: 12, color: "var(--color-text-muted)" }}>Distance</p>
                  <p style={{ margin: "4px 0 0", fontSize: 20, fontWeight: 900 }}>{summary.distance}</p>
                </div>
                <div className="fuel-card" style={{ padding: 12 }}>
                  <p style={{ margin: 0, fontSize: 12, color: "var(--color-text-muted)" }}>Dénivelé</p>
                  <p style={{ margin: "4px 0 0", fontSize: 20, fontWeight: 900 }}>{summary.dplus}</p>
                </div>
                <div className="fuel-card" style={{ padding: 12 }}>
                  <p style={{ margin: 0, fontSize: 12, color: "var(--color-text-muted)" }}>Catégorie</p>
                  <p style={{ margin: "4px 0 0", fontSize: 15, fontWeight: 900 }}>{summary.elevation}</p>
                </div>
              </div>

              <div style={{ marginTop: 14 }}>
                <label style={{ display: "block", fontSize: 12, fontWeight: 800, color: "var(--color-text-muted)" }}>
                  Objectif temps: <span style={{ color: "var(--color-primary)" }}>{formatHours(targetTimeHours)}</span>
                </label>
                <input
                  type="range"
                  min={1}
                  max={24}
                  step={0.25}
                  value={targetTimeHours}
                  onChange={(e) => setTargetTimeHours(Number(e.target.value))}
                  style={{ width: "100%", marginTop: 8, accentColor: "var(--color-primary)" }}
                />
              </div>

              <div style={{ marginTop: 14, display: "grid", gap: 10, gridTemplateColumns: "1fr" }}>
                <label>
                  <span style={{ display: "block", fontSize: 12, fontWeight: 800, color: "var(--color-text-muted)" }}>
                    Date de l&apos;event
                  </span>
                  <input
                    type="date"
                    value={eventDate}
                    onChange={(e) => setEventDate(e.target.value)}
                    className="fuel-input-compact"
                    style={{ width: "100%", marginTop: 6 }}
                  />
                </label>
              </div>
              <p style={{ marginTop: 8, fontSize: 12, color: "var(--color-text-muted)" }}>
                Lieu détecté via GPX: <strong>{detectedPlace ?? "en cours..."}</strong>
                {detectedWeather ? (
                  <>
                    {" · "}
                    Météo estimée: <strong>{detectedWeather.category}</strong> ({detectedWeather.tempC.toFixed(1)}°C
                    {detectedWeather.humidityPct != null ? ` · ${Math.round(detectedWeather.humidityPct)}% hum.` : ""})
                  </>
                ) : weatherLoading ? (
                  <> · Météo estimée: <strong>calcul en cours...</strong></>
                ) : null}
              </p>

              <div style={{ marginTop: 14 }}>
                <p style={{ margin: 0, fontSize: 12, fontWeight: 800, color: "var(--color-text-muted)" }}>Sport</p>
                <div style={{ marginTop: 8, display: "grid", gap: 8, gridTemplateColumns: "repeat(3, minmax(0, 1fr))" }}>
                  {([
                    { id: "trail", label: "Trail" },
                    { id: "running", label: "Running" },
                    { id: "cycling", label: "Vélo" },
                  ] as { id: SportChoice; label: string }[]).map((item) => {
                    const active = sport === item.id;
                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => setSport(item.id)}
                        className="fuel-btn-pill"
                        style={{
                          width: "100%",
                          borderColor: active ? "var(--color-primary)" : "var(--color-border)",
                          background: active
                            ? "color-mix(in srgb, var(--color-primary) 12%, var(--color-bg-card))"
                            : "var(--color-bg-card)",
                          color: active ? "var(--color-primary)" : "var(--color-text)",
                          fontWeight: active ? 800 : 600,
                        }}
                      >
                        {item.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              <button type="button" className="fuel-cta" style={{ marginTop: 14, width: "100%" }} onClick={onGeneratePlan}>
                Générer mon plan nutrition
              </button>
            </section>
          </>
        ) : null}

        {result && resultEvent ? (
          <section className="fuel-card" style={{ marginTop: 12, padding: 20 }}>
            <h2 className="font-display" style={{ margin: 0, fontSize: 18 }}>3) Résultat immédiat</h2>
            <div style={{ marginTop: 12, display: "grid", gap: 10, gridTemplateColumns: "repeat(auto-fit, minmax(170px, 1fr))" }}>
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

            <button
              type="button"
              className="fuel-cta"
              style={{ marginTop: 14, width: "100%" }}
              onClick={() => router.push("/race")}
            >
              Démarrer
            </button>
          </section>
        ) : null}
      </main>
    </div>
  );
}
