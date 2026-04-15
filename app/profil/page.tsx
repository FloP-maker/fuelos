"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import {
  Activity,
  BarChart3,
  CalendarDays,
  ChevronDown,
  Droplets,
  Footprints,
  Gauge,
  LayoutGrid,
  Leaf,
  Library,
  Link2,
  Medal,
  Settings,
  ShieldCheck,
  Sparkles,
  Target,
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
  return value || "?";
}

function inputClass() {
  return "mt-1.5 w-full rounded-2xl border border-[var(--color-border)] bg-[color-mix(in_srgb,var(--color-bg-card)_74%,var(--color-bg-elevated))] px-4 py-3 text-sm text-[var(--color-text)] outline-none transition focus:border-[var(--color-accent)]";
}

function selectClass() {
  return "mt-1.5 w-full rounded-2xl border border-[var(--color-border)] bg-[color-mix(in_srgb,var(--color-bg-card)_74%,var(--color-bg-elevated))] px-4 py-3 text-sm text-[var(--color-text)] outline-none transition focus:border-[var(--color-accent)]";
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

function ProfileHeroMetric({
  label,
  value,
  help,
}: {
  label: string;
  value: string;
  help: string;
}) {
  return (
    <div className="relative overflow-hidden rounded-2xl border border-white/14 bg-white/[0.07] px-4 py-3.5 shadow-[0_12px_40px_rgba(0,0,0,0.18)] backdrop-blur-md">
      <div
        className="pointer-events-none absolute inset-y-2 left-0 w-0.5 rounded-full bg-gradient-to-b from-[var(--color-energy)] to-[var(--color-accent)]"
        aria-hidden
      />
      <p className="pl-2 text-[10px] font-bold uppercase tracking-[0.2em] text-white/55">{label}</p>
      <p className="mt-1.5 pl-2 font-display text-2xl font-black tracking-tight text-white">{value}</p>
      <p className="mt-1 pl-2 text-[11px] leading-snug text-white/65">{help}</p>
    </div>
  );
}

function DashboardTile({
  icon,
  eyebrow,
  title,
  body,
  children,
}: {
  icon: ReactNode;
  eyebrow: string;
  title: string;
  body: string;
  children?: ReactNode;
}) {
  return (
    <article className="group relative overflow-hidden rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg-card)] p-5 shadow-[0_2px_16px_color-mix(in_srgb,#000_4%,transparent)] transition-[box-shadow,transform] duration-200 motion-safe:hover:-translate-y-0.5 hover:shadow-[0_12px_36px_color-mix(in_srgb,#000_8%,transparent)] md:rounded-3xl">
      <div
        className="pointer-events-none absolute inset-y-3 left-0 w-[3px] rounded-full bg-gradient-to-b from-[var(--color-energy)] via-[var(--color-accent)] to-[var(--color-primary)] opacity-90"
        aria-hidden
      />
      <div className="relative flex items-start gap-3.5 pl-1.5">
        <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[color-mix(in_srgb,var(--color-energy)_12%,var(--color-bg-subtle))] text-[var(--color-energy)] ring-1 ring-[color-mix(in_srgb,var(--color-energy)_22%,transparent)]">
          {icon}
        </span>
        <div className="min-w-0">
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[var(--color-text-muted)]">{eyebrow}</p>
          <h3 className="mt-1.5 font-display text-lg font-black tracking-tight text-[var(--color-text)]">{title}</h3>
          <p className="mt-1 text-sm leading-relaxed text-[var(--color-text-muted)]">{body}</p>
        </div>
      </div>
      {children ? <div className="relative mt-5 pl-1.5">{children}</div> : null}
    </article>
  );
}

function StatPill({
  value,
  unit,
  label,
}: {
  value: number | string;
  unit?: string;
  label: string;
}) {
  return (
    <div className="rounded-2xl border border-[color-mix(in_srgb,var(--color-border)_88%,var(--color-energy))] bg-[color-mix(in_srgb,var(--color-bg-subtle)_55%,var(--color-bg-card))] px-4 py-3.5">
      <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[var(--color-text-muted)]">{label}</p>
      <div className="mt-1.5 flex items-baseline gap-1">
        <span className="font-display text-[1.65rem] font-black leading-none tracking-tight text-[var(--color-text)]">
          {value}
        </span>
        {unit ? <span className="text-xs font-bold text-[var(--color-text-muted)]">{unit}</span> : null}
      </div>
    </div>
  );
}

function SectionAccordion({
  id,
  icon,
  title,
  subtitle,
  open,
  onToggle,
  children,
  accentColor,
}: {
  id: string;
  icon: ReactNode;
  title: string;
  subtitle: string;
  open: boolean;
  onToggle: () => void;
  children: ReactNode;
  accentColor?: string;
}) {
  const accent = accentColor ?? GREEN;
  return (
    <section
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
        className="flex w-full items-center justify-between gap-4 px-4 py-4 text-left md:px-6 md:py-5"
        onClick={onToggle}
        aria-expanded={open}
        aria-controls={`section-${id}-body`}
        id={`section-${id}-title`}
      >
        <div className="flex min-w-0 items-center gap-3.5 md:gap-4">
          <span
            className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl text-white shadow-md ring-2 ring-white/10"
            style={{
              background: `linear-gradient(145deg, ${accent} 0%, color-mix(in srgb, ${accent} 55%, #0f172a) 100%)`,
            }}
          >
            {icon}
          </span>
          <div className="min-w-0">
            <p className="font-display text-base font-black tracking-tight text-[var(--color-text)] md:text-lg">
              {title}
            </p>
            <p className="mt-0.5 text-sm leading-snug text-[var(--color-text-muted)]">{subtitle}</p>
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
          className="border-t border-[var(--color-border-subtle)] bg-[color-mix(in_srgb,var(--color-bg-subtle)_40%,var(--color-bg-card))] px-4 py-5 md:px-6 md:py-6"
        >
          {children}
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
        className="inline-block h-5 w-5 rounded-full bg-white shadow transition-transform"
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
  const [openSection, setOpenSection] = useState<string | null>("personal");
  const [profilTab, setProfilTab] = useState<ProfilDashboardTab>("overview");

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
  const nutritionMode =
    profile.digestiveLiquidSolidPct <= 35
      ? "Liquide dominant"
      : profile.digestiveLiquidSolidPct >= 70
        ? "Solide dominant"
        : "Mix équilibré";
  const brands = [
    profile.brandMaurten && "Maurten",
    profile.brandSis && "SiS",
    profile.brandTailwind && "Tailwind",
    profile.brandNaak && "Näak",
    profile.brandOther && "Autres",
  ].filter(Boolean) as string[];
  const primaryPerformanceStat =
    typeof profile.ftpWatts === "number"
      ? `${profile.ftpWatts} W FTP`
      : typeof profile.runnerVmaKmh === "number"
        ? `${profile.runnerVmaKmh} km/h VMA`
        : "À renseigner";

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

  const handleSave = () => {
    syncToAthleteCalculator();
    setSaveHint("Profil enregistré dans le calculateur ✓");
    window.setTimeout(() => setSaveHint(null), 4000);
  };

  return (
    <>
      <Header />
      <main className="fuel-main races-page profil-page">
        <section className="races-page-hero profil-hero" aria-labelledby="profil-hero-title">
          <svg viewBox="0 0 1200 220" preserveAspectRatio="none" aria-hidden>
            <path
              fill="#0b1711"
              d="M0 220 L0 118 L138 64 L236 110 L360 24 L484 96 L626 42 L760 114 L902 28 L1076 88 L1200 54 L1200 220 Z"
            />
            <path
              fill="#13241a"
              d="M0 220 L0 156 L154 104 L294 146 L462 72 L628 132 L816 68 L978 124 L1128 92 L1200 114 L1200 220 Z"
            />
          </svg>
          <div className="races-page-hero__inner">
            <div className="races-page-hero__left w-full max-w-[1400px] gap-6">
              <div className="races-page-hero__copy max-w-3xl">
                <span className="inline-flex items-center gap-2 rounded-full border border-white/14 bg-white/[0.09] px-3 py-1 text-[10px] font-bold uppercase tracking-[0.22em] text-white/80 backdrop-blur-md">
                  <Sparkles className="h-3.5 w-3.5 text-[var(--color-energy)]" aria-hidden />
                  Profil athlète
                </span>
                <h1 id="profil-hero-title" className="mt-4">
                  Là où ton corps rencontre le plan nutrition.
                </h1>
                <p className="mt-3 max-w-2xl text-sm text-white/75">
                  Un tableau de bord clair : identité, carburant, hydratation et connexions — le même fil conducteur
                  que tes courses, tes analyses et ton calculateur.
                </p>
              </div>

              <div className="grid w-full gap-4 lg:grid-cols-[minmax(0,1.35fr)_minmax(260px,0.65fr)]">
                <div className="rounded-[28px] border border-white/14 bg-[linear-gradient(155deg,rgba(255,255,255,0.2)_0%,rgba(255,255,255,0.07)_45%,rgba(255,255,255,0.03)_100%)] p-5 shadow-[0_24px_80px_rgba(0,0,0,0.35)] backdrop-blur-xl md:rounded-[32px] md:p-6">
                  <div className="flex flex-col gap-6 md:flex-row md:items-start">
                    <label className="group relative mx-auto shrink-0 cursor-pointer md:mx-0">
                      <div className="relative h-[5.5rem] w-[5.5rem] overflow-hidden rounded-[26px] border-2 border-white/20 bg-white/10 shadow-xl ring-2 ring-[color-mix(in_srgb,var(--color-energy)_45%,transparent)]">
                        {profile.avatarDataUrl ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={profile.avatarDataUrl}
                            alt={displayName}
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <div
                            className="flex h-full w-full items-center justify-center font-display text-3xl font-black text-white"
                            style={{
                              background: `linear-gradient(145deg, ${GREEN_MUTED} 0%, ${GREEN_LIGHT} 55%, color-mix(in srgb, var(--color-energy) 35%, ${GREEN_LIGHT}) 100%)`,
                            }}
                            aria-hidden
                          >
                            {initials(profile.firstName, profile.lastName)}
                          </div>
                        )}
                        <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 transition-opacity group-hover:opacity-100">
                          <span className="text-[11px] font-bold uppercase tracking-wide text-white">Photo</span>
                        </div>
                      </div>
                      <input
                        type="file"
                        accept="image/*"
                        className="sr-only"
                        onChange={(e) => onAvatarFile(e.target.files?.[0] ?? null)}
                      />
                    </label>

                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-end gap-2">
                        <h2 className="font-display text-[clamp(1.65rem,4vw,2.25rem)] font-black leading-none tracking-tight text-white">
                          {displayName}
                        </h2>
                        {seasonTotal > 0 ? (
                          <span className="mb-0.5 rounded-full border border-white/20 bg-black/20 px-2.5 py-0.5 text-[11px] font-bold text-white/85">
                            {seasonTotal} course{seasonTotal > 1 ? "s" : ""}
                          </span>
                        ) : null}
                      </div>
                      <div className="mt-3 flex flex-wrap gap-2">
                        {sportObj ? (
                          <span className="inline-flex items-center gap-1.5 rounded-full border border-white/18 bg-black/15 px-3 py-1 text-xs font-bold text-white">
                            <span aria-hidden>{sportObj.emoji}</span>
                            {sportObj.label}
                          </span>
                        ) : null}
                        {levelObj ? (
                          <span
                            className="inline-flex items-center rounded-full px-3 py-1 text-xs font-black uppercase tracking-wide text-white shadow-sm"
                            style={{ backgroundColor: levelObj.color }}
                          >
                            {levelObj.label}
                          </span>
                        ) : null}
                        {goalObj ? (
                          <span className="inline-flex items-center gap-1.5 rounded-full border border-white/18 bg-white/10 px-3 py-1 text-xs font-semibold text-white/90">
                            <Target className="h-3.5 w-3.5 text-[var(--color-energy)]" aria-hidden />
                            {goalObj.label}
                          </span>
                        ) : null}
                      </div>

                      <div className="mt-5 grid gap-2.5 sm:grid-cols-3">
                        <ProfileHeroMetric
                          label="Complétude"
                          value={`${completion}%`}
                          help="Plus c’est rempli, plus les plans sont précis."
                        />
                        <ProfileHeroMetric
                          label="Sources"
                          value={`${connectedCount}/5`}
                          help="Apps et boîtiers liés au profil."
                        />
                        <ProfileHeroMetric
                          label="Carburant"
                          value={nutritionMode}
                          help="Liquide / solide pendant l’effort."
                        />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col gap-3">
                  <ProfileHeroMetric
                    label="Métrique clé"
                    value={primaryPerformanceStat}
                    help={
                      sportObj
                        ? `Repère pour ${sportObj.theme.toLowerCase()}`
                        : "FTP ou VMA : à renseigner pour affiner les plans."
                    }
                  />
                  <ProfileHeroMetric
                    label="Sudation"
                    value={
                      typeof profile.sweatRateMlPerH === "number"
                        ? `${profile.sweatRateMlPerH} ml/h`
                        : "—"
                    }
                    help={
                      typeof profile.sodiumLossMgPerH === "number"
                        ? `${profile.sodiumLossMgPerH} mg sodium / h`
                        : "Sodium perdu : à calibrer pour l’hydratation."
                    }
                  />
                  <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
                    <Link href="#personal" className="races-page-hero__cta">
                      Éditer le profil
                    </Link>
                    <Link
                      href="/profil/integrations"
                      className="inline-flex flex-1 items-center justify-center rounded-full border border-white/22 bg-[color-mix(in_srgb,var(--color-energy)_22%,rgba(255,255,255,0.08))] px-5 py-3 text-sm font-bold text-white shadow-lg backdrop-blur-md transition hover:bg-[color-mix(in_srgb,var(--color-energy)_32%,rgba(255,255,255,0.12))] sm:flex-none"
                    >
                      <Link2 className="mr-2 h-4 w-4" aria-hidden />
                      Intégrations
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {saveHint ? (
          <div className="relative z-10 px-6 pb-3 pt-4 md:px-10" role="status">
            <div className="rounded-2xl border border-[var(--color-accent)] bg-[var(--color-accent-muted)] px-4 py-3 text-sm font-medium text-[var(--color-text)] shadow-sm">
              {saveHint}
            </div>
          </div>
        ) : null}

        <div className="races-layout">
          <div className="races-layout__main min-w-0">
            <nav className="mb-6 scroll-mt-6" aria-label="Sections du profil">
              <div className="flex gap-1 rounded-2xl border border-[var(--color-border)] bg-[color-mix(in_srgb,var(--color-bg-subtle)_88%,var(--color-bg))] p-1.5 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]">
                {PROFIL_TABS.map((tab) => {
                  const active = profilTab === tab.id;
                  const Icon = tab.icon;
                  return (
                    <button
                      key={tab.id}
                      type="button"
                      onClick={() => setProfilTab(tab.id)}
                      className={[
                        "relative flex min-h-[48px] flex-1 items-center justify-center gap-2 rounded-xl px-2 py-2 text-sm font-bold transition-all sm:min-h-[50px] sm:flex-none sm:px-5",
                        active
                          ? "bg-[var(--color-bg-card)] text-[var(--color-text)] shadow-[0_4px_20px_color-mix(in_srgb,#000_12%,transparent),0_0_0_1px_color-mix(in_srgb,var(--color-energy)_35%,transparent)]"
                          : "text-[var(--color-text-muted)] hover:bg-[color-mix(in_srgb,var(--color-bg-card)_55%,transparent)] hover:text-[var(--color-text)]",
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
                    </button>
                  );
                })}
              </div>
            </nav>

            {profilTab === "overview" ? (
              <>
                <div className="grid gap-8 xl:grid-cols-[minmax(0,1.25fr)_minmax(360px,0.75fr)]">
                  <div>
                    <RacesNextMilestone nextRace={nextRace} />
                  </div>

                  <DashboardTile
                    icon={<ShieldCheck className="h-5 w-5" aria-hidden />}
                    eyebrow="État du profil"
                    title="Vue synthèse"
                    body="Les chiffres qui pilotent ton calculateur : morpho, saison et progression du remplissage."
                  >
                    <div className="grid gap-3 sm:grid-cols-2">
                      <StatPill
                        value={profile.weightKg ?? "—"}
                        unit={typeof profile.weightKg === "number" ? "kg" : undefined}
                        label="Poids"
                      />
                      <StatPill
                        value={profile.heightCm ?? "—"}
                        unit={typeof profile.heightCm === "number" ? "cm" : undefined}
                        label="Taille"
                      />
                      <StatPill value={profile.age ?? "—"} label="Âge" />
                      <StatPill value={seasonTotal} label="Courses" />
                    </div>
                    <div className="mt-4 rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg-subtle)] p-4">
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <p className="text-sm font-semibold text-[var(--color-text)]">Progression du setup</p>
                          <p className="text-xs text-[var(--color-text-muted)]">
                            Plus le profil est complet, plus FuelOS peut personnaliser.
                          </p>
                        </div>
                        <span className="text-lg font-extrabold text-[var(--color-primary)]">{completion}%</span>
                      </div>
                      <div className="mt-3 h-2 overflow-hidden rounded-full bg-[var(--color-border)]">
                        <div
                          className="h-full rounded-full"
                          style={{
                            width: `${completion}%`,
                            background: "linear-gradient(90deg, var(--color-primary) 0%, #6ee7b7 100%)",
                          }}
                        />
                      </div>
                    </div>
                  </DashboardTile>
                </div>

                <div className="grid gap-8 lg:grid-cols-2">
                  <DashboardTile
                    icon={<Medal className="h-5 w-5" aria-hidden />}
                    eyebrow="Identité sportive"
                    title={sportObj ? `${sportObj.label} · ${levelObj?.short ?? "Profil"}` : "Profil athlète"}
                    body={
                      sports.length > 0
                        ? `Sports cochés : ${sports.join(", ")}`
                        : "Indique les disciplines pratiquées pour caler les repères nutrition."
                    }
                  >
                    <div className="flex flex-wrap gap-2">
                      {sports.length > 0 ? (
                        sports.map((sport) => (
                          <span
                            key={sport}
                            className="rounded-full border border-[var(--color-border)] bg-[var(--color-bg-subtle)] px-3 py-1 text-xs font-semibold text-[var(--color-text)]"
                          >
                            {sport}
                          </span>
                        ))
                      ) : (
                        <span className="text-sm text-[var(--color-text-muted)]">Aucun sport secondaire renseigné.</span>
                      )}
                    </div>
                  </DashboardTile>

                  <DashboardTile
                    icon={<Droplets className="h-5 w-5" aria-hidden />}
                    eyebrow="Carburant & eau"
                    title="Tolérance à l’effort"
                    body="Sueur, sodium et mix liquide / solide : la base des longues sorties."
                  >
                    <div className="space-y-3">
                      <div className="flex items-center justify-between rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg-subtle)] px-4 py-3">
                        <span className="text-sm text-[var(--color-text-muted)]">Hydratation</span>
                        <span className="text-sm font-bold text-[var(--color-text)]">
                          {typeof profile.sweatRateMlPerH === "number"
                            ? `${profile.sweatRateMlPerH} ml/h`
                            : "À calibrer"}
                        </span>
                      </div>
                      <div className="flex items-center justify-between rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg-subtle)] px-4 py-3">
                        <span className="text-sm text-[var(--color-text-muted)]">Sodium</span>
                        <span className="text-sm font-bold text-[var(--color-text)]">
                          {typeof profile.sodiumLossMgPerH === "number"
                            ? `${profile.sodiumLossMgPerH} mg/h`
                            : "À calibrer"}
                        </span>
                      </div>
                      <div className="flex items-center justify-between rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg-subtle)] px-4 py-3">
                        <span className="text-sm text-[var(--color-text-muted)]">Texture favorite</span>
                        <span className="text-sm font-bold text-[var(--color-text)]">{nutritionMode}</span>
                      </div>
                    </div>
                  </DashboardTile>

                </div>

                <div
                  className="fuel-races-main-panel overflow-hidden rounded-2xl border border-[color-mix(in_srgb,var(--color-energy)_22%,var(--color-border))] shadow-[0_8px_40px_color-mix(in_srgb,#000_6%,transparent)] md:rounded-[28px]"
                  id="personal"
                >
                  <div className="grid gap-8 border-b border-[var(--color-border-subtle)] bg-[linear-gradient(165deg,color-mix(in_srgb,var(--color-energy)_10%,var(--color-bg-card))_0%,var(--color-bg-card)_55%,var(--color-bg-card)_100%)] p-6 lg:grid-cols-[minmax(0,1.08fr)_minmax(340px,0.92fr)] lg:p-8">
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-[0.22em] text-[var(--color-energy)]">
                        Activité
                      </p>
                      <h2 className="mt-2 font-display text-2xl font-black tracking-tight text-[var(--color-text)] md:text-[1.65rem]">
                        Passe du profil à la ligne de départ.
                      </h2>
                      <p className="mt-2 max-w-2xl text-sm leading-relaxed text-[var(--color-text-muted)]">
                        Raccourcis vers les outils FuelOS : plan nutrition, jour J, charge autour de la course et
                        calendrier — sans quitter ton espace athlète.
                      </p>

                      <div className="mt-6 flex flex-wrap gap-2.5">
                        <Link
                          href="/plan"
                          className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-[var(--color-energy)] to-[color-mix(in_srgb,var(--color-energy)_75%,var(--color-accent))] px-5 py-2.5 text-sm font-bold text-white shadow-md transition hover:brightness-105"
                        >
                          <Zap className="h-4 w-4" aria-hidden />
                          Plan nutrition
                        </Link>
                        <Link
                          href="/race"
                          className="inline-flex items-center gap-2 rounded-full border border-[var(--color-border)] bg-[var(--color-bg-card)] px-4 py-2.5 text-sm font-bold text-[var(--color-text)] shadow-sm transition hover:border-[color-mix(in_srgb,var(--color-energy)_40%,var(--color-border))]"
                        >
                          <Footprints className="h-4 w-4 text-[var(--color-text-muted)]" aria-hidden />
                          Mode course
                        </Link>
                        <Link
                          href="/prep"
                          className="inline-flex items-center gap-2 rounded-full border border-[var(--color-border)] bg-[var(--color-bg-card)] px-4 py-2.5 text-sm font-bold text-[var(--color-text)] shadow-sm transition hover:border-[color-mix(in_srgb,var(--color-energy)_40%,var(--color-border))]"
                        >
                          <Leaf className="h-4 w-4 text-[var(--color-text-muted)]" aria-hidden />
                          Pré / post
                        </Link>
                        <Link
                          href="/races"
                          className="inline-flex items-center gap-2 rounded-full border border-[var(--color-border)] bg-[var(--color-bg-card)] px-4 py-2.5 text-sm font-bold text-[var(--color-text)] shadow-sm transition hover:border-[color-mix(in_srgb,var(--color-energy)_40%,var(--color-border))]"
                        >
                          <CalendarDays className="h-4 w-4 text-[var(--color-text-muted)]" aria-hidden />
                          Mes courses
                        </Link>
                      </div>
                    </div>

                    <div className="grid gap-4 sm:grid-cols-3 lg:grid-cols-1">
                      <div className="rounded-2xl border border-[var(--color-border)] bg-[color-mix(in_srgb,var(--color-bg-subtle)_50%,var(--color-bg-card))] p-4 md:rounded-3xl">
                        <p className="text-[10px] font-black uppercase tracking-[0.18em] text-[var(--color-text-muted)]">
                          Objectif saison
                        </p>
                        <p className="mt-2 font-display text-lg font-black text-[var(--color-text)]">
                          {goalObj?.label ?? "À définir"}
                        </p>
                        <p className="mt-1 text-sm text-[var(--color-text-muted)]">
                          {goalObj?.cue ?? "Choisis un axe pour prioriser les reco nutrition."}
                        </p>
                      </div>
                      <div className="rounded-2xl border border-[var(--color-border)] bg-[color-mix(in_srgb,var(--color-bg-subtle)_50%,var(--color-bg-card))] p-4 md:rounded-3xl">
                        <p className="text-[10px] font-black uppercase tracking-[0.18em] text-[var(--color-text-muted)]">
                          Marques
                        </p>
                        <p className="mt-2 font-display text-lg font-black text-[var(--color-text)]">
                          {brands.length > 0 ? brands.length : "0"}
                        </p>
                        <p className="mt-1 text-sm text-[var(--color-text-muted)]">
                          {brands.length > 0 ? brands.join(", ") : "Sélectionne les marques que tu utilises."}
                        </p>
                      </div>
                      <div className="rounded-2xl border border-[var(--color-border)] bg-[color-mix(in_srgb,var(--color-bg-subtle)_50%,var(--color-bg-card))] p-4 md:rounded-3xl">
                        <p className="text-[10px] font-black uppercase tracking-[0.18em] text-[var(--color-text-muted)]">
                          Prochaine course
                        </p>
                        <p className="mt-2 line-clamp-2 font-display text-lg font-black text-[var(--color-text)]">
                          {nextRace ? nextRace.name : "—"}
                        </p>
                        <p className="mt-1 text-sm text-[var(--color-text-muted)]">
                          {nextRace
                            ? "Contexte pris en compte pour tes plans."
                            : "Ajoute un objectif dans Mes courses."}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <SectionAccordion
                    id="personal"
                    icon={<User className="h-5 w-5" />}
                    title="Identité & morphologie"
                    subtitle="Le socle du profil athlète: informations physiques, sport principal et objectif."
                    open={openSection === "personal"}
                    onToggle={() => toggleSection("personal")}
                    accentColor={GREEN}
                  >
                    <div className="grid gap-4 sm:grid-cols-2">
                      <label className="block text-sm font-semibold text-[var(--color-text)]">
                        Prénom
                        <input
                          className={inputClass()}
                          value={profile.firstName}
                          onChange={(e) => updateProfile({ firstName: e.target.value })}
                        />
                      </label>
                      <label className="block text-sm font-semibold text-[var(--color-text)]">
                        Nom
                        <input
                          className={inputClass()}
                          value={profile.lastName}
                          onChange={(e) => updateProfile({ lastName: e.target.value })}
                        />
                      </label>
                      <label className="block text-sm font-semibold text-[var(--color-text)]">
                        Poids (kg)
                        <input
                          type="number"
                          min={30}
                          max={200}
                          step={0.1}
                          className={inputClass()}
                          value={profile.weightKg ?? ""}
                          onChange={(e) =>
                            updateProfile({ weightKg: e.target.value === "" ? null : Number(e.target.value) })
                          }
                        />
                      </label>
                      <label className="block text-sm font-semibold text-[var(--color-text)]">
                        Taille (cm)
                        <input
                          type="number"
                          min={120}
                          max={230}
                          className={inputClass()}
                          value={profile.heightCm ?? ""}
                          onChange={(e) =>
                            updateProfile({ heightCm: e.target.value === "" ? null : Number(e.target.value) })
                          }
                        />
                      </label>
                      <label className="block text-sm font-semibold text-[var(--color-text)]">
                        Âge
                        <input
                          type="number"
                          min={10}
                          max={99}
                          className={inputClass()}
                          value={profile.age ?? ""}
                          onChange={(e) =>
                            updateProfile({ age: e.target.value === "" ? null : Number(e.target.value) })
                          }
                        />
                      </label>
                      <div>
                        <span className="block text-sm font-semibold text-[var(--color-text)]">Sexe</span>
                        <div className="mt-3 flex flex-wrap gap-3">
                          {(["M", "F", "other"] as const).map((sex) => (
                            <label
                              key={sex}
                              className={`flex cursor-pointer items-center gap-2 rounded-2xl border px-4 py-2.5 text-sm font-medium transition-colors ${
                                profile.sex === sex
                                  ? "border-[var(--color-accent)] bg-[var(--color-accent-muted)] text-[var(--color-text)]"
                                  : "border-[var(--color-border)] text-[var(--color-text-muted)] hover:border-[var(--color-accent)]"
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

                    <div className="mt-6">
                      <span className="text-sm font-semibold text-[var(--color-text)]">Sports pratiqués</span>
                      <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3">
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
                            className={`flex cursor-pointer items-center gap-2 rounded-2xl border px-4 py-3 text-sm font-medium transition-colors ${
                              profile.sports[key]
                                ? "border-[var(--color-accent)] bg-[var(--color-accent-muted)] text-[var(--color-text)]"
                                : "border-[var(--color-border)] text-[var(--color-text-muted)] hover:border-[var(--color-accent)]"
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

                    <div className="mt-6 grid gap-4 sm:grid-cols-2">
                      <div>
                        <span className="block text-sm font-semibold text-[var(--color-text)]">
                          Sport principal
                        </span>
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
                      </div>
                      <div>
                        <span className="block text-sm font-semibold text-[var(--color-text)]">
                          Niveau athlétique
                        </span>
                        <select
                          className={selectClass()}
                          value={profile.athleticLevel}
                          onChange={(e) =>
                            updateProfile({ athleticLevel: e.target.value as FuelOsAthleticLevel })
                          }
                        >
                          {LEVELS.map((level) => (
                            <option key={level.id} value={level.id}>
                              {level.label}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div className="sm:col-span-2">
                        <span className="block text-sm font-semibold text-[var(--color-text)]">
                          Objectif principal
                        </span>
                        <select
                          className={selectClass()}
                          value={profile.mainGoal}
                          onChange={(e) =>
                            updateProfile({ mainGoal: e.target.value as FuelOsUserProfile["mainGoal"] })
                          }
                        >
                          {GOALS.map((goal) => (
                            <option key={goal.id} value={goal.id}>
                              {goal.label}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div className="mt-6">
                      <Button type="button" variant="primary" size="md" onClick={handleSave}>
                        Sauvegarder le profil
                      </Button>
                    </div>
                  </SectionAccordion>

                  <SectionAccordion
                    id="nutrition"
                    icon={<Activity className="h-5 w-5" />}
                    title="Performance & nutrition"
                    subtitle="Les réglages qui rendent les plans plus pertinents pour l'effort long."
                    open={openSection === "nutrition"}
                    onToggle={() => toggleSection("nutrition")}
                    accentColor="#1D4ED8"
                  >
                    <div className="grid gap-4 lg:grid-cols-[minmax(0,1.15fr)_minmax(280px,0.85fr)]">
                      <div>
                        <div className="mb-3 flex items-center gap-2">
                          <Gauge className="h-4 w-4 text-[var(--color-text-muted)]" />
                          <span className="text-sm font-bold text-[var(--color-text)]">Données de performance</span>
                        </div>
                        <div className="grid gap-4 sm:grid-cols-2">
                          <label className="block text-sm font-semibold text-[var(--color-text)]">
                            FTP (W)
                            <input
                              type="number"
                              min={50}
                              max={650}
                              className={inputClass()}
                              value={profile.ftpWatts ?? ""}
                              placeholder="ex. 240"
                              onChange={(e) =>
                                updateProfile({ ftpWatts: e.target.value === "" ? null : Number(e.target.value) })
                              }
                            />
                          </label>
                          <label className="block text-sm font-semibold text-[var(--color-text)]">
                            VMA (km/h)
                            <input
                              type="number"
                              min={8}
                              max={25}
                              step={0.1}
                              className={inputClass()}
                              value={profile.runnerVmaKmh ?? ""}
                              placeholder="ex. 16.5"
                              onChange={(e) =>
                                updateProfile({
                                  runnerVmaKmh: e.target.value === "" ? null : Number(e.target.value),
                                })
                              }
                            />
                          </label>
                          <label className="block text-sm font-semibold text-[var(--color-text)] sm:col-span-2">
                            Allure seuil (min/km)
                            <input
                              type="number"
                              min={2.6}
                              max={12}
                              step={0.1}
                              className={inputClass()}
                              value={profile.runnerThresholdPaceMinPerKm ?? ""}
                              placeholder="ex. 4.5 pour 4:30 / km"
                              onChange={(e) =>
                                updateProfile({
                                  runnerThresholdPaceMinPerKm:
                                    e.target.value === "" ? null : Number(e.target.value),
                                })
                              }
                            />
                          </label>
                        </div>
                      </div>

                      <div className="rounded-3xl border border-[var(--color-border)] bg-[var(--color-bg-subtle)] p-4">
                        <p className="text-[10px] font-black uppercase tracking-[0.18em] text-[var(--color-text-muted)]">
                          Repère effort
                        </p>
                        <p className="mt-2 font-display text-lg font-black text-[var(--color-text)]">
                          {primaryPerformanceStat}
                        </p>
                        <p className="mt-2 text-sm text-[var(--color-text-muted)]">
                          FTP ou VMA : une seule donnée forte suffit à ancrer les recommandations.
                        </p>
                      </div>
                    </div>

                    <div className="mt-6 border-t border-[var(--color-border-subtle)] pt-5">
                      <div className="mb-3 flex items-center gap-2">
                        <Droplets className="h-4 w-4 text-[var(--color-text-muted)]" />
                        <span className="text-sm font-bold text-[var(--color-text)]">Hydratation & sudation</span>
                      </div>
                      <div className="grid gap-4 sm:grid-cols-2">
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

                    <div className="mt-6 border-t border-[var(--color-border-subtle)] pt-5">
                      <span className="text-sm font-bold text-[var(--color-text)]">Tolérance digestive</span>
                      <div className="mt-3 flex justify-between text-[10px] font-bold uppercase tracking-wider text-[var(--color-text-muted)]">
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

                    <div className="mt-6 border-t border-[var(--color-border-subtle)] pt-5">
                      <span className="text-sm font-bold text-[var(--color-text)]">Régimes & restrictions</span>
                      <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3">
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

                    <label className="mt-6 block text-sm font-semibold text-[var(--color-text)]">
                      Allergènes (texte libre)
                      <textarea
                        rows={3}
                        className="mt-1.5 w-full rounded-2xl border border-[var(--color-border)] bg-[color-mix(in_srgb,var(--color-bg-card)_74%,var(--color-bg-elevated))] px-4 py-3 text-sm text-[var(--color-text)] outline-none transition focus:border-[var(--color-accent)]"
                        value={profile.allergenNotes}
                        onChange={(e) => updateProfile({ allergenNotes: e.target.value })}
                        placeholder="Ex. fruits à coque, arachides…"
                      />
                    </label>

                    <div className="mt-6">
                      <span className="text-sm font-semibold text-[var(--color-text)]">Marques favorites</span>
                      <div className="mt-3 flex flex-wrap gap-4">
                        {(
                          [
                            ["brandMaurten", "Maurten"],
                            ["brandSis", "SiS"],
                            ["brandTailwind", "Tailwind"],
                            ["brandNaak", "Näak"],
                            ["brandOther", "Autres"],
                          ] as const
                        ).map(([key, label]) => (
                          <label key={key} className="flex cursor-pointer items-center gap-2 text-sm">
                            <input
                              type="checkbox"
                              checked={profile[key]}
                              onChange={(e) => updateProfile({ [key]: e.target.checked })}
                            />
                            {label}
                          </label>
                        ))}
                      </div>
                    </div>

                    <div className="mt-8">
                      <Button type="button" variant="primary" size="md" onClick={handleSave}>
                        Enregistrer dans le calculateur
                      </Button>
                    </div>
                  </SectionAccordion>

                  <SectionAccordion
                    id="integrations"
                    icon={<Settings className="h-5 w-5" />}
                    title="Connexions"
                    subtitle="Active ou coupe chaque source : c’est indicatif pour visualiser ton écosystème."
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
                                    className="rounded-full px-2.5 py-1 text-[11px] font-bold uppercase tracking-[0.16em]"
                                    style={{
                                      color: connected ? integration.color : "var(--color-text-muted)",
                                      backgroundColor: connected ? `${integration.color}18` : "var(--color-bg-subtle)",
                                    }}
                                  >
                                    {connected ? "Connecté" : "Déconnecté"}
                                  </span>
                                </div>
                                <p className="mt-1 text-sm text-[var(--color-text-muted)]">
                                  {integration.description}
                                </p>
                              </div>
                            </div>

                            <div className="flex items-center gap-4">
                              <div className="text-right">
                                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--color-text-muted)]">
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
              </>
            ) : null}

            {profilTab === "memory" ? (
              <div className="min-w-0 pb-2">
                <ProfileMemoryTabContent />
              </div>
            ) : null}

            {profilTab === "insights" ? (
              <div className="min-w-0 pb-2">
                <ProfileAnalysesTabContent />
              </div>
            ) : null}
          </div>
        </div>
      </main>
    </>
  );
}
