'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import type { ReactNode } from 'react';
import { ThemeToggle } from './ThemeToggle';
import { AuthMenu } from './AuthMenu';
import { FuelLogo } from './FuelLogo';
import { SiteSearch } from './SiteSearch';
import { NAV_SECTIONS, pathnameToHeaderPage, type HeaderActivePage } from '../lib/navSections';

export type { HeaderActivePage };

export type HeaderProps = {
  /** Overrides automatic detection from `usePathname()`. */
  activePage?: HeaderActivePage;
  sticky?: boolean;
  /** Optional slot for contextual badges (e.g. race simulation). */
  extra?: ReactNode;
};

export function Header({ activePage: activePageProp, sticky, extra }: HeaderProps) {
  const pathname = usePathname();
  const resolvedActive = activePageProp ?? pathnameToHeaderPage(pathname);

  return (
    <header className={[sticky ? 'fuel-header-shell fuel-header-shell--sticky' : 'fuel-header-shell'].join(' ')}>
      <div className="fuel-header-inner">
        <div className="fuel-header-left">
          <Link
            href="/"
            className="fuel-header-logo-link shrink-0"
            aria-label="FuelOS — Accueil"
          >
            <FuelLogo size={34} withWordmark wordmarkClassName="fuel-header-wordmark" />
          </Link>
          <nav className="fuel-header-text-nav" aria-label="Sections principales">
            {NAV_SECTIONS.map((item) => {
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

        <div className="fuel-header-tail">
          <div className="fuel-header-search-column">
            <SiteSearch />
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
            <ThemeToggle />
          </div>
        </div>
      </div>
    </header>
  );
}
