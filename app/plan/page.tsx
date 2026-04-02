"use client";

import { useState, useEffect, useRef, useCallback, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import useLocalStorage from "../lib/hooks/useLocalStorage";
import usePageTitle from "../lib/hooks/usePageTitle";
import { calculateFuelPlan } from "../lib/fuelCalculator";
import { PRODUCTS } from "../lib/products";
import type { AthleteProfile, EventDetails, FuelPlan, Product } from "../lib/types";
import { Header } from "../components/Header";

const SPORTS = ["Course à pied", "Trail", "Cyclisme", "Triathlon", "Ultra-trail"];
const WEATHER = ["Froid (<10°C)", "Tempéré (10-20°C)", "Chaud (20-30°C)", "Très chaud (>30°C)"];
const ELEVATION = ["Plat (0-500m D+)", "Vallonné (500-1500m D+)", "Montagneux (1500-3000m D+)", "Alpin (>3000m D+)"];
const CUSTOM_PRODUCTS_STORAGE_KEY = "fuelos_custom_products";
const ONBOARDING_PROFILE_KEY = "fuelos_onboarding_profile_done";
const ONBOARDING_EVENT_KEY = "fuelos_onboarding_event_done";
const ONBOARDING_EVENT_STEP_KEY = "fuelos_onboarding_event_step_done";

type PlanWizardStep = 1 | 2 | 3;

const PLAN_WIZARD_STEPS: { num: PlanWizardStep; label: string }[] = [
  { num: 1, label: "Profil" },
  { num: 2, label: "Course" },
  { num: 3, label: "Plan" },
];

const S = {
  page: {
    minHeight: "100vh",
    background: "var(--color-bg)",
    color: "var(--color-text)",
    fontFamily: "system-ui, sans-serif",
  } as React.CSSProperties,
  planWizardBar: {
    borderBottom: "1px solid var(--color-border)",
    padding: "12px 24px",
    background: "var(--color-bg)",
  } as React.CSSProperties,
  main: { maxWidth: 960, margin: "0 auto", padding: "40px 24px" } as React.CSSProperties,
  card: {
    background: "var(--color-bg-card)",
    border: "1px solid var(--color-border)",
    borderRadius: 12,
    padding: 24,
    marginBottom: 20,
  } as React.CSSProperties,
  label: {
    display: "block",
    fontSize: 12,
    fontWeight: 600,
    color: "var(--color-text-muted)",
    marginBottom: 6,
    letterSpacing: "0.5px",
  } as React.CSSProperties,
  input: {
    width: "100%",
    padding: "10px 14px",
    borderRadius: 8,
    background: "var(--color-bg-card)",
    border: "1px solid var(--color-border)",
    color: "var(--color-text)",
    fontSize: 14,
    outline: "none",
    boxSizing: "border-box",
  } as React.CSSProperties,
  select: {
    width: "100%",
    padding: "10px 14px",
    borderRadius: 8,
    background: "var(--color-bg-card)",
    border: "1px solid var(--color-border)",
    color: "var(--color-text)",
    fontSize: 14,
    outline: "none",
    boxSizing: "border-box",
  } as React.CSSProperties,
  grid2: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 } as React.CSSProperties,
  grid3: { display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 16 } as React.CSSProperties,
  sectionTitle: {
    fontWeight: 700,
    fontSize: 16,
    marginBottom: 16,
    display: "flex",
    alignItems: "center",
    gap: 8,
  } as React.CSSProperties,
  btn: {
    padding: "14px 28px",
    borderRadius: 10,
    background: "var(--color-accent)",
    color: "#000",
    fontWeight: 700,
    fontSize: 16,
    border: "none",
    cursor: "pointer",
    width: "100%",
  } as React.CSSProperties,
  btnOutline: {
    padding: "10px 20px",
    borderRadius: 8,
    background: "transparent",
    color: "var(--color-text)",
    fontWeight: 600,
    fontSize: 14,
    border: "1px solid var(--color-border)",
    cursor: "pointer",
  } as React.CSSProperties,
  badge: {
    display: "inline-flex",
    alignItems: "center",
    padding: "4px 10px",
    borderRadius: 99,
    fontSize: 11,
    fontWeight: 700,
    letterSpacing: "0.5px",
  } as React.CSSProperties,
};

type AidStationDraft = {
  distanceKm: number;
  name: string;
  availableProducts: string[];
};

function isValidHttpUrl(value?: string): boolean {
  if (!value) return false;
  try {
    const url = new URL(value.trim());
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

function getProductImageUrl(product?: Product): string | undefined {
  if (!product) return undefined;
  const imageUrl = product.imageUrl?.trim();
  if (imageUrl && isValidHttpUrl(imageUrl)) return imageUrl;
  return undefined;
}

function ProductThumb({
  product,
  alt,
  size = 28,
}: {
  product?: Product;
  alt: string;
  size?: number;
}) {
  const [hasError, setHasError] = useState(false);
  const src = getProductImageUrl(product);

  if (!src || hasError) {
    return (
      <div
        title={product ? `${product.brand} ${product.name}` : alt}
        style={{
          width: size,
          height: size,
          minWidth: size,
          borderRadius: 6,
          border: "1px solid var(--color-border)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: size <= 28 ? 12 : 14,
          background: "var(--color-bg)",
        }}
      >
        📦
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      width={size}
      height={size}
      style={{
        width: size,
        height: size,
        minWidth: size,
        borderRadius: 6,
        objectFit: "cover",
        border: "1px solid var(--color-border)",
        background: "var(--color-bg)",
      }}
      onError={() => {
        console.error("Image failed to load:", src);
        setHasError(true);
      }}
    />
  );
}

function PlanPageContent() {
  usePageTitle("Plan");
  const searchParams = useSearchParams();
  const [athleteProfile, setAthleteProfile] = useLocalStorage<AthleteProfile | null>("athlete-profile", null);

  const [currentStep, setCurrentStep] = useState<PlanWizardStep>(1);
  const [maxReachedStep, setMaxReachedStep] = useState<PlanWizardStep>(1);
  const skipInitialScrollRef = useRef(true);
  const [showProductSelector, setShowProductSelector] = useState<"gels" | "drinks" | "bars" | null>(null);

  const [profile, setProfile] = useState<AthleteProfile>({
    weight: athleteProfile?.weight || 70,
    age: athleteProfile?.age || 35,
    gender: athleteProfile?.gender || "M",
    sweatRate: athleteProfile?.sweatRate || 1.0,
    giTolerance: athleteProfile?.giTolerance || "normal",
    allergies: athleteProfile?.allergies || [],
    preferredProducts: athleteProfile?.preferredProducts || {
      gels: [],
      drinks: [],
      bars: [],
    },
    tastePreferences: athleteProfile?.tastePreferences || {
      sweetness: "medium",
      flavors: [],
    },
  });

  const [event, setEvent] = useState<EventDetails>({
    sport: "Trail",
    distance: 50,
    elevationGain: 2000,
    targetTime: 6,
    weather: "Tempéré (10-20°C)",
    elevation: "Montagneux (1500-3000m D+)",
    aidStations: [],
  });

  const [showAidStationForm, setShowAidStationForm] = useState(false);
  const [newAidStation, setNewAidStation] = useState<AidStationDraft>({
    distanceKm: 0,
    name: "",
    availableProducts: [],
  });

  const [customProducts, setCustomProducts] = useState<Product[]>([]);
  const [newCustomProduct, setNewCustomProduct] = useState({
    name: "",
    brand: "",
    imageUrl: "",
    category: "gel" as Product["category"],
    cho_per_unit: 25,
    water_per_unit: 0,
    sodium_per_unit: 0,
    calories_per_unit: 100,
    price_per_unit: 2,
    weight_g: 40,
  });

  const [plan, setPlan] = useState<FuelPlan | null>(null);

  const allProducts = [...PRODUCTS, ...customProducts];

  const getProductsByCategoryWithCustom = (category: Product["category"]) =>
    allProducts.filter((p) => p.category === category);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(CUSTOM_PRODUCTS_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved) as Product[];
        setCustomProducts(parsed);
      }
    } catch (error) {
      console.error("Erreur chargement custom products:", error);
    }
  }, []);

  useEffect(() => {
    localStorage.setItem(CUSTOM_PRODUCTS_STORAGE_KEY, JSON.stringify(customProducts));
  }, [customProducts]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setAthleteProfile(profile);
    }, 500);

    return () => clearTimeout(timer);
  }, [profile, setAthleteProfile]);

  useEffect(() => {
    const s = searchParams.get("step");
    if (s === "event") {
      setCurrentStep(2);
      setMaxReachedStep((m) => Math.max(m, 2) as PlanWizardStep);
    } else if (s === "profile") {
      setCurrentStep(1);
    }
  }, [searchParams]);

  useEffect(() => {
    if (skipInitialScrollRef.current) {
      skipInitialScrollRef.current = false;
      return;
    }
    let frame = 0;
    frame = window.requestAnimationFrame(() => {
      document.getElementById(`plan-step-${currentStep}`)?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    });
    return () => window.cancelAnimationFrame(frame);
  }, [currentStep]);

  useEffect(() => {
    if (currentStep === 2) {
      try {
        localStorage.setItem(ONBOARDING_EVENT_STEP_KEY, "1");
      } catch {
        /* ignore */
      }
    }
  }, [currentStep]);

  function goToPlanStep(n: PlanWizardStep) {
    if (n > maxReachedStep) return;
    setCurrentStep(n);
  }

  function handleCalculate() {
    console.log("🔍 Profile GI Tolerance:", profile.giTolerance);
    console.log("🔍 Full Profile:", profile);

    const result = calculateFuelPlan(profile, event);

    console.log("🔍 CHO Strategy:", result.choStrategy);
    console.log("🔍 CHO per hour:", result.choPerHour);

    setPlan(result);
    localStorage.setItem(
      "fuelos_active_plan",
      JSON.stringify({ fuelPlan: result, profile, event })
    );
    try {
      localStorage.setItem(ONBOARDING_PROFILE_KEY, "1");
      localStorage.setItem(ONBOARDING_EVENT_STEP_KEY, "1");
      localStorage.setItem(ONBOARDING_EVENT_KEY, "1");
    } catch {
      /* ignore */
    }
    setMaxReachedStep(3);
    setCurrentStep(3);
  }

  return (
    <div style={S.page}>
      <Header />
      <div style={S.planWizardBar}>
        <nav
          aria-label="Étapes du plan"
          style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap", justifyContent: "center" }}
        >
          {PLAN_WIZARD_STEPS.map(({ num, label }, i) => {
            const isLocked = num > maxReachedStep;
            const isActive = num === currentStep;
            const isCompleted = num < currentStep;

            const base: React.CSSProperties = {
              ...S.badge,
              margin: 0,
              font: "inherit",
              fontFamily: "inherit",
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              transition: "background 0.15s, color 0.15s, border-color 0.15s, opacity 0.15s",
            };

            let visual: React.CSSProperties;
            let text: React.ReactNode;

            if (isLocked) {
              visual = {
                ...base,
                cursor: "not-allowed",
                opacity: 0.45,
                background: "var(--color-bg-card)",
                color: "var(--color-text-muted)",
                border: "1px solid var(--color-border)",
              };
              text = (
                <>
                  <span aria-hidden>{num}</span>
                  <span>{label}</span>
                </>
              );
            } else if (isActive) {
              visual = {
                ...base,
                cursor: "pointer",
                opacity: 1,
                background: "var(--color-accent)",
                color: "#000",
                border: "1px solid var(--color-accent)",
                boxShadow: "0 0 0 1px var(--color-accent)",
              };
              text = (
                <>
                  <span aria-hidden>{num}</span>
                  <span>{label}</span>
                </>
              );
            } else if (isCompleted) {
              visual = {
                ...base,
                cursor: "pointer",
                opacity: 1,
                background: "rgba(34, 197, 94, 0.12)",
                color: "var(--color-accent)",
                border: "1px solid var(--color-accent)",
              };
              text = (
                <>
                  <span aria-hidden style={{ fontWeight: 800 }}>
                    ✓
                  </span>
                  <span>{label}</span>
                </>
              );
            } else {
              visual = {
                ...base,
                cursor: "pointer",
                opacity: 1,
                background: "var(--color-bg-card)",
                color: "var(--color-text-muted)",
                border: "1px solid var(--color-border)",
              };
              text = (
                <>
                  <span aria-hidden>{num}</span>
                  <span>{label}</span>
                </>
              );
            }

            return (
              <div key={num} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <button
                  type="button"
                  disabled={isLocked}
                  aria-current={isActive ? "step" : undefined}
                  aria-disabled={isLocked || undefined}
                  onClick={() => goToPlanStep(num)}
                  style={visual}
                >
                  {text}
                </button>
                {i < 2 && (
                  <span style={{ color: "var(--color-border)", userSelect: "none" }} aria-hidden>
                    →
                  </span>
                )}
              </div>
            );
          })}
        </nav>
      </div>

      <div style={S.main}>
        {currentStep === 1 && (
          <div id="plan-step-1" style={{ scrollMarginTop: 24 }}>
            <h1 style={{ fontSize: 28, fontWeight: 800, marginBottom: 8, letterSpacing: "-0.5px" }}>
              Ton profil athlète
            </h1>
            <p style={{ color: "var(--color-text-muted)", marginBottom: 32, fontSize: 14 }}>
              Ces données permettent de personnaliser tes besoins nutritionnels.
            </p>

            {athleteProfile && (
              <div
                style={{
                  padding: "12px 16px",
                  borderRadius: 8,
                  background: "rgba(34,197,94,0.1)",
                  border: "1px solid var(--color-accent)",
                  marginBottom: 20,
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                }}
              >
                <span style={{ fontSize: 18 }}>✓</span>
                <span style={{ fontSize: 13, color: "var(--color-accent)", fontWeight: 600 }}>
                  Profil sauvegardé automatiquement
                </span>
              </div>
            )}

            <div style={S.card}>
              <div style={S.sectionTitle}>
                <span>🏃</span> Données physiques
              </div>
              <div style={S.grid3}>
                <div>
                  <label style={S.label}>POIDS (kg)</label>
                  <input
                    style={S.input}
                    type="number"
                    value={profile.weight}
                    onChange={(e) => setProfile({ ...profile, weight: +e.target.value })}
                    min={40}
                    max={120}
                  />
                </div>
                <div>
                  <label style={S.label}>ÂGE</label>
                  <input
                    style={S.input}
                    type="number"
                    value={profile.age}
                    onChange={(e) => setProfile({ ...profile, age: +e.target.value })}
                    min={16}
                    max={80}
                  />
                </div>
                <div>
                  <label style={S.label}>GENRE</label>
                  <select
                    style={S.select}
                    value={profile.gender}
                    onChange={(e) => setProfile({ ...profile, gender: e.target.value as "M" | "F" })}
                  >
                    <option value="M">Homme</option>
                    <option value="F">Femme</option>
                  </select>
                </div>
              </div>
            </div>

            <div style={S.card}>
              <div style={S.sectionTitle}>
                <span>⭐</span> Préférences produits
              </div>
              <p style={{ fontSize: 12, color: "var(--color-text-muted)", marginBottom: 16 }}>
                Sélectionne tes produits préférés pour un plan personnalisé
              </p>

              <div style={{ marginBottom: 16 }}>
                <label style={S.label}>GELS PRÉFÉRÉS</label>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 8 }}>
                  {profile.preferredProducts?.gels?.map((gelId) => {
                    const product = getProductsByCategoryWithCustom("gel").find((p) => p.id === gelId);
                    return product ? (
                      <div
                        key={gelId}
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: 6,
                          padding: "6px 12px",
                          borderRadius: 20,
                          background: "rgba(34,197,94,0.15)",
                          border: "1px solid var(--color-accent)",
                          fontSize: 12,
                          fontWeight: 600,
                          color: "var(--color-accent)",
                        }}
                      >
                        <ProductThumb product={product} alt={`${product.brand} ${product.name}`} size={20} />
                        {product.brand} {product.name}
                        <button
                          onClick={() =>
                            setProfile({
                              ...profile,
                              preferredProducts: {
                                ...profile.preferredProducts,
                                gels: profile.preferredProducts?.gels?.filter((id) => id !== gelId) || [],
                              },
                            })
                          }
                          style={{
                            background: "none",
                            border: "none",
                            color: "var(--color-accent)",
                            cursor: "pointer",
                            fontSize: 14,
                            padding: 0,
                            marginLeft: 2,
                          }}
                        >
                          ×
                        </button>
                      </div>
                    ) : null;
                  })}

                  <button
                    onClick={() => setShowProductSelector("gels")}
                    style={{
                      padding: "6px 12px",
                      borderRadius: 20,
                      background: "var(--color-bg)",
                      border: "1px dashed var(--color-border)",
                      color: "var(--color-text-muted)",
                      fontSize: 12,
                      cursor: "pointer",
                      fontWeight: 600,
                    }}
                  >
                    + Ajouter un gel
                  </button>
                </div>

                {showProductSelector === "gels" && (
                  <div
                    style={{
                      padding: 12,
                      borderRadius: 8,
                      background: "var(--color-bg)",
                      border: "1px solid var(--color-border)",
                      maxHeight: 200,
                      overflowY: "auto",
                    }}
                  >
                    {getProductsByCategoryWithCustom("gel")
                      .slice(0, 20)
                      .map((gel) => (
                        <button
                          key={gel.id}
                          onClick={() => {
                            const currentGels = profile.preferredProducts?.gels || [];
                            if (!currentGels.includes(gel.id)) {
                              setProfile({
                                ...profile,
                                preferredProducts: {
                                  ...profile.preferredProducts,
                                  gels: [...currentGels, gel.id],
                                },
                              });
                            }
                            setShowProductSelector(null);
                          }}
                          style={{
                            display: "block",
                            width: "100%",
                            padding: "8px 12px",
                            background: "none",
                            border: "none",
                            color: "var(--color-text)",
                            textAlign: "left",
                            cursor: "pointer",
                            fontSize: 13,
                            borderRadius: 6,
                          }}
                          onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(255,255,255,0.05)")}
                          onMouseLeave={(e) => (e.currentTarget.style.background = "none")}
                        >
                          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                            <ProductThumb product={gel} alt={`${gel.brand} ${gel.name}`} />
                            <div>
                              <div style={{ fontWeight: 600 }}>
                                {gel.brand} - {gel.name}
                              </div>
                              <div style={{ fontSize: 11, color: "var(--color-text-muted)" }}>
                                {gel.cho_per_unit}g CHO · {gel.price_per_unit.toFixed(2)}€
                              </div>
                            </div>
                          </div>
                        </button>
                      ))}
                  </div>
                )}
              </div>

              <div style={{ marginBottom: 16 }}>
                <label style={S.label}>BOISSONS PRÉFÉRÉES</label>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 8 }}>
                  {profile.preferredProducts?.drinks?.map((drinkId) => {
                    const product = getProductsByCategoryWithCustom("drink").find((p) => p.id === drinkId);
                    return product ? (
                      <div
                        key={drinkId}
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: 6,
                          padding: "6px 12px",
                          borderRadius: 20,
                          background: "rgba(96,165,250,0.15)",
                          border: "1px solid #60a5fa",
                          fontSize: 12,
                          fontWeight: 600,
                          color: "#60a5fa",
                        }}
                      >
                        <ProductThumb product={product} alt={`${product.brand} ${product.name}`} size={20} />
                        {product.brand} {product.name}
                        <button
                          onClick={() =>
                            setProfile({
                              ...profile,
                              preferredProducts: {
                                ...profile.preferredProducts,
                                drinks: profile.preferredProducts?.drinks?.filter((id) => id !== drinkId) || [],
                              },
                            })
                          }
                          style={{
                            background: "none",
                            border: "none",
                            color: "#60a5fa",
                            cursor: "pointer",
                            fontSize: 14,
                            padding: 0,
                            marginLeft: 2,
                          }}
                        >
                          ×
                        </button>
                      </div>
                    ) : null;
                  })}

                  <button
                    onClick={() => setShowProductSelector("drinks")}
                    style={{
                      padding: "6px 12px",
                      borderRadius: 20,
                      background: "var(--color-bg)",
                      border: "1px dashed var(--color-border)",
                      color: "var(--color-text-muted)",
                      fontSize: 12,
                      cursor: "pointer",
                      fontWeight: 600,
                    }}
                  >
                    + Ajouter une boisson
                  </button>
                </div>

                {showProductSelector === "drinks" && (
                  <div
                    style={{
                      padding: 12,
                      borderRadius: 8,
                      background: "var(--color-bg)",
                      border: "1px solid var(--color-border)",
                      maxHeight: 200,
                      overflowY: "auto",
                    }}
                  >
                    {getProductsByCategoryWithCustom("drink")
                      .slice(0, 20)
                      .map((drink) => (
                        <button
                          key={drink.id}
                          onClick={() => {
                            const currentDrinks = profile.preferredProducts?.drinks || [];
                            if (!currentDrinks.includes(drink.id)) {
                              setProfile({
                                ...profile,
                                preferredProducts: {
                                  ...profile.preferredProducts,
                                  drinks: [...currentDrinks, drink.id],
                                },
                              });
                            }
                            setShowProductSelector(null);
                          }}
                          style={{
                            display: "block",
                            width: "100%",
                            padding: "8px 12px",
                            background: "none",
                            border: "none",
                            color: "var(--color-text)",
                            textAlign: "left",
                            cursor: "pointer",
                            fontSize: 13,
                            borderRadius: 6,
                          }}
                          onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(255,255,255,0.05)")}
                          onMouseLeave={(e) => (e.currentTarget.style.background = "none")}
                        >
                          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                            <ProductThumb product={drink} alt={`${drink.brand} ${drink.name}`} />
                            <div>
                              <div style={{ fontWeight: 600 }}>
                                {drink.brand} - {drink.name}
                              </div>
                              <div style={{ fontSize: 11, color: "var(--color-text-muted)" }}>
                                {drink.cho_per_unit}g CHO · {drink.price_per_unit.toFixed(2)}€
                              </div>
                            </div>
                          </div>
                        </button>
                      ))}
                  </div>
                )}
              </div>

              <div>
                <label style={S.label}>NIVEAU DE SUCRÉ</label>
                <div style={{ display: "flex", gap: 8 }}>
                  {(["low", "medium", "high"] as const).map((level) => (
                    <button
                      key={level}
                      onClick={() =>
                        setProfile({
                          ...profile,
                          tastePreferences: {
                            sweetness: level,
                            flavors: profile.tastePreferences?.flavors || [],
                          },
                        })
                      }
                      style={{
                        flex: 1,
                        padding: "10px 16px",
                        borderRadius: 8,
                        border: `2px solid ${
                          profile.tastePreferences?.sweetness === level
                            ? "var(--color-accent)"
                            : "var(--color-border)"
                        }`,
                        background:
                          profile.tastePreferences?.sweetness === level
                            ? "rgba(34,197,94,0.1)"
                            : "var(--color-bg-card)",
                        color:
                          profile.tastePreferences?.sweetness === level
                            ? "var(--color-accent)"
                            : "var(--color-text-muted)",
                        fontSize: 13,
                        fontWeight: 600,
                        cursor: "pointer",
                      }}
                    >
                      {level === "low"
                        ? "🍃 Peu sucré"
                        : level === "medium"
                        ? "🍯 Modéré"
                        : "🍬 Très sucré"}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div style={S.card}>
              <div style={S.sectionTitle}>
                <span>🧪</span> Produits custom
              </div>
              <p style={{ fontSize: 12, color: "var(--color-text-muted)", marginBottom: 16 }}>
                Ajoute tes propres produits (gel, boisson, barre, chew, real-food ou électrolyte). Ils seront disponibles dans les sélecteurs.
              </p>

              <div style={{ ...S.grid3, marginBottom: 10 }}>
                <div>
                  <label style={S.label}>NOM</label>
                  <input
                    style={S.input}
                    value={newCustomProduct.name}
                    onChange={(e) => setNewCustomProduct({ ...newCustomProduct, name: e.target.value })}
                    placeholder="Ex: Gel maison"
                  />
                </div>
                <div>
                  <label style={S.label}>MARQUE</label>
                  <input
                    style={S.input}
                    value={newCustomProduct.brand}
                    onChange={(e) => setNewCustomProduct({ ...newCustomProduct, brand: e.target.value })}
                    placeholder="Ex: Perso"
                  />
                </div>
                <div>
                  <label style={S.label}>URL PHOTO (optionnel)</label>
                  <input
                    style={S.input}
                    value={newCustomProduct.imageUrl}
                    onChange={(e) => setNewCustomProduct({ ...newCustomProduct, imageUrl: e.target.value })}
                    placeholder="https://..."
                  />
                </div>
                <div>
                  <label style={S.label}>CATÉGORIE</label>
                  <select
                    style={S.select}
                    value={newCustomProduct.category}
                    onChange={(e) =>
                      setNewCustomProduct({
                        ...newCustomProduct,
                        category: e.target.value as Product["category"],
                      })
                    }
                  >
                    {["gel", "drink", "bar", "chew", "real-food", "electrolyte"].map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div style={S.grid3}>
                <div>
                  <label style={S.label}>CHO / unité (g)</label>
                  <input
                    style={S.input}
                    type="number"
                    value={newCustomProduct.cho_per_unit}
                    onChange={(e) =>
                      setNewCustomProduct({ ...newCustomProduct, cho_per_unit: +e.target.value })
                    }
                    min={0}
                  />
                </div>
                <div>
                  <label style={S.label}>EAU / unité (ml)</label>
                  <input
                    style={S.input}
                    type="number"
                    value={newCustomProduct.water_per_unit}
                    onChange={(e) =>
                      setNewCustomProduct({ ...newCustomProduct, water_per_unit: +e.target.value })
                    }
                    min={0}
                  />
                </div>
                <div>
                  <label style={S.label}>SODIUM / unité (mg)</label>
                  <input
                    style={S.input}
                    type="number"
                    value={newCustomProduct.sodium_per_unit}
                    onChange={(e) =>
                      setNewCustomProduct({ ...newCustomProduct, sodium_per_unit: +e.target.value })
                    }
                    min={0}
                  />
                </div>
                <div>
                  <label style={S.label}>CALORIES / unité</label>
                  <input
                    style={S.input}
                    type="number"
                    value={newCustomProduct.calories_per_unit}
                    onChange={(e) =>
                      setNewCustomProduct({ ...newCustomProduct, calories_per_unit: +e.target.value })
                    }
                    min={0}
                  />
                </div>
                <div>
                  <label style={S.label}>PRIX / unité (€)</label>
                  <input
                    style={S.input}
                    type="number"
                    value={newCustomProduct.price_per_unit}
                    onChange={(e) =>
                      setNewCustomProduct({ ...newCustomProduct, price_per_unit: +e.target.value })
                    }
                    min={0}
                    step={0.1}
                  />
                </div>
                <div>
                  <label style={S.label}>POIDS (g)</label>
                  <input
                    style={S.input}
                    type="number"
                    value={newCustomProduct.weight_g}
                    onChange={(e) =>
                      setNewCustomProduct({ ...newCustomProduct, weight_g: +e.target.value })
                    }
                    min={0}
                  />
                </div>
              </div>

              <div style={{ marginTop: 12 }}>
                <button
                  style={{ ...S.btnOutline, width: "100%" }}
                  onClick={() => {
                    if (!newCustomProduct.name.trim()) {
                      alert("Nom requis");
                      return;
                    }

                    if (newCustomProduct.imageUrl.trim() && !isValidHttpUrl(newCustomProduct.imageUrl)) {
                      alert("URL image invalide. Utilise une URL publique commençant par http:// ou https://");
                      return;
                    }

                    const id = `custom-${Date.now()}`;
                    const product: Product = {
                      id,
                      name: newCustomProduct.name.trim(),
                      brand: newCustomProduct.brand.trim() || "Custom",
                      imageUrl: newCustomProduct.imageUrl.trim() || undefined,
                      category: newCustomProduct.category,
                      cho_per_unit: newCustomProduct.cho_per_unit,
                      water_per_unit: newCustomProduct.water_per_unit || undefined,
                      sodium_per_unit: newCustomProduct.sodium_per_unit || undefined,
                      calories_per_unit: newCustomProduct.calories_per_unit,
                      price_per_unit: newCustomProduct.price_per_unit,
                      weight_g: newCustomProduct.weight_g,
                      allergens: [],
                      diet_tags: [],
                      description: "Produit personnalisé",
                    };

                    setCustomProducts((prev) => [product, ...prev]);
                    setNewCustomProduct({
                      name: "",
                      brand: "",
                      imageUrl: "",
                      category: "gel",
                      cho_per_unit: 25,
                      water_per_unit: 0,
                      sodium_per_unit: 0,
                      calories_per_unit: 100,
                      price_per_unit: 2,
                      weight_g: 40,
                    });
                  }}
                >
                  + Ajouter le produit custom
                </button>
              </div>

              {customProducts.length > 0 && (
                <div style={{ marginTop: 14, display: "flex", flexDirection: "column", gap: 8 }}>
                  {customProducts.map((item) => (
                    <div
                      key={item.id}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        padding: "10px 12px",
                        borderRadius: 8,
                        background: "var(--color-bg)",
                        border: "1px solid var(--color-border)",
                      }}
                    >
                      <div style={{ fontSize: 12, display: "flex", alignItems: "center", gap: 10 }}>
                        <ProductThumb product={item} alt={`${item.brand} ${item.name}`} />
                        <div>
                          <div style={{ fontWeight: 700 }}>
                            {item.brand} - {item.name}
                          </div>
                          <div style={{ color: "var(--color-text-muted)" }}>
                            {item.category} · {item.cho_per_unit}g CHO
                          </div>
                        </div>
                      </div>
                      <button
                        style={{ ...S.btnOutline, padding: "6px 10px", fontSize: 12 }}
                        onClick={() => setCustomProducts((prev) => prev.filter((p) => p.id !== item.id))}
                      >
                        Supprimer
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div style={S.card}>
              <div style={S.sectionTitle}>
                <span>💧</span> Hydratation & tolérance
              </div>
              <div style={S.grid2}>
                <div>
                  <label style={S.label}>TAUX DE SUDATION (L/h)</label>
                  <select
                    style={S.select}
                    value={profile.sweatRate}
                    onChange={(e) => setProfile({ ...profile, sweatRate: +e.target.value })}
                  >
                    <option value={0.5}>Faible (0.5 L/h)</option>
                    <option value={0.8}>Modéré (0.8 L/h)</option>
                    <option value={1.0}>Normal (1.0 L/h)</option>
                    <option value={1.3}>Élevé (1.3 L/h)</option>
                    <option value={1.6}>Très élevé (1.6 L/h)</option>
                  </select>
                  <p style={{ fontSize: 11, color: "var(--color-text-muted)", marginTop: 4 }}>
                    Effectuez un test sudation pour plus de précision
                  </p>
                </div>

                <div>
                  <div style={{ position: "relative", display: "flex", alignItems: "center", gap: 6 }}>
                    <label style={S.label}>TOLÉRANCE GI</label>
                    <div
                      title={
                        "Sensible : Système digestif fragile, max ~45g CHO/h\n" +
                        "Normal : Tolérance standard, max ~60g CHO/h\n" +
                        "Robuste : Haute capacité d'absorption, max ~90g CHO/h"
                      }
                      style={{ cursor: "help", fontSize: 13, color: "var(--color-text-muted)", lineHeight: 1 }}
                    >
                      ⓘ
                    </div>
                  </div>

                  <select
                    style={S.select}
                    value={profile.giTolerance}
                    onChange={(e) =>
                      setProfile({
                        ...profile,
                        giTolerance: e.target.value as "sensitive" | "normal" | "robust",
                      })
                    }
                  >
                    <option value="sensitive">Sensible (≤45g CHO/h)</option>
                    <option value="normal">Normal (≤60g CHO/h)</option>
                    <option value="robust">Robuste (≤90g CHO/h)</option>
                  </select>
                </div>
              </div>
            </div>

            <button
              style={S.btn}
              onClick={() => {
                try {
                  localStorage.setItem(ONBOARDING_PROFILE_KEY, "1");
                } catch {
                  /* ignore */
                }
                setMaxReachedStep((m) => (Math.max(m, 2) as PlanWizardStep));
                setCurrentStep(2);
              }}
            >
              Continuer → Paramètres course
            </button>
          </div>
        )}

        {currentStep === 2 && (
          <div id="plan-step-2" style={{ scrollMarginTop: 24 }}>
            <h1 style={{ fontSize: 28, fontWeight: 800, marginBottom: 8, letterSpacing: "-0.5px" }}>
              Ta course
            </h1>
            <p style={{ color: "var(--color-text-muted)", marginBottom: 32, fontSize: 14 }}>
              Décris ton événement pour calculer le plan optimal.
            </p>

            <div style={S.card}>
              <div style={S.sectionTitle}>
                <span>🏔</span> Détails course
              </div>

              <div style={S.grid3}>
                <div>
                  <label style={S.label}>SPORT</label>
                  <select
                    style={S.select}
                    value={event.sport}
                    onChange={(e) => setEvent({ ...event, sport: e.target.value })}
                  >
                    {SPORTS.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label style={S.label}>DISTANCE (km)</label>
                  <input
                    style={S.input}
                    type="number"
                    value={event.distance}
                    onChange={(e) => setEvent({ ...event, distance: +e.target.value })}
                    min={5}
                    max={500}
                  />
                </div>

                <div>
                  <label style={S.label}>TEMPS CIBLE (h)</label>
                  <input
                    style={S.input}
                    type="number"
                    value={event.targetTime}
                    onChange={(e) => setEvent({ ...event, targetTime: +e.target.value })}
                    min={0.5}
                    max={72}
                    step={0.5}
                  />
                </div>
              </div>

              <div style={{ ...S.grid2, marginTop: 16 }}>
                <div>
                  <label style={S.label}>DÉNIVELÉ POSITIF (m)</label>
                  <input
                    style={S.input}
                    type="number"
                    value={event.elevationGain}
                    onChange={(e) => setEvent({ ...event, elevationGain: +e.target.value })}
                    min={0}
                    max={15000}
                  />
                </div>

                <div>
                  <label style={S.label}>TYPE DE TERRAIN</label>
                  <select
                    style={S.select}
                    value={event.elevation}
                    onChange={(e) => setEvent({ ...event, elevation: e.target.value })}
                  >
                    {ELEVATION.map((elevation) => (
                      <option key={elevation} value={elevation}>
                        {elevation}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            <div style={S.card}>
              <div style={S.sectionTitle}>
                <span>🌡</span> Météo prévue
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 10 }}>
                {WEATHER.map((w) => (
                  <button
                    key={w}
                    onClick={() => setEvent({ ...event, weather: w })}
                    style={{
                      padding: "12px 8px",
                      borderRadius: 8,
                      border: `2px solid ${event.weather === w ? "var(--color-accent)" : "var(--color-border)"}`,
                      background:
                        event.weather === w ? "rgba(34,197,94,0.1)" : "var(--color-bg-card)",
                      color: event.weather === w ? "var(--color-accent)" : "var(--color-text-muted)",
                      fontSize: 12,
                      cursor: "pointer",
                      textAlign: "center",
                      fontWeight: 600,
                    }}
                  >
                    {w.split(" ")[0]}
                    <br />
                    <span style={{ fontSize: 10, fontWeight: 400 }}>
                      {w.split(" ").slice(1).join(" ")}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            <div style={S.card}>
              <div style={S.sectionTitle}>
                <span>📍</span> Ravitaillements fixes (optionnel)
              </div>
              <p style={{ fontSize: 12, color: "var(--color-text-muted)", marginBottom: 16 }}>
                Ajoute les points de ravitaillement où des produits seront fournis
              </p>

              {event.aidStations && event.aidStations.length > 0 && (
                <div style={{ marginBottom: 16 }}>
                  {event.aidStations.map((station, idx) => (
                    <div
                      key={idx}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        padding: "12px 14px",
                        borderRadius: 8,
                        background: "rgba(96,165,250,0.08)",
                        border: "1px solid #60a5fa",
                        marginBottom: 8,
                      }}
                    >
                      <div style={{ flex: 1 }}>
                        <div
                          style={{
                            fontWeight: 600,
                            fontSize: 14,
                            color: "#60a5fa",
                            marginBottom: 2,
                          }}
                        >
                          📍 {station.name || `Ravito ${idx + 1}`}
                        </div>

                        <div style={{ fontSize: 12, color: "var(--color-text-muted)" }}>
                          Km {station.distanceKm} · {station.availableProducts.length} produit(s) disponible(s)
                        </div>

                        {station.availableProducts.length > 0 && (
                          <div style={{ display: "flex", flexWrap: "wrap", gap: 4, marginTop: 6 }}>
                            {station.availableProducts.slice(0, 3).map((prodId) => {
                              const product = allProducts.find((p) => p.id === prodId);
                              return product ? (
                                <span
                                  key={prodId}
                                  style={{
                                    fontSize: 10,
                                    padding: "2px 6px",
                                    borderRadius: 4,
                                    background: "rgba(96,165,250,0.15)",
                                    color: "#60a5fa",
                                    display: "inline-flex",
                                    alignItems: "center",
                                    gap: 4,
                                  }}
                                >
                                  <ProductThumb
                                    product={product}
                                    alt={`${product.brand} ${product.name}`}
                                    size={16}
                                  />
                                  {product.brand} {product.name}
                                </span>
                              ) : null;
                            })}

                            {station.availableProducts.length > 3 && (
                              <span style={{ fontSize: 10, color: "var(--color-text-muted)" }}>
                                +{station.availableProducts.length - 3} autre(s)
                              </span>
                            )}
                          </div>
                        )}
                      </div>

                      <button
                        onClick={() => {
                          setEvent({
                            ...event,
                            aidStations: event.aidStations?.filter((_, i) => i !== idx),
                          });
                        }}
                        style={{
                          background: "none",
                          border: "none",
                          color: "#ef4444",
                          cursor: "pointer",
                          fontSize: 18,
                          padding: "0 8px",
                        }}
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {!showAidStationForm ? (
                <button
                  onClick={() => setShowAidStationForm(true)}
                  style={{
                    width: "100%",
                    padding: "12px",
                    borderRadius: 8,
                    background: "var(--color-bg)",
                    border: "1px dashed var(--color-border)",
                    color: "var(--color-text-muted)",
                    fontSize: 13,
                    cursor: "pointer",
                    fontWeight: 600,
                  }}
                >
                  + Ajouter un point de ravitaillement
                </button>
              ) : (
                <div
                  style={{
                    padding: 16,
                    borderRadius: 8,
                    background: "var(--color-bg)",
                    border: "1px solid var(--color-border)",
                  }}
                >
                  <div style={{ marginBottom: 12 }}>
                    <label style={S.label}>NOM DU RAVITAILLEMENT</label>
                    <input
                      style={S.input}
                      type="text"
                      placeholder="Ex: Ravito 1, Col du Tourmalet..."
                      value={newAidStation.name}
                      onChange={(e) =>
                        setNewAidStation({ ...newAidStation, name: e.target.value })
                      }
                    />
                  </div>

                  <div style={{ marginBottom: 12 }}>
                    <label style={S.label}>POSITION (km)</label>
                    <input
                      style={S.input}
                      type="number"
                      placeholder="Distance en km"
                      value={newAidStation.distanceKm || ""}
                      onChange={(e) =>
                        setNewAidStation({ ...newAidStation, distanceKm: +e.target.value })
                      }
                      min={0}
                      max={event.distance}
                    />
                  </div>

                  <div style={{ marginBottom: 12 }}>
                    <label style={S.label}>PRODUITS DISPONIBLES</label>
                    <p style={{ fontSize: 11, color: "var(--color-text-muted)", marginBottom: 8 }}>
                      Sélectionne les produits qui seront fournis à ce ravitaillement
                    </p>

                    <div
                      style={{
                        maxHeight: 150,
                        overflowY: "auto",
                        border: "1px solid var(--color-border)",
                        borderRadius: 6,
                        padding: 8,
                      }}
                    >
                      {["gel", "drink", "bar", "real-food"].map((category) => (
                        <div key={category} style={{ marginBottom: 12 }}>
                          <div
                            style={{
                              fontSize: 11,
                              fontWeight: 700,
                              color: "var(--color-text-muted)",
                              marginBottom: 4,
                              textTransform: "uppercase",
                            }}
                          >
                            {category === "gel"
                              ? "Gels"
                              : category === "drink"
                              ? "Boissons"
                              : category === "bar"
                              ? "Barres"
                              : "Aliments"}
                          </div>

                          {getProductsByCategoryWithCustom(category as Product["category"])
                            .slice(0, 8)
                            .map((product) => (
                              <label
                                key={product.id}
                                style={{
                                  display: "flex",
                                  alignItems: "center",
                                  gap: 8,
                                  padding: "4px 8px",
                                  cursor: "pointer",
                                  fontSize: 12,
                                  borderRadius: 4,
                                }}
                                onMouseEnter={(e) =>
                                  (e.currentTarget.style.background = "rgba(255,255,255,0.03)")
                                }
                                onMouseLeave={(e) => (e.currentTarget.style.background = "none")}
                              >
                                <input
                                  type="checkbox"
                                  checked={newAidStation.availableProducts.includes(product.id)}
                                  onChange={(e) => {
                                    if (e.target.checked) {
                                      setNewAidStation({
                                        ...newAidStation,
                                        availableProducts: [...newAidStation.availableProducts, product.id],
                                      });
                                    } else {
                                      setNewAidStation({
                                        ...newAidStation,
                                        availableProducts: newAidStation.availableProducts.filter(
                                          (id) => id !== product.id
                                        ),
                                      });
                                    }
                                  }}
                                />
                                <ProductThumb product={product} alt={`${product.brand} ${product.name}`} />
                                <span>
                                  {product.brand} - {product.name}
                                </span>
                              </label>
                            ))}
                        </div>
                      ))}
                    </div>
                  </div>

                  <div style={{ display: "flex", gap: 8 }}>
                    <button
                      onClick={() => {
                        setShowAidStationForm(false);
                        setNewAidStation({ distanceKm: 0, name: "", availableProducts: [] });
                      }}
                      style={{
                        flex: 1,
                        padding: "10px",
                        borderRadius: 6,
                        background: "var(--color-bg-card)",
                        border: "1px solid var(--color-border)",
                        color: "var(--color-text-muted)",
                        cursor: "pointer",
                        fontSize: 13,
                        fontWeight: 600,
                      }}
                    >
                      Annuler
                    </button>

                    <button
                      onClick={() => {
                        if (newAidStation.distanceKm > 0 && newAidStation.availableProducts.length > 0) {
                          const avgSpeed = event.distance / event.targetTime;
                          const estimatedTimeMin = (newAidStation.distanceKm / avgSpeed) * 60;

                          setEvent({
                            ...event,
                            aidStations: [
                              ...(event.aidStations || []),
                              {
                                ...newAidStation,
                                estimatedTimeMin: Math.round(estimatedTimeMin),
                              },
                            ].sort((a, b) => a.distanceKm - b.distanceKm),
                          });

                          setShowAidStationForm(false);
                          setNewAidStation({ distanceKm: 0, name: "", availableProducts: [] });
                        } else {
                          alert("Veuillez remplir la position et sélectionner au moins un produit");
                        }
                      }}
                      style={{
                        flex: 2,
                        padding: "10px",
                        borderRadius: 6,
                        background: "var(--color-accent)",
                        border: "none",
                        color: "#000",
                        cursor: "pointer",
                        fontSize: 13,
                        fontWeight: 700,
                      }}
                    >
                      Ajouter le ravitaillement
                    </button>
                  </div>
                </div>
              )}
            </div>

            <div style={{ display: "flex", gap: 12 }}>
              <button style={{ ...S.btnOutline, flex: 1 }} onClick={() => setCurrentStep(1)}>
                ← Profil
              </button>
              <button style={{ ...S.btn, flex: 2 }} onClick={handleCalculate}>
                Calculer mon plan →
              </button>
            </div>
          </div>
        )}

        {currentStep === 3 && plan && (
          <div id="plan-step-3" style={{ scrollMarginTop: 24 }}>
            <PlanResult
              plan={plan}
              profile={profile}
              event={event}
              onBack={() => setCurrentStep(2)}
              customProducts={customProducts}
            />
          </div>
        )}
      </div>
    </div>
  );
}

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function formatIcsDate(date: Date): string {
  return date.toISOString().replaceAll("-", "").replaceAll(":", "").replace(/\.\d{3}Z$/, "Z");
}

function escapeIcsText(value: string): string {
  return value
    .replaceAll("\\", "\\\\")
    .replaceAll(";", "\\;")
    .replaceAll(",", "\\,")
    .replaceAll("\n", "\\n");
}

function PlanResult({
  plan,
  profile,
  event,
  onBack,
  customProducts,
}: {
  plan: FuelPlan;
  profile: AthleteProfile;
  event: EventDetails;
  onBack: () => void;
  customProducts: Product[];
}) {
  const [activeTab, setActiveTab] = useState<"plan" | "shop" | "export">("plan");
  const [linkCopiedToast, setLinkCopiedToast] = useState(false);

  const [compareCategory, setCompareCategory] = useState<
    "all" | "gel" | "drink" | "bar" | "chew" | "real-food" | "electrolyte"
  >("all");
  const [compareSort, setCompareSort] = useState<"cho-euro" | "efficiency" | "price">("cho-euro");
  const productsCatalog = [...PRODUCTS, ...customProducts];

  const estimatedCost = plan.shoppingList.reduce((sum, item) => {
    const prod = productsCatalog.find((p) => p.id === item.productId);
    return sum + (prod?.price_per_unit || 0) * item.quantity;
  }, 0);

  const timelineByHour = plan.timeline.reduce<Array<{ hour: number; items: FuelPlan["timeline"] }>>(
    (groups, item) => {
      const hour = Math.floor(item.timeMin / 60);
      const group = groups[groups.length - 1];
      if (!group || group.hour !== hour) {
        groups.push({ hour, items: [item] });
      } else {
        group.items.push(item);
      }
      return groups;
    },
    []
  );

  const comparedProducts = productsCatalog
    .filter((product) => (compareCategory === "all" ? true : product.category === compareCategory))
    .map((product) => {
      const choPerEuro = product.price_per_unit > 0 ? product.cho_per_unit / product.price_per_unit : 0;
      const sodiumPerEuro =
        product.price_per_unit > 0 ? (product.sodium_per_unit || 0) / product.price_per_unit : 0;
      const caloriesPerEuro =
        product.price_per_unit > 0 ? product.calories_per_unit / product.price_per_unit : 0;

      // Score synthétique orienté endurance: priorité CHO/€ + bonus sodium/calories.
      const efficiencyScore = choPerEuro * 0.7 + sodiumPerEuro * 0.0002 + caloriesPerEuro * 0.001;
      return { product, choPerEuro, efficiencyScore };
    })
    .sort((a, b) => {
      if (compareSort === "price") return a.product.price_per_unit - b.product.price_per_unit;
      if (compareSort === "efficiency") return b.efficiencyScore - a.efficiencyScore;
      return b.choPerEuro - a.choPerEuro;
    })
    .slice(0, 12);

  const handlePrintPdf = () => {
    const printWindow = window.open("", "_blank", "width=1000,height=800");
    if (!printWindow) {
      alert("Autorise les pop-ups pour exporter en PDF.");
      return;
    }

    const warningBlocks = (plan.warnings || [])
      .map((w) => `<li>${escapeHtml(w.replace(/^(⚠️|💡|ℹ️)\s*/, ""))}</li>`)
      .join("");

    const timelineBlocks = timelineByHour
      .map((group) => {
        const rows = group.items
          .map((item) => {
            const source =
              item.source === "aid-station"
                ? ` · <span class="muted">📍 ${escapeHtml(item.aidStationName || "ravitaillement fourni")}</span>`
                : "";
            const details = `${item.quantity} · ${item.cho}g CHO${
              item.water ? ` · ${item.water}ml eau` : ""
            }${item.sodium ? ` · ${item.sodium}mg Na+` : ""}`;

            return `
              <tr>
                <td>${Math.floor(item.timeMin / 60)}h${String(item.timeMin % 60).padStart(2, "0")}</td>
                <td>${escapeHtml(item.product)}${source}</td>
                <td>${escapeHtml(details)}</td>
                <td>${escapeHtml(item.type)}</td>
              </tr>
            `;
          })
          .join("");

        return `
          <h3>Heure ${group.hour}</h3>
          <table>
            <thead>
              <tr><th>Heure</th><th>Produit</th><th>Dose</th><th>Type</th></tr>
            </thead>
            <tbody>${rows}</tbody>
          </table>
        `;
      })
      .join("");

    const shoppingRows = plan.shoppingList
      .map((item) => {
        const prod = productsCatalog.find((p) => p.id === item.productId);
        const unitPrice = prod?.price_per_unit || 0;
        return `
          <tr>
            <td>${escapeHtml(prod?.brand || "")} ${escapeHtml(prod?.name || item.productId)}</td>
            <td>x${item.quantity}</td>
            <td>${(unitPrice * item.quantity).toFixed(2)}€</td>
          </tr>
        `;
      })
      .join("");

    const html = `<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <title>FuelOS - Plan nutritionnel</title>
    <style>
      @page { size: A4; margin: 14mm; }
      body { font-family: Inter, Arial, sans-serif; color: #111; margin: 0; }
      .header { margin-bottom: 18px; border-bottom: 2px solid #111; padding-bottom: 12px; }
      .title { font-size: 24px; font-weight: 800; margin-bottom: 4px; }
      .sub { color: #444; font-size: 12px; }
      .grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px; margin: 14px 0 20px; }
      .kpi { border: 1px solid #ddd; border-radius: 8px; padding: 10px; }
      .kpi .v { font-size: 22px; font-weight: 800; }
      .kpi .l { font-size: 11px; color: #555; text-transform: uppercase; letter-spacing: .04em; }
      h2 { font-size: 16px; margin: 18px 0 8px; }
      h3 { font-size: 13px; margin: 12px 0 6px; color: #222; }
      ul { margin: 0; padding-left: 18px; }
      li { margin: 0 0 4px; font-size: 12px; }
      table { width: 100%; border-collapse: collapse; margin-bottom: 10px; }
      th, td { border: 1px solid #ddd; padding: 6px 8px; font-size: 11px; text-align: left; vertical-align: top; }
      th { background: #f3f4f6; font-size: 10px; text-transform: uppercase; letter-spacing: .04em; }
      .muted { color: #666; font-size: 10px; }
      .footer { margin-top: 16px; color: #666; font-size: 10px; border-top: 1px solid #ddd; padding-top: 8px; }
    </style>
  </head>
  <body>
    <div class="header">
      <div class="title">FuelOS - Plan nutritionnel</div>
      <div class="sub">${escapeHtml(event.sport)} · ${event.distance} km · ${event.targetTime} h · ${escapeHtml(event.weather)}</div>
      <div class="sub">Profil: ${profile.weight} kg · ${profile.age} ans · GI ${escapeHtml(profile.giTolerance)}</div>
    </div>

    <div class="grid">
      <div class="kpi"><div class="v">${plan.choPerHour}g</div><div class="l">CHO / heure</div></div>
      <div class="kpi"><div class="v">${plan.waterPerHour}ml</div><div class="l">Eau / heure</div></div>
      <div class="kpi"><div class="v">${plan.sodiumPerHour}mg</div><div class="l">Sodium / heure</div></div>
      <div class="kpi"><div class="v">${plan.totalCalories}</div><div class="l">Calories totales</div></div>
    </div>

    ${warningBlocks ? `<h2>Avertissements & conseils</h2><ul>${warningBlocks}</ul>` : ""}
    <h2>Timeline de course</h2>
    ${timelineBlocks}
    <h2>Liste de courses</h2>
    <table>
      <thead><tr><th>Produit</th><th>Quantité</th><th>Coût estimé</th></tr></thead>
      <tbody>${shoppingRows}</tbody>
    </table>
    <div style="font-weight:700; font-size:12px;">Coût total estimé: ${estimatedCost.toFixed(2)}€</div>
    <div class="footer">Généré le ${new Date().toLocaleString("fr-FR")} · FuelOS</div>
  </body>
</html>`;

    printWindow.document.open();
    printWindow.document.write(html);
    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
  };

  const handleExportIcs = () => {
    const now = new Date();
    const defaultStart = new Date(now.getTime() + 5 * 60000).toISOString().slice(0, 16);
    const startInput = window.prompt(
      "Date/heure de départ de course (format: YYYY-MM-DDTHH:mm)",
      defaultStart
    );

    if (!startInput) return;

    const raceStart = new Date(startInput);
    if (Number.isNaN(raceStart.getTime())) {
      alert("Format invalide. Utilise par exemple: 2026-04-01T08:30");
      return;
    }

    const calendarLines: string[] = [
      "BEGIN:VCALENDAR",
      "VERSION:2.0",
      "PRODID:-//FuelOS//Nutrition Plan//FR",
      "CALSCALE:GREGORIAN",
      "METHOD:PUBLISH",
      "X-WR-CALNAME:FuelOS - Plan nutrition",
      "X-WR-TIMEZONE:UTC",
    ];

    plan.timeline.forEach((item, index) => {
      const eventStart = new Date(raceStart.getTime() + item.timeMin * 60000);
      const eventEnd = new Date(eventStart.getTime() + 5 * 60000);
      const uid = `fuelos-${Date.now()}-${index}@fuelos.app`;
      const details = `${item.quantity} · ${item.cho}g CHO${
        item.water ? ` · ${item.water}ml eau` : ""
      }${item.sodium ? ` · ${item.sodium}mg Na+` : ""}`;
      const source =
        item.source === "aid-station"
          ? ` (ravitaillement${item.aidStationName ? `: ${item.aidStationName}` : ""})`
          : "";

      calendarLines.push(
        "BEGIN:VEVENT",
        `UID:${uid}`,
        `DTSTAMP:${formatIcsDate(new Date())}`,
        `DTSTART:${formatIcsDate(eventStart)}`,
        `DTEND:${formatIcsDate(eventEnd)}`,
        `SUMMARY:${escapeIcsText(`FuelOS · ${item.product}`)}`,
        `DESCRIPTION:${escapeIcsText(`${details}${source}`)}`,
        `CATEGORIES:${escapeIcsText("Nutrition,Sport")}`,
        "BEGIN:VALARM",
        "ACTION:DISPLAY",
        `DESCRIPTION:${escapeIcsText(`Rappel FuelOS: ${item.product}`)}`,
        "TRIGGER:-PT1M",
        "END:VALARM",
        "END:VEVENT"
      );
    });

    calendarLines.push("END:VCALENDAR");

    const icsContent = calendarLines.join("\r\n");
    const blob = new Blob([icsContent], { type: "text/calendar;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `fuelos-plan-${event.sport.toLowerCase().replaceAll(" ", "-")}.ics`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  };

  const handleCopyShareLink = useCallback(async () => {
    try {
      const payload = encodeURIComponent(JSON.stringify({ plan, profile, event }));
      const shareUrl = `${window.location.origin}/race?plan=${payload}`;
      await navigator.clipboard.writeText(shareUrl);
      setLinkCopiedToast(true);
      window.setTimeout(() => setLinkCopiedToast(false), 2000);
    } catch {
      alert("Impossible de copier le lien automatiquement.");
    }
  }, [plan, profile, event]);

  return (
    <div>
      {linkCopiedToast && (
        <div
          role="status"
          aria-live="polite"
          style={{
            position: "fixed",
            bottom: 24,
            left: "50%",
            transform: "translateX(-50%)",
            padding: "12px 20px",
            borderRadius: 10,
            background: "var(--color-text)",
            color: "var(--color-bg)",
            fontWeight: 600,
            fontSize: 14,
            boxShadow: "0 4px 24px rgba(0, 0, 0, 0.18)",
            zIndex: 9999,
            pointerEvents: "none",
          }}
        >
          Lien copié !
        </div>
      )}

      <div
        role="status"
        style={{
          display: "flex",
          flexWrap: "wrap",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 12,
          marginBottom: 20,
          padding: "14px 18px",
          borderRadius: 12,
          border: "1px solid rgba(34, 197, 94, 0.35)",
          background: "rgba(34, 197, 94, 0.08)",
        }}
      >
        <span style={{ fontWeight: 600, fontSize: 15, color: "var(--color-text)" }}>
          ✅ Plan sauvegardé — accessible depuis Race Mode
        </span>
        <button type="button" style={{ ...S.btnOutline, flexShrink: 0 }} onClick={handleCopyShareLink}>
          Copier le lien du plan
        </button>
      </div>

      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: 24,
        }}
      >
        <div>
          <h1 style={{ fontSize: 28, fontWeight: 800, letterSpacing: "-0.5px", marginBottom: 4 }}>
            Ton plan nutritionnel
          </h1>
          <p style={{ color: "var(--color-text-muted)", fontSize: 14 }}>
            {event.sport} · {event.distance}km · {event.targetTime}h · {event.weather}
          </p>
        </div>

        <div style={{ display: "flex", gap: 8 }}>
          <Link
            href={`/race?plan=${encodeURIComponent(JSON.stringify({ plan, profile, event }))}`}
            style={{
              padding: "12px 20px",
              borderRadius: 10,
              background: "var(--color-accent)",
              color: "#000",
              fontWeight: 700,
              fontSize: 14,
              textDecoration: "none",
            }}
          >
            ⏱ Lancer Race Mode
          </Link>
          <button style={S.btnOutline} onClick={onBack}>
            Modifier
          </button>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12, marginBottom: 24 }}>
        {[
          { label: "CHO/h", value: `${plan.choPerHour}g`, color: "var(--color-accent)", sub: "Glucides/heure" },
          { label: "Eau/h", value: `${plan.waterPerHour}ml`, color: "#60a5fa", sub: "Hydratation/heure" },
          { label: "Na+/h", value: `${plan.sodiumPerHour}mg`, color: "#f59e0b", sub: "Sodium/heure" },
          { label: "Total kcal", value: `${plan.totalCalories}`, color: "#a78bfa", sub: "Calories totales" },
        ].map((item) => (
          <div
            key={item.label}
            style={{
              background: "var(--color-bg-card)",
              border: "1px solid var(--color-border)",
              borderRadius: 12,
              padding: 16,
              textAlign: "center",
            }}
          >
            <div style={{ fontSize: 24, fontWeight: 800, color: item.color, marginBottom: 4 }}>
              {item.value}
            </div>
            <div
              style={{
                fontSize: 11,
                fontWeight: 700,
                letterSpacing: "0.5px",
                color: "var(--color-text-muted)",
              }}
            >
              {item.sub}
            </div>
          </div>
        ))}
      </div>

      {plan.warnings && plan.warnings.length > 0 && (
        <div style={{ marginBottom: 24 }}>
          {plan.warnings.map((warning, idx) => (
            <div
              key={idx}
              style={{
                padding: "14px 16px",
                borderRadius: 8,
                background: warning.includes("⚠️")
                  ? "rgba(245,158,11,0.1)"
                  : "rgba(96,165,250,0.1)",
                border: `1px solid ${warning.includes("⚠️") ? "#f59e0b" : "#60a5fa"}`,
                marginBottom: 8,
                display: "flex",
                alignItems: "flex-start",
                gap: 10,
              }}
            >
              <span style={{ fontSize: 18, flexShrink: 0 }}>
                {warning.includes("⚠️") ? "⚠️" : warning.includes("💡") ? "💡" : "ℹ️"}
              </span>
              <div
                style={{
                  fontSize: 13,
                  color: warning.includes("⚠️") ? "#f59e0b" : "#60a5fa",
                  lineHeight: 1.5,
                  flex: 1,
                }}
              >
                {warning.replace(/^(⚠️|💡|ℹ️)\s*/, "")}
              </div>
            </div>
          ))}
        </div>
      )}

      {plan.choStrategy && (
        <div
          style={{
            marginBottom: 24,
            padding: "16px 20px",
            borderRadius: 12,
            background: "var(--color-bg-card)",
            border: "1px solid var(--color-border)",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
            <span style={{ fontSize: 16 }}>⚡</span>
            <h4 style={{ fontSize: 14, fontWeight: 700, margin: 0, color: "var(--color-text)" }}>
              Stratégie glucidique
            </h4>
            <span
              style={{
                fontSize: 11,
                padding: "2px 8px",
                borderRadius: 99,
                background:
                  plan.choStrategy.type === "constant"
                    ? "rgba(96,165,250,0.15)"
                    : "rgba(251,146,60,0.15)",
                color: plan.choStrategy.type === "constant" ? "#60a5fa" : "#fb923c",
                fontWeight: 600,
                letterSpacing: "0.3px",
              }}
            >
              {plan.choStrategy.type === "constant" ? "Intensité constante" : "Progression par phases"}
            </span>
          </div>

          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            {plan.choStrategy.phases.map((phase, i) => (
              <div
                key={i}
                style={{
                  flex: 1,
                  minWidth: 100,
                  padding: "10px 14px",
                  borderRadius: 10,
                  background: `rgba(${
                    i === 0 ? "96,165,250" : i === 1 ? "52,211,153" : "251,146,60"
                  },0.08)`,
                  border: `1px solid rgba(${
                    i === 0 ? "96,165,250" : i === 1 ? "52,211,153" : "251,146,60"
                  },0.25)`,
                }}
              >
                <div
                  style={{
                    fontSize: 11,
                    fontWeight: 600,
                    color: "var(--color-text-muted)",
                    marginBottom: 4,
                    textTransform: "uppercase",
                    letterSpacing: "0.5px",
                  }}
                >
                  {i === 0 ? "Phase 1" : i === 1 ? "Phase 2" : "Phase 3"} · {phase.startTimeMin}–{phase.endTimeMin}min
                </div>

                <div
                  style={{
                    fontSize: 22,
                    fontWeight: 800,
                    color: i === 0 ? "#60a5fa" : i === 1 ? "#34d399" : "#fb923c",
                  }}
                >
                  {phase.choPerHour}
                  <span style={{ fontSize: 12, fontWeight: 500, color: "var(--color-text-muted)" }}>
                    g/h
                  </span>
                </div>

                <div style={{ fontSize: 11, color: "var(--color-text-muted)", marginTop: 2 }}>
                  {phase.description}
                </div>
              </div>
            ))}
          </div>

          <div style={{ marginTop: 16, marginBottom: 4 }}>
            <div
              style={{
                fontSize: 11,
                fontWeight: 700,
                color: "var(--color-text-muted)",
                marginBottom: 6,
                textTransform: "uppercase",
                letterSpacing: "0.5px",
              }}
            >
              📈 Courbe CHO/h
            </div>

            {(() => {
              const p = plan.choStrategy!.phases;
              const total = p[p.length - 1].endTimeMin;
              const mx = Math.max(...p.map((x) => x.choPerHour)) * 1.2;
              const W = 360;
              const H = 70;
              const PL = 28;
              const PR = 8;
              const PT = 6;
              const PB = 16;
              const gW = W - PL - PR;
              const gH = H - PT - PB;
              const tx = (m: number) => PL + (m / total) * gW;
              const ty = (c: number) => PT + gH - (c / mx) * gH;
              const C = ["#60a5fa", "#34d399", "#fb923c"];
              let d = "";

              p.forEach((ph, i) => {
                const x1 = tx(ph.startTimeMin);
                const x2 = tx(ph.endTimeMin);
                const y = ty(ph.choPerHour);
                d += i === 0 ? `M${x1},${y} L${x2},${y}` : ` L${x1},${y} L${x2},${y}`;
              });

              const aD = `${d} L${tx(p[p.length - 1].endTimeMin)},${PT + gH} L${tx(
                p[0].startTimeMin
              )},${PT + gH} Z`;

              return (
                <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", display: "block", overflow: "visible" }}>
                  <defs>
                    <linearGradient id="choG" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="var(--color-accent)" stopOpacity="0.2" />
                      <stop offset="100%" stopColor="var(--color-accent)" stopOpacity="0" />
                    </linearGradient>
                  </defs>

                  {p.map((ph, i) => (
                    <rect
                      key={i}
                      x={tx(ph.startTimeMin)}
                      y={PT}
                      width={tx(ph.endTimeMin) - tx(ph.startTimeMin)}
                      height={gH}
                      fill={C[i % 3]}
                      fillOpacity={0.05}
                    />
                  ))}

                  {[0.5, 1].map((t, i) => (
                    <line
                      key={i}
                      x1={PL}
                      x2={W - PR}
                      y1={ty(mx * t)}
                      y2={ty(mx * t)}
                      stroke="var(--color-border)"
                      strokeWidth="0.5"
                      strokeDasharray="3 3"
                    />
                  ))}

                  <line x1={PL} x2={PL} y1={PT} y2={PT + gH} stroke="var(--color-border)" strokeWidth="1" />
                  <line x1={PL} x2={W - PR} y1={PT + gH} y2={PT + gH} stroke="var(--color-border)" strokeWidth="1" />

                  {[0.5, 1].map((t, i) => (
                    <text
                      key={i}
                      x={PL - 3}
                      y={ty(mx * t) + 3}
                      textAnchor="end"
                      fontSize="7"
                      fill="var(--color-text-muted)"
                    >
                      {Math.round(mx * t)}
                    </text>
                  ))}

                  <path d={aD} fill="url(#choG)" />
                  <path
                    d={d}
                    fill="none"
                    stroke="var(--color-accent)"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />

                  {p.map((ph, i) => {
                    const cx = tx((ph.startTimeMin + ph.endTimeMin) / 2);
                    const cy = ty(ph.choPerHour);
                    return (
                      <g key={i}>
                        <circle cx={tx(ph.startTimeMin)} cy={cy} r={3} fill={C[i % 3]} stroke="white" strokeWidth="1" />
                        <text x={cx} y={cy - 6} textAnchor="middle" fontSize="8" fontWeight="700" fill={C[i % 3]}>
                          {ph.choPerHour}g/h
                        </text>
                      </g>
                    );
                  })}

                  {p.map((ph, i) => (
                    <text key={i} x={tx(ph.startTimeMin)} y={H - 2} textAnchor="middle" fontSize="7" fill="var(--color-text-muted)">
                      {ph.startTimeMin}min
                    </text>
                  ))}

                  <text
                    x={tx(p[p.length - 1].endTimeMin)}
                    y={H - 2}
                    textAnchor="end"
                    fontSize="7"
                    fill="var(--color-text-muted)"
                  >
                    {p[p.length - 1].endTimeMin}min
                  </text>
                </svg>
              );
            })()}
          </div>

          <div
            style={{
              marginTop: 10,
              fontSize: 11,
              color: "var(--color-text-muted)",
              display: "flex",
              gap: 16,
              flexWrap: "wrap",
            }}
          >
            <span>
              🎯 Objectif moyen : <strong style={{ color: "var(--color-accent)" }}>{plan.choPerHour}g CHO/h</strong>
            </span>
            <span>
              💧 Hydratation : <strong>{plan.waterPerHour}ml/h</strong>
            </span>
            <span>
              🧂 Sodium : <strong>{plan.sodiumPerHour}mg/h</strong>
            </span>
          </div>
        </div>
      )}

      <div
        style={{
          display: "flex",
          gap: 4,
          marginBottom: 20,
          borderBottom: "1px solid var(--color-border)",
          paddingBottom: 0,
        }}
      >
        {(["plan", "shop", "export"] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            style={{
              padding: "10px 20px",
              border: "none",
              background: "none",
              color: activeTab === tab ? "var(--color-accent)" : "var(--color-text-muted)",
              fontWeight: 600,
              fontSize: 14,
              cursor: "pointer",
              borderBottom: `2px solid ${activeTab === tab ? "var(--color-accent)" : "transparent"}`,
              marginBottom: -1,
            }}
          >
            {tab === "plan" ? "📋 Timeline" : tab === "shop" ? "🛒 Shopping" : "📤 Export"}
          </button>
        ))}
      </div>

      {activeTab === "plan" && (
        <div style={S.card}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
            <h3 style={{ fontWeight: 700 }}>Timeline in-race</h3>
            <span style={{ fontSize: 12, color: "var(--color-text-muted)" }}>Durée totale: {event.targetTime}h</span>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {plan.timeline.map((item, i) => {
              const productData = productsCatalog.find((p) => p.id === item.productId);

              return (
                <div
                  key={i}
                  style={{
                    display: "flex",
                    alignItems: "flex-start",
                    gap: 12,
                    padding: "12px 14px",
                    borderRadius: 8,
                    background:
                      item.source === "aid-station"
                        ? "rgba(96,165,250,0.08)"
                        : i === 0
                        ? "rgba(34,197,94,0.05)"
                        : "var(--color-bg)",
                    border: `1px solid ${
                      item.source === "aid-station"
                        ? "#60a5fa"
                        : i === 0
                        ? "var(--color-accent)"
                        : "var(--color-border)"
                    }`,
                  }}
                >
                  <div style={{ minWidth: 60, fontWeight: 700, color: "var(--color-accent)", fontSize: 14 }}>
                    {Math.floor(item.timeMin / 60)}h{String(item.timeMin % 60).padStart(2, "0")}
                  </div>

                  <div style={{ flex: 1 }}>
                    {item.source === "aid-station" && (
                      <div
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: 4,
                          padding: "2px 8px",
                          borderRadius: 12,
                          background: "#60a5fa",
                          color: "#000",
                          fontSize: 10,
                          fontWeight: 700,
                          marginBottom: 4,
                        }}
                      >
                        📍 {item.aidStationName || "RAVITAILLEMENT"}
                      </div>
                    )}

                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 2 }}>
                      <ProductThumb product={productData} alt={item.product} size={26} />
                      <div style={{ fontWeight: 600, fontSize: 14 }}>
                        {item.product}
                        {item.source === "aid-station" && (
                          <span
                            style={{
                              fontSize: 11,
                              color: "#60a5fa",
                              marginLeft: 6,
                              fontWeight: 500,
                            }}
                          >
                            (fourni)
                          </span>
                        )}
                      </div>
                    </div>

                    <div style={{ fontSize: 12, color: "var(--color-text-muted)" }}>
                      {item.quantity} · {item.cho}g CHO
                      {item.water ? ` · ${item.water}ml eau` : ""}
                      {item.sodium ? ` · ${item.sodium}mg Na+` : ""}
                    </div>

                    {item.alert && (
                      <div
                        style={{
                          fontSize: 11,
                          color: item.source === "aid-station" ? "#60a5fa" : "var(--color-accent)",
                          marginTop: 4,
                          fontStyle: "italic",
                        }}
                      >
                        {item.alert}
                      </div>
                    )}
                  </div>

                  <div
                    style={{
                      fontSize: 11,
                      padding: "3px 8px",
                      borderRadius: 99,
                      background:
                        item.type === "gel"
                          ? "rgba(34,197,94,0.15)"
                          : item.type === "drink"
                          ? "rgba(96,165,250,0.15)"
                          : "rgba(245,158,11,0.15)",
                      color:
                        item.type === "gel"
                          ? "var(--color-accent)"
                          : item.type === "drink"
                          ? "#60a5fa"
                          : "#f59e0b",
                      fontWeight: 600,
                    }}
                  >
                    {item.type}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {activeTab === "shop" && (
        <div>
          <div style={{ ...S.card, marginBottom: 14 }}>
            <h3 style={{ fontWeight: 700, marginBottom: 12 }}>Comparateur produits</h3>
            <p style={{ fontSize: 12, color: "var(--color-text-muted)", marginBottom: 14 }}>
              Compare rapidement les produits selon le rendement glucidique et un score global.
            </p>

            <div style={{ ...S.grid2, marginBottom: 12 }}>
              <div>
                <label style={S.label}>CATÉGORIE</label>
                <select
                  style={S.select}
                  value={compareCategory}
                  onChange={(e) =>
                    setCompareCategory(
                      e.target.value as "all" | "gel" | "drink" | "bar" | "chew" | "real-food" | "electrolyte"
                    )
                  }
                >
                  <option value="all">Toutes</option>
                  <option value="gel">Gels</option>
                  <option value="drink">Boissons</option>
                  <option value="bar">Barres</option>
                  <option value="chew">Chews</option>
                  <option value="real-food">Real food</option>
                  <option value="electrolyte">Electrolytes</option>
                </select>
              </div>
              <div>
                <label style={S.label}>TRI</label>
                <select
                  style={S.select}
                  value={compareSort}
                  onChange={(e) => setCompareSort(e.target.value as "cho-euro" | "efficiency" | "price")}
                >
                  <option value="cho-euro">CHO / EUR</option>
                  <option value="efficiency">Efficacite globale</option>
                  <option value="price">Prix / unite</option>
                </select>
              </div>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {comparedProducts.map(({ product, choPerEuro, efficiencyScore }) => (
                <div
                  key={`compare-${product.id}`}
                  style={{
                    display: "grid",
                    gridTemplateColumns: "minmax(180px, 2fr) repeat(4, 1fr)",
                    gap: 10,
                    alignItems: "center",
                    padding: "10px 12px",
                    borderRadius: 8,
                    background: "var(--color-bg)",
                    border: "1px solid var(--color-border)",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <ProductThumb product={product} alt={`${product.brand} ${product.name}`} />
                    <div>
                      <div style={{ fontWeight: 600, fontSize: 13 }}>
                        {product.brand} - {product.name}
                      </div>
                      <div style={{ fontSize: 11, color: "var(--color-text-muted)" }}>{product.category}</div>
                    </div>
                  </div>
                  <div style={{ fontSize: 12 }}>
                    <div style={{ color: "var(--color-text-muted)" }}>CHO/EUR</div>
                    <div style={{ fontWeight: 700, color: "var(--color-accent)" }}>{choPerEuro.toFixed(1)} g</div>
                  </div>
                  <div style={{ fontSize: 12 }}>
                    <div style={{ color: "var(--color-text-muted)" }}>Efficacite</div>
                    <div style={{ fontWeight: 700 }}>{efficiencyScore.toFixed(1)}</div>
                  </div>
                  <div style={{ fontSize: 12 }}>
                    <div style={{ color: "var(--color-text-muted)" }}>CHO/unite</div>
                    <div style={{ fontWeight: 700 }}>{product.cho_per_unit} g</div>
                  </div>
                  <div style={{ fontSize: 12, textAlign: "right" }}>
                    <div style={{ color: "var(--color-text-muted)" }}>Prix</div>
                    <div style={{ fontWeight: 700 }}>{product.price_per_unit.toFixed(2)} EUR</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div style={S.card}>
            <h3 style={{ fontWeight: 700, marginBottom: 16 }}>Liste de courses</h3>

            <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 20 }}>
              {plan.shoppingList.map((item, i) => {
                const prod = productsCatalog.find((p) => p.id === item.productId);

                return (
                  <div
                    key={i}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      padding: "12px 14px",
                      borderRadius: 8,
                      background: "var(--color-bg)",
                      border: "1px solid var(--color-border)",
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <ProductThumb product={prod} alt={prod?.name || item.productId} />

                      <div>
                        <div style={{ fontWeight: 600, fontSize: 14 }}>{prod?.name || item.productId}</div>
                        <div style={{ fontSize: 12, color: "var(--color-text-muted)" }}>
                          {prod?.brand} · {prod?.cho_per_unit}g CHO/unité
                        </div>
                      </div>
                    </div>

                    <div style={{ textAlign: "right" }}>
                      <div style={{ fontWeight: 700, color: "var(--color-accent)" }}>x{item.quantity}</div>
                      <div style={{ fontSize: 12, color: "var(--color-text-muted)" }}>
                        ~{((prod?.price_per_unit || 0) * item.quantity).toFixed(2)}€
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            <div
              style={{
                padding: "14px 16px",
                borderRadius: 8,
                background: "rgba(34,197,94,0.08)",
                border: "1px solid var(--color-accent)",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <span style={{ fontWeight: 600 }}>Coût total estimé</span>
              <span style={{ fontWeight: 800, fontSize: 20, color: "var(--color-accent)" }}>
                ~
                {plan.shoppingList
                  .reduce((sum, item) => {
                    const prod = productsCatalog.find((p) => p.id === item.productId);
                    return sum + (prod?.price_per_unit || 0) * item.quantity;
                  }, 0)
                  .toFixed(2)}
                €
              </span>
            </div>
          </div>
        </div>
      )}

      {activeTab === "export" && (
        <div style={S.card}>
          <h3 style={{ fontWeight: 700, marginBottom: 16 }}>Exporter le plan</h3>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            {[
              {
                icon: "📱",
                label: "Sauvegarder (local)",
                desc: "Sauvegarde dans le navigateur pour Race Mode",
                action: () => {
                  localStorage.setItem(
                    "fuelos_active_plan",
                    JSON.stringify({ plan, profile, event, savedAt: new Date().toISOString() })
                  );
                  alert("Plan sauvegardé ! Accédez à Race Mode pour l'utiliser.");
                },
              },
              {
                icon: "🖨️",
                label: "Exporter PDF",
                desc: "Format A4 imprimable (mise en page propre)",
                action: handlePrintPdf,
              },
              {
                icon: "📅",
                label: "Exporter ICS",
                desc: "Rappels timeline dans le calendrier",
                action: handleExportIcs,
              },
              {
                icon: "🔗",
                label: "Lien de partage",
                desc: "URL avec plan encodé (ouvre Race Mode)",
                action: handleCopyShareLink,
              },
              {
                icon: "📋",
                label: "Copier JSON",
                desc: "Pour développeurs / backup",
                action: () => {
                  navigator.clipboard.writeText(JSON.stringify({ plan, profile, event }, null, 2));
                  alert("Plan copié dans le presse-papier !");
                },
              },
            ].map((item) => (
              <button
                key={item.label}
                onClick={item.action}
                style={{
                  padding: 20,
                  borderRadius: 10,
                  background: "var(--color-bg)",
                  border: "1px solid var(--color-border)",
                  cursor: "pointer",
                  textAlign: "left",
                  color: "var(--color-text)",
                }}
              >
                <div style={{ fontSize: 28, marginBottom: 8 }}>{item.icon}</div>
                <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 4 }}>{item.label}</div>
                <div style={{ fontSize: 12, color: "var(--color-text-muted)" }}>{item.desc}</div>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default function PlanPage() {
  return (
    <Suspense
      fallback={
        <div
          style={{
            minHeight: "100vh",
            background: "var(--color-bg)",
            color: "var(--color-text)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontFamily: "system-ui, sans-serif",
          }}
        >
          Chargement…
        </div>
      }
    >
      <PlanPageContent />
    </Suspense>
  );
}