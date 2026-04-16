'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { mergeStoredAthleteProfile } from '@/app/lib/athleteProfileData';
import type { AthleteProfile } from '@/app/lib/types';
import { generatePatternInsights } from '@/lib/nutrition/patterns';
import { raceEventFromJson } from '@/lib/nutrition/raceHistory';
import type { RaceEvent } from '@/types/race';
import { InsightCard as HistoryInsight } from '@/app/components/history/InsightCard';

export function NutritionPatternsSection() {
  const { status } = useSession();
  const [profile, setProfile] = useState<AthleteProfile | null>(null);
  const [races, setRaces] = useState<RaceEvent[]>([]);

  useEffect(() => {
    if (status !== 'authenticated') return;
    void (async () => {
      try {
        const [ap, re] = await Promise.all([
          fetch('/api/user/athlete-profiles', { credentials: 'include' }).then((r) => r.json()),
          fetch('/api/user/race-events', { credentials: 'include' }).then((r) => r.json()),
        ]);
        const rows = (ap.profiles ?? []) as { isDefault?: boolean; data?: unknown }[];
        const def = rows.find((p) => p.isDefault) ?? rows[0];
        if (def?.data) setProfile(mergeStoredAthleteProfile(def.data as Partial<AthleteProfile>));
        const raw = (re.races ?? []) as unknown[];
        const parsed = raw.map((x) => raceEventFromJson(x)).filter((x): x is RaceEvent => x !== null);
        setRaces(parsed);
      } catch {
        /* ignore */
      }
    })();
  }, [status]);

  const raceCountWithTimeline = useMemo(
    () => races.filter((r) => (r.intakeTimeline?.length ?? 0) > 0).length,
    [races]
  );

  const patterns = profile?.patterns;
  const insights = useMemo(() => {
    if (!patterns) return [];
    return generatePatternInsights(patterns, {
      raceCount: races.length,
      races,
    }).slice(0, 3);
  }, [patterns, races]);

  if (status !== 'authenticated') return null;

  if (raceCountWithTimeline < 3) {
    const progressPct = Math.max(0, Math.min(100, Math.round((raceCountWithTimeline / 3) * 100)));
    return (
      <div
        className="mb-6 rounded-xl border border-dashed border-[var(--color-border)] bg-[var(--color-bg-card)] p-4 text-[13px] leading-relaxed text-[var(--color-text-muted)]"
        style={{ minWidth: 0 }}
      >
        <div className="relative overflow-hidden rounded-xl border border-[var(--color-border)] bg-[color-mix(in_srgb,var(--color-bg-subtle)_60%,var(--color-bg-card))] p-4">
          <div className="absolute inset-0 bg-[linear-gradient(120deg,rgba(15,23,42,0.06),rgba(15,23,42,0.02))]" aria-hidden />
          <div className="relative">
            <div className="mb-1 flex items-center gap-2 font-extrabold text-[var(--color-text)]">
              <span aria-hidden>🔒</span>
              <span>Tes patterns nutritionnels</span>
            </div>
            <p className="m-0">
              Complète 3 courses avec suivi détaillé des prises pour débloquer ton analyse de patterns.
            </p>
            <div className="mt-3">
              <div className="mb-1 flex items-center justify-between text-[11px] font-semibold">
                <span>Progression</span>
                <span>
                  {raceCountWithTimeline}/3 courses
                </span>
              </div>
              <div className="h-2 rounded-full bg-[var(--color-border)]">
                <div
                  className="h-full rounded-full bg-[linear-gradient(90deg,#16a34a,#22c55e)]"
                  style={{ width: `${progressPct}%` }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!patterns) {
    return (
      <div className="mb-6 rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-card)] p-4 text-[13px] text-[var(--color-text-muted)]">
        Analyse des patterns en cours — reviens après ta prochaine course enregistrée sur le compte.
      </div>
    );
  }

  return (
    <div className="mb-8" style={{ minWidth: 0 }}>
      <div className="mb-2 flex flex-wrap items-baseline justify-between gap-2">
        <h3 className="m-0 text-[17px] font-extrabold text-[var(--color-text)]">Tes patterns nutritionnels</h3>
        <span className="rounded-full border border-[var(--color-border)] bg-[var(--color-bg)] px-2 py-0.5 text-[11px] font-bold text-[var(--color-text-muted)]">
          Basé sur {races.length} course{races.length > 1 ? 's' : ''}
        </span>
      </div>

      {patterns.dropZones.length > 0 ? (
        <div className="mb-4">
          <div className="mb-2 text-[12px] font-bold text-[var(--color-text-muted)]">Zones de décrochage (km)</div>
          <div
            className="relative h-8 w-full overflow-hidden rounded-lg border border-[var(--color-border)] bg-[var(--color-bg)]"
            title="Bande distance 0 → max observé"
          >
            <div className="absolute inset-0 opacity-30" style={{ background: 'linear-gradient(90deg, #22c55e, #eab308, #ef4444)' }} />
            {(() => {
              const maxKm = Math.max(50, ...patterns.dropZones.map((z) => z.kmEnd));
              return patterns.dropZones.map((z) => (
                <div
                  key={`${z.kmStart}-${z.kmEnd}`}
                  className="absolute top-0 h-full bg-red-600/55"
                  style={{
                    left: `${(z.kmStart / maxKm) * 100}%`,
                    width: `${((z.kmEnd - z.kmStart) / maxKm) * 100}%`,
                  }}
                  title={`${z.kmStart}–${z.kmEnd} km · ${z.skipRatePercent}% saut · ${z.likelyCause}`}
                />
              ));
            })()}
          </div>
        </div>
      ) : null}

      <div className="grid gap-2">
        {insights.map((text) => (
          <HistoryInsight key={text.slice(0, 40)} text={text} />
        ))}
      </div>

      <div className="mt-3 text-[12px] font-semibold">
        <Link href="/history" className="text-emerald-700 underline-offset-2 hover:underline dark:text-emerald-400">
          Voir l&apos;historique des courses
        </Link>
      </div>
    </div>
  );
}
