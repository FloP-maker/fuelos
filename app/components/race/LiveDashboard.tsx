'use client';

import clsx from 'clsx';
import { useRaceLiveOptional } from '@/app/contexts/RaceContext';

function deficitTone(deficit: number, plannedRate: number): 'ok' | 'mid' | 'bad' {
  if (plannedRate <= 0) return 'ok';
  const rel = (deficit / Math.max(plannedRate * 1.5, 30)) * 100;
  const pct = Math.min(100, Math.max(0, rel));
  if (pct < 5) return 'ok';
  if (pct <= 15) return 'mid';
  return 'bad';
}

export function LiveDashboard() {
  const ctx = useRaceLiveOptional();
  if (!ctx?.session) return null;

  const { session, deficitAlert } = ctx;
  const s = session.liveStats;
  const total = session.intakes.length;
  const ok = s.intakesTaken;
  const next = session.intakes.find((i) => i.status === 'pending');
  const minUntil = next ? Math.max(0, next.scheduledAtMin - session.currentMin) : null;
  const tone = deficitTone(s.deficitChoG, session.plannedChoPerHour);

  return (
    <div
      className="sticky top-0 z-20 border-b border-[var(--color-border)] bg-[color-mix(in_srgb,var(--color-bg)_92%,transparent)] px-2 py-2 backdrop-blur-md sm:px-3"
      aria-label="Métriques temps réel"
    >
      <div className="mx-auto grid max-w-md grid-cols-2 gap-2 text-[12px] sm:grid-cols-4">
        <Metric
          label="CHO/h actuel"
          value={`${Math.round(s.choPerHourCurrent)} g/h`}
          muted={false}
        />
        <Metric
          label="Déficit cumulé"
          value={`${Math.round(s.deficitChoG)} g`}
          valueClass={clsx(
            tone === 'ok' && 'text-emerald-600 dark:text-emerald-400',
            tone === 'mid' && 'text-amber-600 dark:text-amber-300',
            tone === 'bad' && 'text-red-600 dark:text-red-400'
          )}
        />
        <Metric label="Prises ok / total" value={`${ok} / ${total}`} />
        <Metric
          label="Prochaine"
          value={next ? `${next.product.name.slice(0, 18)}${next.product.name.length > 18 ? '…' : ''}` : '—'}
          sub={minUntil != null ? `dans ${Math.round(minUntil)} min` : undefined}
        />
      </div>
      {!session.networkOnline ? (
        <div className="mt-1 text-center text-[11px] font-semibold text-amber-700 dark:text-amber-300">
          Offline — sync en attente
        </div>
      ) : null}
      {deficitAlert ? (
        <div className="mt-2 rounded-lg border border-red-300/60 bg-red-500/10 px-2 py-1.5 text-[11px] font-semibold text-red-800 dark:text-red-200">
          Tu accuses un retard glucidique — prends ta prochaine prise maintenant.
        </div>
      ) : null}
    </div>
  );
}

function Metric({
  label,
  value,
  sub,
  muted,
  valueClass,
}: {
  label: string;
  value: string;
  sub?: string;
  muted?: boolean;
  valueClass?: string;
}) {
  return (
    <div
      className={clsx(
        'rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-card)] px-2 py-1.5 shadow-xs',
        muted && 'opacity-90'
      )}
    >
      <div className="text-[10px] font-bold uppercase tracking-wide text-[var(--color-text-muted)]">{label}</div>
      <div className={clsx('mt-0.5 truncate text-[13px] font-extrabold text-[var(--color-text)]', valueClass)}>
        {value}
      </div>
      {sub ? <div className="truncate text-[10px] text-[var(--color-text-muted)]">{sub}</div> : null}
    </div>
  );
}
