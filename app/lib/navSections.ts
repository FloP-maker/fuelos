export type HeaderActivePage = 'plan' | 'shop' | 'race' | 'learn' | 'prep';

/** Ordre principal du header — aligné sur le parcours type (plan → exécution → apprentissage). */
export const NAV_SECTIONS: { href: string; label: string; page: HeaderActivePage }[] = [
  { href: '/plan', label: 'Plan', page: 'plan' },
  { href: '/shop', label: 'Produits', page: 'shop' },
  { href: '/prep', label: 'Pré / post', page: 'prep' },
  { href: '/race', label: 'Mode course', page: 'race' },
  { href: '/learn', label: 'Analyses', page: 'learn' },
];

export function pathnameToHeaderPage(pathname: string | null): HeaderActivePage | undefined {
  if (!pathname) return undefined;
  if (pathname.startsWith('/plan')) return 'plan';
  if (pathname.startsWith('/shop')) return 'shop';
  if (pathname.startsWith('/race')) return 'race';
  if (pathname.startsWith('/prep')) return 'prep';
  if (pathname.startsWith('/learn')) return 'learn';
  return undefined;
}

export function sectionLabelForPathname(pathname: string | null): string | undefined {
  const page = pathnameToHeaderPage(pathname);
  if (!page) return undefined;
  return NAV_SECTIONS.find((s) => s.page === page)?.label;
}
