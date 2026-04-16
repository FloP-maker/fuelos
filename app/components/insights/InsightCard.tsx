'use client';

import Link from 'next/link';
import type { InsightCard as InsightCardModel } from '@/lib/nutrition-profile';

const BORDER: Record<InsightCardModel['type'], string> = {
  warning: '#ea580c',
  positive: '#16a34a',
  suggestion: '#2563eb',
};

const ICON: Record<InsightCardModel['type'], string> = {
  warning: '⚠️',
  positive: '✅',
  suggestion: '💡',
};

export function InsightCard({
  insight,
  sparklinePoints,
}: {
  insight: InsightCardModel;
  sparklinePoints?: number[];
}) {
  const border = BORDER[insight.type];
  const icon = ICON[insight.type];
  const sparklineMax = sparklinePoints && sparklinePoints.length > 0 ? Math.max(1, ...sparklinePoints) : 1;
  const sparklinePath =
    sparklinePoints && sparklinePoints.length > 1
      ? sparklinePoints
          .map((v, i) => {
            const x = (i / (sparklinePoints.length - 1)) * 72;
            const y = 22 - (v / sparklineMax) * 16;
            return `${x},${y}`;
          })
          .join(' ')
      : null;

  return (
    <div
      style={{
        display: 'flex',
        gap: 12,
        padding: '12px 14px',
        borderRadius: 12,
        border: '1px solid var(--color-border)',
        background: 'var(--color-bg-card)',
        boxShadow: '0 1px 0 color-mix(in srgb, var(--color-border) 40%, transparent)',
      }}
    >
      <div style={{ width: 4, borderRadius: 4, background: border, flexShrink: 0 }} aria-hidden />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8 }}>
          <div style={{ display: 'flex', gap: 8, alignItems: 'flex-start', minWidth: 0 }}>
            <span style={{ fontSize: 16, lineHeight: 1.2 }} aria-hidden>
              {icon}
            </span>
            <div>
              <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--color-text)' }}>{insight.title}</div>
              <p style={{ margin: '6px 0 0', fontSize: 13, lineHeight: 1.45, color: 'var(--color-text-muted)' }}>
                {insight.body}
              </p>
            </div>
          </div>
          {insight.actionLabel && insight.actionHref ? (
            <Link
              href={insight.actionHref}
              style={{
                flexShrink: 0,
                fontSize: 13,
                fontWeight: 600,
                color: '#16a34a',
                textDecoration: 'none',
                whiteSpace: 'nowrap',
              }}
            >
              {insight.actionLabel}
            </Link>
          ) : null}
        </div>
        {sparklinePath ? (
          <div style={{ marginTop: 8 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--color-text-muted)', marginBottom: 4 }}>
              Évolution récente
            </div>
            <svg viewBox="0 0 72 24" width="100%" height="24" aria-label="Évolution de l'insight">
              <polyline
                fill="none"
                stroke={border}
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                points={sparklinePath}
              />
            </svg>
          </div>
        ) : null}
      </div>
    </div>
  );
}
