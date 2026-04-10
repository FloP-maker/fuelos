'use client';

import Link from 'next/link';
import type { NextRaceReco as NextRaceRecoModel } from '@/lib/nutrition-profile';

export function NextRaceReco({ reco }: { reco: NextRaceRecoModel }) {
  return (
    <div
      style={{
        marginTop: 16,
        padding: '16px 18px',
        borderRadius: 14,
        border: '1px solid #bbf7d0',
        background: '#f0fdf4',
      }}
    >
      <h3 style={{ margin: '0 0 10px', fontSize: 15, fontWeight: 800, color: 'var(--color-text)' }}>
        🗓️ Avant {reco.raceName}
      </h3>
      <p style={{ margin: '0 0 14px', fontSize: 14, lineHeight: 1.5, color: 'var(--color-text-muted)' }}>
        {reco.message}
      </p>
      <Link
        href={reco.actionHref}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '10px 16px',
          borderRadius: 10,
          fontWeight: 700,
          fontSize: 14,
          textDecoration: 'none',
          color: '#fff',
          background: '#16a34a',
          border: '1px solid #15803d',
        }}
      >
        {reco.actionLabel}
      </Link>
    </div>
  );
}
