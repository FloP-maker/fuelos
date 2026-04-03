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

const navPillBase: CSSProperties = {
  padding: '8px 16px',
  borderRadius: 'var(--radius-pill)',
  fontSize: 13,
  fontWeight: 600,
  border: '1px solid transparent',
  textDecoration: 'none',
  transition: 'background 0.15s ease, border-color 0.15s ease, color 0.15s ease',
};

const navPillActive: CSSProperties = {
  ...navPillBase,
  fontWeight: 700,
  color: 'var(--color-text)',
  border: '1px solid color-mix(in srgb, var(--color-accent) 40%, var(--color-border))',
  background: 'color-mix(in srgb, var(--color-accent) 14%, var(--color-bg-card))',
  boxShadow: 'var(--shadow-xs)',
};

const S = {
  headerBase: {
    borderBottom: '1px solid var(--color-border-subtle)',
    padding: '14px 22px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 16,
  } as CSSProperties,
  headerSticky: {
    position: 'sticky',
    top: 0,
    zIndex: 30,
    background: 'color-mix(in srgb, var(--color-bg) 82%, transparent)',
    backdropFilter: 'saturate(160%) blur(14px)',
    WebkitBackdropFilter: 'saturate(160%) blur(14px)',
  } as CSSProperties,
  logo: { display: 'flex', alignItems: 'center', gap: 12, textDecoration: 'none', color: 'inherit' } as CSSProperties,
  logoIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontWeight: 800,
    fontSize: 17,
    fontFamily: 'var(--font-display)',
    color: '#052e14',
    flexShrink: 0,
    background:
      'linear-gradient(145deg, var(--color-accent) 0%, color-mix(in srgb, var(--color-energy) 38%, var(--color-accent)) 100%)',
    boxShadow: 'var(--shadow-xs), 0 0 24px color-mix(in srgb, var(--color-accent) 35%, transparent)',
  } as CSSProperties,
  btnOutline: {
    padding: '9px 18px',
    borderRadius: 'var(--radius-pill)',
    background: 'transparent',
    color: 'var(--color-text)',
    fontWeight: 600,
    fontSize: 13,
    border: '1px solid var(--color-border)',
    cursor: 'pointer',
    textDecoration: 'none',
    transition: 'background 0.15s ease, border-color 0.15s ease',
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
        <span style={{ fontWeight: 800, fontSize: 20, fontFamily: 'var(--font-display)', letterSpacing: '-0.03em' }}>
          FuelOS
        </span>
      </Link>
      <div
        style={{
          display: 'flex',
          gap: 10,
          alignItems: 'center',
          flexWrap: 'wrap',
          justifyContent: 'flex-end',
        }}
      >
        <nav
          aria-label="Navigation principale"
          style={{
            display: 'flex',
            gap: 6,
            alignItems: 'center',
            flexWrap: 'wrap',
            padding: 4,
            borderRadius: 'var(--radius-pill)',
            background: 'color-mix(in srgb, var(--color-bg-card) 65%, transparent)',
            border: '1px solid var(--color-border-subtle)',
          }}
        >
          {NAV.map((item) => {
            const isActive = resolvedActive === item.page;
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={isActive ? 'page' : undefined}
                style={
                  isActive
                    ? navPillActive
                    : {
                        ...navPillBase,
                        color: 'var(--color-text-muted)',
                      }
                }
              >
                {item.label}
              </Link>
            );
          })}
        </nav>
        {extra}
        <AuthMenu />
        {pathname !== '/' && (
          <Link
            href="/"
            style={S.btnOutline}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'var(--color-bg-card-hover)';
              e.currentTarget.style.borderColor =
                'color-mix(in srgb, var(--color-text-muted) 35%, var(--color-border))';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'transparent';
              e.currentTarget.style.borderColor = 'var(--color-border)';
            }}
          >
            Accueil
          </Link>
        )}
        <ThemeToggle />
      </div>
    </header>
  );
}
