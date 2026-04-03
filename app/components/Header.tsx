'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import type { ReactNode } from 'react';
import { ThemeToggle } from './ThemeToggle';
import { AuthMenu } from './AuthMenu';
import { FuelLogo } from './FuelLogo';
import { SiteSearch } from './SiteSearch';

export type HeaderActivePage = 'plan' | 'shop' | 'race' | 'learn' | 'prep';

const NAV: { href: string; label: string; page: HeaderActivePage }[] = [
  { href: '/plan', label: 'Plan', page: 'plan' },
  { href: '/shop', label: 'Shop', page: 'shop' },
  { href: '/prep', label: 'Pré / post', page: 'prep' },
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
          <Link
            href="/"
            className="fuel-header-logo-link min-w-0 shrink"
            aria-label="FuelOS — Accueil"
          >
            <FuelLogo size={34} withWordmark wordmarkClassName="fuel-header-wordmark" />
          </Link>
          <SiteSearch />
          <nav className="fuel-header-text-nav" aria-label="Sections principales">
            {NAV.map((item) => {
              const isActive = resolvedActive === item.page;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  aria-current={isActive ? 'page' : undefined}
                >
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
            className="fuel-header-text-link"
            title="Profil athlète — étape 1 du plan"
          >
            <span className="sm:hidden">Profil</span>
            <span className="hidden sm:inline">Profil athlète</span>
          </Link>
          <AuthMenu />
          {pathname !== '/' && (
            <Link href="/" className="fuel-header-text-link">
              Accueil
            </Link>
          )}
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}
