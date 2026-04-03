import type { AthleteProfile, AidStation, FuelPlan, TimelineItem } from "./types";

export type DietStyle = "omnivore" | "vegetarian" | "vegan" | "gluten_free";

export const DEFAULT_CARB_G_PER_KG = {
  j3: 7,
  j2: 8,
  j1: 6,
} as const;

export type CarbDayKey = "j3" | "j2" | "j1";

export function dailyChoFromBody(weightKg: number, gPerKg: number): number {
  return Math.round(weightKg * gPerKg);
}

export function inferDietFromProfile(profile: AthleteProfile | null): DietStyle {
  if (!profile) return "omnivore";
  const a = profile.allergies.map((x) => x.toLowerCase());
  if (a.some((x) => x.includes("gluten") || x === "blé")) return "gluten_free";
  return "omnivore";
}

export type MealExample = {
  label: string;
  items: string[];
  approxChoG: number;
};

/** Blocs repas indicatifs (à ajuster au poids réel via l’objectif du jour). */
export function getCarbLoadingMealBlocks(
  diet: DietStyle,
  dailyChoTotalG: number
): MealExample[] {
  const q = (pct: number) => Math.round(dailyChoTotalG * pct);

  const blocks: Record<DietStyle, MealExample[]> = {
    omnivore: [
      {
        label: "Petit-déjeuner",
        items: [
          "Flocons d’avoine 80–100 g + banane + miel",
          "Pain / brioche + confiture",
          "Jus de fruits 200 ml ou compote",
        ],
        approxChoG: q(0.28),
      },
      {
        label: "Déjeuner",
        items: [
          "Grande portion de riz basmati ou pâtes (~150–200 g secs cuits)",
          "Poulet / tofu grillé (portion modérée — le CHO vient surtout des féculents)",
          "Légumes peu fibreux (courgettes, carottes)",
        ],
        approxChoG: q(0.32),
      },
      {
        label: "Collation",
        items: [
          "Barre céréales ou figolu / génoise",
          "Yaourt + coulis de fruits",
        ],
        approxChoG: q(0.18),
      },
      {
        label: "Dîner",
        items: [
          "Pommes de terre au four / purée généreuse",
          "Poisson blanc ou blanc de dinde",
          "Pain complet si toléré",
        ],
        approxChoG: q(0.22),
      },
    ],
    vegetarian: [
      {
        label: "Petit-déjeuner",
        items: [
          "Porridge avoine + sirop d’érable + fruits secs",
          "Pain + confiture, jus de fruits",
        ],
        approxChoG: q(0.28),
      },
      {
        label: "Déjeuner",
        items: [
          "Gros bol de pâtes ou risotto parmesan",
          "Salade simple, feta si tolérée",
        ],
        approxChoG: q(0.32),
      },
      {
        label: "Collation",
        items: ["Smoothie banane + flocons d’avoine", "Gâteau maison ou muffin"],
        approxChoG: q(0.18),
      },
      {
        label: "Dîner",
        items: [
          "Curry pois chiches + riz basmati (double ration de riz)",
          "Naan ou pain (sans gluten si besoin)",
        ],
        approxChoG: q(0.22),
      },
    ],
    vegan: [
      {
        label: "Petit-déjeuner",
        items: [
          "Porridge avoine lait végétal + banane + sirop d’agave",
          "Tartines (beurre végétal) + confiture",
        ],
        approxChoG: q(0.28),
      },
      {
        label: "Déjeuner",
        items: [
          "Bol de pâtes + sauce tomate + légumineuses",
          "Fromage végétal ou parmesan vegan si utilisé",
        ],
        approxChoG: q(0.32),
      },
      {
        label: "Collation",
        items: ["Dattes + barre énergétique vegan", "Smoothie fruits + flocons"],
        approxChoG: q(0.18),
      },
      {
        label: "Dîner",
        items: [
          "Riz + lentilles corail / tofu mariné",
          "Légumes vapeur, tortillas de maïs si besoin",
        ],
        approxChoG: q(0.22),
      },
    ],
    gluten_free: [
      {
        label: "Petit-déjeuner",
        items: [
          "Flocons de riz / quinoa soufflé + fruits",
          "Pain certifié sans gluten + confiture",
          "Jus de fruits",
        ],
        approxChoG: q(0.28),
      },
      {
        label: "Déjeuner",
        items: [
          "Pâtes de sarrasin ou riz (grande portion)",
          "Protéine au choix (sans panure au blé)",
        ],
        approxChoG: q(0.32),
      },
      {
        label: "Collation",
        items: ["Gâteau riz / maïs", "Yaourt ou alternative + coulis fruits"],
        approxChoG: q(0.18),
      },
      {
        label: "Dîner",
        items: [
          "Pommes de terre / patate douce en volume",
          "Volaille, poisson ou tofu — sauce sans farine de blé",
        ],
        approxChoG: q(0.22),
      },
    ],
  };

  return blocks[diet];
}

export type CarbChecklistItem = { id: string; label: string };

export function carbDayChecklist(day: CarbDayKey, dayLabel: string): CarbChecklistItem[] {
  const fiber =
    day === "j1"
      ? "Limiter fibres & plats trop lourds (légumineuses, choux, trop de légumes secs)"
      : "Éviter l’excès de fibres nouvelles (nouveaux produits, épices fortes)";

  return [
    { id: `${day}-hydration`, label: `Hydratation régulière (${dayLabel}) — eau + boissons habituelles` },
    { id: `${day}-meals`, label: `4 prises principales + collations pour coller à l’objectif CHO` },
    { id: `${day}-low-fiber`, label: fiber },
    { id: `${day}-train`, label: day === "j1" ? "Entraînement très léger ou repos — pas de séance intense" : "Entraînement léger / court si prévu" },
    { id: `${day}-sleep`, label: "Sommeil prioritaire (7–9 h)" },
  ];
}

export const RACE_MATERIAL_CHECKLIST: CarbChecklistItem[] = [
  { id: "mat-gels-counted", label: "Gels : quantité alignée avec le plan (comptés, dates de péremption OK)" },
  { id: "mat-flasks", label: "Flasques / soft flasks : nettoyées, remplies ou prêtes à remplir" },
  { id: "mat-drink-mix", label: "Sachets de boisson / électrolytes pré-dosés si utilisés" },
  { id: "mat-bars-realfood", label: "Barres & aliments solides du plan emballés et accessibles" },
  { id: "mat-drop-bags", label: "Sacs de repli / drop bags étiquetés (nom, dossard, poste)" },
  { id: "mat-backup", label: "Kit secours : 1–2 gels & un peu de cash / lampe selon parcours" },
];

/** Compte les gels prévus sur la timeline du plan actif. */
export function summarizeRaceNutritionFromPlan(plan: FuelPlan | null): {
  gelCount: number;
  gelChoG: number;
  flaskHints: number;
  items: TimelineItem[];
} {
  if (!plan) {
    return { gelCount: 0, gelChoG: 0, flaskHints: 0, items: [] };
  }
  const items = plan.timeline;
  let gelCount = 0;
  let gelChoG = 0;
  let flaskHints = 0;
  for (const t of items) {
    if (t.type === "gel") {
      gelCount += 1;
      gelChoG += t.cho;
    }
    if (t.water && t.water >= 250) flaskHints += 1;
  }
  return { gelCount, gelChoG, flaskHints, items };
}

export function seedDropBagsFromAid(aids: AidStation[] | undefined): { cpLabel: string; distanceKm: string }[] {
  if (!aids?.length) return [];
  return aids.map((a) => ({
    cpLabel: a.name?.trim() || `CP ${a.distanceKm} km`,
    distanceKm: String(a.distanceKm),
  }));
}
