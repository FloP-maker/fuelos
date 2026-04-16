"use client";

import Link from "next/link";
import { useSession } from "next-auth/react";
import { useCallback, useEffect, useState } from "react";
import { Button } from "@/app/components/Button";
import { RaceCard } from "@/app/components/history/RaceCard";
import type { RaceEvent, RaceSport } from "@/types/race";
import { aggregateRaceHistory } from "@/lib/nutrition/raceHistoryStats";
import { raceEventFromJson } from "@/lib/nutrition/raceHistory";
import {
  flushRaceHistoryOutbox,
} from "@/lib/raceHistoryLocal";

const SPORT_FR: Record<RaceSport, string> = {
  trail: "Trail",
  marathon: "Marathon",
  triathlon: "Triathlon",
  cyclisme: "Cyclisme",
  autre: "Autre",
};

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0">
      <div className="text-[11px] font-extrabold uppercase tracking-wide text-[var(--color-text-muted)]">
        {label}
      </div>
      <div className="mt-1 truncate text-[15px] font-extrabold text-[var(--color-text)]" title={value}>
        {value}
      </div>
    </div>
  );
}

export function ProfileMemoryTabContent() {
  const { status } = useSession();
  const [races, setRaces] = useState<RaceEvent[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setError(null);
    const res = await fetch("/api/user/race-events", { credentials: "include" });
    if (!res.ok) {
      setRaces([]);
      setError(res.status === 401 ? "connect" : "load");
      return;
    }
    const body = (await res.json()) as { races?: unknown[] };
    const list = Array.isArray(body.races)
      ? body.races.map((x) => raceEventFromJson(x)).filter((x): x is RaceEvent => x !== null)
      : [];
    setRaces(list);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    if (status !== "authenticated" || typeof window === "undefined") return;
    void (async () => {
      const flushed = await flushRaceHistoryOutbox(async (payload) => {
        const res = await fetch("/api/user/race-events", {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        return res.ok;
      });
      if (flushed > 0) void load();
    })();
  }, [status, load]);

  const agg = races && races.length > 0 ? aggregateRaceHistory(races) : null;

  if (status === "unauthenticated") {
    return (
      <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg-card)] p-6 shadow-sm">
        <p className="races-section-eyebrow mb-2">Mémoire nutritionnelle</p>
        <p className="text-sm leading-relaxed text-[var(--color-text-muted)]">
          Connecte-toi pour synchroniser ton historique de courses et tes scores nutrition sur tous tes appareils.
        </p>
        <Link
          href={`/api/auth/signin?callbackUrl=${encodeURIComponent("/profil")}`}
          className="mt-4 inline-block"
        >
          <Button variant="primary" size="md" className="min-h-11">
            Se connecter
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="races-section-eyebrow mb-1">Mémoire</p>
          <h2 className="font-display text-xl font-extrabold tracking-tight text-[var(--color-text)] md:text-2xl">
            Historique des courses
          </h2>
          <p className="mt-1 max-w-prose text-sm text-[var(--color-text-muted)]">
            Chaque sortie enrichit ton profil pour les prochains plans.
          </p>
        </div>
        <Link href="/history/new">
          <Button variant="primary" className="min-h-11 px-5">
            Ajouter une course
          </Button>
        </Link>
      </div>

      {error === "load" ? (
        <div className="rounded-2xl border border-[color-mix(in_srgb,var(--color-danger)_28%,var(--color-border))] bg-[color-mix(in_srgb,var(--color-danger)_6%,var(--color-bg-card))] p-6 shadow-sm">
          <p className="text-[15px] font-semibold text-[var(--color-text)]">Impossible de charger l&apos;historique</p>
          <p className="mt-2 text-sm text-[var(--color-text-muted)]">
            Ton historique se construit à chaque course enregistrée. Connecte Strava ou ajoute une course manuellement pour commencer.
          </p>
          <div className="mt-4 flex flex-wrap gap-3">
            <Link href="/profil/integrations">
              <Button type="button" variant="secondary" className="min-h-11 px-5">
                Connecter Strava
              </Button>
            </Link>
            <Link href="/history/new">
              <Button type="button" variant="primary" className="min-h-11 px-5">
                Ajouter une course
              </Button>
            </Link>
          </div>
        </div>
      ) : null}

      {agg ? (
        <section
          className="grid gap-3 rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg-card)] p-4 shadow-sm sm:grid-cols-2 lg:grid-cols-4"
          aria-label="Synthèse mémoire"
        >
          <Stat label="Courses enregistrées" value={String(agg.raceCount)} />
          <Stat
            label="Score nutritionnel moyen"
            value={agg.raceCount ? `${agg.avgNutritionScore} / 100` : "—"}
          />
          <Stat label="Produit le plus utilisé" value={agg.topProduct ? agg.topProduct.name : "—"} />
          <Stat label="Sport dominant" value={agg.dominantSport ? SPORT_FR[agg.dominantSport] : "—"} />
        </section>
      ) : null}

      {error == null && races && races.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-[var(--color-border)] bg-[var(--color-bg-card)] p-8 text-center shadow-sm">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-[color-mix(in_srgb,var(--color-primary)_10%,white)] text-3xl" aria-hidden>
            🏁
          </div>
          <p className="mt-4 text-[15px] font-semibold text-[var(--color-text)]">Ta première course alimentera ta mémoire nutritionnelle</p>
          <p className="mt-2 text-sm text-[var(--color-text-muted)]">
            Enregistre une sortie après l&apos;arrivée pour commencer à construire des repères utiles pour tes prochains objectifs d&apos;endurance.
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <Link href="/history/new">
              <Button variant="primary" className="min-h-11 px-5">
                Saisir une course
              </Button>
            </Link>
          </div>
        </div>
      ) : null}

      {races && races.length > 0 ? (
        <ul className="flex flex-col gap-3">
          {races.map((r) => (
            <li key={r.id}>
              <RaceCard race={r} />
            </li>
          ))}
        </ul>
      ) : null}

      {races && races.length > 0 ? (
        <p className="text-center text-xs text-[var(--color-text-muted)]">
          <Link href="/history" className="font-semibold text-[var(--color-primary)] underline-offset-2 hover:underline">
            Ouvrir la page Mémoire complète
          </Link>
        </p>
      ) : null}
    </div>
  );
}
