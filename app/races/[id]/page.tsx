"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import usePageTitle from "../../lib/hooks/usePageTitle";
import { Header } from "../../components/Header";
import { Button } from "../../components/Button";
import { loadRaces, updateRace } from "@/lib/races";
import type { RaceEntry } from "@/lib/types/race";
import {
  DEFAULT_NUTRITION_CHARGE_DAYS_BEFORE,
  DEFAULT_NUTRITION_RECOVERY_DAYS_AFTER,
} from "@/lib/raceNutritionBands";

export default function RaceDetailPage() {
  const params = useParams();
  const id = typeof params?.id === "string" ? params.id : "";
  const [race, setRace] = useState<RaceEntry | null | undefined>(undefined);
  const [chargeDays, setChargeDays] = useState(5);
  const [recoveryDays, setRecoveryDays] = useState(4);
  const [chargeLabel, setChargeLabel] = useState("");
  const [recoveryLabel, setRecoveryLabel] = useState("");
  const [savedHint, setSavedHint] = useState<string | null>(null);

  useEffect(() => {
    if (!id) {
      setRace(null);
      return;
    }
    const r = loadRaces().find((x) => x.id === id) ?? null;
    setRace(r);
    if (r) {
      const c = r.nutritionChargeDaysBefore;
      const rec = r.nutritionRecoveryDaysAfter;
      setChargeDays(c === undefined ? DEFAULT_NUTRITION_CHARGE_DAYS_BEFORE : c);
      setRecoveryDays(rec === undefined ? DEFAULT_NUTRITION_RECOVERY_DAYS_AFTER : rec);
      setChargeLabel(r.nutritionChargeLabel ?? "");
      setRecoveryLabel(r.nutritionRecoveryLabel ?? "");
    }
  }, [id]);

  usePageTitle(race?.name ?? "Course");

  const saveNutrition = useCallback(() => {
    if (!race) return;
    const next = updateRace(race.id, {
      nutritionChargeDaysBefore: chargeDays,
      nutritionRecoveryDaysAfter: recoveryDays,
      nutritionChargeLabel: chargeLabel.trim() || undefined,
      nutritionRecoveryLabel: recoveryLabel.trim() || undefined,
    });
    if (next) {
      setRace(next);
      setSavedHint("Périodes nutrition enregistrées.");
      window.setTimeout(() => setSavedHint(null), 3000);
    }
  }, [race, chargeDays, recoveryDays, chargeLabel, recoveryLabel]);

  if (race === undefined) {
    return (
      <>
        <Header />
        <main className="fuel-main mx-auto max-w-2xl px-4 py-8 text-[var(--color-text-muted)]">
          Chargement…
        </main>
      </>
    );
  }

  if (!race) {
    return (
      <>
        <Header />
        <main className="fuel-main mx-auto max-w-2xl px-4 py-8">
          <p className="text-[var(--color-text-muted)]">Course introuvable.</p>
          <Link href="/mes-plans-courses" className="mt-4 inline-block font-semibold text-[#16a34a] underline">
            Retour à mes courses
          </Link>
        </main>
      </>
    );
  }

  return (
    <>
      <Header />
      <main className="fuel-main mx-auto w-full max-w-2xl px-4 py-8 md:px-6">
        <Link href="/mes-plans-courses" className="mb-6 inline-block text-sm font-semibold text-[#16a34a] hover:underline">
          ← Mes courses
        </Link>
        <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
          <h1 className="font-display text-2xl font-bold text-[var(--color-text)]">{race.name}</h1>
          <div className="flex flex-wrap items-center gap-3 text-sm">
            <Link
              href="/plan"
              className="font-semibold text-[var(--color-text-muted)] underline-offset-4 hover:text-[var(--color-text)] hover:underline"
            >
              Modifier
            </Link>
            <Link
              href={`/races/${race.id}/export`}
              className="font-semibold text-[var(--color-text-muted)] underline-offset-4 hover:text-[var(--color-text)] hover:underline"
            >
              📄 Exporter la fiche
            </Link>
          </div>
        </div>
        <p className="mt-2 text-[var(--color-text-muted)]">
          {race.date} · {race.sport} · {race.distance} km
        </p>

        <section className="fuel-card mt-8 p-5 md:p-6">
          <h2 className="font-display text-lg font-bold text-[var(--color-text)]">Périodes nutrition (calendrier)</h2>
          <p className="mt-1.5 text-xs italic text-gray-400 dark:text-zinc-500">
            Protocole basé sur les recommandations ACSM / IOC — charge glucidique : 8–12 g/kg sur J-3 à J-1 ·{" "}
            <Link
              href="/profil?tab=insights"
              className="text-gray-500 underline-offset-2 hover:text-gray-600 hover:underline dark:text-zinc-400 dark:hover:text-zinc-300"
            >
              Profil · Analyses
            </Link>
          </p>
          <p className="mt-2 text-sm text-[var(--color-text-muted)]">
            Ces réglages dessinent les bandeaux <strong className="text-[var(--color-text)]">avant</strong> (charge) et{" "}
            <strong className="text-[var(--color-text)]">après</strong> (récup) la course sur la page Mes courses.{" "}
            <strong className="text-[var(--color-text)]">0</strong> jour désactive la période correspondante.
          </p>
          {savedHint ? (
            <p className="mt-3 text-sm font-semibold text-[var(--color-accent)]" role="status">
              {savedHint}
            </p>
          ) : null}
          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            <label className="block text-sm font-semibold text-[var(--color-text)]">
              Jours de charge (J−n…J−1)
              <input
                type="number"
                min={0}
                max={21}
                value={chargeDays}
                onChange={(e) => setChargeDays(Math.max(0, Math.min(21, Number(e.target.value) || 0)))}
                className="mt-1.5 w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-elevated)] px-3 py-2.5 text-[var(--color-text)] outline-none focus:ring-2 focus:ring-[var(--color-accent)]"
              />
            </label>
            <label className="block text-sm font-semibold text-[var(--color-text)]">
              Jours de récup (J+1…J+n)
              <input
                type="number"
                min={0}
                max={21}
                value={recoveryDays}
                onChange={(e) => setRecoveryDays(Math.max(0, Math.min(21, Number(e.target.value) || 0)))}
                className="mt-1.5 w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-elevated)] px-3 py-2.5 text-[var(--color-text)] outline-none focus:ring-2 focus:ring-[var(--color-accent)]"
              />
            </label>
            <label className="block text-sm font-semibold text-[var(--color-text)] sm:col-span-2">
              Libellé charge
              <input
                type="text"
                value={chargeLabel}
                onChange={(e) => setChargeLabel(e.target.value)}
                placeholder="Charge nutrition"
                className="mt-1.5 w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-elevated)] px-3 py-2.5 text-[var(--color-text)] outline-none focus:ring-2 focus:ring-[var(--color-accent)]"
              />
            </label>
            <label className="block text-sm font-semibold text-[var(--color-text)] sm:col-span-2">
              Libellé récupération
              <input
                type="text"
                value={recoveryLabel}
                onChange={(e) => setRecoveryLabel(e.target.value)}
                placeholder="Récup post-course"
                className="mt-1.5 w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-elevated)] px-3 py-2.5 text-[var(--color-text)] outline-none focus:ring-2 focus:ring-[var(--color-accent)]"
              />
            </label>
          </div>
          <div className="mt-6">
            <Button type="button" variant="primary" size="md" onClick={saveNutrition}>
              Enregistrer les périodes
            </Button>
          </div>
        </section>
      </main>
    </>
  );
}
