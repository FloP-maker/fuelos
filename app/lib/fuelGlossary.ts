/**
 * Définitions pédagogiques pour les abréviations et termes techniques (nutrition d'effort).
 * Texte orienté grand public — réutilisable dans Plan, Boutique, etc.
 */
export const FUEL_GLOSSARY = {
  cho: {
    title: 'CHO — glucides',
    body: `« CHO » vient de l’anglais carbohydrates : ce sont les glucides que tu consommes pendant l’effort (gels, boissons, barres, etc.).

En pratique, on les exprime souvent en grammes par heure (g/h ou « g CHO/h ») : c’est le débit cible pour alimenter les muscles sans saturer l’estomac.`,
  },
  gi_tolerance: {
    title: 'Tolérance digestive (souvent abrégée « GI » ici)',
    body: `Ici, « GI » ne signifie pas l’index glycémique, mais la tolérance digestive : ta capacité à absorber des glucides sans inconfort (nausées, lourdeur, crampes).

Le calculateur adapte un plafond horaire en grammes de glucides par heure (g CHO/h) :

• Sensible — estomac fragile : plafond d’environ 45 g/h.
• Normal — tolérance habituelle : jusqu’à environ 60 g/h.
• Robuste — très bonne absorption : jusqu’à environ 90 g/h.

En cas de doute, reste sur « Normal » et ajuste après quelques sorties longues.`,
  },
  sweat_rate: {
    title: 'Taux de sudation (L/h)',
    body: `C’est le volume de sueur perdu environ par heure d’effort, en litres par heure (L/h).

Il sert à estimer tes besoins en boisson (et partiellement en sels). Les réglages « Faible » à « Très élevé » correspondent à des profils typiques ; pour affiner, un test de sudation (pesée avant/après séance, conditions proches de la course) donne le meilleur repère.`,
  },
} as const;

export type FuelGlossaryTermId = keyof typeof FUEL_GLOSSARY;
