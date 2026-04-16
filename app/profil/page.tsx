"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import {
  Activity,
  BarChart3,
  CalendarDays,
  ChevronDown,
  Droplets,
  Expand,
  Footprints,
  Gauge,
  LayoutGrid,
  Leaf,
  Library,
  Link2,
  Mountain,
  Pencil,
  Settings,
  Target,
  Trash2,
  User,
  Zap,
} from "lucide-react";
import { Header } from "../components/Header";
import { Button } from "../components/Button";
import { ProfileAnalysesTabContent } from "../components/profil/ProfileAnalysesTabContent";
import { ProfileMemoryTabContent } from "../components/profil/ProfileMemoryTabContent";
import { RacesNextMilestone } from "../components/races/RacesNextMilestone";
import usePageTitle from "../lib/hooks/usePageTitle";
import { loadRaces, partitionRacesByUpcoming } from "@/lib/races";
import type { RaceEntry } from "@/lib/types/race";
import { useProfile } from "@/hooks/useProfile";
import type {
  FuelOsAthleticLevel,
  FuelOsIntegrationId,
  FuelOsMainSport,
  FuelOsUserProfile,
} from "@/lib/fuelOsUserProfile";

const MAIN_SPORTS: { id: FuelOsMainSport; label: string; emoji: string; theme: string }[] = [
  { id: "trail", label: "Trail", emoji: "🏔️", theme: "Dénivelé" },
  { id: "velo", label: "Vélo", emoji: "🚴", theme: "Puissance" },
  { id: "triathlon", label: "Triathlon", emoji: "🏊", theme: "Transitions" },
  { id: "running", label: "Running", emoji: "🏃", theme: "Allure" },
];

const LEVELS: { id: FuelOsAthleticLevel; label: string; color: string; short: string }[] = [
  { id: "debutant", label: "Débutant", color: "#64748B", short: "Base" },
  { id: "intermediaire", label: "Intermédiaire", color: "#2563EB", short: "Build" },
  { id: "elite", label: "Élite", color: "#D97706", short: "Peak" },
];

const GOALS: { id: FuelOsUserProfile["mainGoal"]; label: string; cue: string }[] = [
  { id: "performance", label: "Performance", cue: "Optimisation" },
  { id: "endurance", label: "Endurance", cue: "Durabilité" },
  { id: "weight_loss", label: "Perte de poids", cue: "Composition" },
  { id: "health", label: "Santé", cue: "Bien-être" },
];

const INTEGRATIONS: {
  id: FuelOsIntegrationId;
  name: string;
  logo: string;
  color: string;
  description: string;
}[] = [
  { id: "strava", name: "Strava", logo: "🟠", color: "#FC4C02", description: "Activités et volume" },
  { id: "garmin", name: "Garmin Connect", logo: "🔵", color: "#006EFF", description: "Capteurs et sessions" },
  { id: "wahoo", name: "Wahoo", logo: "⚫", color: "#111827", description: "Bike computer" },
  { id: "apple_health", name: "Apple Health", logo: "❤️", color: "#FF375F", description: "Santé quotidienne" },
  { id: "trainingpeaks", name: "TrainingPeaks", logo: "📈", color: "#4F46E5", description: "Charge et planification" },
];

const GREEN = "#1B4332";
const GREEN_LIGHT = "#4B7F52";
const GREEN_MUTED = "#22543D";

type ProfilDashboardTab = "overview" | "memory" | "insights";
type ProfilDensityMode = "auto" | "standard" | "compact";
const PROFILE_DENSITY_KEY = "fuelos_profile_density";
const PROFILE_AUTOSAVE_KEY = "fuelos_profile_autosave";
const PROFILE_LAST_TAB_KEY = "fuelos_profile_last_tab";
const PROFILE_LAST_SECTION_KEY = "fuelos_profile_last_section";

const PROFIL_TABS: {
  id: ProfilDashboardTab;
  label: string;
  short: string;
  icon: typeof LayoutGrid;
}[] = [
  { id: "overview", label: "Aperçu", short: "Aperçu", icon: LayoutGrid },
  { id: "memory", label: "Mémoire", short: "Mémoire", icon: Library },
  { id: "insights", label: "Analyses", short: "Analyses", icon: BarChart3 },
];

function initials(first: string, last: string): string {
  const value = `${first.trim().charAt(0)}${last.trim().charAt(0)}`.toUpperCase();
  return value || "FP";
}

function daysUntil(dateIso: string): number | null {
  const target = new Date(`${dateIso}T00:00:00`);
  if (Number.isNaN(target.getTime())) return null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return Math.ceil((target.getTime() - today.getTime()) / 86_400_000);
}

function formatRelativeSyncDate(value: string | null): string {
  if (!value) return "Jamais synchronisé";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;
  const now = new Date();
  const diffMs = now.getTime() - parsed.getTime();
  if (diffMs < 60_000) return "À l'instant";
  if (diffMs < 3_600_000) return `il y a ${Math.floor(diffMs / 60_000)} min`;
  if (diffMs < 86_400_000) return `il y a ${Math.floor(diffMs / 3_600_000)}h`;
  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  if (parsed.toDateString() === yesterday.toDateString()) {
    return `hier à ${parsed.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}`;
  }
  return parsed.toLocaleString("fr-FR", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" });
}

function inputClass() {
  return "mt-1.5 w-full rounded-xl border border-[rgba(0,0,0,0.1)] bg-white px-[14px] py-[10px] text-sm text-[var(--color-text)] outline-none transition duration-200 focus:border-[color-mix(in_srgb,var(--color-primary)_52%,rgba(0,0,0,0.1))] focus:ring-2 focus:ring-[color-mix(in_srgb,var(--color-primary)_20%,transparent)]";
}

function selectClass() {
  return "mt-1.5 w-full appearance-none rounded-xl border border-[rgba(0,0,0,0.1)] bg-white bg-[url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='20' height='20' viewBox='0 0 20 20' fill='none'%3E%3Cpath d='M5 7.5L10 12.5L15 7.5' stroke='%236b7280' stroke-width='1.7' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E\")] bg-[position:right_10px_center] bg-no-repeat px-[14px] py-[10px] pr-10 text-sm text-[var(--color-text)] outline-none transition duration-200 focus:border-[color-mix(in_srgb,var(--color-primary)_52%,rgba(0,0,0,0.1))] focus:ring-2 focus:ring-[color-mix(in_srgb,var(--color-primary)_20%,transparent)]";
}

function floatingInputClass() {
  return "w-full rounded-xl border border-[rgba(0,0,0,0.1)] bg-white px-[14px] py-[10px] text-sm text-[var(--color-text)] outline-none transition duration-200 focus:border-[color-mix(in_srgb,var(--color-primary)_52%,rgba(0,0,0,0.1))] focus:ring-2 focus:ring-[color-mix(in_srgb,var(--color-primary)_20%,transparent)]";
}

function floatingLabelClass() {
  return "pointer-events-none absolute left-3.5 -top-2 z-[1] rounded px-1 text-[12px] font-medium text-[var(--color-text-muted)] bg-[color-mix(in_srgb,var(--color-bg-card)_92%,white)]";
}

function SemiGauge({
  label,
  value,
  unit,
  min,
  max,
  accent = "#D97706",
}: {
  label: string;
  value: number | null;
  unit: string;
  min: number;
  max: number;
  accent?: string;
}) {
  const size = 132;
  const radius = 44;
  const cx = size / 2;
  const cy = size / 2 + 8;
  const start = Math.PI;
  const end = 2 * Math.PI;
  const arc = (a: number) => `${cx + radius * Math.cos(a)} ${cy + radius * Math.sin(a)}`;
  const p = value == null ? 0 : Math.max(0, Math.min(1, (value - min) / (max - min)));
  const valueAngle = start + (end - start) * p;

  return (
    <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg-subtle)] p-4">
      <p className="profil-kicker">{label}</p>
      <div className="mt-2 flex items-center justify-center">
        <svg viewBox={`0 0 ${size} ${size}`} className="h-24 w-32" aria-hidden>
          <path d={`M ${arc(start)} A ${radius} ${radius} 0 0 1 ${arc(end)}`} fill="none" stroke="rgba(148,163,184,0.28)" strokeWidth="8" strokeLinecap="round" />
          <path
            d={`M ${arc(start)} A ${radius} ${radius} 0 0 1 ${arc(valueAngle)}`}
            fill="none"
            stroke={accent}
            strokeWidth="8"
            strokeLinecap="round"
          />
        </svg>
      </div>
      <p className="mt-1 text-center text-lg font-bold text-gray-900">
        {value == null ? "À renseigner" : `${value} ${unit}`}
      </p>
    </div>
  );
}

function profileCompletion(profile: FuelOsUserProfile) {
  const checkpoints = [
    !!profile.firstName,
    !!profile.lastName,
    typeof profile.weightKg === "number",
    typeof profile.heightCm === "number",
    typeof profile.age === "number",
    !!profile.mainSport,
    !!profile.mainGoal,
    typeof profile.sweatRateMlPerH === "number",
    typeof profile.sodiumLossMgPerH === "number",
    typeof profile.ftpWatts === "number" || typeof profile.runnerVmaKmh === "number",
    Object.values(profile.integrationConnected).some(Boolean),
  ];
  const completed = checkpoints.filter(Boolean).length;
  return Math.round((completed / checkpoints.length) * 100);
}

function activeSports(profile: FuelOsUserProfile) {
  return [
    profile.sports.trail && "Trail",
    profile.sports.running && "Running",
    profile.sports.veloRoute && "Vélo route",
    profile.sports.vtt && "VTT",
    profile.sports.triathlon && "Triathlon",
  ].filter(Boolean) as string[];
}

function safeStorageGet(key: string): string | null {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

function safeStorageSet(key: string, value: string) {
  try {
    localStorage.setItem(key, value);
  } catch {
    /* ignore */
  }
}

function SectionAccordion({
  id,
  icon,
  title,
  subtitle,
  alertBadge,
  open,
  onToggle,
  children,
  accentColor,
}: {
  id: string;
  icon: ReactNode;
  title: string;
  subtitle: string;
  alertBadge?: string;
  open: boolean;
  onToggle: () => void;
  children: ReactNode;
  accentColor?: string;
}) {
  const accent = accentColor ?? GREEN;
  return (
    <section
      id={id}
      className={[
        "overflow-hidden rounded-2xl border bg-[var(--color-bg-card)] shadow-sm transition-[border-color,box-shadow] duration-200 md:rounded-3xl",
        open
          ? "border-[color-mix(in_srgb,var(--color-energy)_28%,var(--color-border))] shadow-[0_8px_32px_color-mix(in_srgb,#000_6%,transparent)]"
          : "border-[var(--color-border)] hover:border-[color-mix(in_srgb,var(--color-text-muted)_35%,var(--color-border))]",
      ].join(" ")}
      aria-labelledby={`section-${id}-title`}
    >
      <button
        type="button"
        className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left"
        onClick={onToggle}
        aria-expanded={open}
        aria-controls={`section-${id}-body`}
        id={`section-${id}-title`}
      >
        <div className="flex min-w-0 items-center gap-3">
          <span
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-white shadow-sm [&_svg]:h-5 [&_svg]:w-5"
            style={{
              background: `linear-gradient(145deg, ${accent} 0%, color-mix(in srgb, ${accent} 55%, #0f172a) 100%)`,
            }}
          >
            {icon}
          </span>
          <div className="min-w-0">
            <p className="font-display text-base font-semibold tracking-tight text-[var(--color-text)]">
              {title}
            </p>
            <div className="mt-1 flex flex-wrap items-center gap-2">
              <p className="text-[13px] leading-relaxed text-[var(--color-text-muted)]">{subtitle}</p>
              {alertBadge ? (
                <span className="rounded-full border border-[#fdba74] bg-[#fff7ed] px-2 py-0.5 text-[11px] font-semibold text-[#b45309]">
                  {alertBadge}
                </span>
              ) : null}
            </div>
          </div>
        </div>
        <ChevronDown
          className={[
            "h-5 w-5 shrink-0 transition-transform duration-200",
            open ? "text-[var(--color-energy)]" : "text-[var(--color-text-muted)]",
          ].join(" ")}
          style={{ transform: open ? "rotate(180deg)" : "rotate(0deg)" }}
          aria-hidden
        />
      </button>

      {open ? (
        <div
          id={`section-${id}-body`}
          className="border-t border-[var(--color-border-subtle)] bg-[color-mix(in_srgb,var(--color-bg-subtle)_40%,var(--color-bg-card))] px-5 py-6"
        >
          <div className="space-y-6">{children}</div>
        </div>
      ) : null}
    </section>
  );
}

function ToggleSwitch({
  checked,
  onChange,
  accentColor,
}: {
  checked: boolean;
  onChange: () => void;
  accentColor?: string;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={onChange}
      className="relative inline-flex h-7 w-12 shrink-0 items-center rounded-full border transition-colors"
      style={
        checked
          ? { borderColor: accentColor ?? GREEN, backgroundColor: `${accentColor ?? GREEN}33` }
          : { borderColor: "var(--color-border)", backgroundColor: "var(--color-bg-card)" }
      }
    >
      <span
        className="inline-block h-5 w-5 rounded-full bg-[var(--color-bg-card)] shadow-[0_1px_4px_rgba(0,0,0,0.18)] transition-transform"
        style={{ transform: checked ? "translateX(1.45rem)" : "translateX(0.2rem)" }}
      />
    </button>
  );
}

export default function ProfilPage() {
  usePageTitle("Profil");
  const { profile, updateProfile, syncToAthleteCalculator } = useProfile();
  const [races, setRaces] = useState<RaceEntry[]>(() => loadRaces());
  const [saveHint, setSaveHint] = useState<string | null>(null);
  const [lastSyncedAt, setLastSyncedAt] = useState<string | null>(null);
  const [autoSaveEnabled, setAutoSaveEnabled] = useState(true);
  const [autoSaveStatus, setAutoSaveStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [openSection, setOpenSection] = useState<string | null>("personal");
  const [profilTab, setProfilTab] = useState<ProfilDashboardTab>("overview");
  const [densityMode, setDensityMode] = useState<ProfilDensityMode>("auto");
  const [isAutoCompactViewport, setIsAutoCompactViewport] = useState(false);
  const [syncedProfileSnapshot, setSyncedProfileSnapshot] = useState<string>("");
  const saveHintTimeoutRef = useRef<number | null>(null);
  const [avatarImageError, setAvatarImageError] = useState(false);
  const avatarInputRef = useRef<HTMLInputElement | null>(null);
  const [avatarLightboxOpen, setAvatarLightboxOpen] = useState(false);

  const toggleSection = (id: string) => setOpenSection((prev) => (prev === id ? null : id));
  const refreshRaces = useCallback(() => setRaces(loadRaces()), []);

  useEffect(() => {
    const onVis = () => refreshRaces();
    const onStorage = (e: StorageEvent) => {
      if (e.key === "fuelos_races" || e.key === null) refreshRaces();
    };
    document.addEventListener("visibilitychange", onVis);
    window.addEventListener("storage", onStorage);
    return () => {
      document.removeEventListener("visibilitychange", onVis);
      window.removeEventListener("storage", onStorage);
    };
  }, [refreshRaces]);

  useEffect(() => {
    const savedDensity = safeStorageGet(PROFILE_DENSITY_KEY);
    if (savedDensity === "compact" || savedDensity === "standard" || savedDensity === "auto") {
      setDensityMode(savedDensity);
    }
    const savedTab = safeStorageGet(PROFILE_LAST_TAB_KEY);
    if (savedTab === "overview" || savedTab === "memory" || savedTab === "insights") {
      setProfilTab(savedTab);
    }
    const savedSection = safeStorageGet(PROFILE_LAST_SECTION_KEY);
    if (savedSection) setOpenSection(savedSection);
    if (safeStorageGet(PROFILE_AUTOSAVE_KEY) === "0") {
      setAutoSaveEnabled(false);
    }
  }, []);

  useEffect(() => {
    let rafId: number | null = null;
    const updateViewportMode = () => {
      // Compact auto pour desktop "resserré" (tablettes paysage + petits laptops)
      setIsAutoCompactViewport(window.innerWidth >= 1024 && window.innerWidth < 1520);
    };
    const onResize = () => {
      if (rafId !== null) return;
      rafId = window.requestAnimationFrame(() => {
        rafId = null;
        updateViewportMode();
      });
    };
    updateViewportMode();
    window.addEventListener("resize", onResize, { passive: true });
    return () => {
      window.removeEventListener("resize", onResize);
      if (rafId !== null) window.cancelAnimationFrame(rafId);
    };
  }, []);

  useEffect(() => {
    safeStorageSet(PROFILE_DENSITY_KEY, densityMode);
  }, [densityMode]);

  useEffect(() => {
    safeStorageSet(PROFILE_LAST_TAB_KEY, profilTab);
  }, [profilTab]);

  useEffect(() => {
    if (openSection) safeStorageSet(PROFILE_LAST_SECTION_KEY, openSection);
  }, [openSection]);

  useEffect(() => {
    safeStorageSet(PROFILE_AUTOSAVE_KEY, autoSaveEnabled ? "1" : "0");
  }, [autoSaveEnabled]);

  const { upcoming, past } = useMemo(() => partitionRacesByUpcoming(races), [races]);
  const nextRace = upcoming[0] ?? null;
  const seasonTotal = past.length + upcoming.length;
  const displayName =
    [profile.firstName, profile.lastName].filter(Boolean).join(" ").trim() || "Athlète FuelOS";
  const sportObj = MAIN_SPORTS.find((s) => s.id === profile.mainSport);
  const levelObj = LEVELS.find((l) => l.id === profile.athleticLevel);
  const goalObj = GOALS.find((g) => g.id === profile.mainGoal);
  const connectedCount = Object.values(profile.integrationConnected).filter(Boolean).length;
  const completion = profileCompletion(profile);
  const sports = activeSports(profile);
  const profileContextSubtitle = useMemo(() => {
    if (nextRace) {
      const dayDelta = daysUntil(nextRace.date);
      if (dayDelta === null) return `En préparation pour ${nextRace.name}`;
      if (dayDelta > 0) return `En préparation pour ${nextRace.name} — J-${dayDelta}`;
      if (dayDelta === 0) return `Objectif du jour: ${nextRace.name}`;
      return `Dernière course: ${nextRace.name}`;
    }
    if (goalObj?.label) return `Cap actuel: ${goalObj.label}`;
    if (sportObj?.label) return `Saison ${sportObj.label} en cours`;
    return "Profil en cours de personnalisation";
  }, [goalObj?.label, nextRace, sportObj?.label]);
  const profileHeaderChips = useMemo(
    () =>
      [
        sportObj
          ? {
              id: "sport",
              category: "Sport",
              label: sportObj.label,
              icon: Mountain,
              className:
                "border-[color-mix(in_srgb,var(--color-primary)_30%,transparent)] bg-[color-mix(in_srgb,var(--color-primary)_12%,white)] text-[var(--color-primary)]",
            }
          : null,
        levelObj
          ? {
              id: "level",
              category: "Niveau",
              label: levelObj.label,
              icon: BarChart3,
              className:
                "border-[color-mix(in_srgb,#2563EB_35%,transparent)] bg-[color-mix(in_srgb,#2563EB_12%,white)] text-[#1D4ED8]",
            }
          : null,
        goalObj
          ? {
              id: "goal",
              category: "Objectif",
              label: goalObj.label,
              icon: Target,
              className:
                "border-[color-mix(in_srgb,#D97706_35%,transparent)] bg-[color-mix(in_srgb,#D97706_12%,white)] text-[#B45309]",
            }
          : null,
      ].filter(Boolean) as { id: string; category: string; label: string; icon: typeof Mountain; className: string }[],
    [goalObj, levelObj, sportObj]
  );
  const nextRaceIdentity = useMemo(() => {
    if (!nextRace) return null;
    const distance = typeof nextRace.distance === "number" && nextRace.distance > 0 ? `${nextRace.distance} km` : null;
    const elevation =
      typeof nextRace.elevationGain === "number" && nextRace.elevationGain > 0
        ? `${Math.round(nextRace.elevationGain).toLocaleString("fr-FR")} D+`
        : null;
    if (!distance && !elevation) return null;
    return [distance, elevation].filter(Boolean).join(" · ");
  }, [nextRace]);
  const nutritionMode =
    profile.digestiveLiquidSolidPct <= 35
      ? "Liquide dominant"
      : profile.digestiveLiquidSolidPct >= 70
        ? "Solide dominant"
        : "Mix équilibré";
  const primaryPerformanceStat =
    typeof profile.ftpWatts === "number"
      ? `${profile.ftpWatts} W FTP`
      : typeof profile.runnerVmaKmh === "number"
        ? `${profile.runnerVmaKmh} km/h VMA`
        : "À renseigner";
  const bmi =
    typeof profile.weightKg === "number" && typeof profile.heightCm === "number" && profile.heightCm > 0
      ? profile.weightKg / Math.pow(profile.heightCm / 100, 2)
      : null;
  const weeklySparkline = useMemo(() => {
    const now = new Date();
    const day = now.getDay();
    const mondayDelta = day === 0 ? -6 : 1 - day;
    const currentWeekStart = new Date(now);
    currentWeekStart.setHours(0, 0, 0, 0);
    currentWeekStart.setDate(now.getDate() + mondayDelta);

    const starts = [3, 2, 1, 0].map((w) => {
      const d = new Date(currentWeekStart);
      d.setDate(currentWeekStart.getDate() - w * 7);
      return d;
    });
    const counts = starts.map((start) => {
      const end = new Date(start);
      end.setDate(start.getDate() + 7);
      return races.filter((race) => {
        const t = new Date(race.date);
        return t >= start && t < end;
      }).length;
    });
    return counts;
  }, [races]);
  const sparkMax = Math.max(1, ...weeklySparkline);
  const sparkPoints = weeklySparkline
    .map((v, i) => {
      const x = (i / 3) * 120;
      const y = 40 - (v / sparkMax) * 32;
      return `${x},${y}`;
    })
    .join(" ");
  const profileSnapshot = useMemo(() => JSON.stringify(profile), [profile]);
  const setupChecklist = useMemo(
    () => [
      { id: "identity", label: "Nom + sport principal", done: Boolean(profile.firstName && profile.mainSport), anchor: "#personal" },
      {
        id: "morpho",
        label: "Poids + taille renseignés",
        done: typeof profile.weightKg === "number" && typeof profile.heightCm === "number",
        anchor: "#personal",
      },
      {
        id: "performance",
        label: "FTP ou VMA définie",
        done: typeof profile.ftpWatts === "number" || typeof profile.runnerVmaKmh === "number",
        anchor: "#performance",
      },
      {
        id: "hydration",
        label: "Hydratation + sodium calibrés",
        done: typeof profile.sweatRateMlPerH === "number" && typeof profile.sodiumLossMgPerH === "number",
        anchor: "#nutrition",
      },
      {
        id: "integrations",
        label: "Au moins une intégration active",
        done: connectedCount > 0,
        anchor: "#integrations",
      },
    ],
    [
      connectedCount,
      profile.firstName,
      profile.mainSport,
      profile.weightKg,
      profile.heightCm,
      profile.ftpWatts,
      profile.runnerVmaKmh,
      profile.sweatRateMlPerH,
      profile.sodiumLossMgPerH,
    ]
  );
  const pendingChecklist = setupChecklist.filter((item) => !item.done);
  const setupProgressPct = Math.round(((setupChecklist.length - pendingChecklist.length) / setupChecklist.length) * 100);
  const nextPriorityAnchor = pendingChecklist[0]?.anchor ?? null;
  const firstIncompleteSectionId = nextPriorityAnchor?.replace("#", "") ?? "personal";
  const nutritionPendingCount = setupChecklist.filter((item) => ["performance", "hydration"].includes(item.id) && !item.done).length;
  const integrationsPendingCount = setupChecklist.filter((item) => item.id === "integrations" && !item.done).length;
  const quickPriorityItems = useMemo(
    () =>
      ["performance", "hydration", "integrations"]
        .map((id) => setupChecklist.find((item) => item.id === id))
        .filter(Boolean) as typeof setupChecklist,
    [setupChecklist]
  );
  const quickAccessCards = useMemo(
    () => [
      {
        id: "plan",
        href: "/plan",
        title: "Plan nutrition",
        description: "Plan personnalisé pour tes entraînements.",
        icon: Zap,
        status: completion >= 60 ? "Actif" : "À compléter",
        statusTone:
          completion >= 60
            ? "text-[#166534] bg-[#f0fdf4] border-[#86efac]"
            : "text-[#b45309] bg-[#fff7ed] border-[#fed7aa]",
      },
      {
        id: "race",
        href: "/race",
        title: "Mode course",
        description: "Checklist et stratégie pour le jour J.",
        icon: Footprints,
        status: nextRace ? "Configuré" : "Non configuré",
        statusTone: nextRace ? "text-[#166534] bg-[#f0fdf4] border-[#86efac]" : "text-[#991b1b] bg-[#fef2f2] border-[#fecaca]",
      },
      {
        id: "prep",
        href: "/prep",
        title: "Pré / post",
        description: "Protocoles nutritionnels avant et après effort.",
        icon: Leaf,
        status: pendingChecklist.some((item) => item.id === "hydration") ? "À paramétrer" : "Prêt",
        statusTone: pendingChecklist.some((item) => item.id === "hydration")
          ? "text-[#b45309] bg-[#fff7ed] border-[#fed7aa]"
          : "text-[#166534] bg-[#f0fdf4] border-[#86efac]",
      },
      {
        id: "races",
        href: "/races",
        title: "Mes courses",
        description: "Calendrier et objectifs de la saison.",
        icon: CalendarDays,
        status: nextRace ? "1 objectif à venir" : "Aucun objectif",
        statusTone: nextRace ? "text-[#1d4ed8] bg-[#eff6ff] border-[#bfdbfe]" : "text-[#991b1b] bg-[#fef2f2] border-[#fecaca]",
      },
    ],
    [completion, nextRace, pendingChecklist]
  );
  const completionVisual = completion < 50
    ? { barClass: "bg-[#dc2626]", softClass: "bg-[#fef2f2] text-[#b91c1c]", label: "À renforcer" }
    : completion <= 80
      ? { barClass: "bg-[#d97706]", softClass: "bg-[#fff7ed] text-[#b45309]", label: "En progression" }
      : { barClass: "bg-[#16a34a]", softClass: "bg-[#f0fdf4] text-[#15803d]", label: "Solide" };
  const readinessFillClass =
    completion > 70
      ? "bg-[var(--color-primary)]"
      : completion >= 50
        ? "bg-[#d97706]"
        : "bg-[#dc2626]";

  const onAvatarFile = (file: File | null) => {
    if (!file || !file.type.startsWith("image/")) return;
    if (file.size > 900_000) {
      setSaveHint("Image trop lourde (max. ~900 Ko).");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result;
      if (typeof result === "string") updateProfile({ avatarDataUrl: result });
    };
    reader.readAsDataURL(file);
  };

  useEffect(() => {
    if (!syncedProfileSnapshot) {
      setSyncedProfileSnapshot(profileSnapshot);
    }
  }, [profileSnapshot, syncedProfileSnapshot]);

  useEffect(() => {
    const savedSection = safeStorageGet(PROFILE_LAST_SECTION_KEY);
    if (!savedSection) setOpenSection(firstIncompleteSectionId);
  }, [firstIncompleteSectionId]);

  useEffect(() => {
    setAvatarImageError(false);
  }, [profile.avatarDataUrl]);

  useEffect(
    () => () => {
      if (saveHintTimeoutRef.current !== null) {
        window.clearTimeout(saveHintTimeoutRef.current);
      }
    },
    []
  );

  const runSync = useCallback(
    (mode: "manual" | "auto") => {
      try {
        setAutoSaveStatus("saving");
        syncToAthleteCalculator();
        setSyncedProfileSnapshot(profileSnapshot);
        setLastSyncedAt(new Date().toISOString());
        setAutoSaveStatus("saved");
        if (mode === "manual") {
          setSaveHint("Profil enregistré dans le calculateur ✓");
          if (saveHintTimeoutRef.current !== null) window.clearTimeout(saveHintTimeoutRef.current);
          saveHintTimeoutRef.current = window.setTimeout(() => setSaveHint(null), 4000);
        }
      } catch {
        setAutoSaveStatus("error");
        if (mode === "manual") {
          setSaveHint("Échec de synchronisation. Réessaie dans quelques secondes.");
          if (saveHintTimeoutRef.current !== null) window.clearTimeout(saveHintTimeoutRef.current);
          saveHintTimeoutRef.current = window.setTimeout(() => setSaveHint(null), 5000);
        }
      }
    },
    [profileSnapshot, syncToAthleteCalculator]
  );

  const handleSave = useCallback(() => runSync("manual"), [runSync]);
  const effectiveCompactDensity =
    densityMode === "compact" ||
    (densityMode === "auto" && isAutoCompactViewport && profilTab === "overview");
  const hasPendingSync = Boolean(syncedProfileSnapshot) && syncedProfileSnapshot !== profileSnapshot;
  const hasConnectedSources = connectedCount > 0;
  const syncStatusLabel =
    autoSaveStatus === "saving"
      ? "Sync en cours"
      : autoSaveStatus === "error"
        ? "Erreur sync"
        : hasPendingSync
          ? autoSaveEnabled
            ? "En attente auto"
            : "En attente"
          : "À jour";
  const quickSyncStatusLabel = !hasConnectedSources
    ? "Aucune source connectée"
    : autoSaveStatus === "error"
      ? "Erreur"
      : hasPendingSync
        ? "En attente"
        : "✓ À jour";
  const quickSyncSubtitle = !hasConnectedSources
    ? "Connecte Strava, Garmin ou TrainingPeaks pour activer la synchro."
    : `Dernière synchro: ${formatRelativeSyncDate(lastSyncedAt)}`;
  const syncConfidencePct =
    autoSaveStatus === "error"
      ? 20
      : autoSaveStatus === "saving"
        ? 60
        : hasPendingSync
          ? autoSaveEnabled
            ? 55
            : 45
          : 100;

  useEffect(() => {
    if (!autoSaveEnabled || !hasPendingSync || !syncedProfileSnapshot) return;
    const timeoutId = window.setTimeout(() => runSync("auto"), 1400);
    return () => window.clearTimeout(timeoutId);
  }, [autoSaveEnabled, hasPendingSync, runSync, syncedProfileSnapshot]);

  return (
    <>
      <Header />
      <main
        className={[
          "fuel-main races-page profil-page",
          effectiveCompactDensity ? "profil-density-compact" : "",
        ]
          .filter(Boolean)
          .join(" ")}
      >
        <section className="races-page-hero profil-hero" aria-labelledby="profil-hero-title">
          <svg viewBox="0 0 1200 200" preserveAspectRatio="none" aria-hidden>
            <path
              fill="#0f1f0f"
              d="M0 200 L0 120 L180 40 L320 95 L480 25 L620 80 L780 15 L920 70 L1080 30 L1200 90 L1200 200 Z"
            />
            <path
              fill="#0f1f0f"
              d="M0 200 L0 150 L220 85 L400 130 L560 60 L720 110 L900 50 L1040 95 L1200 75 L1200 200 Z"
            />
          </svg>
          <div className="races-page-hero__inner">
            <div className="races-page-hero__left">
              <div className="races-page-hero__copy">
                <h1 id="profil-hero-title">Profil athlète</h1>
              </div>
            </div>
          </div>
        </section>

        <div className="profil-hero-floating-card relative z-10 -mt-16 mx-4 rounded-2xl bg-white px-5 pb-4 pt-4 shadow-xl md:mx-10 md:px-6 md:pb-4 md:pt-5">
          <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
            <div className="flex min-w-0 items-center gap-4">
              <label
                style={{ width: "72px", height: "72px", minWidth: "72px", maxWidth: "72px", flexShrink: 0 }}
                className="group relative -mt-10 overflow-hidden rounded-full"
              >
                <div
                  className="relative h-full w-full overflow-hidden rounded-full bg-[#e6efe6]"
                  style={{ border: "3px solid #fff", boxShadow: "0 8px 24px rgba(0,0,0,0.18)" }}
                >
                  {profile.avatarDataUrl && !avatarImageError ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={profile.avatarDataUrl}
                      alt={displayName}
                      className="h-full w-full cursor-zoom-in object-cover object-center"
                      onError={() => setAvatarImageError(true)}
                      onClick={() => setAvatarLightboxOpen(true)}
                    />
                  ) : (
                    <div
                      className="flex h-full w-full items-center justify-center text-lg font-black text-[#1f3a1f]"
                      style={{
                        background: `linear-gradient(145deg, ${GREEN_MUTED} 0%, ${GREEN_LIGHT} 55%, color-mix(in srgb, var(--color-energy) 35%, ${GREEN_LIGHT}) 100%)`,
                      }}
                      aria-hidden
                    >
                      {initials(profile.firstName, profile.lastName)}
                    </div>
                  )}
                </div>
                <input
                  type="file"
                  accept="image/*"
                  className="sr-only"
                  ref={avatarInputRef}
                  onChange={(e) => onAvatarFile(e.target.files?.[0] ?? null)}
                />
              </label>

              <div className="min-w-0">
                <h2 className="truncate text-2xl font-bold text-[#142214]">{displayName}</h2>
                <p className="mt-1 truncate text-sm font-medium text-[var(--color-text-muted)]">{profileContextSubtitle}</p>
                {nextRaceIdentity ? (
                  <p className="mt-1 text-xs font-semibold text-[var(--color-text-muted)]">{nextRaceIdentity}</p>
                ) : null}
                <div className="mt-2 flex flex-wrap gap-3">
                  {profileHeaderChips.map((chip) => {
                    const Icon = chip.icon;
                    return (
                      <div key={chip.id} className="flex flex-col gap-1">
                        <span className="text-[10px] font-semibold uppercase tracking-[0.08em] text-[var(--color-text-muted)]">
                          {chip.category}
                        </span>
                        <span
                          className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-[12px] font-semibold ${chip.className}`}
                        >
                          <Icon size={13} strokeWidth={2.2} aria-hidden />
                          {chip.label}
                        </span>
                      </div>
                    );
                  })}
                </div>
                <div className="mt-2 flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => avatarInputRef.current?.click()}
                    className="inline-flex items-center gap-1 rounded-full border border-[var(--color-border)] bg-[var(--color-bg-subtle)] px-2.5 py-1 text-[11px] font-semibold text-[var(--color-text)]"
                  >
                    <Pencil size={12} aria-hidden />
                    Modifier
                  </button>
                  {profile.avatarDataUrl ? (
                    <button
                      type="button"
                      onClick={() => setAvatarLightboxOpen(true)}
                      className="inline-flex items-center gap-1 rounded-full border border-[var(--color-border)] bg-[var(--color-bg-subtle)] px-2.5 py-1 text-[11px] font-semibold text-[var(--color-text)]"
                    >
                      <Expand size={12} aria-hidden />
                      Agrandir
                    </button>
                  ) : null}
                  {profile.avatarDataUrl ? (
                    <button
                      type="button"
                      onClick={() => updateProfile({ avatarDataUrl: null })}
                      className="inline-flex items-center gap-1 rounded-full border border-[#fecaca] bg-[#fef2f2] px-2.5 py-1 text-[11px] font-semibold text-[#b91c1c]"
                    >
                      <Trash2 size={12} aria-hidden />
                      Supprimer
                    </button>
                  ) : null}
                </div>
              </div>
            </div>
          </div>
        </div>
        {avatarLightboxOpen && profile.avatarDataUrl ? (
          <div
            className="fixed inset-0 z-[60] flex items-center justify-center bg-black/70 p-4"
            role="dialog"
            aria-modal="true"
            aria-label="Aperçu avatar"
            onClick={() => setAvatarLightboxOpen(false)}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={profile.avatarDataUrl}
              alt={displayName}
              className="max-h-[85vh] max-w-[85vw] rounded-2xl border-2 border-white/80 object-contain"
              onClick={(e) => e.stopPropagation()}
            />
          </div>
        ) : null}

        <section className="relative z-10 mx-4 mt-3 md:mx-10" aria-label="Stats rapides">
          <div
            className="fuel-race-kpis-grid grid grid-cols-1 gap-3 md:grid-cols-3"
          >
            <article className="rounded-[16px] border border-[rgba(0,0,0,0.08)] bg-white p-[18px] shadow-[0_1px_2px_rgba(26,26,26,0.08)]">
              <p
                className="font-semibold uppercase"
                style={{ fontSize: "11px", letterSpacing: "0.08em", color: "var(--color-muted, var(--color-text-muted))" }}
              >
                Complétude profil
              </p>
              <div className="mt-2 flex items-end justify-between gap-3">
                <p className="profil-value">{completion}%</p>
                <span className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${completionVisual.softClass}`}>
                  {completionVisual.label}
                </span>
              </div>
              <div className="mt-3 h-3 overflow-hidden rounded-full bg-[var(--color-border)] ring-1 ring-[color-mix(in_srgb,var(--color-border)_80%,#fff)]">
                <div
                  className={`h-full rounded-full transition-all ${completionVisual.barClass}`}
                  style={{ width: `${completion}%` }}
                  aria-hidden
                />
              </div>
              <p className="mt-1 text-[11px] font-semibold text-[var(--color-text-muted)]">Progression globale du profil</p>
              <p className="profil-subtitle mt-2">
                {completion < 50
                  ? "Complète les champs clés pour débloquer des recommandations fiables."
                  : completion <= 80
                    ? "Bon rythme: encore quelques infos pour fiabiliser les plans."
                    : "Profil robuste, les recommandations sont bien calibrées."}
              </p>
            </article>

            <article className="rounded-[16px] border border-[rgba(0,0,0,0.08)] bg-white p-[18px] shadow-[0_1px_2px_rgba(26,26,26,0.08)]">
              <p
                className="font-semibold uppercase"
                style={{ fontSize: "11px", letterSpacing: "0.08em", color: "var(--color-muted, var(--color-text-muted))" }}
              >
                Priorités
              </p>
              <p className="profil-value mt-2">{pendingChecklist.length} items</p>
              <div className="mt-2 space-y-1.5">
                {quickPriorityItems.map((item) => (
                  <a
                    key={item.id}
                    href={item.anchor}
                    onClick={() => setOpenSection(item.anchor.replace("#", ""))}
                    className="group flex items-center gap-2 rounded-lg px-1 py-1 text-sm text-[var(--color-text)] transition hover:bg-[var(--color-bg-subtle)]"
                  >
                    <input
                      type="checkbox"
                      checked={item.done}
                      readOnly
                      tabIndex={-1}
                      className="h-4 w-4 shrink-0 rounded border-[var(--color-border)] text-[#16a34a] accent-[#16a34a]"
                      aria-hidden
                    />
                    <span className={item.done ? "text-[var(--color-text-muted)] line-through" : "group-hover:underline"}>
                      {item.label}
                    </span>
                  </a>
                ))}
              </div>
            </article>

            <article className="rounded-[16px] border border-[rgba(0,0,0,0.08)] bg-white p-[18px] shadow-[0_1px_2px_rgba(26,26,26,0.08)]">
              <p
                className="font-semibold uppercase"
                style={{ fontSize: "11px", letterSpacing: "0.08em", color: "var(--color-muted, var(--color-text-muted))" }}
              >
                Sync
              </p>
              <p className="profil-value mt-2">{quickSyncStatusLabel}</p>
              <p className="profil-subtitle mt-2">
                {quickSyncSubtitle}
              </p>
            </article>
          </div>
        </section>
        {nextPriorityAnchor ? (
          <div className="relative z-10 mx-4 mt-3 md:mx-10">
            <a
              href={nextPriorityAnchor}
              className="inline-flex w-full items-center justify-between gap-3 rounded-2xl border border-[color-mix(in_srgb,var(--color-energy)_45%,#f59e0b)] bg-[color-mix(in_srgb,#f59e0b_14%,var(--color-bg-card))] px-4 py-3 text-sm font-semibold text-[#b45309] shadow-sm transition hover:brightness-[0.98]"
            >
              <span>Complète ton profil pour des plans personnalisés</span>
              <span className="rounded-full border border-[#fdba74] bg-white/70 px-2 py-0.5 text-xs">
                {pendingChecklist.length} priorité{pendingChecklist.length > 1 ? "s" : ""}
              </span>
            </a>
          </div>
        ) : null}

        {saveHint ? (
          <div className="relative z-10 px-6 pb-3 pt-4 md:px-10" role="status">
            <div className="rounded-2xl border border-[var(--color-accent)] bg-[var(--color-accent-muted)] px-4 py-3 text-sm font-medium text-[var(--color-text)] shadow-sm">
              {saveHint}
            </div>
          </div>
        ) : null}

        <div className="races-layout mx-auto">
          <div className="races-layout__main min-w-0">
            <nav className="profil-tabs-shell mb-1 scroll-mt-6" aria-label="Sections du profil">
              <div className="relative">
                <details className="absolute right-0 top-0 z-10">
                  <summary
                    className="cursor-pointer list-none rounded-full border border-[var(--color-border)] bg-[var(--color-bg-card)] px-3 py-1 text-[11px] font-semibold text-[var(--color-text-muted)]"
                    title="Mode d'affichage: Auto adapte la densité, Confort affiche toutes les sections, Focus compacte l'interface et met en avant les priorités."
                  >
                    Mode d'affichage
                  </summary>
                  <div className="mt-2 min-w-[180px] rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-card)] p-2 shadow-sm">
                    <p className="px-2 pb-1 text-[10px] font-semibold uppercase tracking-widest text-gray-400">Affichage</p>
                    {(
                      [
                        ["auto", "Auto", "Ajuste automatiquement la densité selon l'écran."],
                        ["standard", "Confort", "Affiche toutes les sections avec espacement standard."],
                        ["compact", "Focus", "Masque les sections non prioritaires pour aller à l'essentiel."],
                      ] as const
                    ).map(([id, label, description]) => {
                      const active = densityMode === id;
                      return (
                        <button
                          key={id}
                          type="button"
                          onClick={() => setDensityMode(id)}
                          title={description}
                          className={[
                            "profil-density-btn flex w-full items-start justify-between gap-2 rounded-lg px-2.5 py-1.5 text-left text-xs font-medium transition-colors",
                            active
                              ? "bg-[color-mix(in_srgb,var(--color-primary)_12%,var(--color-bg-card))] text-[var(--color-text)]"
                              : "text-[var(--color-text-muted)] hover:bg-[var(--color-bg-subtle)] hover:text-[var(--color-text)]",
                          ].join(" ")}
                        >
                          <span className="flex flex-col">
                            <span>{label}</span>
                            <span className="text-[10px] font-normal text-[var(--color-text-muted)]">{description}</span>
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </details>

                <div className="flex rounded-full border border-[var(--color-border)] bg-[var(--color-bg-subtle)] p-1 pr-20 sm:pr-24">
                  {PROFIL_TABS.map((tab) => {
                    const active = profilTab === tab.id;
                    const Icon = tab.icon;
                    return (
                      <button
                        key={tab.id}
                        type="button"
                        onClick={() => setProfilTab(tab.id)}
                        className={[
                          "profil-tab-btn relative flex min-h-[44px] flex-1 items-center justify-center gap-2 rounded-full px-3 py-2 text-sm font-semibold transition-all sm:min-h-[46px] sm:flex-none sm:px-5",
                          active
                            ? "bg-white text-[#1b3a23] shadow-sm ring-1 ring-[color-mix(in_srgb,#1b3a23_16%,var(--color-border))]"
                            : "bg-transparent text-[var(--color-text-muted)] hover:text-[var(--color-text)]",
                        ].join(" ")}
                        aria-current={active ? "page" : undefined}
                      >
                        <Icon
                          className={["h-4 w-4 shrink-0", active ? "text-[var(--color-energy)]" : "opacity-75"].join(
                            " "
                          )}
                          aria-hidden
                        />
                        <span className="hidden sm:inline">{tab.label}</span>
                        <span className="sm:hidden">{tab.short}</span>
                        {active ? (
                          <span
                            className="absolute bottom-[3px] left-1/2 h-[3px] w-8 -translate-x-1/2 rounded-full bg-[var(--color-energy)]"
                            aria-hidden
                          />
                        ) : null}
                      </button>
                    );
                  })}
                </div>
              </div>
            </nav>

            {profilTab === "overview" ? (
              <>
                {hasPendingSync ? (
                  <div className="mb-2 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-[color-mix(in_srgb,var(--color-energy)_32%,var(--color-border))] bg-[color-mix(in_srgb,var(--color-energy)_8%,var(--color-bg-card))] px-4 py-3 text-sm">
                    <span className="font-medium text-[var(--color-text)]">
                      Modifications non synchronisées avec le calculateur.
                    </span>
                    <Button type="button" variant="primary" size="md" onClick={handleSave}>
                      Synchroniser maintenant
                    </Button>
                  </div>
                ) : null}

                <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
                  <div className="space-y-6">
                    <RacesNextMilestone nextRace={nextRace} />

                    <div
                      className="fuel-races-main-panel overflow-hidden rounded-2xl border border-[color-mix(in_srgb,var(--color-energy)_22%,var(--color-border))] shadow-[0_8px_40px_color-mix(in_srgb,#000_6%,transparent)] md:rounded-[28px]"
                      id="personal"
                    >
                      <div className="grid gap-6 border-b border-[var(--color-border-subtle)] bg-[linear-gradient(165deg,color-mix(in_srgb,var(--color-energy)_10%,var(--color-bg-card))_0%,var(--color-bg-card)_55%,var(--color-bg-card)_100%)] p-5 lg:grid-cols-[minmax(0,1.08fr)_minmax(340px,0.92fr)] lg:p-6">
                        <div>
                          <h2 className="font-display text-2xl font-black tracking-tight text-[var(--color-text)] md:text-[1.65rem]">
                            Accès rapide
                          </h2>
                          <p className="profil-subtitle mt-1">Tes outils clés avec leur état actuel.</p>

                          <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2">
                            {quickAccessCards.map((card) => {
                              const Icon = card.icon;
                              return (
                                <Link
                                  key={card.id}
                                  href={card.href}
                                  className="rounded-[12px] border border-[rgba(0,0,0,0.06)] bg-white px-4 py-3 transition duration-200 hover:-translate-y-[1px] hover:shadow-md"
                                >
                                  <div className="flex items-start justify-between gap-3">
                                    <div className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-[color-mix(in_srgb,var(--color-primary)_12%,white)]">
                                      <Icon className="h-4.5 w-4.5 text-[var(--color-primary)]" aria-hidden />
                                    </div>
                                    <span className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold ${card.statusTone}`}>
                                      {card.status}
                                    </span>
                                  </div>
                                  <p className="mt-2 text-sm font-semibold text-[var(--color-text)]">{card.title}</p>
                                  <p className="mt-0.5 line-clamp-1 text-xs text-[var(--color-text-muted)]">{card.description}</p>
                                </Link>
                              );
                            })}
                          </div>
                        </div>

                      </div>
                    </div>

                    <div className="space-y-6">
                  <SectionAccordion
                    id="personal"
                    icon={<User className="h-5 w-5" />}
                    title="Identité & morphologie"
                    subtitle="Le socle du profil: physique, sport principal et objectif."
                    open={openSection === "personal"}
                    onToggle={() => toggleSection("personal")}
                    accentColor={GREEN}
                  >
                    <div className="mb-4 grid grid-cols-1 gap-2 sm:grid-cols-3">
                      <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-subtle)] px-3 py-2.5">
                        <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--color-text-muted)]">Poids</p>
                        <p className="mt-1 text-base font-bold text-[var(--color-text)]">
                          {typeof profile.weightKg === "number" ? `${profile.weightKg} kg` : "—"}
                        </p>
                      </div>
                      <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-subtle)] px-3 py-2.5">
                        <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--color-text-muted)]">Taille</p>
                        <p className="mt-1 text-base font-bold text-[var(--color-text)]">
                          {typeof profile.heightCm === "number" ? `${profile.heightCm} cm` : "—"}
                        </p>
                      </div>
                      <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-subtle)] px-3 py-2.5">
                        <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--color-text-muted)]">IMC</p>
                        <p className="mt-1 text-base font-bold text-[var(--color-text)]">{bmi == null ? "—" : bmi.toFixed(1)}</p>
                      </div>
                    </div>

                    <div className="rounded-2xl border border-[var(--color-border-subtle)] bg-[var(--color-bg-card)] p-4 md:p-5">
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                      <label className="relative block">
                        <input
                          className={floatingInputClass()}
                          value={profile.firstName}
                          onChange={(e) => updateProfile({ firstName: e.target.value })}
                        />
                        <span className={floatingLabelClass()}>
                          Prénom
                        </span>
                      </label>
                      <label className="relative block">
                        <input
                          className={floatingInputClass()}
                          value={profile.lastName}
                          onChange={(e) => updateProfile({ lastName: e.target.value })}
                        />
                        <span className={floatingLabelClass()}>
                          Nom
                        </span>
                      </label>
                      <label className="relative block">
                        <input
                          type="number"
                          min={30}
                          max={200}
                          step={0.1}
                          className={floatingInputClass()}
                          value={profile.weightKg ?? ""}
                          onChange={(e) =>
                            updateProfile({ weightKg: e.target.value === "" ? null : Number(e.target.value) })
                          }
                        />
                        <span className={floatingLabelClass()}>
                          Poids (kg)
                        </span>
                      </label>
                      <label className="relative block">
                        <input
                          type="number"
                          min={120}
                          max={230}
                          className={floatingInputClass()}
                          value={profile.heightCm ?? ""}
                          onChange={(e) =>
                            updateProfile({ heightCm: e.target.value === "" ? null : Number(e.target.value) })
                          }
                        />
                        <span className={floatingLabelClass()}>
                          Taille (cm)
                        </span>
                      </label>
                      <label className="relative block">
                        <input
                          type="number"
                          min={10}
                          max={99}
                          className={floatingInputClass()}
                          value={profile.age ?? ""}
                          onChange={(e) =>
                            updateProfile({ age: e.target.value === "" ? null : Number(e.target.value) })
                          }
                        />
                        <span className={floatingLabelClass()}>
                          Âge
                        </span>
                      </label>
                      <div>
                        <span className="block text-[12px] font-medium text-[var(--color-text-muted)]">Sexe</span>
                        <div className="mt-3 inline-flex rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-subtle)] p-1">
                          {(["M", "F", "other"] as const).map((sex) => (
                            <label
                              key={sex}
                              className={`flex cursor-pointer items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold transition-all ${
                                profile.sex === sex
                                  ? "bg-white text-[var(--color-text)] shadow-sm"
                                  : "text-[var(--color-text-muted)] hover:text-[var(--color-text)]"
                              }`}
                            >
                              <input
                                type="radio"
                                name="sex"
                                className="sr-only"
                                checked={profile.sex === sex}
                                onChange={() => updateProfile({ sex })}
                              />
                              {sex === "M" ? "Homme" : sex === "F" ? "Femme" : "Autre"}
                            </label>
                          ))}
                        </div>
                      </div>
                    </div>
                    </div>

                    <div className="mt-6 rounded-2xl border border-[var(--color-border-subtle)] bg-[var(--color-bg-card)] p-4 md:p-5">
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                      <label className="relative block">
                        <select
                          className={selectClass()}
                          value={profile.mainSport}
                          onChange={(e) => updateProfile({ mainSport: e.target.value as FuelOsMainSport })}
                        >
                          {MAIN_SPORTS.map((sport) => (
                            <option key={sport.id} value={sport.id}>
                              {sport.label}
                            </option>
                          ))}
                        </select>
                        <span className={floatingLabelClass()}>
                          Sport principal
                        </span>
                      </label>
                      <label className="relative block">
                        <select
                          className={selectClass()}
                          value={profile.athleticLevel}
                          onChange={(e) => updateProfile({ athleticLevel: e.target.value as FuelOsAthleticLevel })}
                        >
                          {LEVELS.map((level) => (
                            <option key={level.id} value={level.id}>
                              {level.label}
                            </option>
                          ))}
                        </select>
                        <span className={floatingLabelClass()}>
                          Niveau athlétique
                        </span>
                      </label>
                      <label className="relative block md:col-span-2">
                        <select
                          className={selectClass()}
                          value={profile.mainGoal}
                          onChange={(e) => updateProfile({ mainGoal: e.target.value as FuelOsUserProfile["mainGoal"] })}
                        >
                          {GOALS.map((goal) => (
                            <option key={goal.id} value={goal.id}>
                              {goal.label}
                            </option>
                          ))}
                        </select>
                        <span className={floatingLabelClass()}>
                          Objectif principal
                        </span>
                      </label>
                    </div>
                    </div>

                    <div className="mt-6 rounded-2xl border border-[var(--color-border-subtle)] bg-[var(--color-bg-card)] p-4 md:p-5">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <span className="text-sm font-semibold text-[var(--color-text)]">Sports secondaires</span>
                        <span className="text-xs text-[var(--color-text-muted)]">Le sport principal est défini au-dessus</span>
                      </div>
                      <div className="mt-3 grid grid-cols-1 gap-2 md:grid-cols-2 lg:grid-cols-3">
                        {(
                          [
                            ["trail", "🏔️ Trail"],
                            ["running", "🏃 Running"],
                            ["veloRoute", "🚴 Vélo route"],
                            ["vtt", "🚵 VTT"],
                            ["triathlon", "🏊 Triathlon"],
                          ] as const
                        ).map(([key, label]) => (
                          <label
                            key={key}
                            className={`flex cursor-pointer items-center gap-2 rounded-full border px-4 py-2.5 text-sm font-medium transition-all ${
                              profile.sports[key]
                                ? "border-[color-mix(in_srgb,var(--color-energy)_45%,var(--color-border))] bg-[color-mix(in_srgb,var(--color-energy)_12%,var(--color-bg-card))] text-[var(--color-text)] shadow-sm"
                                : "border-[rgba(0,0,0,0.18)] bg-transparent text-[var(--color-text-muted)] hover:border-[var(--color-energy)]"
                            }`}
                          >
                            <input
                              type="checkbox"
                              className="sr-only"
                              checked={profile.sports[key]}
                              onChange={(e) =>
                                updateProfile({ sports: { ...profile.sports, [key]: e.target.checked } })
                              }
                            />
                            {label}
                          </label>
                        ))}
                      </div>
                    </div>

                    <div className="mt-6 rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-subtle)] px-3 py-2.5">
                      <p className="text-sm font-semibold text-[var(--color-text)]">
                        Autosave intelligent: {hasPendingSync ? "Synchronisation en attente" : "Sauvegardé ✓"}
                      </p>
                      <p className="mt-1 text-xs text-[var(--color-text-muted)]">
                        {autoSaveEnabled ? "Les changements sont enregistrés automatiquement." : "Active l'autosave dans la colonne de droite."}
                      </p>
                    </div>
                  </SectionAccordion>

                  <SectionAccordion
                    id="nutrition"
                    icon={<Activity className="h-5 w-5" />}
                    title="Performance & nutrition"
                    subtitle="Les réglages qui rendent les plans plus pertinents sur effort long."
                    alertBadge={
                      nutritionPendingCount > 0
                        ? `⚠️ ${nutritionPendingCount} item${nutritionPendingCount > 1 ? "s" : ""} à compléter`
                        : undefined
                    }
                    open={openSection === "nutrition"}
                    onToggle={() => toggleSection("nutrition")}
                    accentColor="#D97706"
                  >
                    <div className="grid gap-4 lg:grid-cols-[minmax(0,1.15fr)_minmax(280px,0.85fr)]">
                      <div id="performance" className="rounded-2xl border border-[var(--color-border-subtle)] bg-[var(--color-bg-card)] p-4 md:p-5">
                        <div className="mb-3 flex items-center gap-2">
                          <Gauge className="h-4 w-4 text-[var(--color-text-muted)]" />
                          <span className="text-sm font-bold text-[var(--color-text)]">Données de performance</span>
                        </div>
                        <div className="grid gap-4 md:grid-cols-2">
                          <label className="relative block">
                            <input
                              type="number"
                              min={50}
                              max={650}
                              placeholder="FTP (W)"
                              className={floatingInputClass()}
                              value={profile.ftpWatts ?? ""}
                              onChange={(e) =>
                                updateProfile({ ftpWatts: e.target.value === "" ? null : Number(e.target.value) })
                              }
                            />
                            <span className={floatingLabelClass()}>
                              FTP (W)
                            </span>
                          </label>
                          <label className="relative block">
                            <input
                              type="number"
                              min={8}
                              max={25}
                              step={0.1}
                              placeholder="VMA (km/h)"
                              className={floatingInputClass()}
                              value={profile.runnerVmaKmh ?? ""}
                              onChange={(e) =>
                                updateProfile({
                                  runnerVmaKmh: e.target.value === "" ? null : Number(e.target.value),
                                })
                              }
                            />
                            <span className={floatingLabelClass()}>
                              VMA (km/h)
                            </span>
                          </label>
                          <label className="relative block md:col-span-2">
                            <input
                              type="number"
                              min={2.6}
                              max={12}
                              step={0.1}
                              placeholder="Allure seuil (min/km)"
                              className={floatingInputClass()}
                              value={profile.runnerThresholdPaceMinPerKm ?? ""}
                              onChange={(e) =>
                                updateProfile({
                                  runnerThresholdPaceMinPerKm:
                                    e.target.value === "" ? null : Number(e.target.value),
                                })
                              }
                            />
                            <span className={floatingLabelClass()}>
                              Allure seuil (min/km)
                            </span>
                          </label>
                        </div>
                      </div>

                      <div className="rounded-3xl border border-[var(--color-border)] bg-[var(--color-bg-subtle)] p-4">
                        <p className="profil-kicker">
                          Repère effort
                        </p>
                        <div className="mt-3 grid gap-3 md:grid-cols-2 lg:grid-cols-1">
                          <SemiGauge
                            label="FTP"
                            value={typeof profile.ftpWatts === "number" ? profile.ftpWatts : null}
                            unit="W"
                            min={120}
                            max={420}
                            accent="#d97706"
                          />
                          <SemiGauge
                            label="VMA"
                            value={typeof profile.runnerVmaKmh === "number" ? profile.runnerVmaKmh : null}
                            unit="km/h"
                            min={8}
                            max={24}
                            accent="#d97706"
                          />
                        </div>
                        <p className="mt-2 text-sm text-[#d97706]">
                          FTP/VMA orientent la personnalisation endurance.
                        </p>
                      </div>
                    </div>

                    <div className="rounded-2xl border border-[var(--color-border-subtle)] bg-[var(--color-bg-card)] p-4 md:p-5">
                      <div className="mb-3 flex items-center gap-2">
                        <Droplets className="h-4 w-4 text-[var(--color-text-muted)]" />
                        <span className="text-sm font-bold text-[var(--color-text)]">Hydratation & sudation</span>
                      </div>
                      <div className="grid gap-4 md:grid-cols-2">
                          <label className="block text-sm font-semibold text-[var(--color-text)]">
                            Débit de sueur (ml/h)
                          <input
                            type="number"
                            min={200}
                            max={3500}
                            className={inputClass()}
                            value={profile.sweatRateMlPerH ?? ""}
                            placeholder="ex. 900"
                            onChange={(e) =>
                              updateProfile({
                                sweatRateMlPerH: e.target.value === "" ? null : Number(e.target.value),
                              })
                            }
                          />
                        </label>
                        <label className="block text-sm font-semibold text-[var(--color-text)]">
                          Sodium perdu (mg/h)
                          <input
                            type="number"
                            min={100}
                            max={4000}
                            className={inputClass()}
                            value={profile.sodiumLossMgPerH ?? ""}
                            placeholder="ex. 600"
                            onChange={(e) =>
                              updateProfile({
                                sodiumLossMgPerH: e.target.value === "" ? null : Number(e.target.value),
                              })
                            }
                          />
                        </label>
                      </div>
                    </div>

                    <div className="rounded-2xl border border-[var(--color-border-subtle)] bg-[var(--color-bg-card)] p-4 md:p-5">
                      <span className="text-sm font-bold text-[var(--color-text)]">Tolérance digestive</span>
                      <div className="mt-3 flex justify-between text-[11px] font-semibold text-[var(--color-text-muted)]">
                        <span>100 % liquide</span>
                        <span>{profile.digestiveLiquidSolidPct} %</span>
                        <span>100 % solide</span>
                      </div>
                      <input
                        type="range"
                        min={0}
                        max={100}
                        value={profile.digestiveLiquidSolidPct}
                        onChange={(e) =>
                          updateProfile({ digestiveLiquidSolidPct: Number(e.target.value) })
                        }
                        className="mt-2 w-full accent-[var(--color-accent)]"
                      />
                    </div>

                    <div className="rounded-2xl border border-[var(--color-border-subtle)] bg-[var(--color-bg-card)] p-4 md:p-5">
                      <span className="text-sm font-bold text-[var(--color-text)]">Régimes & restrictions</span>
                      <div className="mt-3 grid grid-cols-1 gap-2 md:grid-cols-2 lg:grid-cols-3">
                        {(
                          [
                            ["dietVegetarian", "Végétarien"],
                            ["dietVegan", "Vegan"],
                            ["dietGlutenFree", "Sans gluten"],
                            ["dietLactoseFree", "Sans lactose"],
                            ["dietNoCaffeine", "Sans caféine"],
                          ] as const
                        ).map(([key, label]) => (
                          <label
                            key={key}
                            className={`flex cursor-pointer items-center gap-2 rounded-2xl border px-4 py-3 text-sm font-medium transition-colors ${
                              profile[key]
                                ? "border-[var(--color-accent)] bg-[var(--color-accent-muted)] text-[var(--color-text)]"
                                : "border-[var(--color-border)] text-[var(--color-text-muted)] hover:border-[var(--color-accent)]"
                            }`}
                          >
                            <input
                              type="checkbox"
                              className="sr-only"
                              checked={profile[key]}
                              onChange={(e) => updateProfile({ [key]: e.target.checked })}
                            />
                            {label}
                          </label>
                        ))}
                      </div>
                    </div>

                    <div className="rounded-2xl border border-[var(--color-border-subtle)] bg-[var(--color-bg-card)] p-4 md:p-5">
                      <label className="block text-sm font-semibold text-[var(--color-text)]">
                        Allergènes (texte libre)
                        <textarea
                          rows={3}
                          className="mt-1.5 w-full rounded-2xl border border-[var(--color-border)] bg-[color-mix(in_srgb,var(--color-bg-card)_82%,var(--color-bg-elevated))] px-4 py-3 text-sm text-[var(--color-text)] outline-none shadow-[inset_0_1px_0_rgba(255,255,255,0.06)] transition duration-200 focus:border-[color-mix(in_srgb,var(--color-energy)_55%,var(--color-accent))] focus:ring-2 focus:ring-[color-mix(in_srgb,var(--color-energy)_24%,transparent)]"
                          value={profile.allergenNotes}
                          onChange={(e) => updateProfile({ allergenNotes: e.target.value })}
                          placeholder="Ex. fruits à coque, arachides…"
                        />
                      </label>
                    </div>

                    <div className="rounded-2xl border border-[var(--color-border-subtle)] bg-[var(--color-bg-card)] p-4 md:p-5">
                      <span className="text-sm font-semibold text-[var(--color-text)]">Marques favorites</span>
                      <div className="mt-3 grid grid-cols-1 gap-2 md:grid-cols-2 lg:grid-cols-3">
                        {(
                          [
                            ["brandMaurten", "Maurten"],
                            ["brandSis", "SiS"],
                            ["brandTailwind", "Tailwind"],
                            ["brandNaak", "Näak"],
                            ["brandOther", "Autres"],
                          ] as const
                        ).map(([key, label]) => (
                          <label
                            key={key}
                            className={`flex cursor-pointer items-center gap-2 rounded-2xl border px-4 py-3 text-sm font-medium transition-colors ${
                              profile[key]
                                ? "border-[var(--color-accent)] bg-[var(--color-accent-muted)] text-[var(--color-text)]"
                                : "border-[var(--color-border)] text-[var(--color-text-muted)] hover:border-[var(--color-accent)]"
                            }`}
                          >
                            <input
                              type="checkbox"
                              className="sr-only"
                              checked={profile[key]}
                              onChange={(e) => updateProfile({ [key]: e.target.checked })}
                            />
                            {label}
                          </label>
                        ))}
                      </div>
                    </div>

                  </SectionAccordion>

                  <SectionAccordion
                    id="integrations"
                    icon={<Settings className="h-5 w-5" />}
                    title="Connexions"
                    subtitle="Active ou coupe chaque source pour refléter ton écosystème réel."
                    alertBadge={integrationsPendingCount > 0 ? "⚠️ 1 item à compléter" : undefined}
                    open={openSection === "integrations"}
                    onToggle={() => toggleSection("integrations")}
                    accentColor="#64748B"
                  >
                    <div className="grid gap-3">
                      {INTEGRATIONS.map((integration) => {
                        const connected = !!profile.integrationConnected[integration.id];
                        return (
                          <div
                            key={integration.id}
                            className="flex flex-col gap-4 rounded-[26px] border border-[var(--color-border)] bg-[color-mix(in_srgb,var(--color-bg-card)_82%,var(--color-bg-elevated))] px-4 py-4 sm:flex-row sm:items-center sm:justify-between"
                          >
                            <div className="flex min-w-0 items-center gap-4">
                              <span
                                className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl text-lg"
                                style={{ backgroundColor: `${integration.color}18` }}
                                aria-hidden
                              >
                                {integration.logo}
                              </span>
                              <div className="min-w-0">
                                <div className="flex flex-wrap items-center gap-2">
                                  <p className="truncate text-sm font-semibold text-[var(--color-text)]">
                                    {integration.name}
                                  </p>
                                  <span
                                    className="rounded-full px-2.5 py-1 text-[11px] font-semibold"
                                    style={{
                                      color: connected ? integration.color : "var(--color-text-muted)",
                                      backgroundColor: connected ? `${integration.color}18` : "var(--color-bg-subtle)",
                                    }}
                                  >
                                    {connected ? "Connectée" : "Déconnectée"}
                                  </span>
                                </div>
                                <p className="profil-subtitle mt-1">
                                  {integration.description}
                                </p>
                              </div>
                            </div>

                            <div className="flex items-center gap-4">
                              <div className="text-right">
                                <p className="text-xs font-medium text-[var(--color-text-muted)]">
                                  État
                                </p>
                                <p className="mt-1 text-sm font-semibold text-[var(--color-text)]">
                                  {connected ? "Activée" : "Inactive"}
                                </p>
                              </div>
                              <ToggleSwitch
                                checked={connected}
                                accentColor={integration.color}
                                onChange={() =>
                                  updateProfile({
                                    integrationConnected: {
                                      ...profile.integrationConnected,
                                      [integration.id]: !connected,
                                    },
                                  })
                                }
                              />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </SectionAccordion>
                    </div>
                  </div>

                  <aside className="profil-sticky-rail space-y-6 lg:sticky lg:top-[80px] lg:self-start">
                    <div className="rounded-[16px] border border-[var(--color-border)] bg-[var(--color-bg-card)] p-4 shadow-sm">
                      <p className="profil-kicker">
                        Readiness athlète
                      </p>
                      <p className="profil-value mt-2">{completion}%</p>
                      <div className="mt-2 h-2 overflow-hidden rounded-full bg-[var(--color-border)]">
                        <div className={`h-full rounded-full ${readinessFillClass}`} style={{ width: `${completion}%` }} aria-hidden />
                      </div>
                      <div className="mt-3 grid gap-2">
                        <div className="flex items-center justify-between rounded-xl bg-[var(--color-bg-subtle)] px-3 py-2 text-xs">
                          <span className="text-[var(--color-text-muted)]">Sport principal</span>
                          <span className="font-semibold text-[var(--color-text)]">
                            {sportObj ? `${sportObj.emoji} ${sportObj.label}` : "À définir"}
                          </span>
                        </div>
                        <div className="flex items-center justify-between rounded-xl bg-[var(--color-bg-subtle)] px-3 py-2 text-xs">
                          <span className="text-[var(--color-text-muted)]">Métrique clé</span>
                          <span className="font-semibold text-[var(--color-text)]">{primaryPerformanceStat}</span>
                        </div>
                        <div className="flex items-center justify-between rounded-xl bg-[var(--color-bg-subtle)] px-3 py-2 text-xs">
                          <span className="text-[var(--color-text-muted)]">Hydratation</span>
                          <span className="font-semibold text-[var(--color-text)]">
                            {typeof profile.sweatRateMlPerH === "number" ? `${profile.sweatRateMlPerH} ml/h` : "À calibrer"}
                          </span>
                        </div>
                      </div>
                      <p className="profil-subtitle mt-3">
                        {pendingChecklist.length === 0
                          ? "Prêt pour les recommandations avancées."
                          : `${pendingChecklist.length} priorité${pendingChecklist.length > 1 ? "s" : ""} avant la pleine personnalisation.`}
                      </p>
                    </div>

                    <div className="rounded-[16px] border border-[var(--color-border)] bg-[var(--color-bg-card)] p-4 shadow-sm">
                      <p className="profil-kicker">
                        Priorités profil
                      </p>
                      <div className="mt-3 space-y-2">
                        {setupChecklist.map((item) => (
                          <div
                            key={item.id}
                            className={[
                              "flex items-center justify-between gap-3 rounded-xl border px-3 py-2.5 text-xs",
                              item.done
                                ? "border-[color-mix(in_srgb,var(--color-primary)_28%,var(--color-border))] bg-[color-mix(in_srgb,var(--color-primary)_7%,var(--color-bg-card))]"
                                : "border-[var(--color-border)] bg-[var(--color-bg-subtle)] text-[var(--color-text-muted)]",
                            ].join(" ")}
                          >
                            <span className={["inline-flex items-center gap-2", item.done ? "text-[var(--color-text)]" : "text-[var(--color-text-muted)]"].join(" ")}>
                              <span
                                className={[
                                  "inline-flex h-5 w-5 items-center justify-center rounded-full text-[11px]",
                                  item.done ? "bg-green-100 text-green-700" : "border border-gray-300 bg-transparent text-gray-400",
                                ].join(" ")}
                                aria-hidden
                              >
                                {item.done ? "✅" : "○"}
                              </span>
                              {item.label}
                            </span>
                            {!item.done ? (
                              <a
                                href={item.anchor}
                                className="profil-priority-jump rounded-full border border-[var(--color-border)] px-2.5 py-1 text-[10px] font-semibold text-[var(--color-text-muted)]"
                              >
                                → Renseigner
                              </a>
                            ) : null}
                          </div>
                        ))}
                      </div>
                      <p className="mt-3 text-xs text-[var(--color-text-muted)]">
                        {pendingChecklist.length === 0
                          ? "Profil prêt : base complète pour plans et analyses."
                          : `${pendingChecklist.length} point${pendingChecklist.length > 1 ? "s" : ""} à compléter en priorité.`}
                      </p>
                    </div>
                  </aside>
                </div>
              </>
            ) : null}

            {profilTab === "memory" ? (
              <div className="fuel-theme-panel min-w-0 pb-2">
                <div className="fuel-theme-panel__inner">
                  <ProfileMemoryTabContent />
                </div>
              </div>
            ) : null}

            {profilTab === "insights" ? (
              <div className="space-y-6">
                <div className="fuel-theme-panel min-w-0">
                  <div className="fuel-theme-panel__inner">
                    <p className="profil-kicker">Progression 4 semaines</p>
                    <div className="mt-3 rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg-subtle)] p-4">
                      <svg viewBox="0 0 120 44" className="h-12 w-full" aria-label="Sparkline progression 4 semaines">
                        <polyline
                          fill="none"
                          stroke="#d97706"
                          strokeWidth="2.5"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          points={sparkPoints}
                        />
                      </svg>
                      <div className="mt-2 grid grid-cols-4 text-[11px] text-gray-500">
                        <span>S-3</span>
                        <span className="text-center">S-2</span>
                        <span className="text-center">S-1</span>
                        <span className="text-right">Cette semaine</span>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="fuel-theme-panel min-w-0 pb-2">
                  <div className="fuel-theme-panel__inner">
                  <ProfileAnalysesTabContent />
                  </div>
                </div>
              </div>
            ) : null}
          </div>
        </div>
      </main>
    </>
  );
}
