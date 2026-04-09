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
    href: '/produits',
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
    href: '/analyses',
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
  const [query, setQuery] = useState('');
  const [focusWithin, setFocusWithin] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const trimmedQuery = query.trim();
  const showSuggestions = trimmedQuery.length > 0;
  const popoverOpen = focusWithin && showSuggestions;

  const filtered = useMemo(() => {
    const t = query.trim();
    if (!t) return [];
    return ENTRIES.filter((e) => matchesEntry(query, e));
  }, [query]);

  const clear = useCallback(() => {
    setQuery('');
    inputRef.current?.focus();
  }, []);

  const go = useCallback(
    (href: string) => {
      setQuery('');
      setFocusWithin(false);
      inputRef.current?.blur();
      router.push(href);
    },
    [router]
  );

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        inputRef.current?.focus();
        inputRef.current?.select();
        return;
      }
      if (e.key === 'Escape' && (focusWithin || trimmedQuery.length > 0)) {
        e.preventDefault();
        if (trimmedQuery.length > 0) {
          clear();
        } else {
          inputRef.current?.blur();
        }
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [focusWithin, trimmedQuery.length, clear]);

  useEffect(() => {
    if (!popoverOpen) return;
    const onPointer = (e: MouseEvent) => {
      const el = panelRef.current;
      if (el && !el.contains(e.target as Node)) {
        inputRef.current?.blur();
      }
    };
    document.addEventListener('mousedown', onPointer);
    return () => document.removeEventListener('mousedown', onPointer);
  }, [popoverOpen]);

  useEffect(() => {
    const el = panelRef.current;
    if (!el) return;
    const onFocusIn = () => setFocusWithin(true);
    const onFocusOut = (e: FocusEvent) => {
      const next = e.relatedTarget as Node | null;
      if (!next || !el.contains(next)) {
        setFocusWithin(false);
      }
    };
    el.addEventListener('focusin', onFocusIn);
    el.addEventListener('focusout', onFocusOut);
    return () => {
      el.removeEventListener('focusin', onFocusIn);
      el.removeEventListener('focusout', onFocusOut);
    };
  }, []);

  const slotClass = ['fuel-header-search-slot', 'fuel-header-search-slot--persistent', className ?? '']
    .filter(Boolean)
    .join(' ');

  return (
    <div ref={panelRef} className={slotClass}>
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
            placeholder="Pages, modules… (⌘K)"
            autoComplete="off"
            aria-expanded={popoverOpen}
            aria-controls={popoverOpen ? 'fuel-site-search-results' : undefined}
            aria-autocomplete="list"
          />
          <span className="fuel-header-search-field-icon" aria-hidden>
            <Search size={17} strokeWidth={2} />
          </span>
          {trimmedQuery.length > 0 && (
            <button
              type="button"
              className="fuel-header-search-clear"
              onMouseDown={(e) => e.preventDefault()}
              onClick={clear}
              aria-label="Effacer la recherche"
            >
              <X size={16} strokeWidth={2} aria-hidden />
            </button>
          )}
        </div>
      </div>
      {popoverOpen && (
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
                    onMouseDown={(e) => e.preventDefault()}
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
            <kbd className="fuel-site-search-kbd">⌘</kbd>{' '}
            <kbd className="fuel-site-search-kbd">K</kbd> /{' '}
            <kbd className="fuel-site-search-kbd">Ctrl</kbd>{' '}
            <kbd className="fuel-site-search-kbd">K</kbd> · Le catalogue complet se filtre sur la page{' '}
            <strong>Produits</strong>.
          </p>
        </div>
      )}
    </div>
  );
}
