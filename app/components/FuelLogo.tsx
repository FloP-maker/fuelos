'use client';

import { useId } from 'react';

type FuelLogoProps = {
  size?: number;
  /** Affiche le mot « FuelOS » à droite du pictogramme */
  withWordmark?: boolean;
  wordmarkClassName?: string;
};

/**
 * Logo pictogramme : pastille dégradée (énergie endurance) + « F » géométrique blanc.
 */
export function FuelLogo({ size = 36, withWordmark, wordmarkClassName }: FuelLogoProps) {
  const uid = useId().replace(/:/g, '');
  const gradId = `fuel-logo-grad-${uid}`;

  const mark = (
    <svg width={size} height={size} viewBox="0 0 40 40" aria-hidden>
      <defs>
        <linearGradient id={gradId} x1="8" y1="6" x2="34" y2="36" gradientUnits="userSpaceOnUse">
          <stop stopColor="var(--color-accent)" />
          <stop offset="1" stopColor="var(--color-energy)" />
        </linearGradient>
      </defs>
      <rect x="2" y="2" width="36" height="36" rx="11" fill={`url(#${gradId})`} />
      <rect x="10" y="9" width="18" height="3.6" rx="1.8" fill="#fff" fillOpacity={0.95} />
      <rect x="10" y="17.2" width="18" height="3.6" rx="1.8" fill="#fff" fillOpacity={0.95} />
      <rect x="10" y="25.4" width="10.5" height="3.6" rx="1.8" fill="#fff" fillOpacity={0.95} />
      <circle cx="31" cy="29" r="2.2" fill="#fff" fillOpacity={0.88} />
    </svg>
  );

  if (!withWordmark) return mark;

  return (
    <span style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
      {mark}
      <span
        className={['fuel-logo-wordmark', wordmarkClassName].filter(Boolean).join(' ')}
        style={{
          fontWeight: 800,
          fontSize: Math.round(size * 0.58),
          fontFamily: 'var(--font-display)',
          letterSpacing: '-0.04em',
          lineHeight: 1,
        }}
      >
        FuelOS
      </span>
    </span>
  );
}
