"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Calendar,
  CalendarDays,
  Footprints,
  Leaf,
  Settings,
  Zap,
} from "lucide-react";
import { Header } from "../components/Header";
import { Button } from "../components/Button";
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

const MAIN_SPORTS: { id: FuelOsMainSport; label: string }[] = [
  { id: "trail", label: "Trail" },
  { id: "velo", label: "Vélo" },
  { id: "triathlon", label: "Triathlon" },
  { id: "running", label: "Running" },
];

const LEVELS: { id: FuelOsAthleticLevel; label: string }[] = [
  { id: "debutant", label: "Débutant" },
  { id: "intermediaire", label: "Intermédiaire" },
  { id: "elite", label: "Élite" },
];

const GOALS: { id: FuelOsUserProfile["mainGoal"]; label: string }[] = [
  { id: "performance", label: "Performance" },
  { id: "endurance", label: "Endurance" },
  { id: "weight_loss", label: "Perte de poids" },
  { id: "health", label: "Santé" },
];

const INTEGRATIONS: { id: FuelOsIntegrationId; name: string; logo: string }[] = [
  { id: "strava", name: "Strava", logo: "🟠" },
  { id: "garmin", name: "Garmin Connect", logo: "🔵" },
  { id: "wahoo", name: "Wahoo", logo: "🔴" },
  { id: "apple_health", name: "Apple Health", logo: "❤️" },
  { id: "trainingpeaks", name: "TrainingPeaks", logo: "📈" },
];

const PROFILE_GREEN_SOLID = "#1B4332";
const PROFILE_BADGE_LEVEL_BG = "#4B7F52";

function initials(first: string, last: string): string {
  const a = first.trim().charAt(0);
  const b = last.trim().charAt(0);
  return `${a}${b}`.toUpperCase() || "?";
}

function inputClass() {
  return "mt-1.5 w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-elevated)] px-3 py-2.5 text-[var(--color-text)] outline-none focus:ring-2 focus:ring-[var(--color-accent)]";
}

function selectClass() {
  return "mt-1.5 w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-elevated)] px-3 py-2.5 text-[var(--color-text)] outline-none focus:ring-2 focus:ring-[var(--color-accent)]";
}

function SectionAccordion({
  id,
  icon,
  title,
  subtitle,
  open,
  onToggle,
  children,
}: {
  id: string;
  icon: string;
  title: string;
  subtitle: string;
  open: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}) {
  return (
    <section className="fuel-races-main-panel mb-4 overflow-hidden">
      <button
        type="button"
        className="flex w-full items-center justify-between gap-4 px-6 py-5 text-left md:px-8"
        onClick={onToggle}
        aria-expanded={open}
        aria-controls={`section-${id}`}
      >
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-base">{icon}</span>
            <span className="font-display text-base font-bold tracking-tight text-[var(--color-text)]">
              {title}
            </span>
          </div>
          <p className="mt-0.5 truncate text-xs text-[var(--color-text-muted)]">{subtitle}</p>
        </div>
        <span
          className="shrink-0 text-[var(--color-text-muted)] transition-transform duration-200"
          style={{ transform: open ? "rotate(180deg)" : "rotate(0deg)" }}
          aria-hidden
        >
          ▾
        </span>
      </button>
      {open && (
        <div id={`section-${id}`} className="border-t border-[var(--color-border)] px-6 py-6 md:px-8">
          {children}
        </div>
      )}
    </section>
  );
}

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

  const { upcoming, past } = useMemo(() => partitionRacesByUpcoming(races), [races]);
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

  const handleSavePersonal = () => {
    syncToAthleteCalculator();
    setSaveHint("Profil enregistré — le plan nutritionnel utilisera ces données.");
    window.setTimeout(() => setSaveHint(null), 4000);
  };

  const displayName =
    [profile.firstName, profile.lastName].filter(Boolean).join(" ").trim() || "Athlète FuelOS";

  const sportLabel = MAIN_SPORTS.find((s) => s.id === profile.mainSport)?.label ?? "";
  const levelLabel = LEVELS.find((l) => l.id === profile.athleticLevel)?.label ?? "";
  const goalLabel = GOALS.find((g) => g.id === profile.mainGoal)?.label ?? "";

  return (
    <>
      <Header />
      <main className="fuel-main races-page">
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
                <p>
                  Nutrition d&apos;endurance et repères personnalisés — même esprit que{" "}
                  <span className="font-semibold text-white/90">Mes courses</span>.
                </p>
              </div>
              <div className="flex w-full max-w-xl flex-col gap-2 sm:flex-row sm:items-center sm:gap-3">
                <Link href="#personal" className="races-page-hero__cta">
                  Modifier mes infos
                </Link>
                <Link
                  href="/races?addRace=1"
                  className="inline-flex items-center justify-center rounded-full border border-white/25 bg-white/10 px-5 py-3 text-sm font-semibold text-white backdrop-blur-sm transition hover:bg-white/20"
                >
                  Ajouter une course
                </Link>
              </div>
            </div>
          </div>
        </section>

        {saveHint ? (
          <div
            className="relative z-10 mx-auto max-w-[1400px] px-6 pb-2 pt-3 md:px-6"
            role="status"
          >
            <div className="rounded-xl border border-[var(--color-accent)] bg-[var(--color-accent-muted)] px-4 py-3 text-sm font-medium text-[var(--color-text)] shadow-sm">
              {saveHint}
            </div>
          </div>
        ) : null}

        <div className="races-layout">
          <div className="races-layout__main min-w-0">
            <RacesNextMilestone nextRace={nextRace} />
            <RacesTodayCard nextRace={nextRace} />

            <div className="fuel-races-main-panel px-5 py-4 md:px-6">
              <p className="races-section-eyebrow mb-3">Actions rapides</p>
              <div className="flex flex-wrap gap-2.5">
                <Link
                  href="/plan"
                  className="inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:opacity-95"
                  style={{ backgroundColor: PROFILE_GREEN_SOLID }}
                >
                  <Zap className="h-4 w-4" strokeWidth={2.25} aria-hidden />
                  Plan nutrition
                </Link>
                <Link
                  href="/race"
                  className="inline-flex items-center gap-2 rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-card)] px-4 py-2.5 text-sm font-semibold text-[var(--color-text)] shadow-sm hover:bg-[var(--color-bg-card-hover)]"
                >
                  <Footprints className="h-4 w-4 opacity-70" strokeWidth={2} aria-hidden />
                  Mode course
                </Link>
                <Link
                  href="/prep"
                  className="inline-flex items-center gap-2 rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-card)] px-4 py-2.5 text-sm font-semibold text-[var(--color-text)] shadow-sm hover:bg-[var(--color-bg-card-hover)]"
                >
                  <Leaf className="h-4 w-4 opacity-70" strokeWidth={2} aria-hidden />
                  Pré / Post
                </Link>
                <Link
                  href="/races"
                  className="inline-flex items-center gap-2 rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-card)] px-4 py-2.5 text-sm font-semibold text-[var(--color-text)] shadow-sm hover:bg-[var(--color-bg-card-hover)]"
                >
                  <CalendarDays className="h-4 w-4 opacity-70" strokeWidth={2} aria-hidden />
                  Calendrier
                </Link>
              </div>
            </div>

        {/* ── ACCORDION SECTIONS ── */}

        {/* Infos personnelles */}
        <SectionAccordion
          id="personal"
          icon="👤"
          title="Identité & athlète"
          subtitle="Morphologie, sports pratiqués, objectif"
          open={openSection === "personal"}
          onToggle={() => toggleSection("personal")}
        >
          <h3 className="font-display text-base font-bold text-[var(--color-text)]">
            Infos personnelles
          </h3>
          <p className="mt-1 text-sm text-[var(--color-text-muted)]">
            Ces champs alimentent le calculateur de plan (poids, sports, niveau, objectif) pour
            éviter de tout ressaisir.
          </p>
          <div className="mt-5 grid gap-4 sm:grid-cols-2">
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
              <div className="mt-2 flex flex-wrap gap-3">
                {(["M", "F", "other"] as const).map((s) => (
                  <label key={s} className="flex cursor-pointer items-center gap-2 text-sm">
                    <input
                      type="radio"
                      name="sex"
                      checked={profile.sex === s}
                      onChange={() => updateProfile({ sex: s })}
                    />
                    {s === "M" ? "Homme" : s === "F" ? "Femme" : "Autre"}
                  </label>
                ))}
              </div>
            </div>
          </div>

          <div className="mt-6">
            <span className="text-sm font-semibold text-[var(--color-text)]">Sport(s) principal(aux)</span>
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              {(
                [
                  ["trail", "Trail"],
                  ["running", "Running"],
                  ["veloRoute", "Vélo route"],
                  ["vtt", "VTT"],
                  ["triathlon", "Triathlon"],
                ] as const
              ).map(([key, label]) => (
                <label key={key} className="flex cursor-pointer items-center gap-2 text-sm">
                  <input
                    type="checkbox"
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
                Sport principal (badge)
              </span>
              <select
                className={selectClass()}
                value={profile.mainSport}
                onChange={(e) => updateProfile({ mainSport: e.target.value as FuelOsMainSport })}
              >
                {MAIN_SPORTS.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.label}
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
                {LEVELS.map((l) => (
                  <option key={l.id} value={l.id}>
                    {l.label}
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
                {GOALS.map((g) => (
                  <option key={g.id} value={g.id}>
                    {g.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="mt-8">
            <Button type="button" variant="primary" size="md" onClick={handleSavePersonal}>
              Sauvegarder
            </Button>
          </div>
        </SectionAccordion>

        {/* Préférences nutritionnelles */}
        <SectionAccordion
          id="nutrition"
          icon="🥗"
          title="Performance & nutrition"
          subtitle="FTP, hydratation, préférences alimentaires"
          open={openSection === "nutrition"}
          onToggle={() => toggleSection("nutrition")}
        >
          <h3 className="font-display text-base font-bold text-[var(--color-text)]">
            Données de performance
          </h3>
          <p className="mt-1 text-sm text-[var(--color-text-muted)]">
            Utilisées en priorité dans le plan si renseignées (FTP, VMA / allure, sudation, sodium).
          </p>
          <div className="mt-5 grid gap-4 sm:grid-cols-2">
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
              Allure seuil (min/km) — ex. 4,5 pour 4:30 / km
              <input
                type="number"
                min={2.6}
                max={12}
                step={0.1}
                className={inputClass()}
                value={profile.runnerThresholdPaceMinPerKm ?? ""}
                placeholder="ex. 4.5"
                onChange={(e) =>
                  updateProfile({
                    runnerThresholdPaceMinPerKm:
                      e.target.value === "" ? null : Number(e.target.value),
                  })
                }
              />
            </label>
            <label className="block text-sm font-semibold text-[var(--color-text)]">
              Sweat rate estimé (ml/h)
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
              Sodium perdu estimé (mg/h)
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

          {/* Préférences nutrition */}
          <div className="mt-8 border-t border-[var(--color-border-subtle)] pt-6">
            <h4 className="font-display text-sm font-bold text-[var(--color-text)]">
              Préférences nutritionnelles
            </h4>
            <div className="mt-3 flex justify-between text-xs font-semibold text-[var(--color-text-muted)]">
              <span>100 % liquide</span>
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
            <p className="mt-2 text-xs text-[var(--color-text-muted)]">
              Tolérance / préférence de forme (influence le profil digestif du plan).
            </p>
          </div>
          <div className="mt-6">
            <span className="text-sm font-semibold text-[var(--color-text)]">Régimes / restrictions</span>
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              {(
                [
                  ["dietVegetarian", "Végétarien"],
                  ["dietVegan", "Vegan"],
                  ["dietGlutenFree", "Sans gluten"],
                  ["dietLactoseFree", "Sans lactose"],
                  ["dietNoCaffeine", "Sans caféine"],
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
          <label className="mt-6 block text-sm font-semibold text-[var(--color-text)]">
            Allergènes (texte libre)
            <textarea
              rows={2}
              className="mt-1.5 w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-elevated)] px-3 py-2.5 text-[var(--color-text)] outline-none focus:ring-2 focus:ring-[var(--color-accent)]"
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
            <Button type="button" variant="primary" size="md" onClick={handleSavePersonal}>
              Enregistrer dans le calculateur
            </Button>
          </div>
        </SectionAccordion>

        {/* Connexions */}
        <SectionAccordion
          id="integrations"
          icon="🔗"
          title="Connexions"
          subtitle="Strava, Garmin, Apple Health…"
          open={openSection === "integrations"}
          onToggle={() => toggleSection("integrations")}
        >
          <p className="text-sm text-[var(--color-text-muted)]">
            État local (démo) — les connexions réelles arriveront avec l&apos;OAuth.
          </p>
          <ul className="mt-5 space-y-3">
            {INTEGRATIONS.map((int) => {
              const on = !!profile.integrationConnected[int.id];
              return (
                <li
                  key={int.id}
                  className="flex items-center justify-between gap-4 rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-elevated)] px-4 py-3"
                >
                  <div className="flex min-w-0 items-center gap-3">
                    <span className="text-base" aria-hidden>
                      {int.logo}
                    </span>
                    <span className="truncate text-sm font-semibold text-[var(--color-text)]">
                      {int.name}
                    </span>
                  </div>
                  <button
                    type="button"
                    role="switch"
                    aria-checked={on}
                    onClick={() =>
                      updateProfile({
                        integrationConnected: {
                          ...profile.integrationConnected,
                          [int.id]: !on,
                        },
                      })
                    }
                    className={`relative shrink-0 inline-flex h-7 w-12 items-center rounded-full border transition-colors ${
                      on
                        ? "border-[var(--color-accent)] bg-[var(--color-accent-muted)]"
                        : "border-[var(--color-border)] bg-[var(--color-bg-card)]"
                    }`}
                  >
                    <span
                      className={`inline-block h-5 w-5 rounded-full bg-white shadow transition-transform ${
                        on ? "translate-x-6" : "translate-x-1"
                      }`}
                    />
                  </button>
                </li>
              );
            })}
          </ul>
        </SectionAccordion>
          </div>

          <aside className="races-layout__calendar min-w-0">
            <div className="races-layout__calendar-sticky races-scrollable-y space-y-4">
              <div className="races-next-milestone-card flex-col !items-stretch !gap-4 !p-5 sm:flex-row sm:!items-start">
                <div className="relative shrink-0">
                  <label className="group relative block cursor-pointer">
                    {profile.avatarDataUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={profile.avatarDataUrl}
                        alt=""
                        className="mx-auto h-20 w-20 rounded-full object-cover ring-2 ring-[var(--color-border)] sm:mx-0"
                      />
                    ) : (
                      <div
                        className="mx-auto flex h-20 w-20 items-center justify-center rounded-full text-lg font-bold text-white ring-2 ring-white/25 sm:mx-0"
                        style={{ background: "#4b5563" }}
                        aria-hidden
                      >
                        {initials(profile.firstName, profile.lastName)}
                      </div>
                    )}
                    <input
                      type="file"
                      accept="image/*"
                      className="sr-only"
                      onChange={(e) => onAvatarFile(e.target.files?.[0] ?? null)}
                    />
                  </label>
                </div>
                <div className="min-w-0 flex-1 text-center sm:text-left">
                  <p className="races-section-eyebrow mb-1">Athlète</p>
                  <p className="font-display text-lg font-bold leading-tight text-[var(--color-text)]">
                    {displayName}
                  </p>
                  <div className="mt-2 flex flex-wrap justify-center gap-2 sm:justify-start">
                    <span className="rounded-full border border-[var(--color-border)] bg-[var(--color-bg-subtle)] px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-[var(--color-text)]">
                      {sportLabel || "—"}
                    </span>
                    <span
                      className="rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white"
                      style={{ backgroundColor: PROFILE_BADGE_LEVEL_BG }}
                    >
                      {levelLabel || "—"}
                    </span>
                  </div>
                  {goalLabel ? (
                    <p className="mt-2 text-xs font-medium text-[var(--color-text-muted)]">
                      Objectif · {goalLabel}
                    </p>
                  ) : null}
                </div>
              </div>

              <div className="fuel-races-main-panel overflow-hidden p-0">
                <div className="grid grid-cols-2 divide-x divide-[var(--color-border)] border-b border-[var(--color-border)]">
                  {[
                    { v: profile.weightKg ?? "—", l: "Poids", u: "kg" },
                    { v: profile.heightCm ?? "—", l: "Taille", u: "cm" },
                  ].map((x) => (
                    <div key={x.l} className="px-3 py-3 text-center">
                      <div className="font-display text-xl font-extrabold text-[var(--color-text)]">
                        {x.v}
                        {typeof x.v === "number" ? (
                          <span className="text-[11px] font-semibold text-[var(--color-text-muted)]">
                            {" "}
                            {x.u}
                          </span>
                        ) : null}
                      </div>
                      <div className="mt-0.5 text-[10px] font-bold uppercase tracking-[0.12em] text-[var(--color-text-muted)]">
                        {x.l}
                      </div>
                    </div>
                  ))}
                </div>
                <div className="grid grid-cols-2 divide-x divide-[var(--color-border)]">
                  {[
                    { v: profile.age ?? "—", l: "Âge" },
                    { v: seasonTotal, l: "Courses" },
                  ].map((x) => (
                    <div key={x.l} className="px-3 py-3 text-center">
                      <div className="font-display text-xl font-extrabold text-[var(--color-text)]">
                        {x.v}
                      </div>
                      <div className="mt-0.5 text-[10px] font-bold uppercase tracking-[0.12em] text-[var(--color-text-muted)]">
                        {x.l}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="fuel-races-main-panel px-4 py-4">
                <p className="races-section-eyebrow mb-3">Raccourcis</p>
                <div className="flex flex-col gap-2">
                  <Link
                    href="#personal"
                    className="inline-flex items-center gap-2 rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-elevated)] px-3 py-2.5 text-sm font-semibold text-[var(--color-text)] hover:bg-[var(--color-bg-card-hover)]"
                  >
                    <Settings className="h-4 w-4 opacity-70" strokeWidth={2} aria-hidden />
                    Identité & formulaire
                  </Link>
                  <Link
                    href="/races"
                    className="inline-flex items-center gap-2 rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-elevated)] px-3 py-2.5 text-sm font-semibold text-[var(--color-text)] hover:bg-[var(--color-bg-card-hover)]"
                  >
                    <Calendar className="h-4 w-4 opacity-70" strokeWidth={2} aria-hidden />
                    Mes courses
                  </Link>
                  <Link
                    href="/plan"
                    className="inline-flex items-center gap-2 rounded-lg border border-transparent px-3 py-2.5 text-sm font-semibold text-white hover:opacity-95"
                    style={{ backgroundColor: PROFILE_GREEN_SOLID }}
                  >
                    <Zap className="h-4 w-4" strokeWidth={2.25} aria-hidden />
                    Mon plan nutrition
                  </Link>
                </div>
              </div>
            </div>
          </aside>
        </div>
      </main>
    </>
  );
}