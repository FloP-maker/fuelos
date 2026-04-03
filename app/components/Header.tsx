'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ChevronDown, ChefHat, BookOpen, Crosshair, ShoppingBag, Zap, LayoutGrid } from 'lucide-react';
import type { CSSProperties, ReactNode } from 'react';
import { useCallback, useEffect, useRef, useState } from 'react';
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

const S = {
  headerBase: {
    borderBottom: '1px solid var(--color-border-subtle)',
    padding: '12px 22px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 16,
    flexWrap: 'wrap',
    rowGap: 12,
  } as CSSProperties,
  headerSticky: {
    position: 'sticky',
    top: 0,
    zIndex: 30,
    background: 'color-mix(in srgb, var(--color-bg) 86%, transparent)',
    backdropFilter: 'saturate(160%) blur(14px)',
    WebkitBackdropFilter: 'saturate(160%) blur(14px)',
  } as CSSProperties,
  leftCluster: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    flexShrink: 0,
    minWidth: 0,
  } as CSSProperties,
  logoLink: {
    display: 'flex',
    alignItems: 'center',
    textDecoration: 'none',
    color: 'inherit',
    flexShrink: 0,
  } as CSSProperties,
  rightCluster: {
    display: 'flex',
    gap: 10,
    alignItems: 'center',
    flexWrap: 'wrap',
    justifyContent: 'flex-end',
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

function ExplorerMenu({
  resolvedActive,
}: {
  resolvedActive: HeaderActivePage | undefined;
}) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  const close = useCallback(() => setOpen(false), []);

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) close();
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') close();
    };
    document.addEventListener('mousedown', onDoc);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDoc);
      document.removeEventListener('keydown', onKey);
    };
  }, [open, close]);

  return (
    <div ref={rootRef} style={{ position: 'relative' }}>
      <button
        type="button"
        className="fuel-btn-pill"
        aria-expanded={open}
        aria-controls="fuel-explorer-menu"
        aria-haspopup="true"
        id="fuel-explorer-trigger"
        onClick={() => setOpen((o) => !o)}
        style={{ gap: 6 }}
      >
        <LayoutGrid size={16} strokeWidth={2} aria-hidden />
        Menu
        <ChevronDown
          size={16}
          strokeWidth={2}
          aria-hidden
          style={{
            transition: 'transform 0.2s ease',
            transform: open ? 'rotate(180deg)' : 'none',
          }}
        />
      </button>
      {open && (
        <div
          id="fuel-explorer-menu"
          role="menu"
          aria-labelledby="fuel-explorer-trigger"
          className="fuel-header-menu-panel"
        >
          {NAV.map((item) => {
            const Icon = item.icon;
            const isActive = resolvedActive === item.page;
            return (
              <Link
                key={item.href}
                href={item.href}
                role="menuitem"
                aria-current={isActive ? 'page' : undefined}
                onClick={close}
              >
                <Icon size={18} strokeWidth={1.75} aria-hidden />
                {item.label}
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
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
    <header style={{ ...S.headerBase, ...(sticky ? S.headerSticky : {}) }}>
      <div style={S.leftCluster}>
        <Link href="/" style={S.logoLink} aria-label="FuelOS — Accueil">
          <FuelLogo size={38} withWordmark />
        </Link>
        <ExplorerMenu resolvedActive={resolvedActive} />
      </div>

      <div style={S.rightCluster}>
        {extra}
        <Link
          href="/plan?step=profile"
          className="fuel-btn-pill fuel-btn-pill-accent"
          title="Profil athlète — étape 1 du plan"
        >
          Profil athlète
        </Link>
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
