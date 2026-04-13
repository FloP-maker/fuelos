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

function initials(first: string, last: string): string {
  const a = first.trim().charAt(0);
  const b = last.trim().charAt(0);
  return `${a}${b}`.toUpperCase() || "?";
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

function formatRaceDateShort(isoDate: string): string {
  const d = new Date(`${isoDate}T12:00:00`);
  if (Number.isNaN(d.getTime())) return isoDate;
  return d.toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "short",
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
    <section className="fuel-card mb-4 overflow-hidden">
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
  const { data: session } = useSession();
  const { profile, updateProfile, syncToAthleteCalculator } = useProfile();
  const [races, setRaces] = useState<RaceEntry[]>([]);
  const [saveHint, setSaveHint] = useState<string | null>(null);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState("");
  const [openSection, setOpenSection] = useState<string | null>("personal");

  const toggleSection = (id: string) =>
    setOpenSection((prev) => (prev === id ? null : id));

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
  const seasonDaysLeft = nextRace ? getDaysUntilRace(nextRace) : 0;

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

  const sportLabel = MAIN_SPORTS.find((s) => s.id === profile.mainSport)?.label ?? "";
  const levelLabel = LEVELS.find((l) => l.id === profile.athleticLevel)?.label ?? "";

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

        {/* Page title row */}
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="font-display text-2xl font-bold tracking-tight text-[var(--color-text)]">
              Mon Profil
            </h1>
            <p className="mt-0.5 text-sm text-[var(--color-text-muted)]">
              Tes données athlète · FuelOS
            </p>
          </div>
          <Link
            href="#personal"
            className="inline-flex items-center gap-1.5 rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-card)] px-4 py-2 text-sm font-semibold text-[var(--color-text)] hover:bg-[var(--color-bg-card-hover)]"
          >
            ⚙️ Paramètres
          </Link>
        </div>

        {/* ── HERO CARD ── */}
        <section className="mb-6 overflow-hidden rounded-2xl" style={{ background: "#2d5a3d" }}>
          {/* Top part: avatar + info */}
          <div className="flex items-center gap-5 px-6 py-6 md:px-8 md:py-8">
            <div className="relative shrink-0">
              {profile.avatarDataUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={profile.avatarDataUrl}
                  alt=""
                  className="h-20 w-20 rounded-full object-cover ring-2 ring-white/30 md:h-24 md:w-24"
                />
              ) : (
                <div
                  className="flex h-20 w-20 items-center justify-center rounded-full text-xl font-bold text-white ring-2 ring-white/30 md:h-24 md:w-24"
                  style={{ background: "rgba(255,255,255,0.15)" }}
                  aria-hidden
                >
                  {initials(profile.firstName, profile.lastName)}
                </div>
              )}
              <label
                className="absolute -bottom-1 -right-1 flex h-7 w-7 cursor-pointer items-center justify-center rounded-full border-2 border-white bg-white/90 text-xs shadow hover:bg-white"
                title="Changer la photo"
              >
                📷
                <input
                  type="file"
                  accept="image/*"
                  className="sr-only"
                  onChange={(e) => onAvatarFile(e.target.files?.[0] ?? null)}
                />
              </label>
            </div>

            <div className="min-w-0 flex-1">
              <h2 className="font-display text-2xl font-bold text-white md:text-3xl">
                {displayName}
              </h2>
              <div className="mt-2 flex flex-wrap gap-2">
                <span className="rounded-full border border-white/30 px-3 py-0.5 text-xs font-bold uppercase tracking-wide text-white">
                  {sportLabel}
                </span>
                <span className="rounded-full border border-white/30 px-3 py-0.5 text-xs font-bold uppercase tracking-wide text-white">
                  {levelLabel}
                </span>
              </div>
              <p className="mt-2 text-sm text-white/70">Athlète endurance · FuelOS</p>
            </div>
          </div>

          {/* Stats bar */}
          <div
            className="grid grid-cols-3 divide-x divide-white/20 border-t border-white/20"
            style={{ background: "rgba(0,0,0,0.15)" }}
          >
            {[
              { value: profile.weightKg ?? "—", label: "KG" },
              { value: profile.age ?? "—", label: "ANS" },
              { value: seasonTotal, label: "COURSES" },
            ].map(({ value, label }) => (
              <div key={label} className="flex flex-col items-center py-4">
                <span className="font-display text-2xl font-extrabold text-white">{value}</span>
                <span className="mt-0.5 text-[10px] font-bold uppercase tracking-widest text-white/60">
                  {label}
                </span>
              </div>
            ))}
          </div>
        </section>

        {/* ── PROCHAINE COURSE ── */}
        <section className="fuel-card mb-6 overflow-hidden">
          {!nextRace ? (
            <div className="p-6 text-center md:p-8">
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
              {/* Header row: label + name + countdown box */}
              <div className="flex items-start justify-between gap-4 px-6 py-5 md:px-8">
                <div>
                  <p className="text-xs font-bold uppercase tracking-widest text-[var(--color-text-muted)]">
                    🏁 Prochaine course
                  </p>
                  <h3 className="font-display mt-1 text-2xl font-extrabold text-[var(--color-text)] md:text-3xl">
                    {nextRace.name}
                  </h3>
                </div>
                <div
                  className="flex shrink-0 flex-col items-center justify-center rounded-2xl px-5 py-3 text-center text-white"
                  style={{ background: "#2d5a3d", minWidth: "80px" }}
                >
                  <span className="font-display text-3xl font-extrabold leading-none">
                    {Math.max(0, getDaysUntilRace(nextRace))}
                  </span>
                  <span className="mt-1 text-[10px] font-bold uppercase tracking-widest text-white/80">
                    JOURS
                  </span>
                </div>
              </div>

              {/* Divider */}
              <div className="border-t border-[var(--color-border-subtle)]" />

              {/* Info pills + progress + CTA */}
              <div className="bg-[var(--color-bg-elevated)] px-6 py-5 md:px-8">
                {/* Pills */}
                <div className="flex flex-wrap gap-2">
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-[var(--color-border)] bg-[var(--color-bg-card)] px-3 py-1 text-xs font-medium text-[var(--color-text)]">
                    📅 {formatRaceDateFr(nextRace.date)}
                  </span>
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-[var(--color-border)] bg-[var(--color-bg-card)] px-3 py-1 text-xs font-medium text-[var(--color-text)]">
                    🏃 {nextRace.sport}
                  </span>
                  {nextRace.location?.trim() ? (
                    <span className="inline-flex items-center gap-1.5 rounded-full border border-[var(--color-border)] bg-[var(--color-bg-card)] px-3 py-1 text-xs font-medium text-[var(--color-text)]">
                      📍 {nextRace.location}
                    </span>
                  ) : null}
                </div>

                {/* Season progress */}
                <div className="mt-5">
                  <div className="mb-1.5 flex items-center justify-between text-xs font-bold uppercase tracking-wide text-[var(--color-text-muted)]">
                    <span>Saison</span>
                    <span>{seasonDaysLeft} JOURS</span>
                  </div>
                  <div className="h-1.5 w-full overflow-hidden rounded-full bg-[var(--color-border-subtle)]">
                    <div
                      className="h-full rounded-full bg-[var(--color-accent)]"
                      style={{
                        width:
                          seasonTotal > 0
                            ? `${Math.round((past.length / seasonTotal) * 100)}%`
                            : "0%",
                      }}
                    />
                  </div>
                </div>

                {/* CTAs */}
                <div className="mt-5 flex flex-wrap gap-3">
                  <Link
                    href="/plan"
                    className="inline-flex items-center gap-1.5 rounded-full bg-[var(--color-accent)] px-5 py-2 text-sm font-bold text-black hover:opacity-95"
                  >
                    ⚡ Générer le plan
                  </Link>
                  <Link
                    href="/race"
                    className="inline-flex items-center gap-1.5 rounded-full border border-[var(--color-border)] bg-[var(--color-bg-card)] px-5 py-2 text-sm font-semibold text-[var(--color-text)] hover:bg-[var(--color-bg-card-hover)]"
                  >
                    🏃 Mode course
                  </Link>
                  <Link
                    href="/prep"
                    className="inline-flex items-center gap-1.5 rounded-full border border-[var(--color-border)] bg-[var(--color-bg-card)] px-5 py-2 text-sm font-semibold text-[var(--color-text)] hover:bg-[var(--color-bg-card-hover)]"
                  >
                    🥗 Pré / Post
                  </Link>
                </div>

                {/* Following races */}
                {followingRaces.length > 0 ? (
                  <div className="mt-6 border-t border-[var(--color-border-subtle)] pt-5">
                    <p className="text-xs font-bold uppercase tracking-wide text-[var(--color-text-muted)]">
                      À venir
                    </p>
                    <ul className="mt-3 space-y-2">
                      {followingRaces.map((r) => {
                        const dd = getDaysUntilRace(r);
                        return (
                          <li
                            key={r.id}
                            className="flex flex-wrap items-baseline justify-between gap-2 border-b border-[var(--color-border-subtle)] pb-2 last:border-0 last:pb-0"
                          >
                            <span className="font-bold text-[var(--color-text)]">{r.name}</span>
                            <span className="text-xs text-[var(--color-text-muted)]">
                              {formatRaceDateShort(r.date)} · {daysLabel(dd)}
                            </span>
                          </li>
                        );
                      })}
                    </ul>
                    <Link
                      href="/races"
                      className="mt-3 inline-block text-sm font-semibold text-[var(--color-accent)] underline-offset-2 hover:underline"
                    >
                      Voir tout le calendrier →
                    </Link>
                  </div>
                ) : (
                  <div className="mt-6 border-t border-[var(--color-border-subtle)] pt-5">
                    <p className="text-xs font-bold uppercase tracking-wide text-[var(--color-text-muted)]">
                      À venir
                    </p>
                    <Link
                      href="/races"
                      className="mt-3 inline-block text-sm font-semibold text-[var(--color-accent)] underline-offset-2 hover:underline"
                    >
                      Voir tout le calendrier →
                    </Link>
                  </div>
                )}
              </div>
            </>
          )}
        </section>

        {/* ── ACCORDION SECTIONS ── */}

        {/* Infos personnelles */}
        <SectionAccordion
          id="personal"
          icon="⚡"
          title="Données de performance"
          subtitle="FTP, VMA, allure seuil, sudation"
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
          title="Préférences nutritionnelles"
          subtitle="Forme, régimes et marques favoris"
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
          <div className="mt-6">
            <Button type="button" variant="secondary" size="md" onClick={handleSavePersonal}>
              Enregistrer dans le calculateur
            </Button>
          </div>

          {/* Préférences nutrition */}
          <div className="mt-8 border-t border-[var(--color-border-subtle)] pt-6">
            <div className="flex justify-between text-xs font-semibold text-[var(--color-text-muted)]">
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
          <div className="mt-6">
            <Button type="button" variant="secondary" size="md" onClick={handleSavePersonal}>
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
          <p>Connexions</p>
        </SectionAccordion>
      </main>
    </>
  );
}