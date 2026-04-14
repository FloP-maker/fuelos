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
import { RacesTodayCard } from "../components/races/RacesTodayCard";
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
    <div className="rounded-3xl border border-white/12 bg-white/8 px-4 py-3 backdrop-blur-md">
      <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-white/58">{label}</p>
      <p className="mt-2 text-xl font-extrabold tracking-tight text-white">{value}</p>
      <p className="mt-1 text-xs text-white/62">{help}</p>
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
    <article className="rounded-[28px] border border-[color-mix(in_srgb,var(--color-primary)_14%,var(--color-border))] bg-[linear-gradient(165deg,color-mix(in_srgb,var(--color-bg-card)_84%,white)_0%,var(--color-bg-card)_62%,color-mix(in_srgb,var(--color-primary)_6%,var(--color-bg-card))_100%)] p-5 shadow-[0_18px_45px_color-mix(in_srgb,#06110a_10%,transparent)]">
      <div className="flex items-start gap-3">
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[color-mix(in_srgb,var(--color-primary)_14%,transparent)] text-[var(--color-primary)]">
          {icon}
        </span>
        <div className="min-w-0">
          <p className="races-section-eyebrow">{eyebrow}</p>
          <h3 className="mt-1 font-display text-lg font-extrabold text-[var(--color-text)]">{title}</h3>
          <p className="mt-1 text-sm leading-relaxed text-[var(--color-text-muted)]">{body}</p>
        </div>
      </div>
      {children ? <div className="mt-5">{children}</div> : null}
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
    <div className="rounded-2xl border border-[var(--color-border)] bg-[color-mix(in_srgb,var(--color-bg-card)_70%,var(--color-bg-elevated))] px-4 py-4">
      <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-[var(--color-text-muted)]">{label}</p>
      <div className="mt-2 flex items-end gap-1">
        <span className="font-display text-2xl font-extrabold tracking-tight text-[var(--color-text)]">{value}</span>
        {unit ? <span className="pb-0.5 text-xs font-semibold text-[var(--color-text-muted)]">{unit}</span> : null}
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
  return (
    <section
      className="overflow-hidden rounded-[30px] border border-[color-mix(in_srgb,var(--color-primary)_12%,var(--color-border))] bg-[linear-gradient(180deg,color-mix(in_srgb,var(--color-bg-card)_88%,white)_0%,var(--color-bg-card)_100%)] shadow-[0_16px_40px_color-mix(in_srgb,#021408_8%,transparent)]"
      aria-labelledby={`section-${id}-title`}
    >
      <button
        type="button"
        className="flex w-full items-center justify-between gap-4 px-5 py-5 text-left md:px-6"
        onClick={onToggle}
        aria-expanded={open}
        aria-controls={`section-${id}-body`}
        id={`section-${id}-title`}
      >
        <div className="flex min-w-0 items-center gap-4">
          <span
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl text-white shadow-sm"
            style={{
              background: `linear-gradient(135deg, ${accentColor ?? GREEN} 0%, color-mix(in srgb, ${
                accentColor ?? GREEN
              } 60%, white) 100%)`,
            }}
          >
            {icon}
          </span>
          <div className="min-w-0">
            <p className="text-base font-extrabold text-[var(--color-text)]">{title}</p>
            <p className="mt-1 text-sm text-[var(--color-text-muted)]">{subtitle}</p>
          </div>
        </div>
        <ChevronDown
          className="h-5 w-5 shrink-0 text-[var(--color-text-muted)] transition-transform duration-200"
          style={{ transform: open ? "rotate(180deg)" : "rotate(0deg)" }}
          aria-hidden
        />
      </button>

      {open ? (
        <div
          id={`section-${id}-body`}
          className="border-t border-[color-mix(in_srgb,var(--color-primary)_8%,var(--color-border))] px-5 py-5 md:px-6"
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
      <main className="fuel-main races-page">
        <section className="races-page-hero" aria-labelledby="profil-hero-title">
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
            <div className="races-page-hero__left gap-5">
              <div className="races-page-hero__copy max-w-3xl">
                <span className="inline-flex items-center gap-2 rounded-full border border-white/12 bg-white/8 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-white/78 backdrop-blur-md">
                  <Sparkles className="h-3.5 w-3.5" aria-hidden />
                  Endurance nutrition profile
                </span>
                <h1 id="profil-hero-title" className="mt-4">
                  Un profil athlète qui alimente chaque plan, chaque sortie, chaque debrief.
                </h1>
                <p className="mt-3 max-w-2xl text-sm text-white/72">
                  Même langage visuel que le mode course, avec une lecture plus premium façon app
                  d&apos;endurance: identité, métriques de carburant, connexions et préférences
                  nutritionnelles au même endroit.
                </p>
              </div>

              <div className="grid w-full gap-3 md:grid-cols-[minmax(0,1.45fr)_minmax(280px,0.95fr)]">
                <div className="rounded-[32px] border border-white/12 bg-[linear-gradient(150deg,rgba(255,255,255,0.18)_0%,rgba(255,255,255,0.08)_58%,rgba(255,255,255,0.04)_100%)] p-5 shadow-[0_18px_60px_rgba(2,6,4,0.28)] backdrop-blur-xl">
                  <div className="flex flex-col gap-5 md:flex-row md:items-center">
                    <label className="group relative mx-auto block cursor-pointer md:mx-0">
                      <div className="relative h-24 w-24 overflow-hidden rounded-[28px] border border-white/16 bg-white/10 shadow-lg">
                        {profile.avatarDataUrl ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={profile.avatarDataUrl}
                            alt={displayName}
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <div
                            className="flex h-full w-full items-center justify-center text-2xl font-extrabold text-white"
                            style={{
                              background: `linear-gradient(135deg, ${GREEN_MUTED} 0%, ${GREEN_LIGHT} 100%)`,
                            }}
                            aria-hidden
                          >
                            {initials(profile.firstName, profile.lastName)}
                          </div>
                        )}
                        <div className="absolute inset-0 flex items-center justify-center bg-black/35 opacity-0 transition-opacity group-hover:opacity-100">
                          <span className="text-xs font-semibold text-white">Photo</span>
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
                      <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-white/56">
                        Athlete cockpit
                      </p>
                      <h2 className="mt-2 text-3xl font-extrabold tracking-tight text-white">
                        {displayName}
                      </h2>
                      <div className="mt-3 flex flex-wrap gap-2">
                        {sportObj ? (
                          <span className="inline-flex items-center gap-1.5 rounded-full border border-white/14 bg-white/8 px-3 py-1 text-xs font-semibold text-white/86">
                            <span aria-hidden>{sportObj.emoji}</span>
                            {sportObj.label}
                          </span>
                        ) : null}
                        {levelObj ? (
                          <span
                            className="inline-flex items-center rounded-full px-3 py-1 text-xs font-bold text-white"
                            style={{ backgroundColor: levelObj.color }}
                          >
                            {levelObj.label}
                          </span>
                        ) : null}
                        {goalObj ? (
                          <span className="inline-flex items-center gap-1.5 rounded-full border border-white/14 bg-white/8 px-3 py-1 text-xs font-semibold text-white/78">
                            <Target className="h-3.5 w-3.5" aria-hidden />
                            {goalObj.label}
                          </span>
                        ) : null}
                      </div>
                      <div className="mt-4 grid gap-2 sm:grid-cols-3">
                        <ProfileHeroMetric
                          label="Complétude"
                          value={`${completion}%`}
                          help="Prêt pour des recommandations plus fines"
                        />
                        <ProfileHeroMetric
                          label="Connecté"
                          value={`${connectedCount}/5`}
                          help="Sources de données d&apos;entraînement"
                        />
                        <ProfileHeroMetric
                          label="Mode nutrition"
                          value={nutritionMode}
                          help="Tolérance carburant pendant l&apos;effort"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="grid gap-3 sm:grid-cols-3 md:grid-cols-1">
                  <ProfileHeroMetric
                    label="Métrique clé"
                    value={primaryPerformanceStat}
                    help={sportObj ? `Repère principal pour ${sportObj.theme.toLowerCase()}` : "Ajoute une donnée de performance"}
                  />
                  <ProfileHeroMetric
                    label="Hydratation"
                    value={
                      typeof profile.sweatRateMlPerH === "number"
                        ? `${profile.sweatRateMlPerH} ml/h`
                        : "Non renseignée"
                    }
                    help={
                      typeof profile.sodiumLossMgPerH === "number"
                        ? `${profile.sodiumLossMgPerH} mg sodium/h`
                        : "Ajoute ta perte sodée"
                    }
                  />
                  <div className="flex flex-wrap gap-2">
                    <Link href="#personal" className="races-page-hero__cta">
                      Modifier mon profil
                    </Link>
                    <Link
                      href="/profil/integrations"
                      className="inline-flex items-center justify-center rounded-full border border-white/16 bg-white/8 px-5 py-3 text-sm font-semibold text-white backdrop-blur-md transition hover:bg-white/14"
                    >
                      <Link2 className="mr-2 h-4 w-4" aria-hidden />
                      Connexions
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {saveHint ? (
          <div className="relative z-10 mx-auto max-w-[1400px] px-6 pb-2 pt-3 md:px-6" role="status">
            <div className="rounded-2xl border border-[var(--color-accent)] bg-[var(--color-accent-muted)] px-4 py-3 text-sm font-medium text-[var(--color-text)] shadow-sm">
              {saveHint}
            </div>
          </div>
        ) : null}

        <div className="races-layout">
          <div className="races-layout__main min-w-0">
            <nav className="fuel-races-main-panel mb-4 overflow-hidden" aria-label="Sections du profil">
              <div className="flex border-b border-[var(--color-border)] px-1 sm:px-2">
                {PROFIL_TABS.map((tab) => {
                  const active = profilTab === tab.id;
                  const Icon = tab.icon;
                  return (
                    <button
                      key={tab.id}
                      type="button"
                      onClick={() => setProfilTab(tab.id)}
                      className={[
                        "relative -mb-px flex min-h-[52px] flex-1 items-center justify-center gap-2 border-b-2 px-2 py-2.5 text-sm font-semibold transition-colors sm:flex-none sm:px-5",
                        active
                          ? "border-[var(--color-primary)] text-[var(--color-text)]"
                          : "border-transparent text-[var(--color-text-muted)] hover:text-[var(--color-text)]",
                      ].join(" ")}
                      aria-current={active ? "page" : undefined}
                    >
                      <Icon className="h-4 w-4 shrink-0 opacity-80" aria-hidden />
                      <span className="hidden sm:inline">{tab.label}</span>
                      <span className="sm:hidden">{tab.short}</span>
                    </button>
                  );
                })}
              </div>
            </nav>

            {profilTab === "overview" ? (
              <>
                <div className="grid gap-4 xl:grid-cols-[minmax(0,1.2fr)_minmax(320px,0.8fr)]">
                  <div className="space-y-4">
                    <RacesNextMilestone nextRace={nextRace} />
                    <RacesTodayCard nextRace={nextRace} />
                  </div>

                  <DashboardTile
                    icon={<ShieldCheck className="h-5 w-5" aria-hidden />}
                    eyebrow="Fuel state"
                    title="Résumé du profil"
                    body="Un cockpit clair pour savoir ce qui manque avant de fiabiliser les plans et recommandations."
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

                <div className="grid gap-4 lg:grid-cols-3">
                  <DashboardTile
                    icon={<Medal className="h-5 w-5" aria-hidden />}
                    eyebrow="Identité sportive"
                    title={sportObj ? `${sportObj.label} · ${levelObj?.short ?? "Profil"}` : "Profil athlète"}
                    body={
                      sports.length > 0
                        ? `Sports actifs: ${sports.join(", ")}`
                        : "Sélectionne tes sports pour adapter les repères nutritionnels."
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
                    eyebrow="Fueling"
                    title="Profil de tolérance"
                    body="Hydratation, sodium et texture d&apos;apport pour préparer les courses longues."
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

                  <DashboardTile
                    icon={<Link2 className="h-5 w-5" aria-hidden />}
                    eyebrow="Connectivité"
                    title="Écosystème d&apos;entraînement"
                    body="Une lecture inspirée des apps d&apos;endurance pour visualiser ce qui alimente ton profil."
                  >
                    <div className="space-y-2">
                      {INTEGRATIONS.slice(0, 3).map((integration) => {
                        const connected = !!profile.integrationConnected[integration.id];
                        return (
                          <div
                            key={integration.id}
                            className="flex items-center justify-between rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg-subtle)] px-4 py-3"
                          >
                            <div className="flex items-center gap-3">
                              <span className="text-base" aria-hidden>
                                {integration.logo}
                              </span>
                              <div>
                                <p className="text-sm font-semibold text-[var(--color-text)]">{integration.name}</p>
                                <p className="text-xs text-[var(--color-text-muted)]">{integration.description}</p>
                              </div>
                            </div>
                            <span
                              className="rounded-full px-2.5 py-1 text-[11px] font-bold uppercase tracking-[0.16em]"
                              style={{
                                color: connected ? integration.color : "var(--color-text-muted)",
                                backgroundColor: connected ? `${integration.color}18` : "var(--color-bg-card)",
                              }}
                            >
                              {connected ? "Live" : "Off"}
                            </span>
                          </div>
                        );
                      })}
                      <Link
                        href="/profil/integrations"
                        className="inline-flex items-center text-sm font-semibold text-[var(--color-primary)]"
                      >
                        Gérer toutes les connexions
                      </Link>
                    </div>
                  </DashboardTile>
                </div>

                <div
                  className="fuel-races-main-panel overflow-hidden rounded-[30px] border border-[color-mix(in_srgb,var(--color-primary)_12%,var(--color-border))]"
                  id="personal"
                >
                  <div className="grid gap-4 border-b border-[color-mix(in_srgb,var(--color-primary)_8%,var(--color-border))] bg-[linear-gradient(160deg,color-mix(in_srgb,var(--color-primary)_9%,var(--color-bg-card))_0%,var(--color-bg-card)_70%)] p-5 lg:grid-cols-[minmax(0,1.05fr)_minmax(320px,0.95fr)] lg:p-6">
                    <div>
                      <p className="races-section-eyebrow">Overview</p>
                      <h2 className="mt-2 font-display text-2xl font-extrabold tracking-tight text-[var(--color-text)]">
                        Profil athlète, prêt pour la personnalisation.
                      </h2>
                      <p className="mt-2 max-w-2xl text-sm leading-relaxed text-[var(--color-text-muted)]">
                        Le look reprend les codes du mode course, mais avec une lecture plus calme
                        et analytique, pensée comme une page profil d&apos;application de nutrition
                        sportive.
                      </p>

                      <div className="mt-5 flex flex-wrap gap-3">
                        <Link
                          href="/plan"
                          className="inline-flex items-center gap-2 rounded-2xl bg-[var(--color-primary)] px-4 py-2.5 text-sm font-semibold text-white shadow-sm"
                        >
                          <Zap className="h-4 w-4" aria-hidden />
                          Plan nutrition
                        </Link>
                        <Link
                          href="/race"
                          className="inline-flex items-center gap-2 rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg-card)] px-4 py-2.5 text-sm font-semibold text-[var(--color-text)]"
                        >
                          <Footprints className="h-4 w-4 opacity-70" aria-hidden />
                          Mode course
                        </Link>
                        <Link
                          href="/prep"
                          className="inline-flex items-center gap-2 rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg-card)] px-4 py-2.5 text-sm font-semibold text-[var(--color-text)]"
                        >
                          <Leaf className="h-4 w-4 opacity-70" aria-hidden />
                          Pré / Post
                        </Link>
                        <Link
                          href="/races"
                          className="inline-flex items-center gap-2 rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg-card)] px-4 py-2.5 text-sm font-semibold text-[var(--color-text)]"
                        >
                          <CalendarDays className="h-4 w-4 opacity-70" aria-hidden />
                          Calendrier
                        </Link>
                      </div>
                    </div>

                    <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-1">
                      <div className="rounded-3xl border border-[var(--color-border)] bg-[var(--color-bg-card)] p-4">
                        <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-[var(--color-text-muted)]">
                          Objectif saison
                        </p>
                        <p className="mt-2 text-lg font-extrabold text-[var(--color-text)]">
                          {goalObj?.label ?? "À définir"}
                        </p>
                        <p className="mt-1 text-sm text-[var(--color-text-muted)]">
                          {goalObj?.cue ?? "Clarifie ton axe principal pour mieux hiérarchiser les recommandations."}
                        </p>
                      </div>
                      <div className="rounded-3xl border border-[var(--color-border)] bg-[var(--color-bg-card)] p-4">
                        <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-[var(--color-text-muted)]">
                          Marques favorites
                        </p>
                        <p className="mt-2 text-lg font-extrabold text-[var(--color-text)]">
                          {brands.length > 0 ? brands.length : "0"}
                        </p>
                        <p className="mt-1 text-sm text-[var(--color-text-muted)]">
                          {brands.length > 0 ? brands.join(", ") : "Ajoute tes préférences produits."}
                        </p>
                      </div>
                      <div className="rounded-3xl border border-[var(--color-border)] bg-[var(--color-bg-card)] p-4">
                        <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-[var(--color-text-muted)]">
                          Prochaine course
                        </p>
                        <p className="mt-2 text-lg font-extrabold text-[var(--color-text)]">
                          {nextRace ? nextRace.name : "Aucune programmée"}
                        </p>
                        <p className="mt-1 text-sm text-[var(--color-text-muted)]">
                          {nextRace ? "FuelOS pourra te proposer un plan plus contextuel." : "Ajoute une course pour contextualiser le profil."}
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
                        <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-[var(--color-text-muted)]">
                          Readiness
                        </p>
                        <p className="mt-2 text-lg font-extrabold text-[var(--color-text)]">{primaryPerformanceStat}</p>
                        <p className="mt-2 text-sm text-[var(--color-text-muted)]">
                          Une seule métrique forte suffit déjà à rendre les recommandations plus crédibles.
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
                          Sweat rate (ml/h)
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
                    subtitle="Un rendu plus proche des apps d'endurance pour visualiser tes sources actives."
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
                                  Sync
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
