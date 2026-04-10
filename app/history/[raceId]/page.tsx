'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { useEffect, useState } from 'react';
import { Header } from '@/app/components/Header';
import { Button } from '@/app/components/Button';
import { NutritionComparisonTable } from '@/app/components/history/NutritionComparisonTable';
import { GITimeline } from '@/app/components/history/GITimeline';
import { InsightCard } from '@/app/components/history/InsightCard';
import { NutritionScoreRing } from '@/app/components/history/NutritionScoreRing';
import { raceEventFromJson, scoreNutritionBreakdown } from '@/lib/nutrition/raceHistory';
import type { RaceEvent, RaceSport } from '@/types/race';

const SPORT_FR: Record<RaceSport, string> = {
  trail: 'Trail',
  marathon: 'Marathon',
  triathlon: 'Triathlon',
  cyclisme: 'Cyclisme',
  autre: 'Autre',
};

const WEATHER_FR: Record<RaceEvent['weather']['conditions'], string> = {
  soleil: 'Soleil',
  nuageux: 'Nuageux',
  pluie: 'Pluie',
  chaleur: 'Chaleur',
  froid: 'Froid',
};

function formatDateFr(d: Date): string {
  return new Intl.DateTimeFormat('fr-FR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(d);
}

function formatDuration(min: number): string {
  const h = Math.floor(min / 60);
  const m = Math.round(min % 60);
  if (h <= 0) return `${m} min`;
  return `${h} h ${m.toString().padStart(2, '0')}`;
}

export default function HistoryRaceDetailPage() {
  const params = useParams();
  const raceId = typeof params?.raceId === 'string' ? params.raceId : '';
  const { status } = useSession();
  const [race, setRace] = useState<RaceEvent | null>(null);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    if (!raceId || status !== 'authenticated') return;
    void (async () => {
      setErr(null);
      const res = await fetch(`/api/user/race-events/${raceId}`, { credentials: 'include' });
      if (!res.ok) {
        setRace(null);
        setErr(res.status === 404 ? 'notfound' : 'error');
        return;
      }
      const body = (await res.json()) as { race?: unknown };
      const r = body.race ? raceEventFromJson(body.race) : null;
      setRace(r);
      if (!r) setErr('error');
    })();
  }, [raceId, status]);

  const breakdown = race ? scoreNutritionBreakdown(race) : null;

  return (
    <div className="min-h-[100dvh] bg-[var(--color-bg)] text-[var(--color-text)]">
      <Header sticky />
      <main className="mx-auto w-full max-w-[var(--fuel-shell-max)] px-4 pb-16 pt-6" style={{ minWidth: 0 }}>
        <div className="mb-6">
          <Link
            href="/history"
            className="text-[13px] font-bold text-[var(--color-accent)] hover:underline"
          >
            ← Historique
          </Link>
        </div>

        {status === 'unauthenticated' ? (
          <p className="text-[14px] text-[var(--color-text-muted)]">Connecte-toi pour voir cette course.</p>
        ) : null}

        {err === 'notfound' ? (
          <p className="text-[14px] text-[var(--color-danger)]">Course introuvable.</p>
        ) : null}
        {err === 'error' && !race ? (
          <p className="text-[14px] text-[var(--color-danger)]">Chargement impossible.</p>
        ) : null}

        {race ? (
          <>
            <section className="mb-8 rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-bg-card)] p-5 shadow-[var(--shadow-xs)]">
              <h1 className="font-display text-xl font-extrabold md:text-2xl">{race.name}</h1>
              <p className="mt-2 text-[14px] text-[var(--color-text-muted)]">
                {formatDateFr(race.date)} · {SPORT_FR[race.sport]}
              </p>
              <p className="mt-3 text-[14px] leading-relaxed text-[var(--color-text)]">
                Météo : {WEATHER_FR[race.weather.conditions]} · {Math.round(race.weather.tempC)} °C · humidité{' '}
                {Math.round(race.weather.humidity)} %
              </p>
              <p className="mt-2 text-[14px] text-[var(--color-text)]">
                {race.distanceKm.toFixed(1)} km · D+ {Math.round(race.elevationGainM)} m · durée réelle{' '}
                {formatDuration(race.durationMin)}
              </p>
            </section>

            <section className="mb-8">
              <h2 className="mb-3 font-display text-lg font-extrabold">Nutrition prévu vs réel</h2>
              <NutritionComparisonTable race={race} />
              {(race.intakeTimeline?.length ?? 0) > 0 ? (
                <div className="mt-4">
                  <Link
                    href={`/history/${raceId}/report`}
                    className="inline-flex rounded-full border border-[var(--color-border)] bg-[var(--color-bg)] px-4 py-2 text-[13px] font-bold text-[var(--color-accent)] hover:underline"
                  >
                    Rapport Prévu / Réel (prises)
                  </Link>
                </div>
              ) : null}
              <div className="mt-4 grid gap-3 sm:grid-cols-3">
                <CompareBar label="CHO/h" planned={race.plannedNutrition.choPerHour} actual={race.actualNutrition.choPerHour} max={120} unit="g" />
                <CompareBar
                  label="Sodium/h"
                  planned={race.plannedNutrition.sodiumPerHour}
                  actual={race.actualNutrition.sodiumPerHour}
                  max={1600}
                  unit="mg"
                />
                <CompareBar
                  label="Fluides/h"
                  planned={race.plannedNutrition.fluidPerHour}
                  actual={race.actualNutrition.fluidPerHour}
                  max={1200}
                  unit="ml"
                />
              </div>
            </section>

            <section className="mb-8 rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-bg-card)] p-5">
              <h2 className="mb-3 font-display text-lg font-extrabold">Journal GI</h2>
              <p className="mb-4 text-[14px] text-[var(--color-text-muted)]">
                Score global : <strong className="text-[var(--color-text)]">{race.giLog.overallScore}/5</strong>
                {race.giLog.notes ? (
                  <>
                    <br />
                    Notes : {race.giLog.notes}
                  </>
                ) : null}
              </p>
              <GITimeline distanceKm={race.distanceKm} symptoms={race.giLog.symptoms} />
            </section>

            <section className="mb-8">
              <h2 className="mb-3 font-display text-lg font-extrabold">Insights</h2>
              <div className="flex flex-col gap-3">
                {race.insights.map((t, i) => (
                  <InsightCard key={i} text={t} />
                ))}
              </div>
            </section>

            <section className="mb-10 rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-bg-card)] p-5">
              <h2 className="mb-5 text-center font-display text-lg font-extrabold md:text-left">
                Score nutritionnel
              </h2>
              {breakdown ? (
                <NutritionScoreRing score={race.nutritionScore} breakdown={breakdown} />
              ) : null}
            </section>

            <div className="flex flex-wrap gap-3">
              <Link href="/history">
                <Button type="button" variant="secondary" size="md">
                  Retour à la liste
                </Button>
              </Link>
            </div>
          </>
        ) : null}
      </main>
    </div>
  );
}

function CompareBar({
  label,
  planned,
  actual,
  max,
  unit,
}: {
  label: string;
  planned: number;
  actual: number;
  max: number;
  unit: string;
}) {
  const pm = Math.max(1, max);
  const pw = Math.min(100, (planned / pm) * 100);
  const aw = Math.min(100, (actual / pm) * 100);
  return (
    <div className="rounded-[var(--radius-md)] border border-[var(--color-border-subtle)] bg-[var(--color-bg-elevated)] p-3">
      <div className="text-[12px] font-extrabold text-[var(--color-text)]">{label}</div>
      <div className="mt-2 space-y-1.5">
        <div>
          <div className="text-[10px] font-bold text-[var(--color-text-muted)]">Prévu</div>
          <div className="h-2 overflow-hidden rounded-full bg-[var(--color-border-subtle)]">
            <div className="h-full rounded-full bg-zinc-400 dark:bg-zinc-500" style={{ width: `${pw}%` }} />
          </div>
          <div className="mt-0.5 text-[11px] text-[var(--color-text-muted)]">
            {Math.round(planned)} {unit}/h
          </div>
        </div>
        <div>
          <div className="text-[10px] font-bold text-[var(--color-text-muted)]">Réel</div>
          <div className="h-2 overflow-hidden rounded-full bg-[var(--color-border-subtle)]">
            <div className="h-full rounded-full bg-[var(--color-accent)]" style={{ width: `${aw}%` }} />
          </div>
          <div className="mt-0.5 text-[11px] text-[var(--color-text-muted)]">
            {Math.round(actual)} {unit}/h
          </div>
        </div>
      </div>
    </div>
  );
}
