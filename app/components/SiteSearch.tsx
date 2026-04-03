'use client';

import { useRouter } from 'next/navigation';
import { Search } from 'lucide-react';
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
    title: 'Shop',
    description: 'Catalogue produits et liste de courses',
    keywords: 'boutique maurten sis gels barres acheter',
  },
  {
    href: '/prep',
    title: 'Pré / post',
    description: 'Menus, charge, jour J, sacs et récupération',
    keywords: 'préparation post course repas semaine',
  },
  {
    href: '/race',
    title: 'Race Mode',
    description: 'Timer, alertes et suivi le jour de la course',
    keywords: 'course timer jour j simulation',
  },
  {
    href: '/learn',
    title: 'Learn',
    description: 'Débrief, suivi GI et apprentissage',
    keywords: 'apprendre analyse retour',
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
  /** Classes pour le bouton loupe (aligné sur l’ancien lien plan) */
  className?: string;
};

export function SiteSearch({ className }: SiteSearchProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const panelRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const filtered = useMemo(() => {
    if (!query.trim()) return ENTRIES;
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

  const searchBtnClass = [
    'fuel-header-search shrink-0 touch-manipulation',
    open ? 'fuel-header-search--here' : '',
    className ?? '',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <>
      <button
        type="button"
        className={searchBtnClass}
        onClick={() => setOpen(true)}
        aria-expanded={open}
        aria-haspopup="dialog"
        aria-label="Rechercher une page du site"
        title="Recherche (⌘K ou Ctrl+K)"
      >
        <Search size={20} strokeWidth={2} aria-hidden />
      </button>

      {open && (
        <div className="fuel-site-search-portal" aria-hidden={false}>
          <div
            ref={panelRef}
            className="fuel-site-search-panel"
            role="dialog"
            aria-modal="true"
            aria-labelledby="fuel-site-search-title"
          >
            <div className="fuel-site-search-head">
              <h2 id="fuel-site-search-title" className="fuel-site-search-title">
                Recherche sur le site
              </h2>
              <button type="button" className="fuel-site-search-close" onClick={close} aria-label="Fermer">
                ×
              </button>
            </div>
            <input
              ref={inputRef}
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="fuel-site-search-input"
              placeholder="Plan, shop, race…"
              autoComplete="off"
              aria-controls="fuel-site-search-results"
            />
            <ul id="fuel-site-search-results" className="fuel-site-search-results">
              {filtered.length === 0 ? (
                <li className="fuel-site-search-empty">Aucun résultat pour « {query.trim()} »</li>
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
              Astuce : raccourci clavier <kbd className="fuel-site-search-kbd">⌘</kbd>{' '}
              <kbd className="fuel-site-search-kbd">K</kbd> / <kbd className="fuel-site-search-kbd">Ctrl</kbd>{' '}
              <kbd className="fuel-site-search-kbd">K</kbd>
            </p>
          </div>
        </div>
      )}
    </>
  );
}
