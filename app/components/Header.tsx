'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ChefHat, BookOpen, Crosshair, ShoppingBag, Zap } from 'lucide-react';
import type { CSSProperties, ReactNode } from 'react';
import { ThemeToggle } from './ThemeToggle';
import { AuthMenu } from './AuthMenu';
import { FuelLogo } from './FuelLogo';

export type HeaderActivePage = 'plan' | 'shop' | 'race' | 'learn' | 'prep';

const NAV: {
  href: string;
  label: string;
  page: HeaderActivePage;
  icon: typeof Crosshair;
}[] = [
  { href: '/plan', label: 'Plan', page: 'plan', icon: Crosshair },
  { href: '/shop', label: 'Shop', page: 'shop', icon: ShoppingBag },
  { href: '/prep', label: 'Pré/post course', page: 'prep', icon: ChefHat },
  { href: '/race', label: 'Race Mode', page: 'race', icon: Zap },
  { href: '/learn', label: 'Learn', page: 'learn', icon: BookOpen },
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

const btnOutline: CSSProperties = {
  padding: '9px 16px',
  borderRadius: 'var(--radius-pill)',
  background: 'transparent',
  color: 'var(--color-text)',
  fontWeight: 600,
  fontSize: 13,
  border: '1px solid var(--color-border)',
  cursor: 'pointer',
  textDecoration: 'none',
  transition: 'background 0.15s ease, border-color 0.15s ease',
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
    <header className={[sticky ? 'fuel-header-shell fuel-header-shell--sticky' : 'fuel-header-shell'].join(' ')}>
      <div className="fuel-header-inner">
        <div className="fuel-header-left">
          <Link href="/" className="min-w-0 shrink text-inherit no-underline" aria-label="FuelOS — Accueil">
            <FuelLogo size={38} withWordmark />
          </Link>
          <nav
            className="flex min-w-0 flex-wrap items-center gap-2"
            aria-label="Sections principales"
          >
            {NAV.map((item) => {
              const Icon = item.icon;
              const isActive = resolvedActive === item.page;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={[
                    'fuel-btn-pill min-h-[42px] touch-manipulation whitespace-nowrap sm:min-h-0',
                    isActive ? 'fuel-btn-pill-accent' : '',
                  ]
                    .filter(Boolean)
                    .join(' ')}
                  aria-current={isActive ? 'page' : undefined}
                >
                  <Icon size={18} strokeWidth={1.75} className="shrink-0" aria-hidden />
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </div>

        <div className="fuel-header-right">
          {extra}
          <Link
            href="/plan?step=profile"
            className="fuel-btn-pill fuel-btn-pill-accent min-h-[42px] touch-manipulation whitespace-nowrap sm:min-h-0"
            title="Profil athlète — étape 1 du plan"
          >
            <span className="sm:hidden">Profil</span>
            <span className="hidden sm:inline">Profil athlète</span>
          </Link>
          <AuthMenu />
          {pathname !== '/' && (
            <Link
              href="/"
              className="min-h-[42px] touch-manipulation max-sm:px-3 max-sm:py-2.5 sm:min-h-0"
              style={btnOutline}
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
      </div>
    </header>
  );
}
