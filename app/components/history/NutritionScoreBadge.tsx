'use client';

import type { CSSProperties } from 'react';

export type NutritionScoreBadgeProps = {
  score: number;
  size?: 'sm' | 'md';
};

function tier(score: number): 'high' | 'mid' | 'low' {
  if (score > 80) return 'high';
  if (score >= 60) return 'mid';
  return 'low';
}

const STYLE: Record<
  ReturnType<typeof tier>,
  { bg: string; fg: string; border: string }
> = {
  high: { bg: 'color-mix(in srgb, #16a34a 16%, transparent)', fg: '#16a34a', border: '#bbf7d0' },
  mid: { bg: 'color-mix(in srgb, #f59e0b 14%, transparent)', fg: '#d97706', border: '#fde68a' },
  low: { bg: 'color-mix(in srgb, #dc2626 12%, transparent)', fg: '#dc2626', border: '#fecaca' },
};

export function NutritionScoreBadge({ score, size = 'md' }: NutritionScoreBadgeProps) {
  const t = tier(score);
  const pal = STYLE[t];
  const pad = size === 'sm' ? '4px 10px' : '6px 12px';
  const fs = size === 'sm' ? 12 : 13;

  const css: CSSProperties = {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 6,
    padding: pad,
    borderRadius: 999,
    fontWeight: 800,
    fontSize: fs,
    background: pal.bg,
    color: pal.fg,
    border: `1px solid ${pal.border}`,
  };

  return (
    <span style={css} title="Score nutritionnel 0–100">
      <span aria-hidden>◎</span>
      Score {Math.round(score)}
    </span>
  );
}
