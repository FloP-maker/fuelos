'use client';

import type { RaceEvent } from '@/types/race';
import { sumProductQuantities } from '@/lib/nutrition/raceHistory';

export type NutritionComparisonTableProps = {
  race: RaceEvent;
};

function deltaPct(planned: number, actual: number): number {
  if (!Number.isFinite(planned) || Math.abs(planned) < 1e-9) return 0;
  return ((actual - planned) / planned) * 100;
}

function fmtDelta(pct: number): string {
  const rounded = Math.round(pct);
  if (rounded === 0) return '0%';
  const sign = rounded > 0 ? '+' : '';
  return `${sign}${rounded}%`;
}

export function NutritionComparisonTable({ race }: NutritionComparisonTableProps) {
  const plannedIntakes = sumProductQuantities(race.plannedNutrition.totalProducts);
  const actualIntakes = sumProductQuantities(race.actualNutrition.takenProducts);
  const intakeDelta =
    plannedIntakes > 0 ? deltaPct(plannedIntakes, actualIntakes) : 0;

  const rows: {
    label: string;
    planned: string;
    actual: string;
    delta: string;
  }[] = [
    {
      label: 'CHO/h',
      planned: `${Math.round(race.plannedNutrition.choPerHour)} g`,
      actual: `${Math.round(race.actualNutrition.choPerHour)} g`,
      delta: fmtDelta(
        deltaPct(race.plannedNutrition.choPerHour, race.actualNutrition.choPerHour)
      ),
    },
    {
      label: 'Sodium/h',
      planned: `${Math.round(race.plannedNutrition.sodiumPerHour)} mg`,
      actual: `${Math.round(race.actualNutrition.sodiumPerHour)} mg`,
      delta: fmtDelta(
        deltaPct(race.plannedNutrition.sodiumPerHour, race.actualNutrition.sodiumPerHour)
      ),
    },
    {
      label: 'Fluides/h',
      planned: `${Math.round(race.plannedNutrition.fluidPerHour)} ml`,
      actual: `${Math.round(race.actualNutrition.fluidPerHour)} ml`,
      delta: fmtDelta(
        deltaPct(race.plannedNutrition.fluidPerHour, race.actualNutrition.fluidPerHour)
      ),
    },
    {
      label: 'Prises (unités)',
      planned: String(Math.round(plannedIntakes)),
      actual: String(Math.round(actualIntakes)),
      delta: fmtDelta(intakeDelta),
    },
  ];

  return (
    <div className="overflow-x-auto rounded-[var(--radius-md)] border border-[var(--color-border)]">
      <table className="w-full min-w-[320px] border-collapse text-left text-[13px]">
        <thead>
          <tr className="border-b border-[var(--color-border)] bg-[var(--color-bg-elevated)]">
            <th className="px-3 py-2.5 font-extrabold text-[var(--color-text)]">Métrique</th>
            <th className="px-3 py-2.5 font-extrabold text-[var(--color-text)]">Prévu</th>
            <th className="px-3 py-2.5 font-extrabold text-[var(--color-text)]">Réel</th>
            <th className="px-3 py-2.5 font-extrabold text-[var(--color-text)]">Delta</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.label} className="border-b border-[var(--color-border-subtle)] last:border-b-0">
              <td className="px-3 py-2.5 font-semibold text-[var(--color-text)]">{r.label}</td>
              <td className="px-3 py-2.5 text-[var(--color-text-muted)]">{r.planned}</td>
              <td className="px-3 py-2.5 text-[var(--color-text-muted)]">{r.actual}</td>
              <td
                className={`px-3 py-2.5 font-bold ${
                  r.delta.startsWith('-')
                    ? 'text-amber-600 dark:text-amber-400'
                    : r.delta.startsWith('+')
                      ? 'text-emerald-600 dark:text-emerald-400'
                      : 'text-[var(--color-text-muted)]'
                }`}
              >
                {r.delta}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
