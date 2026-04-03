import type { AthleteProfile, AidStation, FuelPlan, TimelineItem } from "./types";

export type DietStyle = "omnivore" | "vegetarian" | "vegan" | "gluten_free";

export type CarbLoadWindow = "3" | "7";

/** J−7 → J−1 : la fenêtre « 3 jours » n’affiche que J−3 à J−1 dans l’UI. */
export type CarbDayKey = "j7" | "j6" | "j5" | "j4" | "j3" | "j2" | "j1";

export const CARB_DAY_ORDER: CarbDayKey[] = ["j7", "j6", "j5", "j4", "j3", "j2", "j1"];

export const CARB_DAY_LABEL: Record<CarbDayKey, string> = {
  j7: "J−7",
  j6: "J−6",
  j5: "J−5",
  j4: "J−4",
  j3: "J−3",
  j2: "J−2",
  j1: "J−1",
};

export function defaultCarbGPerKg(window: CarbLoadWindow): Record<CarbDayKey, number> {
  if (window === "3") {
    return {
      j7: 5.5,
      j6: 5.5,
      j5: 6,
      j4: 6.5,
      j3: 7,
      j2: 8,
      j1: 6,
    };
  }
  return {
    j7: 5,
    j6: 5.5,
    j5: 6,
    j4: 6.5,
    j3: 7,
    j2: 8,
    j1: 6,
  };
}

/** @deprecated Utiliser defaultCarbGPerKg('3') — conservé pour imports existants. */
export const DEFAULT_CARB_G_PER_KG = defaultCarbGPerKg("3");

export function carbDayMeta(window: CarbLoadWindow): { key: CarbDayKey; title: string; subtitle: string }[] {
  const all: { key: CarbDayKey; title: string; subtitle: string }[] = [
    { key: "j7", title: "J−7", subtitle: "Amorce douce — volume glucides modéré, aliments familiers" },
    { key: "j6", title: "J−6", subtitle: "Maintien — pas de nouveautés digestives" },
    { key: "j5", title: "J−5", subtitle: "Montée progressive — surcharge maîtrisée" },
    { key: "j4", title: "J−4", subtitle: "Continuer à densifier sans saturer les fibres" },
    { key: "j3", title: "J−3", subtitle: "Lancement net de la charge glucidique" },
    { key: "j2", title: "J−2", subtitle: "Pic glucidique principal" },
    { key: "j1", title: "J−1", subtitle: "Maintien + faciliter la digestion" },
  ];
  if (window === "3") return all.filter((d) => ["j3", "j2", "j1"].includes(d.key));
  return all;
}

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

type MealSlot = "Petit-déjeuner" | "Déjeuner" | "Collation" | "Dîner";

type Pool = Record<MealSlot, string[][]>;

function fnv1a32(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

/** Exemples repas tirés de pools variés ; `salt` change à chaque « nouvelles idées ». */
export function pickCarbMealExamples(
  diet: DietStyle,
  dailyChoTotalG: number,
  dayKey: CarbDayKey,
  salt: number
): MealExample[] {
  const q = (pct: number) => Math.round(dailyChoTotalG * pct);
  const pools: Record<DietStyle, Pool> = MEAL_ITEM_POOLS;
  const p = pools[diet];
  const slots: MealSlot[] = ["Petit-déjeuner", "Déjeuner", "Collation", "Dîner"];
  const pcts = [0.28, 0.32, 0.18, 0.22] as const;

  return slots.map((slot, i) => {
    const variants = p[slot];
    const idx = fnv1a32(`${diet}|${dayKey}|${slot}|${salt}`) % variants.length;
    return {
      label: slot,
      items: variants[idx],
      approxChoG: q(pcts[i]),
    };
  });
}

const MEAL_ITEM_POOLS: Record<DietStyle, Pool> = {
  omnivore: {
    "Petit-déjeuner": [
      ["Flocons d’avoine 80–100 g + banane + miel", "Pain / brioche + confiture", "Jus de fruits 200 ml ou compote"],
      ["Pancakes / galettes + sirop d’érable + fruits rouges", "Yaourt ou fromage blanc + miel", "Thé — boisson habituelle"],
      ["Bagel + confiture + beurre", "Smoothie banane + lait ou boisson céréales", "Compote de pomme"],
      ["Riz au lait maison + cannelle + raisins", "Tranche de cake / pain aux raisins", "Jus de raisin (100–200 ml)"],
      ["Céréales type cornflakes / riz soufflé + lait + banane écrasée", "Toast miel", "Nectar de fruits"],
      ["Semolino / bouillie + lait + sucre roux", "Quelques figues sèches trempées", "Compote poire"],
      ["Waffle ou gaufre + coulis fruit + peu de chantilly si coutume", "Jus d’orange frais", "Flocons recap en collation si besoin"],
    ],
    Déjeuner: [
      [
        "Grande portion riz basmati ou pâtes (~150–200 g secs cuits)",
        "Poulet / tofu grillé (portion modérée)",
        "Légumes peu fibreux : courgettes, carottes",
      ],
      ["Bol polenta crémeuse + parmesan", "Dinde ou poisson poêlé", "Purée de carottes / courge"],
      ["Gnocchi de pomme de terre + sauce tomate + peu de viande hachée ou lentilles", "Pain de mie grillé"],
      ["Wrap grande tortilla + riz + haricots + poulet / œufs (sans excès fibres)", "Compote"],
      [
        "Pâtes carbonara légère ou napolitaine — portion généreuse",
        "Salade iceberg simple (peu de volume)",
        "Pain",
      ],
      ["Risotto arborio + champignons + volaille", "Tarte fruit maison part modérée"],
      ["Couscous semoule en volume + poulet, légumes passés à la vapeur douce", "Thé glacé sucré habituel si entraînement chaud"],
      ["Pad thaï noodles + protéine — demander peu de légumes crus en fibres", "Lait de coco = densité énergétique"],
    ],
    Collation: [
      ["Barre céréales ou génoise / madeleine", "Yaourt + coulis fruits"],
      ["Muffin maison ou brioche", "Smoothie lait + banane + miel"],
      ["Flocons d’avoine overnight + sirop", "Quelques biscuits secs"],
      ["Clémentines + pain d’épices", "Boisson maltée ou cacaotée"],
      ["Dattes Medjool ×4–6", "Lait ribot ou yaourt à boire"],
      ["Compote industrielle (facile à digérer) + gaufrettes fines"],
      ["Glace fruit (sorbet) + petite viennoiserie"],
    ],
    Dîner: [
      ["Pommes de terre au four / purée généreuse", "Poisson blanc ou blanc de dinde", "Pain complet si toléré"],
      ["Lasagnes ou gratin dauphinois (portion CHO dominante)", "Protéine simple", "Glucides en priorité"],
      ["Risotto crémeux ou paella riz dominant", "Éviter haricots verts en masse le soir"],
      ["Tarte salée pomme de terre / oignon + salade légère", "Soupe velouté (peu de crème si sensible)"],
      ["Quiche pâte brisée + purée", "Compote dessert"],
      ["Sushi bowls : gros bol riz + saumon / avocat modéré", "Algues en petite quantité"],
      ["Milanaise escalope petite — pâtes ou purée en grande assiette", "Mousse au chocolat légère si coutume"],
    ],
  },
  vegetarian: {
    "Petit-déjeuner": [
      ["Porridge avoine + sirop d’érable + fruits secs", "Pain + confiture, jus de fruits"],
      ["Crêpes + confiture + compote", "Smoothie amande + banane"],
      ["Céréales + lait végétal sucré", "Muffin + marmelade"],
      ["Riz au lait végétal + cannelle", "Raisins secs"],
      ["Toast avocat léger + confiture sur autre tranche", "Jus multivitaminé"],
      ["Semoule au lait (végétal) + sucre", "Poire rôtie"],
    ],
    Déjeuner: [
      ["Gros bol de pâtes ou risotto parmesan", "Salade simple, feta si tolérée"],
      ["Curry légumes + pois chiches + riz double ration", "Naan ou pain"],
      ["Gratin de pasta four cheese + salade iceberg", "Pain"],
      ["Buddha bowl : quinoa + patate douce + houmous (modéré en fibres brutes)", "Tahini sauce"],
      ["Falafels + taboulé limité en persil — privilégier semoule", "Wrap sauce yaourt"],
      ["Pizza margherita pâte épaisse — 2–3 parts", "Roquette symbolique"],
      ["Tarte poireaux sans excès de crème + purée maïs doux"],
    ],
    Collation: [
      ["Smoothie banane + flocons d’avoine", "Gâteau maison ou muffin"],
      ["Barre céréales + compote", "Yaourt soja + coulis"],
      ["Waffle végétal + sirop", "Fruits en conserve au sirop"],
      ["Pancakes protéines végé + confiture", "Thé + biscuit"],
      ["Confiture + pain + beurre cacahuète si toléré", "Banane"],
    ],
    Dîner: [
      ["Curry pois chiches + riz basmati (double ration riz)", "Naan ou chapati"],
      ["Penne aux légumes confits + crème légère + parmesan", "Soupe velouté maïs"],
      ["Tarte fine ratatouille + écrasé pomme de terre", "Salade mâche"],
      ["Curry tofu coco + nouilles de riz (gros bol)", "Brocolis vapeur modéré"],
      ["Chili sin carne + riz (pois chiches en quantité raisonnable si J−1 approche)", "Guacamole petit"],
      ["Risotto champignons + copeaux végétaux", "Compote"],
    ],
  },
  vegan: {
    "Petit-déjeuner": [
      ["Porridge avoine lait avoine + banane + sirop d’agave", "Tartines beurre végétal + confiture"],
      ["Smoothie protéines pois + flocons + dattes", "Muffin vegan"],
      ["Pain + confiture + tahin + datte", "Jus fruits"],
      ["Riz au lait coco + mangue", "Sirop érable"],
      ["Granola maison huile + sirop + flocons", "Compote pomme"],
      ["Crêpes farine pois chiche + confiture"],
    ],
    Déjeuner: [
      ["Bol pâtes + sauce tomate + légumineuses", "Parmesan vegan si utilisé"],
      ["Wrap pois chiches rôtis + riz + sauce yaourt coco", "Peu de crudités en volume"],
      ["Ramen nouilles + bouillon miso + tofu + maïs", "Algues snack"],
      ["Dahl lentilles corail + riz jasmin large", "Pickles en petit volume"],
      ["Curry seitan + patate + riz", "Chapati maïs"],
      ["Bowl buddha : quinoa + patate douce rôtie + houmous", "Légumes cuits"],
      ["Tagliatelles pesto + tomates confites + pignons"],
    ],
    Collation: [
      ["Dattes + barre énergétique vegan", "Smoothie fruits + flocons"],
      ["Compote + biscuit sans œuf", "Boisson avoine suc"],
      ["Glace fruit sorbet + cookie vegan", "Thé"],
      ["Purée amande + banane + cacao", "Rice cakes nappage"],
      ["Trail mix bananes chips + raisins", "Jus concentré"],
    ],
    Dîner: [
      ["Riz + lentilles corail / tofu mariné", "Légumes vapeur, tortillas maïs si besoin"],
      ["Shepherd’s pie patate + lentilles", "Petite salade"],
      ["Paella végétale riz dominant", "Peu d’artichaut"],
      ["Steak soja + purée patate douce + jus", "Compote"],
      ["Nouilles sautées tofu + légumes cuits souples", "Sauce arachide"],
      ["Chili tempeh + riz — haricots modérés si J−1", "Guacamole léger"],
      ["Curry aubergine lait coco + naan sans beurre"],
    ],
  },
  gluten_free: {
    "Petit-déjeuner": [
      ["Flocons riz / quinoa soufflé + fruits", "Pain certifié sans gluten + confiture", "Jus fruits"],
      ["Pancakes farine riz + sirop", "Yaourt + coulis"],
      ["Granola sans gluten + lait", "Banane"],
      ["Galettes sarrasin (sans garniture fibre lourde) + confiture", "Compote"],
      ["Riz au lait riz complet allégé + cannelle"],
      ["Céréales maïs + boisson végétale", "Pâte à tartiner coco"],
    ],
    Déjeuner: [
      ["Pâtes sarrasin ou riz (grande portion)", "Protéine au choix sans panure blé"],
      ["Polenta + roquette symbolique + œufs / volaille", "Pain SG"],
      ["Curry riz jasmin + légumes cuits + tofu", "Naan SG si trouvé"],
      ["Gratin pommes de terre + jambon / poisson", "Compote"],
      ["Risotto riz arborio + champignons + parmesan SG vérifié"],
      ["Wrap maïs + riz + poulet — sauce", "Peu haricots si J−1"],
      ["Nouilles riz pad + protéine + légumes cuits"],
    ],
    Collation: [
      ["Gâteau riz / maïs", "Yaourt ou alternative + coulis fruits"],
      ["Barre céréales SG labellisée", "Dattes"],
      ["Muffin SG maison", "Smoothie"],
      ["Crackers riz + confiture", "Compote poire"],
      ["Sorbet + biscuit SG"],
    ],
    Dîner: [
      ["Pommes de terre / patate douce en volume", "Volaille, poisson ou tofu — sauce sans farine blé"],
      ["Lasagnes pâtes SG + béchamel riz", "Salade jeunes pousses"],
      ["Tajine riz + légumes confits + semoule de riz", "Datte dessert"],
      ["Fish & chips panure riz — frites en volume maîtrisé", "Mushy peas limité"],
      ["Curry coco + riz basmati", "Chips plantain en entree modérée"],
      ["Quiche pâte SG + écrasé carottes"],
    ],
  },
};

export type CarbChecklistItem = { id: string; label: string };

export function carbDayChecklist(day: CarbDayKey, dayLabel: string): CarbChecklistItem[] {
  const raceIn = { j7: 7, j6: 6, j5: 5, j4: 4, j3: 3, j2: 2, j1: 1 }[day];
  const fiber =
    day === "j1"
      ? "Limiter fibres & plats trop lourds (légumineuses, choux, trop de légumes secs)"
      : raceIn >= 5
        ? "Garder des aliments de référence — pas de plats ultra-fibreux nouveaux"
        : "Éviter l’excès de fibres nouvelles (nouveaux produits, épices fortes)";

  const train =
    day === "j1"
      ? "Entraînement très léger ou repos — pas de séance intense"
      : raceIn >= 5
        ? "Entraînement habituel ou légèrement réduit — éviter tests maximaux"
        : raceIn === 4
          ? "Séances plus courtes / qualité légère — limiter fatigue résiduelle"
          : "Entraînement léger / court si prévu";

  return [
    { id: `${day}-hydration`, label: `Hydratation régulière (${dayLabel}) — eau + boissons habituelles` },
    { id: `${day}-meals`, label: `4 prises principales + collations pour coller à l’objectif CHO` },
    { id: `${day}-low-fiber`, label: fiber },
    { id: `${day}-train`, label: train },
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

export type RecoveryPrefs = {
  cryotherapy: boolean;
  naturalCare: boolean;
  massage: boolean;
  saunaOk: boolean;
};

export type PostRaceBlock = { title: string; items: string[] };

/** Protocole indicatif post-épreuve (éducatif — pas un avis médical). */
export function buildPostRaceProtocol(prefs: RecoveryPrefs, giTolerance: AthleteProfile["giTolerance"] | undefined): PostRaceBlock[] {
  const gentleGi = giTolerance === "sensitive";
  const blocks: PostRaceBlock[] = [
    {
      title: "0–2 h : clôture de l’effort",
      items: [
        "Boisson avec sodium + glucides si tolérée (eau + repas ou boisson de récup) — petites gorgées régulières.",
        gentleGi
          ? "Privilégier aliments peu irritants : riz, banane, compote, bouillon ; éviter gros volume fibres ou épices."
          : "Repas ou collation solide dès que l’appétit revient : glucides + protéines (ex. riz/pâtes + yaourt/œuf).",
        "Éviter l’alcool tôt après l’arrivée tant que l’hydratation de base n’est pas rétablie.",
      ],
    },
    {
      title: "24 h : nutrition de récupération",
      items: [
        "Viser repas complets : ~1,2–1,6 g protéines/kg réparties sur la journée + glucides selon faim et séances suivantes.",
        "Fruits, légumes cuits, sources magnésium/potassium (banane, pomme de terre, avocat modéré).",
        "Si deuxième sortie légère le lendemain : petit-déjeuner glucides familiers avant.",
      ],
    },
    {
      title: "48–72 h : retour à charge",
      items: [
        "Réintroduire fibres et repas variés progressivement si l’estomac est OK.",
        "Sommeil et pas forcés — marche légère ou vélo cool avant toute intensité.",
      ],
    },
  ];

  if (prefs.naturalCare) {
    blocks.splice(1, 0, {
      title: "Soins « naturels » & confort",
      items: [
        "Douche tiède puis jambs hautes 10–15 min si agréable ; sortie de bain marche légère pour réactiver circulation.",
        "Auto-massage rouleau / balle pieds & mollets 5–10 min, sans douleur vive.",
        "Respiration ventrale ou courte séance mobilité hanches/cheville (10 min).",
        "Tisane ou infusion habituelle ; compression légère chaussettes si déjà utilisées en entraînement.",
      ],
    });
  }

  if (prefs.massage) {
    blocks.push({
      title: "Massage (si vous y êtes habitué)",
      items: [
        "Préférer massage doux ou drainant dans les 24–72 h plutôt qu’un travail très profond juste après l’ultra.",
        "Signalez zones sensibles, crampes ou douleurs — arrêt si douleur aiguë.",
      ],
    });
  }

  if (prefs.cryotherapy) {
    blocks.push({
      title: "Cryo / froid contrôlé",
      items: [
        "Bain froid ou cryo cabine seulement si vous l’avez déjà testé en phase de prépa — jamais « premier essai » post-course.",
        "Durée brève (ex. immersion 8–12 min eau fraîche, pas glacée extrême) et sortie si engourdissement anormal.",
        "Pas de substitution à l’alimentation et au sommeil ; attention pieds mains si neuropathies.",
      ],
    });
  }

  if (prefs.saunaOk) {
    blocks.push({
      title: "Sauna — option prudente",
      items: [
        "Uniquement si hydratation rétablie et pas de malaise cardio — séances courtes, température modérée.",
        "Éviter le jour même si nausée ou hypotension ; espacer de plusieurs heures après la fin d’effort.",
      ],
    });
  }

  return blocks;
}
