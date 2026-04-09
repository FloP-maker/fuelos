"use client";

import dynamic from "next/dynamic";
import { useState, useEffect, useRef, useCallback, useMemo, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useSession } from "next-auth/react";
import { athleteProfileFromJson } from "../lib/athleteProfileData";
import useLocalStorage from "../lib/hooks/useLocalStorage";
import usePageTitle from "../lib/hooks/usePageTitle";
import { calculateFuelPlan } from "../lib/fuelCalculator";
import {
  recalculateFuelPlanFromTimeline,
  timelineItemWithProduct,
  swapTimelineItemTimesAtSortedIndices,
  deleteTimelineItemAtSortedIndex,
  nudgeTimelineItemTime,
} from "../lib/fuelEngine";
import { computeScienceMetrics } from "../lib/scienceMetrics";
import { toShareableEvent } from "../lib/eventShare";
import { parseGpxDocument } from "../lib/gpx";
import {
  defaultRaceStartLocal,
  geocodePlace,
  getDeviceCoordinates,
  reverseGeocodeClient,
  weatherCategoryFromTempC,
} from "../lib/meteo";
import { PRODUCTS } from "../lib/products";
import type {
  AthleteProfile,
  EventDetails,
  FuelPlan,
  FuelPlanGenerationResult,
  Product,
  TimelineItem,
} from "../lib/types";
import { GripVertical, RotateCcw, Trash2 } from "lucide-react";
import { Header } from "../components/Header";
import { StravaImportPanel } from "../components/StravaImportPanel";
import { SectionBreadcrumb } from "../components/SectionBreadcrumb";
import { ScienceDashboard } from "../components/ScienceDashboard";
import { GlossaryHint } from "../components/GlossaryHint";
import { ToggleGroup } from "../components/ToggleGroup";
import { Button } from "../components/Button";

const CourseMapPanel = dynamic(() => import("../components/CourseMapPanel"), { ssr: false });

const SPORTS = ["Course à pied", "Trail", "Cyclisme", "Triathlon", "Ultra-trail"];
const WEATHER = ["Froid (<10°C)", "Tempéré (10-20°C)", "Chaud (20-30°C)", "Très chaud (>30°C)"];
const ELEVATION = ["Plat (0-500m D+)", "Vallonné (500-1500m D+)", "Montagneux (1500-3000m D+)", "Alpin (>3000m D+)"];
const CUSTOM_PRODUCTS_STORAGE_KEY = "fuelos_custom_products";
const ONBOARDING_PROFILE_KEY = "fuelos_onboarding_profile_done";
const ONBOARDING_EVENT_KEY = "fuelos_onboarding_event_done";
const ONBOARDING_EVENT_STEP_KEY = "fuelos_onboarding_event_step_done";
const SELECTED_CLOUD_PROFILE_KEY = "fuelos_selected_athlete_profile_id";

type CloudAthleteProfileRow = {
  id: string;
  name: string;
  isDefault: boolean;
  data: unknown;
  createdAt: string;
  updatedAt: string;
};

type PlanWizardStep = 1 | 2 | 3;

const PLAN_WIZARD_STEPS: { num: PlanWizardStep; label: string }[] = [
  { num: 1, label: "Profil" },
  { num: 2, label: "Course" },
  { num: 3, label: "Plan" },
];

function elevationLabelFromGain(elevationGain: number): string {
  if (elevationGain <= 500) return "Plat (0-500m D+)";
  if (elevationGain <= 1500) return "Vallonné (500-1500m D+)";
  if (elevationGain <= 3000) return "Montagneux (1500-3000m D+)";
  return "Alpin (>3000m D+)";
}

function weatherFromSweatRate(sweatRate: number): string {
  if (sweatRate >= 1.5) return "Très chaud (>30°C)";
  if (sweatRate >= 1.2) return "Chaud (20-30°C)";
  if (sweatRate <= 0.8) return "Froid (<10°C)";
  return "Tempéré (10-20°C)";
}

const S = {
  main: { paddingTop: 36 } as React.CSSProperties,
  card: {
    background: "var(--color-bg-card)",
    border: "1px solid var(--color-border)",
    borderRadius: "var(--radius-lg)",
    boxShadow: "var(--shadow-xs)",
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
  const router = useRouter();
  const searchParams = useSearchParams();
  const { status, data: sessionData } = useSession();
  const [athleteProfile, setAthleteProfile] = useLocalStorage<AthleteProfile | null>("athlete-profile", null);
  const cloudHydratedRef = useRef(false);
  const lastCloudUserIdRef = useRef<string | undefined>(undefined);

  const [currentStep, setCurrentStep] = useState<PlanWizardStep>(1);
  const skipInitialScrollRef = useRef(true);
  const [showProductSelector, setShowProductSelector] = useState<"gels" | "drinks" | "bars" | null>(null);

  const [profile, setProfile] = useState<AthleteProfile>({
    weight: athleteProfile?.weight || 70,
    age: athleteProfile?.age || 35,
    gender: athleteProfile?.gender || "M",
    sweatRate: athleteProfile?.sweatRate || 1.0,
    giTolerance: athleteProfile?.giTolerance || "normal",
    allergies: athleteProfile?.allergies || [],
    avoidProducts: athleteProfile?.avoidProducts || [],
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

  const [cloudProfiles, setCloudProfiles] = useState<CloudAthleteProfileRow[]>([]);
  const [cloudProfilesLoading, setCloudProfilesLoading] = useState(false);
  const [selectedCloudProfileId, setSelectedCloudProfileId] = useState<string | null>(null);
  const [cloudProfileName, setCloudProfileName] = useState("");
  const [cloudHint, setCloudHint] = useState<string | null>(null);

  const [event, setEvent] = useState<EventDetails>({
    sport: "Trail",
    distance: 50,
    elevationGain: 2000,
    targetTime: 6,
    weather: "Tempéré (10-20°C)",
    elevation: "Montagneux (1500-3000m D+)",
    aidStations: [],
    placeName: "",
    raceStartAt: defaultRaceStartLocal(),
  });

  const [meteoLoading, setMeteoLoading] = useState(false);
  const [deviceGeoLoading, setDeviceGeoLoading] = useState(false);
  const [meteoBanner, setMeteoBanner] = useState<string | null>(null);
  const gpxInputRef = useRef<HTMLInputElement>(null);

  const [showAidStationForm, setShowAidStationForm] = useState(false);
  const [newAidStation, setNewAidStation] = useState<AidStationDraft>({
    distanceKm: 0,
    name: "",
    availableProducts: [],
  });

  const [customProducts, setCustomProducts] = useState<Product[]>([]);

  const [planResult, setPlanResult] = useState<FuelPlanGenerationResult | null>(null);
  /** Incrémenté uniquement à chaque calcul — snapshot « Réinitialiser timeline » côté PlanResult. */
  const [planGenerationId, setPlanGenerationId] = useState(0);
  const onboardingAppliedRef = useRef(false);

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
    if (status !== "authenticated") {
      cloudHydratedRef.current = false;
      lastCloudUserIdRef.current = undefined;
      setCloudProfiles([]);
      setSelectedCloudProfileId(null);
      setCloudProfileName("");
      setCloudProfilesLoading(false);
      return;
    }

    const userId = sessionData?.user?.id;
    if (userId && lastCloudUserIdRef.current !== userId) {
      lastCloudUserIdRef.current = userId;
      cloudHydratedRef.current = false;
    }

    let cancelled = false;
    setCloudProfilesLoading(true);
    setCloudHint(null);

    void (async () => {
      try {
        const res = await fetch("/api/user/athlete-profiles", { credentials: "include" });
        if (!res.ok) throw new Error("Impossible de charger les profils");
        const body = (await res.json()) as { profiles?: CloudAthleteProfileRow[] };
        const list = Array.isArray(body.profiles) ? body.profiles : [];
        if (cancelled) return;
        setCloudProfiles(list);

        if (!cloudHydratedRef.current && list.length > 0) {
          cloudHydratedRef.current = true;
          let storedId: string | null = null;
          try {
            storedId = localStorage.getItem(SELECTED_CLOUD_PROFILE_KEY);
          } catch {
            /* ignore */
          }
          const pick =
            (storedId ? list.find((p) => p.id === storedId) : undefined) ||
            list.find((p) => p.isDefault) ||
            list[0];
          if (pick) {
            const parsed = athleteProfileFromJson(pick.data);
            if (parsed) {
              setProfile(parsed);
              setSelectedCloudProfileId(pick.id);
              setCloudProfileName(pick.name);
            }
          }
        } else if (!cloudHydratedRef.current) {
          cloudHydratedRef.current = true;
        }
      } catch (e) {
        if (!cancelled) {
          setCloudHint(e instanceof Error ? e.message : "Erreur chargement profils");
        }
      } finally {
        if (!cancelled) setCloudProfilesLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [status, sessionData?.user?.id]);

  useEffect(() => {
    const s = searchParams.get("step");
    if (s === "2" || s === "event") {
      setCurrentStep(2);
    } else if (s === "1" || s === "profile") {
      setCurrentStep(1);
    } else if (s === "3" || s === "plan") {
      setCurrentStep(3);
    }
  }, [searchParams]);

  const navigateToPlanStep = useCallback(
    (n: PlanWizardStep) => {
      setCurrentStep(n);
      const stepParam = n === 1 ? "profile" : n === 2 ? "event" : "plan";
      router.replace(`/plan?step=${stepParam}`, { scroll: false });
    },
    [router]
  );

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

  const handleGeocodePlace = useCallback(async () => {
    setMeteoBanner(null);
    const hit = await geocodePlace(event.placeName || "");
    if (!hit) {
      setMeteoBanner("Lieu introuvable — précise le nom ou la commune.");
      return;
    }
    const label = [hit.name, hit.admin1, hit.country].filter(Boolean).join(", ");
    setEvent((prev) => ({
      ...prev,
      placeName: label,
      latitude: hit.latitude,
      longitude: hit.longitude,
      raceTimezone: hit.timezone,
    }));
  }, [event.placeName]);

  const handleUseDeviceLocation = useCallback(async () => {
    setMeteoBanner(null);
    setDeviceGeoLoading(true);
    try {
      const { latitude, longitude } = await getDeviceCoordinates();
      const label = await reverseGeocodeClient(latitude, longitude);
      setEvent((prev) => ({
        ...prev,
        latitude,
        longitude,
        placeName: label ?? `Position GPS (${latitude.toFixed(4)}, ${longitude.toFixed(4)})`,
        raceTimezone: undefined,
      }));
    } catch (e) {
      setMeteoBanner(e instanceof Error ? e.message : "Géolocalisation impossible.");
    } finally {
      setDeviceGeoLoading(false);
    }
  }, []);

  const handleFetchOpenMeteo = useCallback(async () => {
    setMeteoBanner(null);
    let lat = event.latitude;
    let lon = event.longitude;
    if ((lat == null || lon == null) && event.courseGeometry?.coordinates[0]) {
      const c = event.courseGeometry.coordinates[0]!;
      lon = c[0];
      lat = c[1];
    }
    if (lat == null || lon == null || !event.raceStartAt) {
      setMeteoBanner("Indique un lieu géocodé ou importe un GPX, et une date/heure de départ.");
      return;
    }
    setMeteoLoading(true);
    try {
      const u = new URL("/api/meteo", window.location.origin);
      u.searchParams.set("latitude", String(lat));
      u.searchParams.set("longitude", String(lon));
      u.searchParams.set("raceStartAt", event.raceStartAt);
      const res = await fetch(u.toString());
      const data = (await res.json()) as { error?: string; tempC?: number; humidityPct?: number | null };
      if (!res.ok) throw new Error(data.error || "Météo indisponible");
      const tempC = data.tempC!;
      const humidity = data.humidityPct;
      setEvent((prev) => ({
        ...prev,
        latitude: lat ?? prev.latitude,
        longitude: lon ?? prev.longitude,
        weather: weatherCategoryFromTempC(tempC),
        weatherHumidityPct: humidity ?? undefined,
        weatherAuto: {
          tempC,
          humidityPct: humidity ?? 0,
          fetchedAt: new Date().toISOString(),
        },
      }));
    } catch (e) {
      setMeteoBanner(e instanceof Error ? e.message : "Impossible de récupérer la météo.");
    } finally {
      setMeteoLoading(false);
    }
  }, [event.latitude, event.longitude, event.raceStartAt, event.courseGeometry]);

  const handleGpxFile = useCallback(async (file: File | null) => {
    if (!file) return;
    const text = await file.text();
    const parsed = parseGpxDocument(text);
    if (!parsed) {
      setMeteoBanner("GPX invalide ou sans trace exploitable.");
      return;
    }
    setMeteoBanner(null);
    const start = parsed.geometry.coordinates[0]!;
    setEvent((prev) => ({
      ...prev,
      distance: parsed.distanceKm,
      elevationGain: parsed.elevationGainM,
      courseGeometry: parsed.geometry,
      latitude: prev.latitude ?? start[1],
      longitude: prev.longitude ?? start[0],
    }));
  }, []);

  const applyCloudRow = useCallback((row: CloudAthleteProfileRow) => {
    const parsed = athleteProfileFromJson(row.data);
    if (!parsed) {
      setCloudHint("Ce profil contient des données invalides.");
      return;
    }
    setProfile(parsed);
    setSelectedCloudProfileId(row.id);
    setCloudProfileName(row.name);
    try {
      localStorage.setItem(SELECTED_CLOUD_PROFILE_KEY, row.id);
    } catch {
      /* ignore */
    }
    setCloudHint(null);
  }, []);

  const newCloudProfileDraft = useCallback(() => {
    setSelectedCloudProfileId(null);
    setCloudProfileName("");
    try {
      localStorage.removeItem(SELECTED_CLOUD_PROFILE_KEY);
    } catch {
      /* ignore */
    }
    setCloudHint("Brouillon : saisir un nom puis enregistrer pour créer un profil en ligne.");
  }, []);

  const refreshCloudProfiles = useCallback(async (): Promise<CloudAthleteProfileRow[]> => {
    const res = await fetch("/api/user/athlete-profiles", { credentials: "include" });
    if (!res.ok) throw new Error("Synchronisation impossible");
    const body = (await res.json()) as { profiles?: CloudAthleteProfileRow[] };
    const list = Array.isArray(body.profiles) ? body.profiles : [];
    setCloudProfiles(list);
    return list;
  }, []);

  const saveCloudProfile = useCallback(async () => {
    if (status !== "authenticated") return;
    const name = cloudProfileName.trim();
    if (!name) {
      setCloudHint("Indique un nom pour ce profil (ex. « Été chaleur »).");
      return;
    }
    setCloudHint(null);
    try {
      if (selectedCloudProfileId) {
        const res = await fetch(`/api/user/athlete-profiles/${selectedCloudProfileId}`, {
          method: "PATCH",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name, data: profile }),
        });
        if (!res.ok) {
          const err = (await res.json().catch(() => ({}))) as { error?: string };
          throw new Error(err.error || "Mise à jour refusée");
        }
        setCloudHint("Profil mis à jour.");
      } else {
        const res = await fetch("/api/user/athlete-profiles", {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name, data: profile }),
        });
        if (!res.ok) {
          const err = (await res.json().catch(() => ({}))) as { error?: string };
          throw new Error(err.error || "Création refusée");
        }
        const created = (await res.json()) as {
          profile?: { id: string; name: string; data: unknown };
        };
        if (created.profile?.id) {
          setSelectedCloudProfileId(created.profile.id);
          try {
            localStorage.setItem(SELECTED_CLOUD_PROFILE_KEY, created.profile.id);
          } catch {
            /* ignore */
          }
        }
        setCloudHint("Profil créé.");
      }
      await refreshCloudProfiles();
    } catch (e) {
      setCloudHint(e instanceof Error ? e.message : "Erreur enregistrement");
    }
  }, [
    status,
    cloudProfileName,
    selectedCloudProfileId,
    profile,
    refreshCloudProfiles,
  ]);

  const setCloudProfileAsDefault = useCallback(async () => {
    if (!selectedCloudProfileId || status !== "authenticated") return;
    setCloudHint(null);
    try {
      const res = await fetch(`/api/user/athlete-profiles/${selectedCloudProfileId}`, {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isDefault: true }),
      });
      if (!res.ok) throw new Error("Action refusée");
      setCloudHint("Profil défini par défaut pour tes prochaines visites.");
      await refreshCloudProfiles();
    } catch (e) {
      setCloudHint(e instanceof Error ? e.message : "Erreur");
    }
  }, [selectedCloudProfileId, status, refreshCloudProfiles]);

  const deleteCloudProfile = useCallback(async () => {
    if (!selectedCloudProfileId || status !== "authenticated") return;
    if (!window.confirm("Supprimer ce profil enregistré ? Cette action est définitive.")) return;
    setCloudHint(null);
    try {
      const res = await fetch(`/api/user/athlete-profiles/${selectedCloudProfileId}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (!res.ok) throw new Error("Suppression refusée");
      const idRemoved = selectedCloudProfileId;
      setSelectedCloudProfileId(null);
      setCloudProfileName("");
      try {
        localStorage.removeItem(SELECTED_CLOUD_PROFILE_KEY);
      } catch {
        /* ignore */
      }
      const list = await refreshCloudProfiles();
      if (list.length > 0) applyCloudRow(list[0]!);
      else {
        setCloudHint("Profil supprimé. Tu peux en créer un autre ou continuer en brouillon.");
      }
    } catch (e) {
      setCloudHint(e instanceof Error ? e.message : "Erreur suppression");
    }
  }, [selectedCloudProfileId, status, refreshCloudProfiles, applyCloudRow]);

  const persistPlanBundle = useCallback(
    (next: FuelPlanGenerationResult, racePlanVariant: "main" | "alt") => {
      const bundle = {
        fuelPlan: next.mainPlan,
        altFuelPlan: next.altPlan,
        altPlanLabel: next.altPlanLabel,
        altPlanExplanation: next.altPlanExplanation,
        racePlanVariant,
        profile,
        event,
      };
      try {
        localStorage.setItem("fuelos_active_plan", JSON.stringify(bundle));
      } catch {
        /* ignore */
      }
    },
    [profile, event]
  );

  const handleEditorPlanUpdate = useCallback(
    (next: FuelPlanGenerationResult, racePlanVariant: "main" | "alt") => {
      setPlanResult(next);
      persistPlanBundle(next, racePlanVariant);
    },
    [persistPlanBundle]
  );

  const runPlanCalculation = useCallback(
    (profileInput: AthleteProfile, eventInput: EventDetails) => {
      console.log("🔍 Profile GI Tolerance:", profileInput.giTolerance);
      console.log("🔍 Full Profile:", profileInput);

      const result = calculateFuelPlan(profileInput, eventInput, customProducts);

      console.log("🔍 CHO Strategy:", result.mainPlan.choStrategy);
      console.log("🔍 CHO per hour:", result.mainPlan.choPerHour);

      setPlanResult(result);
      setPlanGenerationId((n) => n + 1);
      const bundle = {
        fuelPlan: result.mainPlan,
        altFuelPlan: result.altPlan,
        altPlanLabel: result.altPlanLabel,
        altPlanExplanation: result.altPlanExplanation,
        racePlanVariant: "main" as const,
        profile: profileInput,
        event: eventInput,
      };
      localStorage.setItem("fuelos_active_plan", JSON.stringify(bundle));
      void fetch("/api/user/plans", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          payload: bundle,
          title: eventInput.sport ? `${eventInput.sport} — ${eventInput.distance} km` : null,
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
      navigateToPlanStep(3);
    },
    [customProducts, navigateToPlanStep]
  );

  function handleCalculate() {
    runPlanCalculation(profile, event);
  }

  useEffect(() => {
    if (onboardingAppliedRef.current || searchParams.get("onboarding") !== "1") return;
    onboardingAppliedRef.current = true;

    const parsedSport = searchParams.get("sport");
    const parsedDistance = Number(searchParams.get("distance"));
    const parsedTargetTime = Number(searchParams.get("targetTime"));
    const parsedElevationGain = Number(searchParams.get("elevationGain"));
    const parsedWeight = Number(searchParams.get("weight"));
    const parsedSweatRate = Number(searchParams.get("sweatRate"));
    const parsedGi = searchParams.get("giTolerance");

    const nextProfile: AthleteProfile = {
      ...profile,
      weight: Number.isFinite(parsedWeight) && parsedWeight > 0 ? parsedWeight : profile.weight,
      sweatRate: Number.isFinite(parsedSweatRate) && parsedSweatRate > 0 ? parsedSweatRate : profile.sweatRate,
      giTolerance:
        parsedGi === "sensitive" || parsedGi === "normal" || parsedGi === "robust"
          ? parsedGi
          : profile.giTolerance,
    };

    const nextEvent: EventDetails = {
      ...event,
      sport: parsedSport && SPORTS.includes(parsedSport) ? parsedSport : event.sport,
      distance: Number.isFinite(parsedDistance) && parsedDistance > 0 ? parsedDistance : event.distance,
      targetTime: Number.isFinite(parsedTargetTime) && parsedTargetTime > 0 ? parsedTargetTime : event.targetTime,
      elevationGain:
        Number.isFinite(parsedElevationGain) && parsedElevationGain >= 0 ? parsedElevationGain : event.elevationGain,
      elevation: elevationLabelFromGain(
        Number.isFinite(parsedElevationGain) && parsedElevationGain >= 0 ? parsedElevationGain : event.elevationGain
      ),
      weather: weatherFromSweatRate(nextProfile.sweatRate),
    };

    setProfile(nextProfile);
    setEvent(nextEvent);
    runPlanCalculation(nextProfile, nextEvent);
  }, [searchParams, profile, event, runPlanCalculation]);

  const currentStepLabel = PLAN_WIZARD_STEPS.find((step) => step.num === currentStep)?.label ?? "Profil";

  return (
    <div className="fuel-page">
      <Header sticky />
      <div className="fuel-plan-wizard" style={{ position: "sticky", top: 70, zIndex: 25 }}>
        <div className="fuel-plan-wizard-inner">
          <SectionBreadcrumb />
          <nav
            aria-label="Étapes du plan"
            style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap", justifyContent: "center" }}
          >
          {PLAN_WIZARD_STEPS.map(({ num, label }, i) => {
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

            if (isActive) {
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
                  aria-current={isActive ? "step" : undefined}
                  onClick={() => navigateToPlanStep(num)}
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
          <p style={{ marginTop: 10, marginBottom: 0, color: "var(--color-text-muted)", fontSize: 12 }}>
            Étape {currentStep}/3 — {currentStepLabel}
          </p>
        </div>
      </div>

      <main className="fuel-main" style={S.main}>
        {currentStep === 1 && (
          <div id="plan-step-1" style={{ scrollMarginTop: 24 }}>
            <h1
              className="font-display"
              style={{ fontSize: 28, fontWeight: 800, marginBottom: 8, letterSpacing: "-0.5px" }}
            >
              Ton profil athlète
            </h1>
            <p style={{ color: "var(--color-text-muted)", marginBottom: 32, fontSize: 14 }}>
              Ces données permettent de personnaliser tes besoins nutritionnels.
            </p>

            {status === "unauthenticated" && (
              <div
                style={{
                  marginBottom: 24,
                  marginTop: -12,
                  padding: "14px 16px",
                  borderRadius: 12,
                  border: "1px solid color-mix(in srgb, var(--color-accent) 28%, var(--color-border))",
                  background: "color-mix(in srgb, var(--color-accent) 9%, var(--color-bg-card))",
                }}
              >
                <p style={{ fontSize: 14, fontWeight: 700, margin: "0 0 8px", color: "var(--color-text)" }}>
                  Connexion Google recommandée
                </p>
                <p style={{ fontSize: 14, color: "var(--color-text-muted)", margin: 0, lineHeight: 1.55 }}>
                  Profils illimités dans le cloud (été / hiver, plusieurs courses),{' '}
                  <strong style={{ color: "var(--color-text)" }}>synchronisation sur tous tes appareils</strong> et{' '}
                  <strong style={{ color: "var(--color-text)" }}>historique sauvegardé sans limite</strong>. Utilise le
                  bouton vert « Connexion Google » en haut à droite.
                </p>
              </div>
            )}

            {status === "authenticated" && (
              <div style={{ ...S.card, marginBottom: 20 }}>
                <div style={S.sectionTitle}>
                  <span>☁️</span> Profils enregistrés
                </div>
                {cloudProfilesLoading ? (
                  <p style={{ fontSize: 13, color: "var(--color-text-muted)" }}>Chargement…</p>
                ) : (
                  <>
                    <label style={S.label}>PROFIL ACTIF</label>
                    <select
                      style={{ ...S.select, marginBottom: 16 }}
                      value={selectedCloudProfileId ?? ""}
                      onChange={(e) => {
                        const v = e.target.value;
                        if (!v) {
                          newCloudProfileDraft();
                          return;
                        }
                        const row = cloudProfiles.find((p) => p.id === v);
                        if (row) applyCloudRow(row);
                      }}
                    >
                      <option value="">— Nouveau brouillon (non enregistré) —</option>
                      {cloudProfiles.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.name}
                          {p.isDefault ? " (défaut)" : ""}
                        </option>
                      ))}
                    </select>
                    <label style={S.label}>NOM DU PROFIL</label>
                    <input
                      style={{ ...S.input, marginBottom: 16 }}
                      value={cloudProfileName}
                      onChange={(e) => setCloudProfileName(e.target.value)}
                      placeholder="Ex. Été chaleur, Hiver trail…"
                      autoComplete="off"
                    />
                    <div
                      style={{
                        display: "flex",
                        flexWrap: "wrap",
                        gap: 10,
                        marginBottom: cloudHint ? 12 : 0,
                      }}
                    >
                      <Button type="button" variant="primary" size="md" onClick={() => void saveCloudProfile()}>
                        {selectedCloudProfileId ? "Mettre à jour" : "Créer ce profil"}
                      </Button>
                      <button type="button" style={S.btnOutline} onClick={newCloudProfileDraft}>
                        Nouveau brouillon
                      </button>
                      {selectedCloudProfileId && (
                        <>
                          <button type="button" style={S.btnOutline} onClick={() => void setCloudProfileAsDefault()}>
                            Définir par défaut
                          </button>
                          <button
                            type="button"
                            style={{
                              ...S.btnOutline,
                              borderColor: "rgba(239,68,68,0.45)",
                              color: "#ef4444",
                            }}
                            onClick={() => void deleteCloudProfile()}
                          >
                            Supprimer
                          </button>
                        </>
                      )}
                    </div>
                    {cloudHint && (
                      <p style={{ fontSize: 13, margin: 0, color: "var(--color-text-muted)" }}>{cloudHint}</p>
                    )}
                  </>
                )}
              </div>
            )}

            {(athleteProfile || status === "authenticated") && (
              <div
                style={{
                  padding: "12px 16px",
                  borderRadius: 8,
                  background:
                    status === "authenticated" && selectedCloudProfileId
                      ? "rgba(234,179,8,0.12)"
                      : "rgba(34,197,94,0.1)",
                  border:
                    status === "authenticated" && selectedCloudProfileId
                      ? "1px solid rgba(234,179,8,0.45)"
                      : "1px solid var(--color-accent)",
                  marginBottom: 20,
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                }}
              >
                <span style={{ fontSize: 18 }}>
                  {status === "authenticated" && selectedCloudProfileId ? "⏱" : "✓"}
                </span>
                <span
                  style={{
                    fontSize: 13,
                    fontWeight: 600,
                    color:
                      status === "authenticated" && selectedCloudProfileId
                        ? "rgb(180, 140, 40)"
                        : "var(--color-accent)",
                  }}
                >
                  {status === "authenticated" ? (
                    selectedCloudProfileId ? (
                      <>
                        Profil « {cloudProfileName} » : utilise « Mettre à jour » après modification, ou enchaîne vers la
                        course.
                      </>
                    ) : (
                      <>Sauvegarde locale ; enregistre un profil ci-dessus pour le retrouver en ligne.</>
                    )
                  ) : (
                    <>Profil sauvegardé automatiquement sur cet appareil.</>
                  )}
                </span>
              </div>
            )}

            <div style={S.card}>
              <div style={S.sectionTitle}>
                <span>🏃</span> Données physiques
              </div>
              <div style={S.grid3}>
                <div>
                  <label style={S.label}>Poids (kg)</label>
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
                  <label style={S.label}>Age</label>
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
                  <label style={S.label}>Genre</label>
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
                <span>💧</span> Hydratation & tolérance
              </div>
              <p style={{ fontSize: 13, color: "var(--color-text-muted)", marginTop: 0, marginBottom: 14, lineHeight: 1.5 }}>
                Les abréviations du plan nutrition (CHO, GI, etc.) sont expliquées ci-dessous. Passe en revue chaque
                encart avant de choisir tes réglages.
              </p>
              <div style={{ marginBottom: 16 }}>
                <GlossaryHint term="cho" inlineLabel="Qu’est-ce que « CHO » ?" />
              </div>
              <div style={S.grid2}>
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap", marginBottom: 6 }}>
                    <label style={{ ...S.label, marginBottom: 0 }}>Taux de sudation (L/h)</label>
                    <GlossaryHint term="sweat_rate" />
                  </div>
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
                    Un test de sudation (pesée avant/après sortie) permet d’affiner ce réglage.
                  </p>
                </div>

                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap", marginBottom: 6 }}>
                    <label style={{ ...S.label, marginBottom: 0 }}>Tolérance digestive (GI)</label>
                    <GlossaryHint term="gi_tolerance" />
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
                  <p style={{ fontSize: 11, color: "var(--color-text-muted)", marginTop: 4, lineHeight: 1.45 }}>
                    Sensible = inconfort digestif plus probable; robuste = capacité plus élevée. Commence bas et ajuste
                    selon tes retours d'entraînement.
                  </p>
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
                <label style={S.label}>Gels préférés</label>
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
                <label style={S.label}>Boissons préférées</label>
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
                <label style={S.label}>Niveau de sucré</label>
                <ToggleGroup
                  ariaLabel="Niveau de sucré préféré"
                  value={(profile.tastePreferences?.sweetness ?? "medium") as "low" | "medium" | "high"}
                  onChange={(level) =>
                    setProfile({
                      ...profile,
                      tastePreferences: {
                        sweetness: level,
                        flavors: profile.tastePreferences?.flavors || [],
                      },
                    })
                  }
                  options={[
                    { value: "low", label: "🍃 Peu sucré" },
                    { value: "medium", label: "🍯 Modéré" },
                    { value: "high", label: "🍬 Très sucré" },
                  ]}
                />
              </div>
            </div>

            <Button
              variant="primary"
              size="lg"
              fullWidth
              onClick={() => {
                try {
                  localStorage.setItem(ONBOARDING_PROFILE_KEY, "1");
                } catch {
                  /* ignore */
                }
                navigateToPlanStep(2);
              }}
            >
              Continuer → Paramètres course
            </Button>
          </div>
        )}

        {currentStep === 2 && (
          <div id="plan-step-2" style={{ scrollMarginTop: 24 }}>
            <h1
              className="font-display"
              style={{ fontSize: 28, fontWeight: 800, marginBottom: 8, letterSpacing: "-0.5px" }}
            >
              Ta course
            </h1>
            <p style={{ color: "var(--color-text-muted)", marginBottom: 32, fontSize: 14 }}>
              Décris ton événement pour calculer le plan optimal.
            </p>

            <StravaImportPanel
              weather={event.weather}
              stravaQuery={searchParams.get("strava")}
              onApply={(patch) => setEvent((prev) => ({ ...prev, ...patch }))}
            />

            <div style={S.card}>
              <div style={S.sectionTitle}>
                <span>🏔</span> Détails course
              </div>

              {event.stravaImport && (
                <p
                  style={{
                    fontSize: 13,
                    color: "var(--color-text-muted)",
                    marginBottom: 16,
                    lineHeight: 1.5,
                  }}
                >
                  <strong style={{ color: "var(--color-text)" }}>Import Strava :</strong> {event.stravaImport.name}{" "}
                  ({new Date(event.stravaImport.startDate).toLocaleString("fr-FR", { dateStyle: "short" })})
                  {event.stravaImport.avgHr != null && ` · FC moy. ${event.stravaImport.avgHr}`}
                  {event.stravaImport.maxHr != null && ` · FC max ${event.stravaImport.maxHr}`}
                </p>
              )}

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
                    min={1}
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
              <div style={{ ...S.sectionTitle, display: "flex", alignItems: "center", gap: 8 }}>
                <span>🗺</span>
                <span>Parcours GPX (optionnel)</span>
                <span
                  role="img"
                  aria-label="Information GPX"
                  title="Le GPX débloque la carte des ravitaillements (prises visualisées au fil du parcours). Il active aussi le recalcul automatique des prises selon montée/descente et timing réel."
                  style={{
                    width: 18,
                    height: 18,
                    borderRadius: 999,
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 12,
                    fontWeight: 800,
                    color: "var(--color-accent)",
                    border: "1px solid color-mix(in srgb, var(--color-accent) 45%, var(--color-border))",
                    background: "var(--color-bg-card)",
                    cursor: "help",
                    flexShrink: 0,
                  }}
                >
                  i
                </span>
              </div>
              <p style={{ fontSize: 12, color: "var(--color-text-muted)", marginBottom: 12 }}>
                Importe un fichier GPX : distance, D+ et carte sont mis à jour automatiquement. Les points de
                ravitaillement et le plan calorie seront affichés sur la carte.
              </p>
              <input
                ref={gpxInputRef}
                type="file"
                accept=".gpx,application/gpx+xml"
                style={{ display: "none" }}
                onChange={(e) => void handleGpxFile(e.target.files?.[0] ?? null)}
              />
              <div style={{ ...S.grid2, alignItems: "flex-end" }}>
                <div>
                  <button
                    type="button"
                    style={{ ...S.btnOutline, width: "100%" }}
                    onClick={() => gpxInputRef.current?.click()}
                  >
                    Choisir un fichier GPX
                  </button>
                </div>
                <div style={{ fontSize: 12, color: "var(--color-text-muted)" }}>
                  {event.courseGeometry
                    ? `${event.distance} km · ${event.elevationGain} m D+ · ${event.courseGeometry.coordinates.length} pts`
                    : "Aucun GPX chargé"}
                </div>
              </div>
              {event.courseGeometry && (
                <div style={{ marginTop: 16 }}>
                  <CourseMapPanel event={event} geometry={event.courseGeometry} />
                  <label
                    style={{
                      display: "flex",
                      alignItems: "flex-start",
                      gap: 10,
                      marginTop: 14,
                      fontSize: 13,
                      color: "var(--color-text)",
                      cursor: "pointer",
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={event.adjustIntakesToCourse ?? false}
                      onChange={(e) =>
                        setEvent({ ...event, adjustIntakesToCourse: e.target.checked })
                      }
                      style={{ marginTop: 3 }}
                    />
                    <span>
                      <strong>Ajuster les prises au parcours (GPX)</strong> — chaque prise « perso » peut être
                      décalée de ±25&nbsp;min pour viser replat ou descente ; le lien temps ↔ km s’appuie sur une
                      allure plus lente en montée et plus rapide en descente. Les ravitaillements fixes ne bougent pas.
                    </span>
                  </label>
                </div>
              )}
            </div>

            <div style={S.card}>
              <div style={S.sectionTitle}>
                <span>🌡</span> Météo prévue
              </div>

              <p style={{ fontSize: 12, color: "var(--color-text-muted)", marginBottom: 12 }}>
                Open-Meteo remplit température & humidité à partir du lieu et de l’heure de départ (fuseau du
                parcours via coordonnées). Tu peux utiliser le <strong>GPS du téléphone ou de l’ordinateur</strong>{" "}
                pour prendre la météo là où tu es, ou saisir une ville. Corrige toujours au besoin avec les
                pastilles ci-dessous (HTTPS requis pour le GPS).
              </p>

              <div style={{ ...S.grid2, marginBottom: 12 }}>
                <div>
                  <label style={S.label}>LIEU DE LA COURSE</label>
                  <input
                    style={S.input}
                    type="text"
                    placeholder="Ex: Chamonix (UTMB), Annecy, Nice..."
                    value={event.placeName ?? ""}
                    onChange={(e) => setEvent({ ...event, placeName: e.target.value })}
                  />
                </div>
                <div>
                  <label style={S.label}>DATE / HEURE DE DÉPART</label>
                  <input
                    style={S.input}
                    type="datetime-local"
                    value={event.raceStartAt ?? ""}
                    onChange={(e) => setEvent({ ...event, raceStartAt: e.target.value })}
                  />
                </div>
              </div>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))",
                  gap: 10,
                  marginBottom: 12,
                }}
              >
                <button type="button" style={S.btnOutline} onClick={() => void handleGeocodePlace()}>
                  Géocoder le lieu
                </button>
                <button
                  type="button"
                  style={{
                    ...S.btnOutline,
                    opacity: deviceGeoLoading ? 0.65 : 1,
                  }}
                  disabled={deviceGeoLoading}
                  onClick={() => void handleUseDeviceLocation()}
                >
                  {deviceGeoLoading ? "Position…" : "Ma position (GPS)"}
                </button>
                <button
                  type="button"
                  style={{ ...S.btnOutline, opacity: meteoLoading ? 0.6 : 1 }}
                  disabled={meteoLoading}
                  onClick={() => void handleFetchOpenMeteo()}
                >
                  {meteoLoading ? "Météo…" : "Remplir via Open-Meteo"}
                </button>
              </div>

              {meteoBanner && (
                <div
                  style={{
                    marginBottom: 12,
                    padding: "10px 12px",
                    borderRadius: 8,
                    background: "rgba(239,68,68,0.12)",
                    border: "1px solid rgba(239,68,68,0.45)",
                    fontSize: 13,
                    color: "var(--color-text)",
                  }}
                >
                  {meteoBanner}
                </div>
              )}

              {event.weatherAuto && (
                <div
                  style={{
                    marginBottom: 14,
                    padding: "12px 14px",
                    borderRadius: 8,
                    background: "rgba(34,197,94,0.08)",
                    border: "1px solid rgba(34,197,94,0.35)",
                    fontSize: 13,
                  }}
                >
                  <strong>Open-Meteo</strong> — {event.weatherAuto.tempC}°C
                  {event.weatherHumidityPct != null ? ` · humidité ${Math.round(event.weatherHumidityPct)} %` : ""}
                  <span style={{ color: "var(--color-text-muted)", marginLeft: 8 }}>
                    → catégorie « {event.weather} »
                  </span>
                </div>
              )}

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
              <Button variant="secondary" size="md" style={{ flex: 1 }} onClick={() => navigateToPlanStep(1)}>
                ← Profil
              </Button>
              <Button
                id="fuelos-plan-calculate"
                type="button"
                variant="primary"
                size="lg"
                style={{ flex: 2 }}
                onClick={handleCalculate}
              >
                Calculer mon plan →
              </Button>
            </div>
          </div>
        )}

        {currentStep === 3 && !planResult && (
          <div id="plan-step-3" style={{ scrollMarginTop: 24 }}>
            <h1
              className="font-display"
              style={{ fontSize: 28, fontWeight: 800, marginBottom: 8, letterSpacing: "-0.5px" }}
            >
              Ton plan d&apos;alimentation
            </h1>
            <p style={{ color: "var(--color-text-muted)", marginBottom: 24, fontSize: 14 }}>
              Aucun calcul n&apos;a encore été lancé pour cette session.
            </p>
            <div style={S.card}>
              <p style={{ fontSize: 14, lineHeight: 1.6, marginBottom: 16 }}>
                Pour afficher ton plan, configure ta course puis clique sur « Calculer mon plan » à l&apos;étape Course.
                Tu peux aussi revenir aux paramètres pour ajuster distance, horaires ou parcours.
              </p>
              <Button type="button" variant="primary" size="lg" fullWidth onClick={() => navigateToPlanStep(2)}>
                Aller aux paramètres course →
              </Button>
            </div>
          </div>
        )}

        {currentStep === 3 && planResult && (
          <div id="plan-step-3" style={{ scrollMarginTop: 24 }}>
            <PlanResult
              planResult={planResult}
              profile={profile}
              event={event}
              onBack={() => navigateToPlanStep(2)}
              customProducts={customProducts}
              planGenerationId={planGenerationId}
              onPlanTimelineCommit={handleEditorPlanUpdate}
            />
          </div>
        )}
      </main>
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
  planResult,
  profile,
  event,
  onBack,
  customProducts,
  planGenerationId,
  onPlanTimelineCommit,
}: {
  planResult: FuelPlanGenerationResult;
  profile: AthleteProfile;
  event: EventDetails;
  onBack: () => void;
  customProducts: Product[];
  planGenerationId: number;
  onPlanTimelineCommit: (next: FuelPlanGenerationResult, racePlanVariant: "main" | "alt") => void;
}) {
  const [planVariant, setPlanVariant] = useState<"main" | "alt">("main");
  const [showAltInfo, setShowAltInfo] = useState(false);
  const [activeTab, setActiveTab] = useState<"plan" | "shop" | "science" | "export">("plan");
  const [linkCopiedToast, setLinkCopiedToast] = useState(false);
  const [compareCategory, setCompareCategory] = useState<
    "all" | "gel" | "drink" | "bar" | "chew" | "real-food" | "electrolyte"
  >("all");
  const [compareSort, setCompareSort] = useState<"cho-euro" | "efficiency" | "price">("cho-euro");
  /** Index dans `plan.timeline` — lié à la carte / profil GPX. */
  const [selectedTimelineOrigIdx, setSelectedTimelineOrigIdx] = useState<number | null>(null);

  useEffect(() => {
    setPlanVariant("main");
    setShowAltInfo(false);
  }, [planGenerationId]);

  useEffect(() => {
    setSelectedTimelineOrigIdx(null);
  }, [planGenerationId]);

  const revertSnapshotRef = useRef<FuelPlanGenerationResult>(structuredClone(planResult));
  const prevPlanGenRef = useRef(planGenerationId);
  if (prevPlanGenRef.current !== planGenerationId) {
    prevPlanGenRef.current = planGenerationId;
    revertSnapshotRef.current = structuredClone(planResult);
  }

  const plan =
    planVariant === "alt" && planResult.altPlan ? planResult.altPlan : planResult.mainPlan;

  useEffect(() => {
    if (selectedTimelineOrigIdx != null && selectedTimelineOrigIdx >= plan.timeline.length) {
      setSelectedTimelineOrigIdx(null);
    }
  }, [plan.timeline.length, selectedTimelineOrigIdx]);

  const productsCatalog = [...PRODUCTS, ...customProducts];

  const dragSortedIdx = useRef<number | null>(null);

  const snap = revertSnapshotRef.current;
  const baselinePlan = planVariant === "alt" && snap.altPlan ? snap.altPlan : snap.mainPlan;
  const isTimelineDirty = JSON.stringify(plan.timeline) !== JSON.stringify(baselinePlan.timeline);

  const commitSortedTimeline = useCallback(
    (nextSorted: TimelineItem[]) => {
      const updated = recalculateFuelPlanFromTimeline(plan, nextSorted, event.targetTime, event);
      const nextGen: FuelPlanGenerationResult =
        planVariant === "main"
          ? { ...planResult, mainPlan: updated }
          : { ...planResult, altPlan: updated };
      onPlanTimelineCommit(nextGen, planVariant);
    },
    [plan, planResult, planVariant, event, onPlanTimelineCommit]
  );

  const raceDurationMin = Math.max(1, Math.round(event.targetTime * 60));

  const liveScience = useMemo(() => computeScienceMetrics(profile, event, plan), [profile, event, plan]);

  const sortedTimelineEntries = useMemo(
    () =>
      [...plan.timeline]
        .map((item, origIdx) => ({ item, origIdx }))
        .sort((a, b) => a.item.timeMin - b.item.timeMin),
    [plan.timeline]
  );

  const drinkCatalog = useMemo(
    () => productsCatalog.filter((p) => p.category === "drink" || p.category === "electrolyte"),
    [productsCatalog]
  );

  const barCatalog = useMemo(
    () => productsCatalog.filter((p) => p.category === "bar"),
    [productsCatalog]
  );

  const gelCatalog = useMemo(
    () => productsCatalog.filter((p) => p.category === "gel"),
    [productsCatalog]
  );

  const handleResetTimeline = useCallback(() => {
    onPlanTimelineCommit(structuredClone(revertSnapshotRef.current), planVariant);
  }, [onPlanTimelineCommit, planVariant]);

  const selectTimelineRowFromCourse = useCallback((origIdx: number) => {
    setSelectedTimelineOrigIdx(origIdx);
    requestAnimationFrame(() => {
      document.getElementById(`plan-timeline-row-${origIdx}`)?.scrollIntoView({
        behavior: "smooth",
        block: "nearest",
      });
    });
  }, []);

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

    const electrolyteBlocks = plan.electrolyteStrategy
      ? plan.electrolyteStrategy.bulletPoints
          .map((b) => `<li>${escapeHtml(b)}</li>`)
          .join("")
      : "";

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

    ${
      plan.electrolyteStrategy
        ? `<h2>Électrolytes</h2><p class="muted">Na⁺ ~${plan.electrolyteStrategy.sodiumMgPerHour} mg/h · K⁺ repère ~${plan.electrolyteStrategy.potassiumMgPerHourHint} mg/h · Mg repère ~${plan.electrolyteStrategy.magnesiumMgPerHourHint} mg/h</p><ul>${electrolyteBlocks}</ul>`
        : ""
    }

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

  const raceSharePayload = useCallback(
    () => ({
      plan: planResult.mainPlan,
      fuelPlan: planResult.mainPlan,
      altFuelPlan: planResult.altPlan,
      altPlanLabel: planResult.altPlanLabel,
      altPlanExplanation: planResult.altPlanExplanation,
      racePlanVariant: planVariant,
      profile,
      event: toShareableEvent(event),
    }),
    [planResult, planVariant, profile, event]
  );

  const handleCopyShareLink = useCallback(async () => {
    try {
      const payload = encodeURIComponent(JSON.stringify(raceSharePayload()));
      const shareUrl = `${window.location.origin}/race?plan=${payload}`;
      await navigator.clipboard.writeText(shareUrl);
      setLinkCopiedToast(true);
      window.setTimeout(() => setLinkCopiedToast(false), 2000);
    } catch {
      alert("Impossible de copier le lien automatiquement.");
    }
  }, [raceSharePayload]);

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
          ✅ Plan sauvegardé — accessible depuis le mode course
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
          <h1
            className="font-display"
            style={{ fontSize: 28, fontWeight: 800, letterSpacing: "-0.5px", marginBottom: 4 }}
          >
            Ton plan nutritionnel
          </h1>
          <p style={{ color: "var(--color-text-muted)", fontSize: 14 }}>
            {event.sport} · {event.distance}km · {event.targetTime}h · {event.weather}
          </p>
        </div>

        <div style={{ display: "flex", gap: 8 }}>
          <Link
            href="/race"
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
            ⏱ Lancer le mode course
          </Link>
          <button style={S.btnOutline} onClick={onBack}>
            Modifier
          </button>
        </div>
      </div>

      {planResult.altPlan && (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 12,
            flexWrap: "wrap",
            marginBottom: 18,
          }}
        >
          <span
            style={{ fontSize: 12, fontWeight: 700, color: "var(--color-text-muted)", letterSpacing: "0.04em" }}
          >
            Affichage
          </span>
          <div
            role="group"
            aria-label="Plan principal ou variante météo"
            style={{
              display: "inline-flex",
              borderRadius: 10,
              border: "1px solid var(--color-border)",
              overflow: "hidden",
              background: "var(--color-bg)",
            }}
          >
            <button
              type="button"
              onClick={() => setPlanVariant("main")}
              style={{
                padding: "8px 14px",
                border: "none",
                cursor: "pointer",
                fontWeight: 700,
                fontSize: 13,
                background:
                  planVariant === "main" ? "var(--color-accent)" : "transparent",
                color: planVariant === "main" ? "#000" : "var(--color-text-muted)",
              }}
            >
              Plan principal
            </button>
            <button
              type="button"
              onClick={() => setPlanVariant("alt")}
              style={{
                padding: "8px 14px",
                border: "none",
                cursor: "pointer",
                fontWeight: 700,
                fontSize: 13,
                borderLeft: "1px solid var(--color-border)",
                background:
                  planVariant === "alt" ? "var(--color-accent)" : "transparent",
                color: planVariant === "alt" ? "#000" : "var(--color-text-muted)",
              }}
            >
              {planResult.altPlanLabel ?? "Variante météo"}
            </button>
          </div>
          {planResult.altPlanExplanation ? (
            <div style={{ position: "relative", display: "inline-flex", alignItems: "center" }}>
              <button
                type="button"
                aria-expanded={showAltInfo}
                aria-label="Détail du calcul de la variante météo"
                onClick={() => setShowAltInfo((v) => !v)}
                style={{
                  width: 28,
                  height: 28,
                  borderRadius: "50%",
                  border: "1px solid var(--color-border)",
                  background: "var(--color-bg-card)",
                  color: "var(--color-text-muted)",
                  cursor: "pointer",
                  fontWeight: 800,
                  fontSize: 13,
                  lineHeight: 1,
                }}
              >
                i
              </button>
              {showAltInfo ? (
                <div
                  role="tooltip"
                  style={{
                    position: "absolute",
                    zIndex: 50,
                    top: "100%",
                    left: 0,
                    marginTop: 8,
                    padding: "12px 14px",
                    borderRadius: 10,
                    maxWidth: "min(400px, calc(100vw - 48px))",
                    width: "max-content",
                    maxHeight: 280,
                    overflowY: "auto",
                    whiteSpace: "pre-line",
                    fontSize: 12,
                    lineHeight: 1.45,
                    background: "var(--color-bg-card)",
                    border: "1px solid var(--color-border)",
                    boxShadow: "0 8px 28px rgba(0,0,0,0.14)",
                    color: "var(--color-text)",
                  }}
                >
                  {planResult.altPlanExplanation}
                </div>
              ) : null}
            </div>
          ) : null}
        </div>
      )}

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

      {plan.electrolyteStrategy && (
        <div
          style={{
            marginBottom: 24,
            padding: "16px 20px",
            borderRadius: 12,
            background: "var(--color-bg-card)",
            border: "1px solid color-mix(in srgb, #14b8a6 38%, var(--color-border))",
            boxShadow: "0 6px 24px color-mix(in srgb, #14b8a6 8%, transparent)",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12, flexWrap: "wrap" }}>
            <span style={{ fontSize: 16 }} aria-hidden>
              🧪
            </span>
            <h4 style={{ fontSize: 14, fontWeight: 700, margin: 0, color: "var(--color-text)" }}>
              Électrolytes (sodium, potassium, magnésium)
            </h4>
          </div>
          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              gap: 10,
              marginBottom: 12,
              fontSize: 12,
              fontWeight: 700,
              color: "var(--color-text)",
            }}
          >
            <span>Na⁺ ~{plan.electrolyteStrategy.sodiumMgPerHour} mg/h</span>
            <span style={{ fontWeight: 600, color: "var(--color-text-muted)" }}>
              K⁺ repère ~{plan.electrolyteStrategy.potassiumMgPerHourHint} mg/h · Mg repère ~
              {plan.electrolyteStrategy.magnesiumMgPerHourHint} mg/h
            </span>
          </div>
          <ul
            style={{
              margin: 0,
              paddingLeft: 18,
              fontSize: 13,
              lineHeight: 1.55,
              color: "var(--color-text-muted)",
            }}
          >
            {plan.electrolyteStrategy.bulletPoints.map((line, idx) => (
              <li key={idx} style={{ marginBottom: 6 }}>
                {line}
              </li>
            ))}
          </ul>
        </div>
      )}

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
        {(["plan", "shop", "science", "export"] as const).map((tab) => (
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
            {tab === "plan"
              ? "📋 Timeline"
              : tab === "shop"
                ? "🛒 Shopping"
                : tab === "science"
                  ? "🔬 Science"
                  : "📤 Export"}
          </button>
        ))}
      </div>

      {activeTab === "plan" && (
        <div style={S.card}>
          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              alignItems: "flex-start",
              justifyContent: "space-between",
              gap: 12,
              marginBottom: 16,
            }}
          >
            <div>
              <h3 style={{ fontWeight: 700, marginBottom: 4 }}>Timeline in-race</h3>
              <p style={{ fontSize: 12, color: "var(--color-text-muted)", margin: 0, maxWidth: 520 }}>
                Glisse une <strong>carte entière</strong> sur une autre pour échanger les horaires, ajuste au ±5 min,
                remplace <strong>boisson, barre ou gel</strong>, supprime une ligne ou{" "}
                <strong>clique une ligne</strong> pour la mettre en évidence sur la carte et le profil — le Fuel Score
                se met à jour en direct.
              </p>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 10, flexShrink: 0 }}>
              {isTimelineDirty ? (
                <button
                  type="button"
                  onClick={handleResetTimeline}
                  style={{
                    ...S.btnOutline,
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 6,
                    fontSize: 13,
                  }}
                >
                  <RotateCcw size={16} aria-hidden />
                  Réinitialiser
                </button>
              ) : null}
              <span style={{ fontSize: 12, color: "var(--color-text-muted)" }}>
                Durée totale: {event.targetTime}h
              </span>
            </div>
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))",
              gap: 10,
              marginBottom: 18,
              padding: "12px 14px",
              borderRadius: 10,
              border: "1px solid var(--color-border)",
              background: "var(--color-bg)",
            }}
          >
            <div>
              <div style={{ fontSize: 10, fontWeight: 700, color: "var(--color-text-muted)", letterSpacing: "0.06em" }}>
                FUEL SCORE (100 % exécution)
              </div>
              <div style={{ fontSize: 26, fontWeight: 800, color: "var(--color-accent)", lineHeight: 1.15 }}>
                {liveScience.fuelScore}
                <span style={{ fontSize: 12, fontWeight: 600, color: "var(--color-text-muted)" }}>/100</span>
              </div>
            </div>
            <div style={{ fontSize: 12, color: "var(--color-text-muted)", lineHeight: 1.45 }}>
              <div>
                80 % : <strong style={{ color: "var(--color-text)" }}>{liveScience.fuelScenarios[0]?.fuelScore ?? "—"}</strong>
              </div>
              <div>
                90 % : <strong style={{ color: "var(--color-text)" }}>{liveScience.fuelScenarios[1]?.fuelScore ?? "—"}</strong>
              </div>
            </div>
            <div style={{ fontSize: 11, color: "var(--color-text-muted)", lineHeight: 1.4 }}>
              Glycogène modélisé en fin de course :{" "}
              <strong style={{ color: "var(--color-text)" }}>{Math.round(liveScience.glycogenEndPct)} %</strong> des
              réserves de départ · détail dans l’onglet Science.
            </div>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {sortedTimelineEntries.map(({ item, origIdx }, sortedIdx) => {
              const productData = productsCatalog.find((p) => p.id === item.productId);
              const isSelected = selectedTimelineOrigIdx === origIdx;
              const swapCatalog =
                item.type === "drink"
                  ? drinkCatalog
                  : item.type === "bar"
                    ? barCatalog
                    : item.type === "gel"
                      ? gelCatalog
                      : null;
              const rowHighlight =
                item.source === "aid-station"
                  ? "rgba(96,165,250,0.08)"
                  : isSelected
                    ? "rgba(251,191,36,0.12)"
                    : sortedIdx === 0
                      ? "rgba(34,197,94,0.05)"
                      : "var(--color-bg)";
              const borderColor =
                item.source === "aid-station"
                  ? "#60a5fa"
                  : isSelected
                    ? "#fbbf24"
                    : sortedIdx === 0
                      ? "var(--color-accent)"
                      : "var(--color-border)";
              const borderW = isSelected ? 2 : 1;

              return (
                <div
                  id={`plan-timeline-row-${origIdx}`}
                  key={`${item.timeMin}-${origIdx}`}
                  draggable
                  onDragStart={(e) => {
                    if ((e.target as HTMLElement).closest("[data-timeline-control]")) {
                      e.preventDefault();
                      return;
                    }
                    e.dataTransfer.effectAllowed = "move";
                    e.dataTransfer.setData("text/plain", String(sortedIdx));
                    dragSortedIdx.current = sortedIdx;
                    const el = e.currentTarget as HTMLDivElement;
                    try {
                      const r = el.getBoundingClientRect();
                      e.dataTransfer.setDragImage(el, e.clientX - r.left, e.clientY - r.top);
                    } catch {
                      /* Safari / certains navigateurs */
                    }
                  }}
                  onDragEnd={() => {
                    dragSortedIdx.current = null;
                  }}
                  onClick={(e) => {
                    if ((e.target as HTMLElement).closest("[data-timeline-control]")) return;
                    setSelectedTimelineOrigIdx((cur) => (cur === origIdx ? null : origIdx));
                  }}
                  onDragOver={(e) => {
                    e.preventDefault();
                    e.dataTransfer.dropEffect = "move";
                  }}
                  onDrop={(e) => {
                    e.preventDefault();
                    const from = dragSortedIdx.current;
                    dragSortedIdx.current = null;
                    if (from == null || from === sortedIdx) return;
                    commitSortedTimeline(
                      swapTimelineItemTimesAtSortedIndices(plan.timeline, from, sortedIdx)
                    );
                  }}
                  style={{
                    display: "flex",
                    alignItems: "flex-start",
                    gap: 8,
                    padding: "12px 14px",
                    borderRadius: 8,
                    background: rowHighlight,
                    border: `${borderW}px solid ${borderColor}`,
                    cursor: "grab",
                    boxShadow: isSelected ? "0 0 20px rgba(251,191,36,0.2)" : undefined,
                  }}
                >
                  <span
                    style={{
                      color: "var(--color-text-muted)",
                      padding: "4px 2px",
                      marginTop: 2,
                      flexShrink: 0,
                      lineHeight: 0,
                      pointerEvents: "none",
                      userSelect: "none",
                    }}
                    aria-hidden
                  >
                    <GripVertical size={18} strokeWidth={2} />
                  </span>

                  <div
                    style={{
                      minWidth: 52,
                      fontWeight: 700,
                      color: "var(--color-accent)",
                      fontSize: 14,
                      flexShrink: 0,
                    }}
                  >
                    {Math.floor(item.timeMin / 60)}h{String(item.timeMin % 60).padStart(2, "0")}
                  </div>

                  <div
                    style={{ display: "flex", flexDirection: "column", gap: 4, flexShrink: 0 }}
                    data-timeline-control
                  >
                    <button
                      type="button"
                      aria-label="Reculer de 5 minutes"
                      data-timeline-control
                      onClick={() =>
                        commitSortedTimeline(
                          nudgeTimelineItemTime(plan.timeline, sortedIdx, -5, raceDurationMin)
                        )
                      }
                      style={{
                        border: "1px solid var(--color-border)",
                        borderRadius: 6,
                        background: "var(--color-bg-card)",
                        fontSize: 11,
                        fontWeight: 700,
                        padding: "2px 6px",
                        cursor: "pointer",
                        color: "var(--color-text)",
                      }}
                    >
                      −5
                    </button>
                    <button
                      type="button"
                      aria-label="Avancer de 5 minutes"
                      data-timeline-control
                      onClick={() =>
                        commitSortedTimeline(
                          nudgeTimelineItemTime(plan.timeline, sortedIdx, 5, raceDurationMin)
                        )
                      }
                      style={{
                        border: "1px solid var(--color-border)",
                        borderRadius: 6,
                        background: "var(--color-bg-card)",
                        fontSize: 11,
                        fontWeight: 700,
                        padding: "2px 6px",
                        cursor: "pointer",
                        color: "var(--color-text)",
                      }}
                    >
                      +5
                    </button>
                  </div>

                  <div style={{ flex: 1, minWidth: 0 }}>
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

                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 2, flexWrap: "wrap" }}>
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

                    {swapCatalog && (
                      <div style={{ marginBottom: 8, maxWidth: 360 }} data-timeline-control>
                        <label
                          htmlFor={`product-swap-${item.type}-${origIdx}`}
                          style={{ fontSize: 10, fontWeight: 700, color: "var(--color-text-muted)", display: "block" }}
                        >
                          {item.type === "drink"
                            ? "Remplacer la boisson"
                            : item.type === "bar"
                              ? "Remplacer la barre"
                              : "Remplacer le gel"}
                        </label>
                        <select
                          id={`product-swap-${item.type}-${origIdx}`}
                          data-timeline-control
                          value={item.productId}
                          onChange={(e) => {
                            const p = productsCatalog.find((x) => x.id === e.target.value);
                            if (!p) return;
                            const sorted = [...plan.timeline].sort((a, b) => a.timeMin - b.timeMin);
                            const next = sorted.map((row, i) =>
                              i === sortedIdx ? timelineItemWithProduct(row, p) : row
                            );
                            commitSortedTimeline(next);
                          }}
                          style={{ ...S.select, width: "100%", marginTop: 4, fontSize: 12 }}
                        >
                          {!swapCatalog.some((p) => p.id === item.productId) ? (
                            <option value={item.productId}>
                              {item.product} (actuel · personnalisé)
                            </option>
                          ) : null}
                          {swapCatalog.map((p) => (
                            <option key={p.id} value={p.id}>
                              {p.brand} — {p.name}
                            </option>
                          ))}
                        </select>
                      </div>
                    )}

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

                  <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 8, flexShrink: 0 }}>
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
                    <button
                      type="button"
                      title="Supprimer cette prise"
                      aria-label={`Supprimer ${item.product}`}
                      data-timeline-control
                      onClick={() => {
                        if (!window.confirm("Supprimer cette prise de la timeline ?")) return;
                        setSelectedTimelineOrigIdx(null);
                        commitSortedTimeline(
                          deleteTimelineItemAtSortedIndex(plan.timeline, sortedIdx)
                        );
                      }}
                      style={{
                        border: "1px solid rgba(239,68,68,0.45)",
                        borderRadius: 8,
                        background: "rgba(239,68,68,0.08)",
                        color: "#ef4444",
                        padding: "6px 8px",
                        cursor: "pointer",
                        lineHeight: 0,
                      }}
                    >
                      <Trash2 size={16} aria-hidden />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {event.courseGeometry && (
            <div style={{ marginTop: 20 }}>
              <div style={{ ...S.sectionTitle, marginBottom: 12 }}>
                <span>🗺</span> Parcours & prises nutrition
              </div>
              <CourseMapPanel
                event={event}
                geometry={event.courseGeometry}
                timeline={plan.timeline}
                selectedFuelOrigIdx={selectedTimelineOrigIdx}
                onSelectFuelOrigIdx={selectTimelineRowFromCourse}
              />
            </div>
          )}
        </div>
      )}

      {activeTab === "science" && (
        <div style={{ ...S.card, padding: 20 }}>
          <ScienceDashboard plan={plan} profile={profile} event={event} />
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
                label: "Sauvegarder plan principal",
                desc: "Enregistre uniquement le plan principal (localement). La variante météo n’est pas écrasée.",
                action: () => {
                  try {
                    const raw = localStorage.getItem("fuelos_active_plan");
                    const prev = raw ? (JSON.parse(raw) as Record<string, unknown>) : {};
                    localStorage.setItem(
                      "fuelos_active_plan",
                      JSON.stringify({
                        ...prev,
                        fuelPlan: planResult.mainPlan,
                        profile,
                        event,
                        savedAt: new Date().toISOString(),
                      })
                    );
                    alert("Plan principal sauvegardé pour le mode course.");
                  } catch {
                    alert("Échec de la sauvegarde.");
                  }
                },
              },
              ...(planResult.altPlan
                ? [
                    {
                      icon: "🌡",
                      label: `Sauvegarder ${planResult.altPlanLabel ?? "la variante"}`,
                      desc: "Enregistre uniquement la variante météo. Le plan principal n’est pas écrasé.",
                      action: () => {
                        try {
                          const raw = localStorage.getItem("fuelos_active_plan");
                          const prev = raw ? (JSON.parse(raw) as Record<string, unknown>) : {};
                          localStorage.setItem(
                            "fuelos_active_plan",
                            JSON.stringify({
                              ...prev,
                              altFuelPlan: planResult.altPlan,
                              altPlanLabel: planResult.altPlanLabel,
                              altPlanExplanation: planResult.altPlanExplanation,
                              profile,
                              event,
                              savedAt: new Date().toISOString(),
                            })
                          );
                          alert(`${planResult.altPlanLabel ?? "Variante"} sauvegardée pour le mode course.`);
                        } catch {
                          alert("Échec de la sauvegarde.");
                        }
                      },
                    },
                  ]
                : []),
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
                desc: "URL avec plan encodé (ouvre le mode course)",
                action: handleCopyShareLink,
              },
              {
                icon: "📋",
                label: "Copier JSON",
                desc: "Pour développeurs / backup",
                action: () => {
                  navigator.clipboard.writeText(JSON.stringify(raceSharePayload(), null, 2));
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
          className="fuel-page"
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            minHeight: "100vh",
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