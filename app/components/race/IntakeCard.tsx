'use client';

import { useEffect, useMemo } from 'react';
import clsx from 'clsx';
import type { IntakeStatus, PlannedIntake } from '@/types/race-session';

export type IntakeCardProps = {
  intake: PlannedIntake;
  currentMin: number;
  onPress: () => void;
};

function displayStatus(intake: PlannedIntake, currentMin: number): IntakeStatus | 'due' {
  if (intake.status !== 'pending') return intake.status;
  const until = intake.scheduledAtMin - currentMin;
  if (until <= 5 && until >= -1) return 'due';
  return 'pending';
}

export function IntakeCard({ intake, currentMin, onPress }: IntakeCardProps) {
  const vis = useMemo(() => displayStatus(intake, currentMin), [intake, currentMin]);

  useEffect(() => {
    if (vis !== 'due' || typeof navigator === 'undefined' || !navigator.vibrate) return;
    navigator.vibrate(12);
  }, [vis, intake.scheduledAtMin, currentMin]);

  const countdown =
    intake.status === 'pending'
      ? `${Math.max(0, Math.round(intake.scheduledAtMin - currentMin))} min`
      : null;

  const palette = {
    pending: 'border-[var(--color-border)] bg-[var(--color-bg-card)]',
    due: 'border-orange-400/70 bg-orange-500/15 animate-pulse',
    taken: 'border-emerald-500/60 bg-emerald-500/10',
    skipped: 'border-red-300/50 bg-red-500/10',
    modified: 'border-sky-500/60 bg-sky-500/10',
    vomited: 'border-red-700/70 bg-red-900/25',
    delayed: 'border-amber-500/70 bg-amber-500/12',
  } as const;

  const icon = {
    pending: '⏱',
    due: '⏳',
    taken: '✓',
    skipped: '✗',
    modified: '✎',
    vomited: '⚠️',
    delayed: '+',
  } as const;

  const key = vis === 'due' ? 'due' : vis;
  const delayBadge =
    intake.status === 'delayed' && intake.actualIntake
      ? `+${Math.max(0, Math.round(intake.actualIntake.takenAtMin - intake.scheduledAtMin))} min`
      : null;

  return (
    <button
      type="button"
      onClick={onPress}
      className={clsx(
        'flex w-full min-w-0 items-start gap-3 rounded-xl border px-3 py-3 text-left transition-colors',
        palette[key as keyof typeof palette] ?? palette.pending
      )}
    >
      <span className="text-xl leading-none" aria-hidden>
        {icon[key as keyof typeof icon] ?? icon.pending}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-[15px] font-bold text-[var(--color-text)]">{intake.product.name}</span>
        <span className="mt-0.5 block text-[12px] text-[var(--color-text-muted)]">
          {intake.scheduledAtMin}′ · {Math.round(intake.scheduledAtKm * 10) / 10} km · {Math.round(intake.choG)}g CHO
        </span>
        {countdown ? (
          <span className="mt-1 block text-[12px] font-semibold text-[var(--color-text-muted)]">{countdown}</span>
        ) : null}
        {intake.status === 'taken' || intake.status === 'modified' || intake.status === 'delayed' ? (
          <span className="mt-1 block text-[11px] text-emerald-700 dark:text-emerald-300">
            Pris vers {intake.actualIntake?.takenAtMin ?? intake.scheduledAtMin}′
          </span>
        ) : null}
        {delayBadge ? (
          <span className="mt-1 inline-block rounded-full bg-amber-500/20 px-2 py-0.5 text-[11px] font-bold text-amber-800 dark:text-amber-200">
            {delayBadge}
          </span>
        ) : null}
      </span>
    </button>
  );
}
