"use client";

import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { FuelLogo } from "./FuelLogo";
import { calculateFuelPlan } from "../lib/fuelCalculator";
import { mergeStoredAthleteProfile } from "../lib/athleteProfileData";
import { defaultRaceStartLocal } from "../lib/meteo";
import type { EventDetails, PrimaryDiscipline, Product } from "../lib/types";

const ONBOARDING_PROFILE_KEY = "fuelos_onboarding_profile_done";
const ONBOARDING_EVENT_KEY = "fuelos_onboarding_event_done";
const ONBOARDING_EVENT_STEP_KEY = "fuelos_onboarding_event_step_done";
const CUSTOM_PRODUCTS_STORAGE_KEY = "fuelos_custom_products";
const GREEN = "#16a34a";

type QuickSport = "trail" | "road" | "ultra" | "cycling" | "triathlon";

const SPORT_OPTIONS: { emoji: string; label: string; value: QuickSport }[] = [
  { emoji: "🏔️", label: "Trail", value: "trail" },
  { emoji: "🏃", label: "Route", value: "road" },
  { emoji: "⛰️", label: "Ultra", value: "ultra" },
  { emoji: "🚴", label: "Vélo", value: "cycling" },
  { emoji: "🏊", label: "Triathlon", value: "triathlon" },
];

const EVENT_SPORT: Record<QuickSport, string> = {
  trail: "Trail",
  road: "Course à pied",
  ultra: "Ultra-trail",
  cycling: "Cyclisme",
  triathlon: "Triathlon",
};

const LOADER_MESSAGES = [
  "Calcul de tes besoins en glucides…",
  "Sélection des produits adaptés…",
  "Construction de ta timeline…",
];

/**
 * Bornes basses d'allure basees sur des references record du monde (hommes),
 * puis legerement relachees (+5%) pour eviter un verrou trop strict.
 */
const WORLD_RECORD_ANCHORS_KM_HOURS: ReadonlyArray<{ km: number; hours: number }> = [
  { km: 5, hours: 12.588 / 60 }, // 12:35
  { km: 10, hours: 26.183 / 60 }, // 26:11
  { km: 21.0975, hours: 56.7 / 60 }, // 56:42
  { km: 42.195, hours: 2.0186 }, // 2:01:07
  { km: 50, hours: 2.636 }, // ~2:38
  { km: 80, hours: 6.083 }, // ~6:05
  { km: 100, hours: 6.083 }, // 100 km route
];
const WORLD_RECORD_FLOOR_FACTOR = 1.05;

function suggestTargetHours(distance: number): number {
  if (distance <= 10) return 1.0;
  if (distance <= 21) return 2.5;
  if (distance <= 42) return 4.5;
  if (distance <= 50) return 6.0;
  if (distance <= 80) return 10.0;
  return 16.0;
}

function worldRecordBasedMinTargetHours(distanceKm: number): number {
  const d = Math.max(1, distanceKm);
  const anchors = WORLD_RECORD_ANCHORS_KM_HOURS;
  if (d <= anchors[0].km) return anchors[0].hours * (d / anchors[0].km) * WORLD_RECORD_FLOOR_FACTOR;
  const last = anchors[anchors.length - 1];
  if (d >= last.km) return (last.hours * (d / last.km)) * WORLD_RECORD_FLOOR_FACTOR;

  for (let i = 0; i < anchors.length - 1; i += 1) {
    const a = anchors[i];
    const b = anchors[i + 1];
    if (d < a.km || d > b.km) continue;
    const t = (d - a.km) / (b.km - a.km);
    const interp = a.hours + t * (b.hours - a.hours);
    return interp * WORLD_RECORD_FLOOR_FACTOR;
  }

  return 0.5;
}

export function formatQuickStartTargetTimeLabel(h: number): string {
  if (h < 1) {
    const m = Math.round(h * 60);
    return `${m} min`;
  }
  if (Math.abs(h - 1) < 0.001) return "1h";
  const whole = Math.floor(h + 1e-9);
  const frac = h - whole;
  if (Math.abs(frac) < 0.02) return `${whole}h`;
  const minutes = Math.round(frac * 60);
  if (minutes === 0) return `${whole}h`;
  return `${whole}h${minutes}`;
}

type QuickStartAnswers = {
  sport: QuickSport | null;
  distance: number | null;
  targetTime: number | null;
  weight: number | null;
};

export type QuickStartWizardProps = {
  onSkip: () => void;
  onComplete: () => void;
};

export function QuickStartWizard({ onSkip, onComplete }: QuickStartWizardProps) {
  const [step, setStep] = useState(1);
  const [answers, setAnswers] = useState<QuickStartAnswers>({
    sport: null,
    distance: null,
    targetTime: null,
    weight: null,
  });
  const [phase, setPhase] = useState<"form" | "loading">("form");
  const [loaderMsgIndex, setLoaderMsgIndex] = useState(0);
  const [presetDist, setPresetDist] = useState<number | "100p" | null>(null);
  const weightInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (step !== 4 || phase !== "form") return;
    const t = window.setTimeout(() => weightInputRef.current?.focus(), 50);
    return () => window.clearTimeout(t);
  }, [step, phase]);

  const runGeneration = useCallback(() => {
    const sport = answers.sport;
    const distance = answers.distance;
    const targetTime =
      answers.targetTime != null && answers.targetTime > 0
        ? answers.targetTime
        : distance != null && distance > 0
          ? suggestTargetHours(distance)
          : null;
    const weight = answers.weight;
    if (!sport || distance == null || distance <= 0 || targetTime == null || targetTime <= 0 || weight == null || weight <= 0) {
      setPhase("form");
      return;
    }

    let customProducts: Product[] = [];
    try {
      const raw = localStorage.getItem(CUSTOM_PRODUCTS_STORAGE_KEY);
      if (raw) customProducts = JSON.parse(raw) as Product[];
    } catch {
      customProducts = [];
    }

    const partialProfile = {
      weight,
      primaryDiscipline: sport as PrimaryDiscipline,
      experienceLevel: "beginner" as const,
      seasonGoal: "finisher" as const,
      giTolerance: "normal" as const,
      sweatRate: 1.0,
      gender: "M" as const,
      age: 30,
      allergies: [] as string[],
      preferredProducts: { gels: [], drinks: [], bars: [], realFood: [] },
      tastePreferences: { sweetness: "medium" as const, flavors: [] as string[] },
    };

    const profile = mergeStoredAthleteProfile(partialProfile);
    try {
      localStorage.setItem("athlete-profile", JSON.stringify(profile));
    } catch {
      /* ignore */
    }

    const event: EventDetails = {
      sport: EVENT_SPORT[sport],
      distance,
      elevationGain: 0,
      targetTime,
      weather: "Tempéré (10-20°C)",
      elevation: "Plat (0-500m D+)",
      aidStations: [],
      placeName: "",
      raceStartAt: defaultRaceStartLocal(),
    };

    const result = calculateFuelPlan(profile, event, customProducts);
    const bundle = {
      fuelPlan: result.mainPlan,
      altFuelPlan: result.altPlan,
      altPlanLabel: result.altPlanLabel,
      altPlanExplanation: result.altPlanExplanation,
      racePlanVariant: "main" as const,
      profile,
      event,
    };

    try {
      localStorage.setItem("fuelos_active_plan", JSON.stringify(bundle));
    } catch {
      /* ignore */
    }

    void fetch("/api/user/plans", {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        payload: bundle,
        title: event.sport ? `${event.sport} — ${event.distance} km` : null,
        setActive: true,
      }),
    }).catch(() => {
      /* hors ligne ou non connecté */
    });

    try {
      localStorage.setItem(ONBOARDING_PROFILE_KEY, "1");
      localStorage.setItem(ONBOARDING_EVENT_STEP_KEY, "1");
      localStorage.setItem(ONBOARDING_EVENT_KEY, "1");
    } catch {
      /* ignore */
    }

    onComplete();
  }, [answers, onComplete]);

  const runGenerationRef = useRef(runGeneration);
  useEffect(() => {
    runGenerationRef.current = runGeneration;
  }, [runGeneration]);

  useEffect(() => {
    if (phase !== "loading") return;
    const iv = window.setInterval(() => {
      setLoaderMsgIndex((i) => (i + 1) % LOADER_MESSAGES.length);
    }, 500);
    const finish = window.setTimeout(() => {
      window.clearInterval(iv);
      runGenerationRef.current();
    }, 1200);
    return () => {
      window.clearInterval(iv);
      window.clearTimeout(finish);
    };
  }, [phase]);

  const step3SliderValue =
    answers.distance != null && answers.distance > 0
      ? answers.targetTime != null && answers.targetTime > 0
        ? answers.targetTime
        : suggestTargetHours(answers.distance)
      : null;

  const step3MinTarget =
    answers.distance != null && answers.distance > 0 ? Math.max(0.5, worldRecordBasedMinTargetHours(answers.distance)) : 0.5;

  useEffect(() => {
    if (answers.distance == null || answers.distance <= 0) return;
    const minTarget = Math.max(0.5, worldRecordBasedMinTargetHours(answers.distance));
    if (answers.targetTime == null) return;
    if (answers.targetTime >= minTarget) return;
    setAnswers((a) => ({ ...a, targetTime: minTarget }));
  }, [answers.distance, answers.targetTime]);

  const vitesseLine = useMemo(() => {
    const d = answers.distance;
    const t =
      answers.targetTime != null && answers.targetTime > 0
        ? answers.targetTime
        : d != null && d > 0
          ? suggestTargetHours(d)
          : null;
    if (d == null || t == null || t <= 0) return null;
    const v = d / t;
    if (v > 15) return "⚡ Allure rapide — plan haute performance";
    if (v > 8) return "🏃 Allure normale — plan équilibré";
    return "🥾 Allure trail/endurance — plan longue durée";
  }, [answers.distance, answers.targetTime]);

  const step3TimeLabel =
    step3SliderValue != null ? formatQuickStartTargetTimeLabel(Math.max(step3SliderValue, step3MinTarget)) : "";

  const shell = (children: ReactNode) => (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 9999,
        background: "#fff",
        overflowY: "auto",
        WebkitOverflowScrolling: "touch",
      }}
    >
      <div
        style={{
          maxWidth: 480,
          margin: "0 auto",
          minHeight: "100%",
          boxSizing: "border-box",
          padding: "28px 22px 40px",
          display: "flex",
          flexDirection: "column",
          color: "#111827",
        }}
      >
        {children}
      </div>
    </div>
  );

  if (phase === "loading") {
    return shell(
      <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 24 }}>
        <div
          style={{
            width: 40,
            height: 40,
            border: `3px solid color-mix(in srgb, ${GREEN} 28%, #e5e7eb)`,
            borderTopColor: GREEN,
            borderRadius: "50%",
            animation: "fuel-qs-spin 0.75s linear infinite",
          }}
        />
        <p
          style={{
            fontSize: 16,
            fontWeight: 600,
            textAlign: "center",
            margin: 0,
            minHeight: 48,
            transition: "opacity 0.2s",
          }}
        >
          {LOADER_MESSAGES[loaderMsgIndex]}
        </p>
        <style>{`@keyframes fuel-qs-spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  const progressSegments = [1, 2, 3, 4].map((n) => (
    <div
      key={n}
      style={{
        flex: 1,
        height: 6,
        borderRadius: 4,
        background: n <= step ? GREEN : "#e5e7eb",
        transition: "background 0.2s",
      }}
    />
  ));

  const footer = (
    <div style={{ marginTop: "auto", paddingTop: 28 }}>
      {step === 2 && (
        <button
          type="button"
          disabled={!answers.distance || answers.distance <= 0}
          onClick={() => setStep(3)}
          style={{
            width: "100%",
            padding: "14px 20px",
            borderRadius: 10,
            border: "none",
            background: GREEN,
            color: "#fff",
            fontWeight: 700,
            fontSize: 16,
            cursor: !answers.distance || answers.distance <= 0 ? "not-allowed" : "pointer",
            opacity: !answers.distance || answers.distance <= 0 ? 0.5 : 1,
          }}
        >
          Continuer →
        </button>
      )}
      {step === 3 && (
        <button
          type="button"
          onClick={() => setStep(4)}
          style={{
            width: "100%",
            padding: "14px 20px",
            borderRadius: 10,
            border: "none",
            background: GREEN,
            color: "#fff",
            fontWeight: 700,
            fontSize: 16,
            cursor: "pointer",
          }}
        >
          Continuer →
        </button>
      )}
      {step === 4 && (
        <button
          type="button"
          disabled={answers.weight == null || answers.weight <= 0}
          onClick={() => {
            setLoaderMsgIndex(0);
            setPhase("loading");
          }}
          style={{
            width: "100%",
            padding: "16px 20px",
            borderRadius: 10,
            border: "none",
            background: GREEN,
            color: "#fff",
            fontWeight: 800,
            fontSize: 17,
            cursor: answers.weight == null || answers.weight <= 0 ? "not-allowed" : "pointer",
            opacity: answers.weight == null || answers.weight <= 0 ? 0.5 : 1,
          }}
        >
          Générer mon plan →
        </button>
      )}
      <button
        type="button"
        onClick={onSkip}
        style={{
          display: "block",
          width: "100%",
          marginTop: 14,
          background: "none",
          border: "none",
          color: "#9ca3af",
          fontSize: 13,
          cursor: "pointer",
          padding: 8,
        }}
      >
        Passer
      </button>
    </div>
  );

  return shell(
    <>
      <header style={{ marginBottom: 28, textAlign: "center" }}>
        <div style={{ display: "flex", justifyContent: "center", marginBottom: 20 }}>
          <FuelLogo size={40} withWordmark wordmarkClassName="font-display" />
        </div>
        <div style={{ fontSize: 13, fontWeight: 600, color: "#6b7280", marginBottom: 10 }}>Question {step} sur 4</div>
        <div style={{ display: "flex", gap: 8 }}>{progressSegments}</div>
      </header>

      {step === 1 && (
        <>
          <h1 style={{ fontSize: 22, fontWeight: 800, margin: "0 0 8px", lineHeight: 1.25 }}>Quel est ton sport principal ?</h1>
          <p style={{ fontSize: 14, color: "#6b7280", margin: "0 0 22px", lineHeight: 1.55 }}>
            On optimisera ton plan nutritionnel pour cette discipline.
          </p>
          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              gap: 12,
              justifyContent: "center",
            }}
          >
            {SPORT_OPTIONS.map((opt) => {
              const selected = answers.sport === opt.value;
              return (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => {
                    setAnswers((a) => ({ ...a, sport: opt.value }));
                    setStep(2);
                  }}
                  style={{
                    width: "calc(50% - 6px)",
                    minWidth: 140,
                    maxWidth: 220,
                    boxSizing: "border-box",
                    padding: "18px 12px",
                    borderRadius: 14,
                    border: selected ? `2px solid ${GREEN}` : "2px solid #e5e7eb",
                    background: selected ? "color-mix(in srgb, #16a34a 12%, #fff)" : "#fafafa",
                    cursor: "pointer",
                    textAlign: "center",
                  }}
                >
                  <div style={{ fontSize: 48, lineHeight: 1.1, marginBottom: 8 }}>{opt.emoji}</div>
                  <div style={{ fontSize: 15, fontWeight: 700 }}>{opt.label}</div>
                </button>
              );
            })}
          </div>
        </>
      )}

      {step === 2 && (
        <>
          <h1 style={{ fontSize: 22, fontWeight: 800, margin: "0 0 8px", lineHeight: 1.25 }}>Quelle est la distance de ta course ?</h1>
          <p style={{ fontSize: 14, color: "#6b7280", margin: "0 0 20px", lineHeight: 1.55 }}>
            Donne une estimation, tu pourras ajuster ensuite.
          </p>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10, marginBottom: 16 }}>
            {(
              [
                [10, 10],
                [21, 21],
                [42, 42],
                [50, 50],
                [80, 80],
              ] as const
            ).map(([val, key]) => (
              <button
                key={key}
                type="button"
                onClick={() => {
                  setPresetDist(val);
                  setAnswers((a) => ({ ...a, distance: val }));
                }}
                style={{
                  padding: "12px 8px",
                  borderRadius: 999,
                  border: presetDist === val ? `2px solid ${GREEN}` : "1px solid #e5e7eb",
                  background: presetDist === val ? "color-mix(in srgb, #16a34a 10%, #fff)" : "#fff",
                  fontWeight: 600,
                  fontSize: 14,
                  cursor: "pointer",
                }}
              >
                {val} km
              </button>
            ))}
            <button
              type="button"
              onClick={() => {
                setPresetDist("100p");
                setAnswers((a) => ({ ...a, distance: 100 }));
              }}
              style={{
                padding: "12px 8px",
                borderRadius: 999,
                border: presetDist === "100p" ? `2px solid ${GREEN}` : "1px solid #e5e7eb",
                background: presetDist === "100p" ? "color-mix(in srgb, #16a34a 10%, #fff)" : "#fff",
                fontWeight: 600,
                fontSize: 14,
                cursor: "pointer",
              }}
            >
              100+ km
            </button>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 10, border: "1px solid #e5e7eb", borderRadius: 12, padding: "10px 14px" }}>
            <input
              type="number"
              min={1}
              max={1000}
              placeholder="ou entre ta distance en km"
              value={answers.distance != null && answers.distance > 0 ? answers.distance : ""}
              onChange={(e) => {
                setPresetDist(null);
                const v = e.target.value;
                if (v === "") {
                  setAnswers((a) => ({ ...a, distance: null }));
                  return;
                }
                const n = parseFloat(v);
                if (Number.isFinite(n) && n > 0) setAnswers((a) => ({ ...a, distance: n }));
              }}
              style={{
                flex: 1,
                border: "none",
                outline: "none",
                fontSize: 16,
                minWidth: 0,
                background: "transparent",
              }}
            />
            <span style={{ fontWeight: 700, color: "#6b7280", flexShrink: 0 }}>km</span>
          </div>
        </>
      )}

      {step === 3 && step3SliderValue != null && (
        <>
          <h1 style={{ fontSize: 22, fontWeight: 800, margin: "0 0 8px", lineHeight: 1.25 }}>En combien de temps vises-tu l&apos;arrivée ?</h1>
          <p style={{ fontSize: 14, color: "#6b7280", margin: "0 0 24px", lineHeight: 1.55 }}>
            Sois honnête, c&apos;est pour calculer ton rythme de ravitaillement.
          </p>
          <div style={{ textAlign: "center", marginBottom: 20 }}>
            <span style={{ fontSize: 32, fontWeight: 800 }}>{step3TimeLabel}</span>
          </div>
          <input
            type="range"
            min={step3MinTarget}
            max={24}
            step={0.5}
            value={Math.max(step3SliderValue, step3MinTarget)}
            onChange={(e) => setAnswers((a) => ({ ...a, targetTime: Math.max(step3MinTarget, parseFloat(e.target.value)) }))}
            style={{ width: "100%", accentColor: GREEN, marginBottom: 16 }}
          />
          <p style={{ fontSize: 12, color: "#6b7280", textAlign: "center", margin: "0 0 10px", lineHeight: 1.45 }}>
            Minimum autorise pour cette distance: {formatQuickStartTargetTimeLabel(step3MinTarget)}
          </p>
          {vitesseLine && (
            <p style={{ fontSize: 14, color: "#374151", textAlign: "center", margin: 0, lineHeight: 1.5 }}>{vitesseLine}</p>
          )}
        </>
      )}

      {step === 4 && (
        <>
          <h1 style={{ fontSize: 22, fontWeight: 800, margin: "0 0 8px", lineHeight: 1.25 }}>Quel est ton poids ?</h1>
          <p style={{ fontSize: 14, color: "#6b7280", margin: "0 0 24px", lineHeight: 1.55 }}>
            Utilisé pour calculer tes besoins en glucides. Jamais affiché ailleurs.
          </p>
          <div style={{ display: "flex", alignItems: "baseline", justifyContent: "center", gap: 10, marginBottom: 16 }}>
            <input
              ref={weightInputRef}
              type="number"
              min={30}
              max={200}
              placeholder="70"
              value={answers.weight != null && answers.weight > 0 ? answers.weight : ""}
              onChange={(e) => {
                const v = e.target.value;
                if (v === "") {
                  setAnswers((a) => ({ ...a, weight: null }));
                  return;
                }
                const n = parseFloat(v);
                if (Number.isFinite(n)) setAnswers((a) => ({ ...a, weight: n }));
              }}
              inputMode="decimal"
              style={{
                fontSize: 48,
                fontWeight: 800,
                width: 140,
                textAlign: "right",
                border: "none",
                borderBottom: `3px solid ${GREEN}`,
                outline: "none",
                background: "transparent",
              }}
            />
            <span style={{ fontSize: 48, fontWeight: 800 }}>kg</span>
          </div>
          <p style={{ fontSize: 13, color: "#6b7280", textAlign: "center", margin: 0, lineHeight: 1.5 }}>
            💡 Estimation ok, tu pourras préciser dans ton profil ensuite.
          </p>
        </>
      )}

      {footer}
    </>
  );
}
