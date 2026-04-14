'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import type { ReactNode } from 'react';
import { useCallback, useEffect, useState } from 'react';
import { Lock, Menu, X } from 'lucide-react';
import { useSession } from 'next-auth/react';
import { ThemeToggle } from './ThemeToggle';
import { AuthMenu } from './AuthMenu';
import { FuelLogo } from './FuelLogo';
import { SiteSearch } from './SiteSearch';
import {
  NAV_ACCOUNT_REQUIRED_HINT,
  NAV_GROUP_LABELS,
  NAV_SECTIONS,
  pathnameToHeaderPage,
  type HeaderActivePage,
  type NavGroupId,
  type NavSectionItem,
} from '../lib/navSections';
import { RacesAuthGateModal } from './races/RacesAuthGateModal';

export type { HeaderActivePage };

const NAV_GROUP_ORDER: NavGroupId[] = ['discover', 'athlete'];

export type HeaderProps = {
  /** Overrides automatic detection from `usePathname()`. */
  activePage?: HeaderActivePage;
  sticky?: boolean;
  /** Version plus haute pour pages marketing / connexion. */
  tall?: boolean;
  /** Optional slot for contextual badges (e.g. race simulation). */
  extra?: ReactNode;
};

function navItemsInGroup(group: NavGroupId): NavSectionItem[] {
  return NAV_SECTIONS.filter((s) => s.group === group);
}

export function Header({ activePage: activePageProp, sticky, tall, extra }: HeaderProps) {
  const pathname = usePathname();
  const { status } = useSession();
  const resolvedActive = activePageProp ?? pathnameToHeaderPage(pathname);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [authGateOpen, setAuthGateOpen] = useState(false);
  const [authGateReturnTo, setAuthGateReturnTo] = useState<string>('/races');

  const guestLocked = status === 'unauthenticated';

  const openAuthGate = useCallback((returnTo: string) => {
    setAuthGateReturnTo(returnTo);
    setAuthGateOpen(true);
  }, []);

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

  const renderDesktopNavItem = (item: NavSectionItem, index: number) => {
    const prev = index > 0 ? NAV_SECTIONS[index - 1] : null;
    const showSep = Boolean(prev && prev.group === 'discover' && item.group === 'athlete');
    const isActive = resolvedActive === item.page;
    const locked = guestLocked && item.requiresAccount;

    return (
      <span key={item.href} className="fuel-header-text-nav-item-wrap">
        {showSep ? <span className="fuel-header-nav-sep" aria-hidden /> : null}
        {locked ? (
          <button
            type="button"
            className={['fuel-header-text-nav-link', 'fuel-header-text-nav-link--locked']
              .filter(Boolean)
              .join(' ')}
            aria-current={isActive ? 'page' : undefined}
            aria-label={`${item.label} — ${NAV_ACCOUNT_REQUIRED_HINT}`}
            title={NAV_ACCOUNT_REQUIRED_HINT}
            onClick={() => openAuthGate(item.href)}
          >
            <span className="fuel-header-text-nav-link__row">
              {item.label}
              <Lock className="fuel-header-nav-lock" strokeWidth={2} aria-hidden />
            </span>
          </button>
        ) : (
          <Link
            href={item.href}
            className="fuel-header-text-nav-link"
            aria-current={isActive ? 'page' : undefined}
          >
            {item.label}
          </Link>
        )}
      </span>
    );
  };

  const renderMobileNavItem = (item: NavSectionItem) => {
    const isActive = resolvedActive === item.page;
    const locked = guestLocked && item.requiresAccount;

    if (locked) {
      return (
        <button
          key={item.href}
          type="button"
          className="fuel-header-nav-panel-link fuel-header-nav-panel-link--locked"
          aria-current={isActive ? 'page' : undefined}
          aria-label={`${item.label} — ${NAV_ACCOUNT_REQUIRED_HINT}`}
          title={NAV_ACCOUNT_REQUIRED_HINT}
          onClick={() => {
            setMobileNavOpen(false);
            openAuthGate(item.href);
          }}
        >
          <span className="fuel-header-text-nav-link__row fuel-header-text-nav-link__row--panel">
            {item.label}
            <Lock className="fuel-header-nav-lock" strokeWidth={2} aria-hidden />
          </span>
        </button>
      );
    }

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
  };

  return (
    <>
      <header className={[sticky ? 'fuel-header-shell fuel-header-shell--sticky' : 'fuel-header-shell'].join(' ')}>
        <div className={['fuel-header-inner', tall ? 'fuel-header-inner--tall' : ''].join(' ').trim()}>
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
              {NAV_SECTIONS.map((item, index) => renderDesktopNavItem(item, index))}
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
                {NAV_GROUP_ORDER.map((groupId) => (
                  <div key={groupId} className="fuel-header-nav-panel-group">
                    <div className="fuel-header-nav-panel-group-label">{NAV_GROUP_LABELS[groupId]}</div>
                    <div className="fuel-header-nav-panel-group-links">
                      {navItemsInGroup(groupId).map((item) => renderMobileNavItem(item))}
                    </div>
                  </div>
                ))}
              </nav>
            </div>
          </>
        )}
      </header>

      <RacesAuthGateModal open={authGateOpen} onClose={() => setAuthGateOpen(false)} returnTo={authGateReturnTo} />
    </>
  );
}
