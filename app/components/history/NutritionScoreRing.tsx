'use client';

import type { NutritionScoreBreakdown } from '@/lib/nutrition/raceHistory';

export type NutritionScoreRingProps = {
  score: number;
  breakdown: NutritionScoreBreakdown;
};

export function NutritionScoreRing({ score, breakdown }: NutritionScoreRingProps) {
  const pct = Math.min(100, Math.max(0, score));
  const deg = (pct / 100) * 360;

  return (
    <div className="flex flex-col items-center gap-6 sm:flex-row sm:items-start sm:justify-center">
      <div
        className="relative grid h-36 w-36 shrink-0 place-items-center rounded-full"
        style={{
          background: `conic-gradient(var(--color-accent) ${deg}deg, var(--color-border-subtle) 0)`,
        }}
        aria-hidden
      >
        <div className="flex h-[120px] w-[120px] flex-col items-center justify-center rounded-full bg-[var(--color-bg-card)] text-center shadow-[var(--shadow-xs)]">
          <div className="font-display text-3xl font-extrabold text-[var(--color-text)]">{Math.round(score)}</div>
          <div className="mt-0.5 text-[11px] font-bold text-[var(--color-text-muted)]">/ 100</div>
        </div>
      </div>
      <div className="w-full max-w-sm space-y-3 text-[13px]">
        <ScoreRow label="Respect du plan CHO/h (40 %)" value={breakdown.choCompliance} />
        <ScoreRow label="Taux de prises effectuées (30 %)" value={breakdown.intakeCompliance} />
        <ScoreRow label="Confort GI (30 %)" value={breakdown.giComfort} />
      </div>
    </div>
  );
}

function ScoreRow({ label, value }: { label: string; value: number }) {
  return (
    <div>
      <div className="mb-1 flex justify-between gap-2 font-semibold text-[var(--color-text)]">
        <span>{label}</span>
        <span className="tabular-nums text-[var(--color-text-muted)]">{Math.round(value)}</span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-[var(--color-border-subtle)]">
        <div
          className="h-full rounded-full bg-[var(--color-accent)] transition-[width]"
          style={{ width: `${Math.min(100, Math.max(0, value))}%` }}
        />
      </div>
    </div>
  );
}
