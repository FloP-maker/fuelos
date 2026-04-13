Après analyse complète du code existant (`profil/page.tsx`) et de l'esthétique de la page `/races`, voici un **nouveau `profil/page.tsx`** complet et optimisé — style Strava-like, sombre, cartes épurées, hero montagne, avatar mis en valeur, stats en évidence :

---

## Ce qui change (et pourquoi)

**Problèmes actuels :**
- La sidebar affiche une carte "hero" (`races-next-milestone-card`) qui n'a pas de sens dans un contexte profil
- L'accordion est fonctionnel mais visuellement très plat (pas de gradient, pas d'icône stylisée)
- Les stats (poids, taille, âge, courses) sont cachées dans la sidebar sous forme de mini-tableau sans relief
- Les "Actions rapides" et "Raccourcis" sont redondants
- L'avatar est trop petit et peu mis en valeur
- La section intégrations ressemble à une liste de settings basique

**Direction : Strava-like endurance profile**
- **Hero card** au-dessus du fold avec avatar large, nom, badges sport/niveau, stats horizontales
- **Sidebar** transformée en "Activity Ring" + "Next Race" + liens CTA propres
- **Accordéons** avec design card cohérent (gradient subtil sur header actif, icône SVG, divider vert accent)
- **Sections** visuellement séparées avec un pill colored header

---

## Code complet

```tsx
"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Calendar,
  CalendarDays,
  ChevronDown,
  Footprints,
  Leaf,
  Settings,
  Trophy,
  User,
  Zap,
  Activity,
  Droplets,
  Gauge,
} from "lucide-react";
import { Header } from "../components/Header";
import { Button } from "../components/Button";
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

/* ─── constants ─────────────────────────────────────────── */

const MAIN_SPORTS: { id: FuelOsMainSport; label: string; emoji: string }[] = [
  { id: "trail", label: "Trail", emoji: "🏔️" },
  { id: "velo", label: "Vélo", emoji: "🚴" },
  { id: "triathlon", label: "Triathlon", emoji: "🏊" },
  { id: "running", label: "Running", emoji: "🏃" },
];

const LEVELS: { id: FuelOsAthleticLevel; label: string; color: string }[] = [
  { id: "debutant", label: "Débutant", color: "#6B7280" },
  { id: "intermediaire", label: "Intermédiaire", color: "#2563EB" },
  { id: "elite", label: "Élite", color: "#D97706" },
];

const GOALS: { id: FuelOsUserProfile["mainGoal"]; label: string }[] = [
  { id: "performance", label: "Performance" },
  { id: "endurance", label: "Endurance" },
  { id: "weight_loss", label: "Perte de poids" },
  { id: "health", label: "Santé" },
];

const INTEGRATIONS: {
  id: FuelOsIntegrationId;
  name: string;
  logo: string;
  color: string;
}[] = [
  { id: "strava", name: "Strava", logo: "🟠", color: "#FC4C02" },
  { id: "garmin", name: "Garmin Connect", logo: "🔵", color: "#006EFF" },
  { id: "wahoo", name: "Wahoo", logo: "🔴", color: "#E11D48" },
  { id: "apple_health", name: "Apple Health", logo: "❤️", color: "#FF375F" },
  { id: "trainingpeaks", name: "TrainingPeaks", logo: "📈", color: "#4F46E5" },
];

const GREEN = "#1B4332";
const GREEN_LIGHT = "#4B7F52";
const GREEN_MUTED = "#22543D";

/* ─── helpers ───────────────────────────────────────────── */

function initials(first: string, last: string): string {
  return `${first.trim().charAt(0)}${last.trim().charAt(0)}`.toUpperCase() || "?";
}

function inputClass() {
  return "mt-1.5 w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-elevated)] px-3.5 py-2.5 text-sm text-[var(--color-text)] outline-none transition focus:border-[var(--color-accent)] focus:ring-2 focus:ring-[var(--color-accent)]/30";
}

function selectClass() {
  return "mt-1.5 w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-elevated)] px-3.5 py-2.5 text-sm text-[var(--color-text)] outline-none transition focus:border-[var(--color-accent)] focus:ring-2 focus:ring-[var(--color-accent)]/30";
}

/* ─── StatPill ───────────────────────────────────────────── */

function StatPill({
  value,
  unit,
  label,
  icon,
}: {
  value: number | string;
  unit?: string;
  label: string;
  icon?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-center gap-0.5 px-4 py-3">
      {icon && (
        <span className="mb-0.5 opacity-50">{icon}</span>
      )}
      <span className="font-display text-2xl font-extrabold tracking-tight text-[var(--color-text)]">
        {value}
        {unit && (
          <span className="ml-0.5 text-sm font-semibold text-[var(--color-text-muted)]">
            {unit}
          </span>
        )}
      </span>
      <span className="text-[10px] font-bold uppercase tracking-[0.12em] text-[var(--color-text-muted)]">
        {label}
      </span>
    </div>
  );
}

/* ─── SectionAccordion ──────────────────────────────────── */

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
  icon: React.ReactNode;
  title: string;
  subtitle: string;
  open: boolean;
  onToggle: () => void;
  children: React.ReactNode;
  accentColor?: string;
}) {
  return (
    <section
      className="mb-3 overflow-hidden rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg-card)] shadow-sm transition-shadow hover:shadow-md"
      aria-labelledby={`section-${id}-title`}
    >
      <button
        type="button"
        className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left md:px-6"
        onClick={onToggle}
        aria-expanded={open}
        aria-controls={`section-${id}-body`}
        id={`section-${id}-title`}
      >
        <div className="flex min-w-0 items-center gap-3">
          <span
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-white"
            style={{ backgroundColor: accentColor ?? GREEN }}
          >
            {icon}
          </span>
          <div className="min-w-0">
            <p className="font-display text-sm font-bold text-[var(--color-text)]">
              {title}
            </p>
            <p className="truncate text-xs text-[var(--color-text-muted)]">
              {subtitle}
            </p>
          </div>
        </div>
        <ChevronDown
          className="h-4 w-4 shrink-0 text-[var(--color-text-muted)] transition-transform duration-200"
          style={{ transform: open ? "rotate(180deg)" : "rotate(0deg)" }}
          aria-hidden
        />
      </button>

      {open && (
        <div
          id={`section-${id}-body`}
          className="border-t border-[var(--color-border)] px-5 py-5 md:px-6"
        >
          {children}
        </div>
      )}
    </section>
  );
}

/* ─── ToggleSwitch ──────────────────────────────────────── */

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
      className="relative shrink-0 inline-flex h-6 w-11 items-center rounded-full border transition-colors"
      style={
        checked
          ? { borderColor: accentColor ?? GREEN, backgroundColor: (accentColor ?? GREEN) + "33" }
          : { borderColor: "var(--color-border)", backgroundColor: "var(--color-bg-card)" }
      }
    >
      <span
        className="inline-block h-4 w-4 rounded-full bg-white shadow transition-transform"
        style={{ transform: checked ? "translateX(1.375rem)" : "translateX(0.25rem)" }}
      />
    </button>
  );
}

/* ─── Page ──────────────────────────────────────────────── */

export default function ProfilPage() {
  usePageTitle("Profil");
  const { profile, updateProfile, syncToAthleteCalculator } = useProfile();
  const [races, setRaces] = useState<RaceEntry[]>(() => loadRaces());
  const [saveHint, setSaveHint] = useState<string | null>(null);
  const [openSection, setOpenSection] = useState<string | null>("personal");

  const toggleSection = (id: string) =>
    setOpenSection((prev) => (prev === id ? null : id));

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

  const { upcoming, past } = useMemo(
    () => partitionRacesByUpcoming(races),
    [races]
  );
  const nextRace = upcoming[0] ?? null;
  const seasonTotal = past.length + upcoming.length;

  const onAvatarFile = (file: File | null) => {
    if (!file || !file.type.startsWith("image/")) return;
    if (file.size > 900_000) {
      setSaveHint("Image trop lourde (max. ~900 Ko).");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const r = reader.result;
      if (typeof r === "string") updateProfile({ avatarDataUrl: r });
    };
    reader.readAsDataURL(file);
  };

  const handleSave = () => {
    syncToAthleteCalculator();
    setSaveHint("Profil enregistré ✓");
    window.setTimeout(() => setSaveHint(null), 4000);
  };

  const displayName =
    [profile.firstName, profile.lastName].filter(Boolean).join(" ").trim() ||
    "Athlète FuelOS";

  const sportObj = MAIN_SPORTS.find((s) => s.id === profile.mainSport);
  const levelObj = LEVELS.find((l) => l.id === profile.athleticLevel);
  const goalLabel = GOALS.find((g) => g.id === profile.mainGoal)?.label ?? "";

  const connectedCount = Object.values(profile.integrationConnected).filter(Boolean).length;

  return (
    <>
      <Header />
      <main className="fuel-main races-page">

        {/* ── HERO ─────────────────────────────────────── */}
        <section className="races-page-hero" aria-labelledby="profil-hero-title">
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
                <h1 id="profil-hero-title">Mon profil</h1>
                <p>Athlète · Nutrition personnalisée · Endurance</p>
              </div>
              <div className="flex w-full max-w-xl flex-col gap-2 sm:flex-row sm:items-center sm:gap-3">
                <Link href="#personal" className="races-page-hero__cta">
                  Modifier mes infos
                </Link>
                <Link
                  href="/races?addRace=1"
                  className="inline-flex items-center justify-center rounded-full border border-white/25 bg-white/10 px-5 py-3 text-sm font-semibold text-white backdrop-blur-sm transition hover:bg-white/20"
                >
                  <Trophy className="mr-2 h-4 w-4" aria-hidden />
                  Ajouter une course
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* ── TOAST ────────────────────────────────────── */}
        {saveHint && (
          <div
            className="relative z-10 mx-auto max-w-[1400px] px-6 pb-2 pt-3 md:px-6"
            role="status"
          >
            <div className="rounded-xl border border-[var(--color-accent)] bg-[var(--color-accent-muted)] px-4 py-3 text-sm font-medium text-[var(--color-text)] shadow-sm">
              {saveHint}
            </div>
          </div>
        )}

        {/* ── LAYOUT ───────────────────────────────────── */}
        <div className="races-layout">

          {/* ── MAIN ─────────────────────────────────── */}
          <div className="races-layout__main min-w-0">

            {/* ── ATHLETE IDENTITY CARD ──────────────── */}
            <div
              className="fuel-races-main-panel mb-4 overflow-hidden"
              id="personal"
            >
              {/* Gradient top bar */}
              <div
                className="h-1.5 w-full"
                style={{
                  background: `linear-gradient(90deg, ${GREEN} 0%, ${GREEN_LIGHT} 100%)`,
                }}
              />

              <div className="flex flex-col gap-5 p-5 sm:flex-row sm:items-start sm:gap-6 md:p-6">
                {/* Avatar */}
                <label className="group relative mx-auto shrink-0 cursor-pointer sm:mx-0">
                  <div className="relative h-24 w-24">
                    {profile.avatarDataUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={profile.avatarDataUrl}
                        alt={displayName}
                        className="h-24 w-24 rounded-2xl object-cover ring-2 ring-[var(--color-border)]"
                      />
                    ) : (
                      <div
                        className="flex h-24 w-24 items-center justify-center rounded-2xl text-2xl font-extrabold text-white ring-2 ring-white/10"
                        style={{ background: `linear-gradient(135deg, ${GREEN_MUTED}, ${GREEN_LIGHT})` }}
                        aria-hidden
                      >
                        {initials(profile.firstName, profile.lastName)}
                      </div>
                    )}
                    {/* Camera overlay */}
                    <div className="absolute inset-0 flex items-center justify-center rounded-2xl bg-black/50 opacity-0 transition-opacity group-hover:opacity-100">
                      <span className="text-xs font-semibold text-white">Changer</span>
                    </div>
                  </div>
                  <input
                    type="file"
                    accept="image/*"
                    className="sr-only"
                    onChange={(e) => onAvatarFile(e.target.files?.[0] ?? null)}
                  />
                </label>

                {/* Name + badges */}
                <div className="min-w-0 flex-1 text-center sm:text-left">
                  <p className="races-section-eyebrow mb-1">Athlète FuelOS</p>
                  <h2 className="font-display text-2xl font-extrabold leading-tight text-[var(--color-text)]">
                    {displayName}
                  </h2>

                  <div className="mt-2 flex flex-wrap justify-center gap-2 sm:justify-start">
                    {sportObj && (
                      <span className="inline-flex items-center gap-1.5 rounded-full border border-[var(--color-border)] bg-[var(--color-bg-subtle)] px-3 py-1 text-xs font-bold uppercase tracking-wider text-[var(--color-text)]">
                        <span aria-hidden>{sportObj.emoji}</span>
                        {sportObj.label}
                      </span>
                    )}
                    {levelObj && (
                      <span
                        className="inline-flex items-center rounded-full px-3 py-1 text-xs font-bold uppercase tracking-wider text-white"
                        style={{ backgroundColor: levelObj.color }}
                      >
                        {levelObj.label}
                      </span>
                    )}
                    {goalLabel && (
                      <span className="inline-flex items-center rounded-full border border-[var(--color-border)] bg-[var(--color-bg-subtle)] px-3 py-1 text-xs font-medium text-[var(--color-text-muted)]">
                        🎯 {goalLabel}
                      </span>
                    )}
                  </div>

                  {connectedCount > 0 && (
                    <p className="mt-2 text-xs text-[var(--color-text-muted)]">
                      {connectedCount} intégration{connectedCount > 1 ? "s" : ""} connectée{connectedCount > 1 ? "s" : ""}
                    </p>
                  )}
                </div>
              </div>

              {/* Stats bar */}
              <div className="border-t border-[var(--color-border)]">
                <div className="grid grid-cols-4 divide-x divide-[var(--color-border)]">
                  <StatPill value={profile.weightKg ?? "—"} unit={typeof profile.weightKg === "number" ? "kg" : undefined} label="Poids" />
                  <StatPill value={profile.heightCm ?? "—"} unit={typeof profile.heightCm === "number" ? "cm" : undefined} label="Taille" />
                  <StatPill value={profile.age ?? "—"} label="Âge" />
                  <StatPill
                    value={seasonTotal}
                    label="Courses"
                    icon={<Trophy className="h-3 w-3" />}
                  />
                </div>
              </div>

              {/* Quick actions row */}
              <div className="border-t border-[var(--color-border)] px-5 py-3 md:px-6">
                <div className="flex flex-wrap gap-2">
                  <Link
                    href="/plan"
                    className="inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold text-white shadow-sm hover:opacity-90 transition-opacity"
                    style={{ backgroundColor: GREEN }}
                  >
                    <Zap className="h-3.5 w-3.5" strokeWidth={2.5} aria-hidden />
                    Plan nutrition
                  </Link>
                  <Link
                    href="/race"
                    className="inline-flex items-center gap-2 rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-elevated)] px-4 py-2 text-sm font-semibold text-[var(--color-text)] hover:bg-[var(--color-bg-card-hover)] transition-colors"
                  >
                    <Footprints className="h-3.5 w-3.5 opacity-70" strokeWidth={2} aria-hidden />
                    Mode course
                  </Link>
                  <Link
                    href="/prep"
                    className="inline-flex items-center gap-2 rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-elevated)] px-4 py-2 text-sm font-semibold text-[var(--color-text)] hover:bg-[var(--color-bg-card-hover)] transition-colors"
                  >
                    <Leaf className="h-3.5 w-3.5 opacity-70" strokeWidth={2} aria-hidden />
                    Pré / Post
                  </Link>
                  <Link
                    href="/races"
                    className="inline-flex items-center gap-2 rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-elevated)] px-4 py-2 text-sm font-semibold text-[var(--color-text)] hover:bg-[var(--color-bg-card-hover)] transition-colors"
                  >
                    <CalendarDays className="h-3.5 w-3.5 opacity-70" strokeWidth={2} aria-hidden />
                    Calendrier
                  </Link>
                </div>
              </div>
            </div>

            {/* ── ACCORDION : Identité & morphologie ──── */}
            <SectionAccordion
              id="personal"
              icon={<User className="h-4 w-4" />}
              title="Identité & morphologie"
              subtitle="Prénom, poids, sport, niveau, objectif"
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
                    type="number" min={30} max={200} step={0.1}
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
                    type="number" min={120} max={230}
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
                    type="number" min={10} max={99}
                    className={inputClass()}
                    value={profile.age ?? ""}
                    onChange={(e) =>
                      updateProfile({ age: e.target.value === "" ? null : Number(e.target.value) })
                    }
                  />
                </label>
                <div>
                  <span className="block text-sm font-semibold text-[var(--color-text)]">
                    Sexe
                  </span>
                  <div className="mt-3 flex gap-3">
                    {(["M", "F", "other"] as const).map((s) => (
                      <label
                        key={s}
                        className={`flex cursor-pointer items-center gap-2 rounded-xl border px-3.5 py-2 text-sm font-medium transition-colors ${
                          profile.sex === s
                            ? "border-[var(--color-accent)] bg-[var(--color-accent-muted)] text-[var(--color-text)]"
                            : "border-[var(--color-border)] text-[var(--color-text-muted)] hover:border-[var(--color-accent)]"
                        }`}
                      >
                        <input type="radio" name="sex" className="sr-only" checked={profile.sex === s} onChange={() => updateProfile({ sex: s })} />
                        {s === "M" ? "Homme" : s === "F" ? "Femme" : "Autre"}
                      </label>
                    ))}
                  </div>
                </div>
              </div>

              {/* Sports */}
              <div className="mt-6">
                <span className="text-sm font-semibold text-[var(--color-text)]">
                  Sports pratiqués
                </span>
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
                      className={`flex cursor-pointer items-center gap-2 rounded-xl border px-3.5 py-2.5 text-sm font-medium transition-colors ${
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

              {/* Sport principal + niveau + objectif */}
              <div className="mt-6 grid gap-4 sm:grid-cols-2">
                <div>
                  <span className="block text-sm font-semibold text-[var(--color-text)]">
                    Sport principal
                  </span>
                  <select
                    className={selectClass()}
                    value={profile.mainSport}
                    onChange={(e) =>
                      updateProfile({ mainSport: e.target.value as FuelOsMainSport })
                    }
                  >
                    {MAIN_SPORTS.map((s) => (
                      <option key={s.id} value={s.id}>{s.label}</option>
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
                    {LEVELS.map((l) => (
                      <option key={l.id} value={l.id}>{l.label}</option>
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
                    {GOALS.map((g) => (
                      <option key={g.id} value={g.id}>{g.label}</option>
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

            {/* ── ACCORDION : Performance & Nutrition ── */}
            <SectionAccordion
              id="nutrition"
              icon={<Activity className="h-4 w-4" />}
              title="Performance & nutrition"
              subtitle="FTP, VMA, hydratation, préférences alimentaires"
              open={openSection === "nutrition"}
              onToggle={() => toggleSection("nutrition")}
              accentColor="#1d4ed8"
            >
              {/* Performance metrics */}
              <div className="mb-1 flex items-center gap-2">
                <Gauge className="h-4 w-4 text-[var(--color-text-muted)]" />
                <span className="text-sm font-bold text-[var(--color-text)]">Données de performance</span>
              </div>
              <p className="mb-4 text-xs text-[var(--color-text-muted)]">
                Utilisées en priorité dans le plan si renseignées.
              </p>

              <div className="grid gap-4 sm:grid-cols-2">
                <label className="block text-sm font-semibold text-[var(--color-text)]">
                  FTP (W)
                  <input
                    type="number" min={50} max={650}
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
                    type="number" min={8} max={25} step={0.1}
                    className={inputClass()}
                    value={profile.runnerVmaKmh ?? ""}
                    placeholder="ex. 16.5"
                    onChange={(e) =>
                      updateProfile({ runnerVmaKmh: e.target.value === "" ? null : Number(e.target.value) })
                    }
                  />
                </label>
                <label className="block text-sm font-semibold text-[var(--color-text)] sm:col-span-2">
                  Allure seuil (min/km)
                  <input
                    type="number" min={2.6} max={12} step={0.1}
                    className={inputClass()}
                    value={profile.runnerThresholdPaceMinPerKm ?? ""}
                    placeholder="ex. 4.5 pour 4:30 / km"
                    onChange={(e) =>
                      updateProfile({ runnerThresholdPaceMinPerKm: e.target.value === "" ? null : Number(e.target.value) })
                    }
                  />
                </label>
              </div>

              {/* Hydration */}
              <div className="mt-6 border-t border-[var(--color-border-subtle)] pt-5">
                <div className="mb-1 flex items-center gap-2">
                  <Droplets className="h-4 w-4 text-[var(--color-text-muted)]" />
                  <span className="text-sm font-bold text-[var(--color-text)]">Hydratation & sudation</span>
                </div>
                <div className="mt-3 grid gap-4 sm:grid-cols-2">
                  <label className="block text-sm font-semibold text-[var(--color-text)]">
                    Sweat rate (ml/h)
                    <input
                      type="number" min={200} max={3500}
                      className={inputClass()}
                      value={profile.sweatRateMlPerH ?? ""}
                      placeholder="ex. 900"
                      onChange={(e) =>
                        updateProfile({ sweatRateMlPerH: e.target.value === "" ? null : Number(e.target.value) })
                      }
                    />
                  </label>
                  <label className="block text-sm font-semibold text-[var(--color-text)]">
                    Sodium perdu (mg/h)
                    <input
                      type="number" min={100} max={4000}
                      className={inputClass()}
                      value={profile.sodiumLossMgPerH ?? ""}
                      placeholder="ex. 600"
                      onChange={(e) =>
                        updateProfile({ sodiumLossMgPerH: e.target.value === "" ? null : Number(e.target.value) })
                      }
                    />
                  </label>
                </div>
              </div>

              {/* Solid / liquid preference */}
              <div className="mt-6 border-t border-[var(--color-border-subtle)] pt-5">
                <span className="text-sm font-bold text-[var(--color-text)]">
                  Tolérance digestive
                </span>
                <div className="mt-3 flex justify-between text-[10px] font-bold uppercase tracking-wider text-[var(--color-text-muted)]">
                  <span>100 % liquide</span>
                  <span>{profile.digestiveLiquidSolidPct} %</span>
                  <span>100 % solide</span>
                </div>
                <input
                  type="range" min={0} max={100}
                  value={profile.digestiveLiquidSolidPct}
                  onChange={(e) =>
                    updateProfile({ digestiveLiquidSolidPct: Number(e.target.value) })
                  }
                  className="mt-2 w-full accent-[var(--color-accent)]"
                />
              </div>

              {/* Diet restrictions */}
              <div className="mt-6 border-t border-[var(--color-border-subtle)] pt-5">
                <span className="text-sm font-bold text-[var(--color-text)]">
                  Régimes & restrictions
                </span>
                <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3">
                  {(
                    [
                      ["dietVegetarian", "🌿 Végétarien"],
                      ["dietVegan", "🌱 Vegan"],
                      ["dietGlutenFree", "🌾 Sans gluten"],
                      ["dietLactoseFree", "🥛 Sans lactose"],
                      ["dietKosher", "🍖 Kosher"],
                      ["dietHalal", "🍗 Halal"],
                      ["dietGlutenFree", "🌾 Sans gluten"],
                      ["dietLactoseFree", "🥛 Sans lactose"],
                      ["dietKosher", "🍖 Kosher"],
                      ["dietHalal", "🍗 Halal"],
                    ] as const
                  ).map(([key, label]) => (
                    <label
                      key={key}
                      className={`flex cursor-pointer items-center gap-2 rounded-xl border px-3.5 py-2.5 text-sm font-medium transition-colors ${
                        profile[key as keyof FuelOsUserProfile]
                          ? "border-[var(--color-accent)] bg-[var(--color-accent-muted)] text-[var(--color-text)]"
                          : "border-[var(--color-border)] text-[var(--color-text-muted)] hover:border-[var(--color-accent)]"
                        }`}
                      >
                        <input
                          type="checkbox"
                          className="sr-only"
                          checked={profile[key as keyof FuelOsUserProfile]}
                          onChange={(e) =>
                            updateProfile({ [key as keyof FuelOsUserProfile]: e.target.checked })
                          }