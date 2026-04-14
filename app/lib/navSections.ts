export type HeaderActivePage = 'home' | 'plan' | 'shop' | 'races' | 'race' | 'learn' | 'prep' | 'history';

/** Groupe navigation : découverte (sans compte) vs espace athlète (compte pour certaines entrées). */
export type NavGroupId = 'discover' | 'athlete';

export type NavSectionItem = {
  href: string;
  label: string;
  page: HeaderActivePage;
  group: NavGroupId;
  /** Hors session : cadenas + ouverture du gate au clic au lieu de naviguer. */
  requiresAccount: boolean;
};

/**
 * Ordre = Découverte puis Espace athlète (séparateur visuel dans le header).
 * Mes courses reste accessible sans compte (données locales) ; Pré/post, Mode course et Mémoire demandent un compte.
 */
export const NAV_SECTIONS: NavSectionItem[] = [
  { href: '/plan', label: 'Plan', page: 'plan', group: 'discover', requiresAccount: false },
  { href: '/produits', label: 'Produits', page: 'shop', group: 'discover', requiresAccount: false },
  { href: '/analyses', label: 'Analyses', page: 'learn', group: 'discover', requiresAccount: false },
  { href: '/races', label: 'Mes courses', page: 'races', group: 'athlete', requiresAccount: false },
  { href: '/prep', label: 'Pré / post', page: 'prep', group: 'athlete', requiresAccount: true },
  { href: '/race', label: 'Mode course', page: 'race', group: 'athlete', requiresAccount: true },
  { href: '/history', label: 'Mémoire', page: 'history', group: 'athlete', requiresAccount: true },
];

export const NAV_GROUP_LABELS: Record<NavGroupId, string> = {
  discover: 'Découverte',
  athlete: 'Espace athlète',
};

/** Libellé dans la barre : suffixe « (compte) » uniquement pour les invités sur les entrées protégées. */
export function navSectionHeaderLabel(item: NavSectionItem, opts?: { showAccountSuffix?: boolean }): string {
  if (item.requiresAccount && opts?.showAccountSuffix) {
    return `${item.label} (compte)`;
  }
  return item.label;
}

/** Texte du modal de connexion selon la destination après OAuth. */
export function authGateCopyForReturnPath(returnPath: string): { title: string; description: string } {
  const path = returnPath.split('?')[0] ?? returnPath;

  if (path.startsWith('/race')) {
    return {
      title: 'Mode course',
      description:
        'Connecte-toi pour enregistrer tes courses sur ton compte, synchroniser le mode course entre appareils et retrouver ton plan le jour J partout.',
    };
  }
  if (path.startsWith('/history')) {
    return {
      title: 'Mémoire',
      description:
        'Connecte-toi pour consulter ton historique de courses, tes débriefs et tes analyses sauvegardés sur tous tes appareils.',
    };
  }
  if (path.startsWith('/prep')) {
    return {
      title: 'Pré / post',
      description:
        'Connecte-toi pour synchroniser tes protocoles pré et post-course avec ton profil et les retrouver sur chaque appareil.',
    };
  }
  if (path.startsWith('/races')) {
    return {
      title: 'Mes courses',
      description:
        'Connecte-toi pour synchroniser ton calendrier de courses sur ton compte et activer les actions liées au cloud (ajout de course, suivi multi-appareils).',
    };
  }
  return {
    title: 'Compte FuelOS',
    description:
      'Connecte-toi pour synchroniser tes données sur tous tes appareils et activer les fonctions liées à ton compte.',
  };
}

export function pathnameToHeaderPage(pathname: string | null): HeaderActivePage | undefined {
  if (!pathname) return undefined;
  if (pathname === '/') return 'home';
  if (pathname.startsWith('/plan')) return 'plan';
  if (pathname.startsWith('/shop') || pathname.startsWith('/produits')) return 'shop';
  if (pathname.startsWith('/races')) return 'races';
  if (pathname.startsWith('/race')) return 'race';
  if (pathname.startsWith('/prep')) return 'prep';
  if (pathname.startsWith('/history')) return 'history';
  if (pathname.startsWith('/learn') || pathname.startsWith('/analyses')) return 'learn';
  return undefined;
}

export function sectionLabelForPathname(pathname: string | null): string | undefined {
  const page = pathnameToHeaderPage(pathname);
  if (!page) return undefined;
  if (page === 'home') return 'Accueil';
  return NAV_SECTIONS.find((s) => s.page === page)?.label;
}
