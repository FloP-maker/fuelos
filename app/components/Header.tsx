'use client';

import Link from 'next/link';
import type { ReactNode } from 'react';
import { useSession } from 'next-auth/react';
import { ThemeToggle } from './ThemeToggle';
import { AuthMenu } from './AuthMenu';
import { FuelBrandWordmark } from './FuelBrandWordmark';

/** Conservé pour compatibilité avec les pages qui passent `activePage` / `sticky` / `tall`. */
export type HeaderActivePage =
  | 'home'
  | 'prep'
  | 'mes-plans'
  | 'mes-plans-courses'
  | 'race'
  | 'history'
  | 'profil'
  | 'produits'
  | 'shop'
  | 'learn'
  | 'races';

export type { HeaderActivePage as HeaderPage };

export type HeaderProps = {
  activePage?: HeaderActivePage;
  sticky?: boolean;
  tall?: boolean;
  extra?: ReactNode;
};

export function Header({ sticky, tall, extra }: HeaderProps) {
  const { status } = useSession();
  const homeHref = status === 'authenticated' ? '/mes-plans-courses' : '/';

  return (
    <header className={[sticky ? 'fuel-header-shell fuel-header-shell--sticky' : 'fuel-header-shell'].join(' ')}>
      <div className={['fuel-header-inner', tall ? 'fuel-header-inner--tall' : ''].join(' ').trim()}>
        <div className="fuel-header-left">
          <Link
            href={homeHref}
            className="fuel-header-logo-link shrink-0"
            aria-label="FuelOS — Accueil"
          >
            <FuelBrandWordmark size={24} />
          </Link>
        </div>

        <div className="fuel-header-tail">
          <div className="fuel-header-right">
            {extra}
            <AuthMenu />
            <ThemeToggle />
          </div>
        </div>
      </div>
    </header>
  );
}
