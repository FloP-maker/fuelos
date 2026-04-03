'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import type { CSSProperties, ReactNode } from 'react';
import { ThemeToggle } from './ThemeToggle';
import { AuthMenu } from './AuthMenu';

export type HeaderActivePage = 'plan' | 'shop' | 'race' | 'learn' | 'prep';

const NAV: { href: string; label: string; page: HeaderActivePage }[] = [
  { href: '/plan', label: 'Plan', page: 'plan' },
  { href: '/shop', label: 'Shop', page: 'shop' },
  { href: '/prep', label: 'Pré/post course', page: 'prep' },
  { href: '/race', label: 'Race Mode', page: 'race' },
  { href: '/learn', label: 'Learn', page: 'learn' },
];

function pathnameToActivePage(pathname: string | null): HeaderActivePage | undefined {
  if (!pathname) return undefined;
  if (pathname.startsWith('/plan')) return 'plan';
  if (pathname.startsWith('/shop')) return 'shop';
  if (pathname.startsWith('/race')) return 'race';
  if (pathname.startsWith('/prep')) return 'prep';
  if (pathname.startsWith('/learn')) return 'learn';
  return undefined;
}

const S = {
  headerBase: {
    borderBottom: '1px solid var(--color-border)',
    padding: '16px 24px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 16,
  } as CSSProperties,
  headerSticky: {
    position: 'sticky',
    top: 0,
    zIndex: 30,
    background: 'color-mix(in srgb, var(--color-bg) 88%, transparent)',
    backdropFilter: 'blur(10px)',
  } as CSSProperties,
  logo: { display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none', color: 'inherit' } as CSSProperties,
  logoIcon: {
    width: 32,
    height: 32,
    background: 'var(--color-accent)',
    borderRadius: 8,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontWeight: 800,
    fontSize: 18,
    color: '#000',
    flexShrink: 0,
  } as CSSProperties,
  navLink: {
    padding: '8px 14px',
    borderRadius: 8,
    fontSize: 13,
    fontWeight: 600,
    border: '1px solid transparent',
    textDecoration: 'none',
  } as CSSProperties,
  navLinkActive: {
    padding: '8px 14px',
    borderRadius: 8,
    fontSize: 13,
    fontWeight: 700,
    color: 'var(--color-accent)',
    border: '1px solid var(--color-accent)',
    background: 'rgba(34,197,94,0.08)',
    textDecoration: 'none',
  } as CSSProperties,
  btnOutline: {
    padding: '10px 20px',
    borderRadius: 8,
    background: 'transparent',
    color: 'var(--color-text)',
    fontWeight: 600,
    fontSize: 14,
    border: '1px solid var(--color-border)',
    cursor: 'pointer',
    textDecoration: 'none',
  } as CSSProperties,
};

export type HeaderProps = {
  /** Overrides automatic detection from `usePathname()`. */
  activePage?: HeaderActivePage;
  sticky?: boolean;
  /** Optional slot for contextual badges (e.g. race simulation). */
  extra?: ReactNode;
};

export function Header({ activePage: activePageProp, sticky, extra }: HeaderProps) {
  const pathname = usePathname();
  const resolvedActive = activePageProp ?? pathnameToActivePage(pathname);

  return (
    <header style={{ ...S.headerBase, ...(sticky ? S.headerSticky : {}) }}>
      <Link href="/" style={S.logo} aria-label="FuelOS — Accueil">
        <div style={S.logoIcon}>F</div>
        <span style={{ fontWeight: 800, fontSize: 20 }}>FuelOS</span>
      </Link>
      <div
        style={{
          display: 'flex',
          gap: 8,
          alignItems: 'center',
          flexWrap: 'wrap',
          justifyContent: 'flex-end',
        }}
      >
        <nav aria-label="Navigation principale" style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
          {NAV.map((item) => {
            const isActive = resolvedActive === item.page;
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={isActive ? 'page' : undefined}
                style={isActive ? S.navLinkActive : { ...S.navLink, color: 'var(--color-text-muted)' }}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>
        {extra}
        <AuthMenu />
        {pathname !== '/' && (
          <Link href="/" style={S.btnOutline}>
            Accueil
          </Link>
        )}
        <ThemeToggle />
      </div>
    </header>
  );
}
