'use client';

import { useRouter } from 'next/navigation';
import { Search, X } from 'lucide-react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

export type SiteSearchEntry = {
  href: string;
  title: string;
  description?: string;
  /** Mots-clés en français / anglais pour élargir la recherche */
  keywords?: string;
};

const ENTRIES: SiteSearchEntry[] = [
  {
    href: '/',
    title: 'Accueil',
    description: 'Présentation FuelOS et accès aux modules',
    keywords: 'home démarrage vitrine',
  },
  {
    href: '/plan',
    title: 'Plan nutrition',
    description: 'Stratégie CHO, hydratation et sodium pour votre effort',
    keywords: 'plan fuel calcul glucides eau sel endurance',
  },
  {
    href: '/plan?step=profile',
    title: 'Profil athlète (plan)',
    description: 'Poids, transpiration, tolérance digestive',
    keywords: 'profil athlète poids gi transpiration',
  },
  {
    href: '/plan?step=event',
    title: 'Événement / parcours (plan)',
    description: 'Distance, dénivelé, météo et allure',
    keywords: 'course trail ultra météo dénivelé',
  },
  {
    href: '/shop',
    title: 'Produits',
    description: 'Catalogue produits et liste de courses',
    keywords: 'boutique shop maurten sis gels barres acheter',
  },
  {
    href: '/prep',
    title: 'Pré / post',
    description: 'Menus, charge, jour J, sacs et récupération',
    keywords: 'préparation post course repas semaine',
  },
  {
    href: '/race',
    title: 'Mode course',
    description: 'Timer, alertes et suivi le jour de la course',
    keywords: 'course race timer jour j simulation',
  },
  {
    href: '/learn',
    title: 'Analyses',
    description: 'Débrief, suivi GI et apprentissage',
    keywords: 'apprendre analyse learn retour débrief',
  },
];

function stripAccents(s: string): string {
  return s.normalize('NFD').replace(/\p{M}/gu, '');
}

function matchesEntry(query: string, entry: SiteSearchEntry): boolean {
  const q = stripAccents(query.trim().toLowerCase());
  if (!q) return true;
  const hay = stripAccents(
    [entry.title, entry.description ?? '', entry.keywords ?? '', entry.href].join(' ').toLowerCase()
  );
  return hay.includes(q);
}

type SiteSearchProps = {
  className?: string;
};

export function SiteSearch({ className }: SiteSearchProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const panelRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const trimmedQuery = query.trim();
  const showSuggestions = trimmedQuery.length > 0;

  const filtered = useMemo(() => {
    const t = query.trim();
    if (!t) return [];
    return ENTRIES.filter((e) => matchesEntry(query, e));
  }, [query]);

  const close = useCallback(() => {
    setOpen(false);
    setQuery('');
  }, []);

  const go = useCallback(
    (href: string) => {
      close();
      router.push(href);
    },
    [close, router]
  );

  useEffect(() => {
    if (!open) return;
    const t = requestAnimationFrame(() => inputRef.current?.focus());
    return () => cancelAnimationFrame(t);
  }, [open]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setOpen((v) => !v);
        return;
      }
      if (e.key === 'Escape' && open) {
        e.preventDefault();
        close();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, close]);

  useEffect(() => {
    if (!open) return;
    const onPointer = (e: MouseEvent) => {
      const el = panelRef.current;
      if (el && !el.contains(e.target as Node)) close();
    };
    document.addEventListener('mousedown', onPointer);
    return () => document.removeEventListener('mousedown', onPointer);
  }, [open, close]);

  const slotClass = [
    'fuel-header-search-slot',
    open ? 'fuel-header-search-slot--open' : '',
    className ?? '',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div ref={panelRef} className={slotClass}>
      {!open ? (
        <button
          type="button"
          className="fuel-header-search-trigger touch-manipulation"
          onClick={() => setOpen(true)}
          aria-expanded={false}
          aria-haspopup="dialog"
          aria-label="Rechercher une page du site"
          title="Recherche (⌘K ou Ctrl+K)"
        >
          <Search size={19} strokeWidth={2} aria-hidden />
        </button>
      ) : (
        <>
          <div className="fuel-header-search-bar" role="search">
            <label htmlFor="fuel-header-search-field" className="fuel-sr-only">
              Recherche sur le site
            </label>
            <div className="fuel-header-search-input-wrap">
              <input
                id="fuel-header-search-field"
                ref={inputRef}
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="fuel-header-search-field"
                placeholder="Rechercher"
                autoComplete="off"
                aria-controls={showSuggestions ? 'fuel-site-search-results' : undefined}
                aria-expanded={showSuggestions}
              />
              <span className="fuel-header-search-field-icon" aria-hidden>
                <Search size={17} strokeWidth={2} />
              </span>
            </div>
            <button
              type="button"
              className="fuel-header-search-dismiss"
              onClick={close}
              aria-label="Fermer la recherche"
            >
              <X size={18} strokeWidth={2} aria-hidden />
            </button>
          </div>
          {showSuggestions && (
            <div className="fuel-header-search-popover">
              <ul id="fuel-site-search-results" className="fuel-site-search-results">
                {filtered.length === 0 ? (
                  <li className="fuel-site-search-empty">Aucun résultat pour « {trimmedQuery} »</li>
                ) : (
                  filtered.map((entry) => (
                    <li key={entry.href}>
                      <button
                        type="button"
                        className="fuel-site-search-hit"
                        onClick={() => go(entry.href)}
                      >
                        <span className="fuel-site-search-hit-title">{entry.title}</span>
                        {entry.description && (
                          <span className="fuel-site-search-hit-desc">{entry.description}</span>
                        )}
                        <span className="fuel-site-search-hit-href">{entry.href}</span>
                      </button>
                    </li>
                  ))
                )}
              </ul>
              <p className="fuel-site-search-hint">
                Astuce :{' '}
                <kbd className="fuel-site-search-kbd">⌘</kbd>{' '}
                <kbd className="fuel-site-search-kbd">K</kbd> /{' '}
                <kbd className="fuel-site-search-kbd">Ctrl</kbd>{' '}
                <kbd className="fuel-site-search-kbd">K</kbd>
              </p>
            </div>
          )}
        </>
      )}
    </div>
  );
}
