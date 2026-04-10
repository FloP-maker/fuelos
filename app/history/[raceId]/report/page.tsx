'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { useEffect, useMemo, useState } from 'react';
import { Header } from '@/app/components/Header';
import { NutritionScoreBadge } from '@/app/components/history/NutritionScoreBadge';
import { NutritionScoreRing } from '@/app/components/history/NutritionScoreRing';
import { InsightCard } from '@/app/components/history/InsightCard';
import {
  generateInsights,
  raceEventFromJson,
  scoreNutritionBreakdown,
} from '@/lib/nutrition/raceHistory';
import {
  cumulativeChoPerKmSeries,
  phaseAnalysis,
  summarizePlannedVsActual,
} from '@/lib/nutrition/plannedVsActualReport';
import type { RaceEvent } from '@/types/race';
import type { PlannedIntake } from '@/types/race-session';

function deltaPct(planned: number, actual: number): string {
  if (!Number.isFinite(planned) || planned <= 0) return '—';
  const p = ((actual - planned) / planned) * 100;
  return `${p >= 0 ? '+' : ''}${Math.round(p)}%`;
}

function statusEmoji(pct: number): string {
  if (pct <= -15) return '🔴';
  if (pct <= -5) return '⚠️';
  return '✅';
}

export default function RaceNutritionReportPage() {
  const params = useParams();
  const raceId = String(params?.raceId ?? '');
  const { status } = useSession();
  const [race, setRace] = useState<RaceEvent | null>(null);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    if (status !== 'authenticated' || !raceId) return;
    void (async () => {
      try {
        const res = await fetch(`/api/user/race-events/${raceId}`, { credentials: 'include' });
        if (!res.ok) {
          setErr(res.status === 404 ? 'Course introuvable.' : 'Erreur de chargement.');
          return;
        }
        const body = (await res.json()) as { race?: unknown };
        const r = body.race ? raceEventFromJson(body.race) : null;
        setRace(r);
        if (!r?.intakeTimeline?.length) {
          setErr(null);
        }
      } catch {
        setErr('Erreur réseau.');
      }
    })();
  }, [status, raceId]);

  const intakes: PlannedIntake[] = useMemo(() => race?.intakeTimeline ?? [], [race]);

  const summary = useMemo(() => summarizePlannedVsActual(intakes), [intakes]);
  const phases = useMemo(() => (race ? phaseAnalysis(race, intakes) : []), [race, intakes]);
  const series = useMemo(
    () => (race ? cumulativeChoPerKmSeries(intakes, race.distanceKm, race.durationMin) : []),
    [intakes, race]
  );

  const breakdown = useMemo(() => (race ? scoreNutritionBreakdown(race) : null), [race]);
  const insights = useMemo(() => (race ? generateInsights(race) : []), [race]);

  const chartW = 320;
  const chartH = 140;
  const maxY = useMemo(() => {
    if (series.length === 0) return 1;
    return Math.max(10, ...series.map((p) => Math.max(p.plannedChoPerH, p.actualChoPerH)));
  }, [series]);

  const linePath = (key: 'plannedChoPerH' | 'actualChoPerH') =>
    series
      .map((p, i) => {
        const x = (i / Math.max(series.length - 1, 1)) * chartW;
        const y = chartH - (p[key] / maxY) * chartH;
        return `${i === 0 ? 'M' : 'L'}${x},${y}`;
      })
      .join(' ');

  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-[var(--color-bg)] px-4 py-10 text-[var(--color-text)]">
        Chargement…
      </div>
    );
  }

  if (err || !race) {
    return (
      <div className="fuel-page min-h-screen">
        <Header sticky />
        <main className="fuel-main px-4 py-8">
          <p className="text-[var(--color-text-muted)]">{err ?? 'Course introuvable.'}</p>
          <Link href="/history" className="mt-4 inline-block font-bold text-emerald-600">
            ← Historique
          </Link>
        </main>
      </div>
    );
  }

  if (intakes.length === 0) {
    return (
      <div className="fuel-page min-h-screen">
        <Header sticky />
        <main className="fuel-main px-4 py-8">
          <h1 className="font-display text-xl font-extrabold">Rapport Prévu / Réel</h1>
          <p className="mt-2 text-[var(--color-text-muted)]">
            Aucune prise horodatée enregistrée pour cette course. Utilise le mode course enrichi pour
            alimenter ce rapport.
          </p>
          <Link href={`/history/${raceId}`} className="mt-4 inline-block font-bold text-emerald-600">
            ← Fiche course
          </Link>
        </main>
      </div>
    );
  }

  const choDelta = deltaPct(summary.choPlannedG, summary.choActualG);
  const naDelta = deltaPct(summary.sodiumPlannedMg, summary.sodiumActualMg);
  const flDelta = deltaPct(summary.fluidPlannedMl, summary.fluidActualMl);
  const intakeDelta = deltaPct(summary.intakesPlanned, summary.intakesTakenOrModified);

  return (
    <div className="fuel-page min-h-screen">
      <Header sticky />
      <main className="fuel-main mx-auto max-w-lg px-4 py-6" style={{ minWidth: 0 }}>
        <div className="mb-2">
          <Link href={`/history/${raceId}`} className="text-[13px] font-bold text-emerald-600">
            ← {race.name}
          </Link>
        </div>
        <h1 className="font-display text-2xl font-extrabold">Rapport Prévu · Réel</h1>
        <p className="mt-1 text-[13px] text-[var(--color-text-muted)]">
          Synthèse générée à partir des prises suivies en mode course.
        </p>

        <section className="mt-6 rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg-card)] p-4">
          <h2 className="m-0 text-[15px] font-extrabold">Score global</h2>
          <div className="mt-3 flex flex-wrap items-center gap-3">
            <NutritionScoreBadge score={race.nutritionScore} />
          </div>
          {breakdown ? (
            <div className="mt-4">
              <NutritionScoreRing score={breakdown.total} breakdown={breakdown} />
            </div>
          ) : null}
        </section>

        <section className="mt-6 rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg-card)] p-4">
          <h2 className="m-0 text-[15px] font-extrabold">Timeline comparative (CHO/h cumulé ~ par km)</h2>
          <svg
            width="100%"
            viewBox={`0 0 ${chartW} ${chartH + 24}`}
            className="mt-3 max-h-48"
            role="img"
            aria-label="Graphique Prévu vs Réel"
          >
            <path
              d={linePath('plannedChoPerH')}
              fill="none"
              stroke="#22c55e"
              strokeWidth={2}
              strokeDasharray="6 4"
            />
            <path d={linePath('actualChoPerH')} fill="none" stroke="#f97316" strokeWidth={2.5} />
            {intakes.map((i) => {
              const x =
                (Math.min(i.scheduledAtKm, race.distanceKm) / Math.max(race.distanceKm, 0.001)) * chartW;
              let sym = '·';
              let fill = '#9ca3af';
              if (i.status === 'taken' || i.status === 'delayed') {
                sym = '✓';
                fill = '#22c55e';
              } else if (i.status === 'skipped') {
                sym = '✗';
                fill = '#ef4444';
              } else if (i.status === 'modified') {
                sym = '↔';
                fill = '#0ea5e9';
              } else if (i.status === 'vomited') {
                sym = '🤢';
                fill = '#991b1b';
              }
              if (i.status === 'delayed') fill = '#f59e0b';
              return (
                <text key={i.id} x={x} y={chartH + 16} fontSize={10} fill={fill} textAnchor="middle">
                  {sym}
                </text>
              );
            })}
          </svg>
          <div className="flex flex-wrap gap-3 text-[11px] text-[var(--color-text-muted)]">
            <span className="text-emerald-600">━━ Prévu</span>
            <span className="text-orange-500">━━ Réel</span>
          </div>
        </section>

        <section className="mt-6 overflow-x-auto rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg-card)] p-4">
          <h2 className="m-0 text-[15px] font-extrabold">Tableau récapitulatif</h2>
          <table className="mt-3 w-full min-w-[320px] text-left text-[12px]">
            <thead>
              <tr className="text-[var(--color-text-muted)]">
                <th className="py-1 pr-2">Métrique</th>
                <th className="py-1 pr-2">Prévu</th>
                <th className="py-1 pr-2">Réel</th>
                <th className="py-1 pr-2">Delta</th>
                <th className="py-1">Statut</th>
              </tr>
            </thead>
            <tbody className="tabular-nums">
              <tr>
                <td className="py-1 font-medium">CHO total (g)</td>
                <td>{Math.round(summary.choPlannedG)}g</td>
                <td>{Math.round(summary.choActualG)}g</td>
                <td>{choDelta}</td>
                <td>{statusEmoji(Number(choDelta.replace(/[^\d-]/g, '')))}</td>
              </tr>
              <tr>
                <td className="py-1 font-medium">Sodium (mg)</td>
                <td>{Math.round(summary.sodiumPlannedMg)}mg</td>
                <td>{Math.round(summary.sodiumActualMg)}mg</td>
                <td>{naDelta}</td>
                <td>{statusEmoji(Number(naDelta.replace(/[^\d-]/g, '')))}</td>
              </tr>
              <tr>
                <td className="py-1 font-medium">Fluides (ml)</td>
                <td>{Math.round(summary.fluidPlannedMl)}ml</td>
                <td>{Math.round(summary.fluidActualMl)}ml</td>
                <td>{flDelta}</td>
                <td>{statusEmoji(Number(flDelta.replace(/[^\d-]/g, '')))}</td>
              </tr>
              <tr>
                <td className="py-1 font-medium">Prises</td>
                <td>{summary.intakesPlanned}</td>
                <td>{summary.intakesTakenOrModified}</td>
                <td>{intakeDelta}</td>
                <td>ℹ️</td>
              </tr>
              <tr>
                <td className="py-1 font-medium">Modifiées</td>
                <td>—</td>
                <td>{summary.intakesModified}</td>
                <td>—</td>
                <td>ℹ️</td>
              </tr>
              <tr>
                <td className="py-1 font-medium">Vomies</td>
                <td>—</td>
                <td>{summary.intakesVomited}</td>
                <td>—</td>
                <td>{summary.intakesVomited > 0 ? '⚠️' : '✅'}</td>
              </tr>
            </tbody>
          </table>
        </section>

        <section className="mt-6 rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg-card)] p-4">
          <h2 className="m-0 text-[15px] font-extrabold">Par phase</h2>
          <div className="mt-3 grid gap-2">
            {phases.map((p) => (
              <div
                key={p.label}
                className="flex items-start justify-between gap-2 rounded-xl border border-[var(--color-border)] px-3 py-2"
              >
                <div>
                  <div className="text-[13px] font-bold">{p.label}</div>
                  <div className="text-[11px] text-[var(--color-text-muted)]">{p.giNotes}</div>
                </div>
                <span
                  className={
                    p.badge === 'good'
                      ? 'text-emerald-600'
                      : p.badge === 'mid'
                        ? 'text-amber-600'
                        : 'text-red-600'
                  }
                >
                  {p.badge === 'good' ? '🟢' : p.badge === 'mid' ? '🟠' : '🔴'} {p.compliancePct}%
                </span>
              </div>
            ))}
          </div>
        </section>

        {insights.length > 0 ? (
          <section className="mt-6">
            <h2 className="m-0 text-[15px] font-extrabold">Insights</h2>
            <div className="mt-3 grid gap-2">
              {insights.map((t) => (
                <InsightCard key={t.slice(0, 48)} text={t} />
              ))}
            </div>
          </section>
        ) : null}
      </main>
    </div>
  );
}
