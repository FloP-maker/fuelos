'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import type { ReactNode } from 'react';
import { useEffect, useState } from 'react';
import { Menu, X } from 'lucide-react';
import { ThemeToggle } from './ThemeToggle';
import { AuthMenu } from './AuthMenu';
import { SignInNudgeBar } from './SignInNudgeBar';
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
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  useEffect(() => {
    void Promise.resolve().then(() => setMobileNavOpen(false));
  }, [pathname]);

  useEffect(() => {
    if (!mobileNavOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setMobileNavOpen(false);
    };
    document.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = prev;
    };
  }, [mobileNavOpen]);

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
          <button
            type="button"
            className="fuel-header-menu-btn"
            aria-expanded={mobileNavOpen}
            aria-controls="fuel-header-nav-drawer"
            onClick={() => setMobileNavOpen((o) => !o)}
          >
            {mobileNavOpen ? (
              <X size={22} strokeWidth={2.25} aria-hidden />
            ) : (
              <Menu size={22} strokeWidth={2.25} aria-hidden />
            )}
            <span className="fuel-sr-only">{mobileNavOpen ? 'Fermer le menu' : 'Ouvrir le menu'}</span>
          </button>
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
            <AuthMenu />
            <ThemeToggle />
          </div>
        </div>
      </div>
      {mobileNavOpen && (
        <>
          <div
            className="fuel-header-nav-backdrop"
            aria-hidden
            onClick={() => setMobileNavOpen(false)}
          />
          <div
            id="fuel-header-nav-drawer"
            className="fuel-header-nav-panel"
            role="dialog"
            aria-modal="true"
            aria-label="Menu de navigation"
          >
            <div className="fuel-header-nav-panel-head">
              <span className="fuel-header-nav-panel-title font-display">Navigation</span>
              <button
                type="button"
                className="fuel-header-nav-close"
                onClick={() => setMobileNavOpen(false)}
                aria-label="Fermer le menu"
              >
                <X size={22} strokeWidth={2.25} aria-hidden />
              </button>
            </div>
            <nav className="fuel-header-nav-panel-links" aria-label="Sections principales">
              {NAV_SECTIONS.map((item) => {
                const isActive = resolvedActive === item.page;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className="fuel-header-nav-panel-link"
                    aria-current={isActive ? 'page' : undefined}
                    onClick={() => setMobileNavOpen(false)}
                  >
                    {item.label}
                  </Link>
                );
              })}
            </nav>
          </div>
        </>
      )}
      <SignInNudgeBar />
    </header>
  );
}
