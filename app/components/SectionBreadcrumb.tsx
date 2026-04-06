'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { sectionLabelForPathname } from '../lib/navSections';

const crumbStyle = {
  fontSize: 12,
  fontWeight: 600,
  letterSpacing: '0.04em',
  color: 'var(--color-text-muted)',
} as const;

const sep = '·';

export function SectionBreadcrumb() {
  const pathname = usePathname();
  const current = sectionLabelForPathname(pathname);
  if (!current) return null;

  return (
    <nav aria-label="Fil d'Ariane" style={{ marginBottom: 14 }}>
      <ol
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          gap: 8,
          listStyle: 'none',
          margin: 0,
          padding: 0,
        }}
      >
        <li style={crumbStyle}>
          <Link href="/" style={{ color: 'var(--color-accent)', textDecoration: 'none' }}>
            Accueil
          </Link>
        </li>
        <li style={crumbStyle} aria-hidden>
          {sep}
        </li>
        <li style={{ ...crumbStyle, color: 'var(--color-text)' }} aria-current="page">
          {current}
        </li>
      </ol>
    </nav>
  );
}
