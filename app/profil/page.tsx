"use client";

import Link from "next/link";
import { useSession, signOut } from "next-auth/react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Header } from "../components/Header";
import { Button } from "../components/Button";
import usePageTitle from "../lib/hooks/usePageTitle";
import { getDaysUntilRace, loadRaces, partitionRacesByUpcoming } from "@/lib/races";
import type { RaceEntry } from "@/lib/types/race";
import { useProfile } from "@/hooks/useProfile";
import type { FuelOsAthleticLevel, FuelOsIntegrationId, FuelOsMainSport, FuelOsUserProfile } from "@/lib/fuelOsUserProfile";

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

const INTEGRATIONS: {
  id: FuelOsIntegrationId;
  name: string;
  logo: string;
}[] = [
  { id: "strava", name: "Strava", logo: "🟠" },
  { id: "garmin", name: "Garmin Connect", logo: "🔵" },
  { id: "wahoo", name: "Wahoo", logo: "🔴" },
  { id: "apple_health", name: "Apple Health", logo: "❤️" },
  { id: "trainingpeaks", name: "TrainingPeaks", logo: "📈" },
];

function sectionTitle(text: string) {
  return (
    <h2 className="font-display text-lg font-bold tracking-tight text-[var(--color-text)] md:text-xl">{text}</h2>
  );
}

function initials(first: string, last: string): string {
  const a = first.trim().charAt(0);
  const b = last.trim().charAt(0);
  const s = `${a}${b}`.toUpperCase();
  return s || "?";
}

function formatRaceDateFr(isoDate: string): string {
  const d = new Date(`${isoDate}T12:00:00`);
  if (Number.isNaN(d.getTime())) return isoDate;
  return d.toLocaleDateString("fr-FR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function daysLabel(d: number): string {
  if (d === 0) return "Jour J";
  if (d === 1) return "1 jour";
  if (d > 1) return `${d} jours`;
  if (d === -1) return "Il y a 1 jour";
  return `Il y a ${Math.abs(d)} jours`;
}

export default function ProfilPage() {
  usePageTitle("Profil");
  const { data: session } = useSession();
  const { profile, updateProfile, syncToAthleteCalculator } = useProfile();
  const [races, setRaces] = useState<RaceEntry[]>([]);
  const [saveHint, setSaveHint] = useState<string | null>(null);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState("");

  const refreshRaces = useCallback(() => setRaces(loadRaces()), []);
  useEffect(() => {
    refreshRaces();
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
  const followingRaces = upcoming.slice(1, 4);
  const seasonTotal = past.length + upcoming.length;
  const seasonProgressPct =
    seasonTotal > 0 ? Math.round((past.length / seasonTotal) * 1000) / 10 : 0;

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

  const handleDeleteAccount = () => {
    if (deleteConfirm.trim().toLowerCase() !== "supprimer") return;
    try {
      const keys = [
        "fuelos_user_profile_v1",
        "athlete-profile",
        "fuelos_races",
        "fuelos_active_plan",
        "fuelos_prep_state",
        "fuelos_onboarding_profile_done",
        "fuelos_onboarding_event_done",
      ];
      for (const k of keys) localStorage.removeItem(k);
    } catch {
      /* ignore */
    }
    setDeleteOpen(false);
    setDeleteConfirm("");
    void signOut({ callbackUrl: "/" });
  };

  const displayName =
    [profile.firstName, profile.lastName].filter(Boolean).join(" ").trim() || "Athlète FuelOS";

  return (
    <>
      <Header />
      <main className="fuel-main mx-auto w-full max-w-[var(--fuel-shell-max)] px-4 py-8 md:px-6 md:py-10">
        {saveHint ? (
          <div
            className="mb-6 rounded-lg border border-[var(--color-accent)] bg-[var(--color-accent-muted)] px-4 py-3 text-sm font-medium text-[var(--color-text)]"
            role="status"
          >
            {saveHint}
          </div>
        ) : null}

        {/* 1. Header profil */}
        <section className="fuel-card mb-8 p-6 md:p-8">
          <div className="flex flex-col items-start gap-6 sm:flex-row sm:items-center">
            <div className="relative shrink-0">
              {profile.avatarDataUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={profile.avatarDataUrl}
                  alt=""
                  className="h-24 w-24 rounded-2xl border border-[var(--color-border)] object-cover shadow-sm md:h-28 md:w-28"
                />
              ) : (
                <div
                  className="flex h-24 w-24 items-center justify-center rounded-2xl border border-[var(--color-border)] text-2xl font-bold text-[var(--color-text)] md:h-28 md:w-28"
                  style={{ background: "var(--color-accent-muted)" }}
                  aria-hidden
                >
                  {initials(profile.firstName, profile.lastName)}
                </div>
              )}
              <label className="mt-3 block cursor-pointer text-xs font-semibold text-[var(--color-accent)] hover:underline">
                Changer la photo
                <input
                  type="file"
                  accept="image/*"
                  className="sr-only"
                  onChange={(e) => onAvatarFile(e.target.files?.[0] ?? null)}
                />
              </label>
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="font-display text-2xl font-bold tracking-tight text-[var(--color-text)] md:text-3xl">
                  {displayName}
                </h1>
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                <span className="rounded-full bg-[var(--color-bg-elevated)] px-3 py-1 text-xs font-semibold text-[var(--color-text)] ring-1 ring-[var(--color-border)]">
                  {MAIN_SPORTS.find((s) => s.id === profile.mainSport)?.label}
                </span>
                <span className="rounded-full bg-[var(--color-accent-muted)] px-3 py-1 text-xs font-semibold text-[var(--color-text)] ring-1 ring-[color-mix(in_srgb,var(--color-accent)_35%,transparent)]">
                  {LEVELS.find((l) => l.id === profile.athleticLevel)?.label}
                </span>
              </div>
            </div>
          </div>
        </section>

        {/* 2. Prochaine course */}
        <section className="fuel-card mb-8 overflow-hidden">
          <div className="border-b border-[var(--color-border)] bg-[color-mix(in_srgb,var(--color-accent)_10%,var(--color-bg-card)))] px-6 py-5 md:px-8">
            {sectionTitle("Ma prochaine course")}
            <p className="mt-1 text-sm text-[var(--color-text-muted)]">
              Données synchronisées avec ton calendrier <Link href="/races" className="font-semibold text-[var(--color-accent)] underline-offset-2 hover:underline">Mes courses</Link>.
            </p>
          </div>
          <div className="p-6 md:p-8">
            {!nextRace ? (
              <div className="text-center">
                <p className="text-[var(--color-text-muted)]">
                  Aucune course à venir. Ajoute ta prochaine objectif pour lancer la préparation.
                </p>
                <Link
                  href="/races"
                  className="mt-4 inline-flex rounded-lg bg-[var(--color-accent)] px-5 py-2.5 text-sm font-bold text-black hover:opacity-95"
                >
                  + Ajouter une course
                </Link>
              </div>
            ) : (
              <>
                <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-bold uppercase tracking-wide text-[var(--color-text-muted)]">
                      {nextRace.sport} · {formatRaceDateFr(nextRace.date)}
                    </p>
                    <h3 className="font-display mt-2 text-2xl font-bold text-[var(--color-text)] md:text-3xl">
                      {nextRace.name}
                    </h3>
                    <p className="mt-2 text-sm text-[var(--color-text-muted)]">
                      {nextRace.location?.trim() ? `${nextRace.location} · ` : null}
                      {nextRace.distance} km
                      {nextRace.elevationGain != null ? ` · ${nextRace.elevationGain} m D+` : null}
                    </p>
                  </div>
                  <div className="flex shrink-0 flex-col items-center justify-center rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg-elevated)] px-8 py-6 text-center">
                    <span className="text-xs font-bold uppercase tracking-wider text-[var(--color-text-muted)]">
                      Compte à rebours
                    </span>
                    <span className="font-display mt-1 text-5xl font-extrabold tabular-nums text-[var(--color-accent)] md:text-6xl">
                      {Math.max(0, getDaysUntilRace(nextRace))}
                    </span>
                    <span className="mt-1 text-sm font-medium text-[var(--color-text-muted)]">
                      {daysLabel(getDaysUntilRace(nextRace))}
                    </span>
                  </div>
                </div>

                <div className="mt-8">
                  <div className="mb-2 flex justify-between text-xs font-semibold text-[var(--color-text-muted)]">
                    <span>Saison</span>
                    <span>
                      {past.length} passée{past.length > 1 ? "s" : ""} · {upcoming.length} à venir
                    </span>
                  </div>
                  <div
                    className="h-3 w-full overflow-hidden rounded-full bg-[var(--color-border-subtle)]"
                    role="progressbar"
                    aria-valuenow={seasonProgressPct}
                    aria-valuemin={0}
                    aria-valuemax={100}
                  >
                    <div
                      className="h-full rounded-full bg-[var(--color-accent)] transition-all"
                      style={{ width: `${seasonProgressPct}%` }}
                    />
                  </div>
                </div>

                <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
                  <Link
                    href="/plan"
                    className="inline-flex min-h-[40px] flex-1 items-center justify-center rounded-lg bg-[var(--color-accent)] px-4 text-sm font-bold text-black hover:opacity-95 sm:flex-none"
                  >
                    Générer le plan
                  </Link>
                  <Link
                    href="/race"
                    className="inline-flex min-h-[40px] flex-1 items-center justify-center rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-card)] px-4 text-sm font-bold text-[var(--color-text)] hover:bg-[var(--color-bg-card-hover)] sm:flex-none"
                  >
                    Mode course
                  </Link>
                  <Link
                    href="/prep"
                    className="inline-flex min-h-[40px] flex-1 items-center justify-center rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-card)] px-4 text-sm font-bold text-[var(--color-text)] hover:bg-[var(--color-bg-card-hover)] sm:flex-none"
                  >
                    Pré / Post
                  </Link>
                </div>

                {followingRaces.length > 0 ? (
                  <div className="mt-10 border-t border-[var(--color-border-subtle)] pt-8">
                    <h4 className="text-sm font-bold uppercase tracking-wide text-[var(--color-text-muted)]">
                      Ensuite
                    </h4>
                    <ul className="mt-4 space-y-3">
                      {followingRaces.map((r) => {
                        const dd = getDaysUntilRace(r);
                        return (
                          <li
                            key={r.id}
                            className="flex flex-wrap items-baseline justify-between gap-2 rounded-lg border border-[var(--color-border-subtle)] bg-[var(--color-bg-elevated)] px-4 py-3"
                          >
                            <span className="font-semibold text-[var(--color-text)]">{r.name}</span>
                            <span className="text-sm text-[var(--color-text-muted)]">
                              {new Date(`${r.date}T12:00:00`).toLocaleDateString("fr-FR", {
                                day: "numeric",
                                month: "short",
                                year: "numeric",
                              })}{" "}
                              · {daysLabel(dd)}
                            </span>
                          </li>
                        );
                      })}
                    </ul>
                    <Link
                      href="/races"
                      className="mt-4 inline-block text-sm font-semibold text-[var(--color-accent)] underline-offset-2 hover:underline"
                    >
                      Voir tout le calendrier →
                    </Link>
                  </div>
                ) : null}
              </>
            )}
          </div>
        </section>

        {/* 3. Infos personnelles */}
        <section className="fuel-card mb-8 p-6 md:p-8">
          {sectionTitle("Infos personnelles")}
          <p className="mt-2 text-sm text-[var(--color-text-muted)]">
            Ces champs alimentent le calculateur de plan (poids, sports, niveau, objectif) pour éviter de tout ressaisir.
          </p>
          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            <label className="block text-sm font-semibold text-[var(--color-text)]">
              Prénom
              <input
                className="mt-1.5 w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-elevated)] px-3 py-2.5 text-[var(--color-text)] outline-none focus:ring-2 focus:ring-[var(--color-accent)]"
                value={profile.firstName}
                onChange={(e) => updateProfile({ firstName: e.target.value })}
              />
            </label>
            <label className="block text-sm font-semibold text-[var(--color-text)]">
              Nom
              <input
                className="mt-1.5 w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-elevated)] px-3 py-2.5 text-[var(--color-text)] outline-none focus:ring-2 focus:ring-[var(--color-accent)]"
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
                className="mt-1.5 w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-elevated)] px-3 py-2.5 text-[var(--color-text)] outline-none focus:ring-2 focus:ring-[var(--color-accent)]"
                value={profile.weightKg ?? ""}
                onChange={(e) =>
                  updateProfile({
                    weightKg: e.target.value === "" ? null : Number(e.target.value),
                  })
                }
              />
            </label>
            <label className="block text-sm font-semibold text-[var(--color-text)]">
              Taille (cm)
              <input
                type="number"
                min={120}
                max={230}
                className="mt-1.5 w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-elevated)] px-3 py-2.5 text-[var(--color-text)] outline-none focus:ring-2 focus:ring-[var(--color-accent)]"
                value={profile.heightCm ?? ""}
                onChange={(e) =>
                  updateProfile({
                    heightCm: e.target.value === "" ? null : Number(e.target.value),
                  })
                }
              />
            </label>
            <label className="block text-sm font-semibold text-[var(--color-text)]">
              Âge
              <input
                type="number"
                min={10}
                max={99}
                className="mt-1.5 w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-elevated)] px-3 py-2.5 text-[var(--color-text)] outline-none focus:ring-2 focus:ring-[var(--color-accent)]"
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
                      updateProfile({
                        sports: { ...profile.sports, [key]: e.target.checked },
                      })
                    }
                  />
                  {label}
                </label>
              ))}
            </div>
          </div>

          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            <div>
              <span className="block text-sm font-semibold text-[var(--color-text)]">Sport principal (badge)</span>
              <select
                className="mt-1.5 w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-elevated)] px-3 py-2.5 text-[var(--color-text)] outline-none focus:ring-2 focus:ring-[var(--color-accent)]"
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
              <span className="block text-sm font-semibold text-[var(--color-text)]">Niveau athlétique</span>
              <select
                className="mt-1.5 w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-elevated)] px-3 py-2.5 text-[var(--color-text)] outline-none focus:ring-2 focus:ring-[var(--color-accent)]"
                value={profile.athleticLevel}
                onChange={(e) => updateProfile({ athleticLevel: e.target.value as FuelOsAthleticLevel })}
              >
                {LEVELS.map((l) => (
                  <option key={l.id} value={l.id}>
                    {l.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="sm:col-span-2">
              <span className="block text-sm font-semibold text-[var(--color-text)]">Objectif principal</span>
              <select
                className="mt-1.5 w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-elevated)] px-3 py-2.5 text-[var(--color-text)] outline-none focus:ring-2 focus:ring-[var(--color-accent)]"
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
        </section>

        {/* 4. Performance */}
        <section className="fuel-card mb-8 p-6 md:p-8">
          {sectionTitle("Données de performance")}
          <p className="mt-2 text-sm text-[var(--color-text-muted)]">
            Utilisées en priorité dans le plan si renseignées (FTP, VMA / allure, sudation, sodium).
          </p>
          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            <label className="block text-sm font-semibold text-[var(--color-text)]">
              FTP (W)
              <input
                type="number"
                min={50}
                max={650}
                className="mt-1.5 w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-elevated)] px-3 py-2.5 text-[var(--color-text)] outline-none focus:ring-2 focus:ring-[var(--color-accent)]"
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
                className="mt-1.5 w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-elevated)] px-3 py-2.5 text-[var(--color-text)] outline-none focus:ring-2 focus:ring-[var(--color-accent)]"
                value={profile.runnerVmaKmh ?? ""}
                placeholder="ex. 16.5"
                onChange={(e) =>
                  updateProfile({ runnerVmaKmh: e.target.value === "" ? null : Number(e.target.value) })
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
                className="mt-1.5 w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-elevated)] px-3 py-2.5 text-[var(--color-text)] outline-none focus:ring-2 focus:ring-[var(--color-accent)]"
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
                className="mt-1.5 w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-elevated)] px-3 py-2.5 text-[var(--color-text)] outline-none focus:ring-2 focus:ring-[var(--color-accent)]"
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
                className="mt-1.5 w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-elevated)] px-3 py-2.5 text-[var(--color-text)] outline-none focus:ring-2 focus:ring-[var(--color-accent)]"
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
          <div className="mt-6">
            <Button type="button" variant="secondary" size="md" onClick={handleSavePersonal}>
              Enregistrer dans le calculateur
            </Button>
          </div>
        </section>

        {/* 5. Préférences nutrition */}
        <section className="fuel-card mb-8 p-6 md:p-8">
          {sectionTitle("Préférences nutritionnelles")}
          <div className="mt-6">
            <div className="flex justify-between text-xs font-semibold text-[var(--color-text-muted)]">
              <span>100 % liquide</span>
              <span>100 % solide</span>
            </div>
            <input
              type="range"
              min={0}
              max={100}
              value={profile.digestiveLiquidSolidPct}
              onChange={(e) => updateProfile({ digestiveLiquidSolidPct: Number(e.target.value) })}
              className="mt-2 w-full accent-[var(--color-accent)]"
            />
            <p className="mt-2 text-xs text-[var(--color-text-muted)]">
              Tolérance / préférence de forme (influence le profil digestif du plan).
            </p>
          </div>
          <div className="mt-8">
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
          <div className="mt-6">
            <Button type="button" variant="secondary" size="md" onClick={handleSavePersonal}>
              Enregistrer dans le calculateur
            </Button>
          </div>
        </section>

        {/* 6. Intégrations */}
        <section className="fuel-card mb-8 p-6 md:p-8">
          {sectionTitle("Connexions applications")}
          <p className="mt-2 text-sm text-[var(--color-text-muted)]">
            OAuth désactivé pour le MVP — connexion guidée sur{" "}
            <Link href="/profil/integrations" className="font-semibold text-[var(--color-accent)] underline-offset-2 hover:underline">
              la page intégrations
            </Link>{" "}
            lorsque disponible.
          </p>
          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {INTEGRATIONS.map((it) => {
              const connected = profile.integrationConnected[it.id] === true;
              return (
                <div
                  key={it.id}
                  className="flex flex-col rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-elevated)] p-4"
                >
                  <div className="flex items-start gap-3">
                    <span className="text-2xl" aria-hidden>
                      {it.logo}
                    </span>
                    <div className="min-w-0 flex-1">
                      <h3 className="font-semibold text-[var(--color-text)]">{it.name}</h3>
                      <p className="mt-1 text-xs text-[var(--color-text-muted)]">
                        {connected ? "Connecté" : "Non connecté"}
                      </p>
                    </div>
                  </div>
                  <div className="mt-4 flex flex-col gap-2">
                    <Button type="button" variant="secondary" size="sm" disabled className="!cursor-not-allowed">
                      {connected ? "Déconnecter" : "Connecter"}
                    </Button>
                    <span className="text-center text-[10px] font-bold uppercase tracking-wide text-[var(--color-text-muted)]">
                      Bientôt disponible
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* 7. Sécurité */}
        <section className="fuel-card p-6 md:p-8">
          {sectionTitle("Sécurité & compte")}
          <div className="mt-4 space-y-4 text-sm">
            <div>
              <span className="font-semibold text-[var(--color-text)]">Email</span>
              <p className="mt-1 rounded-lg border border-[var(--color-border-subtle)] bg-[var(--color-bg-elevated)] px-3 py-2.5 text-[var(--color-text-muted)]">
                {session?.user?.email ?? "— (connecte-toi pour afficher l’email)"}
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Button
                type="button"
                variant="secondary"
                size="md"
                onClick={() => window.alert("Changement de mot de passe : bientôt disponible.")}
              >
                Changer le mot de passe
              </Button>
              <Button type="button" variant="ghost" size="md" onClick={() => void signOut({ callbackUrl: "/" })}>
                Déconnexion
              </Button>
            </div>
            <button
              type="button"
              className="text-sm font-semibold text-[var(--color-danger)] underline-offset-2 hover:underline"
              onClick={() => setDeleteOpen(true)}
            >
              Supprimer mon compte
            </button>
          </div>
        </section>
      </main>

      {deleteOpen ? (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 p-4 sm:items-center"
          role="dialog"
          aria-modal="true"
          aria-labelledby="del-title"
        >
          <div className="w-full max-w-md rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg-card)] p-6 shadow-lg">
            <h2 id="del-title" className="font-display text-lg font-bold text-[var(--color-text)]">
              Supprimer les données locales ?
            </h2>
            <p className="mt-2 text-sm text-[var(--color-text-muted)]">
              Cette action efface le profil, les courses et les plans stockés dans ce navigateur, puis te déconnecte.
              Tape <strong>supprimer</strong> pour confirmer.
            </p>
            <input
              className="mt-4 w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-elevated)] px-3 py-2.5 text-[var(--color-text)]"
              value={deleteConfirm}
              onChange={(e) => setDeleteConfirm(e.target.value)}
              placeholder="supprimer"
              autoComplete="off"
            />
            <div className="mt-6 flex flex-wrap justify-end gap-2">
              <Button type="button" variant="ghost" size="md" onClick={() => setDeleteOpen(false)}>
                Annuler
              </Button>
              <Button
                type="button"
                variant="danger"
                size="md"
                disabled={deleteConfirm.trim().toLowerCase() !== "supprimer"}
                onClick={handleDeleteAccount}
              >
                Confirmer
              </Button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
