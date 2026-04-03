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
  /** Étapes indicatives (quantités pour viser ~approxChoG g CHO sur ce repas) */
  recipeSteps: string[];
  /** Phrase récap (objectif vs somme des lignes) */
  choRecap: string;
  /** Pas à pas plus détaillé (ex. gaufres) selon le type de plat détecté */
  recipeExpanded: string[];
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
    const approxChoG = q(pcts[i]);
    const items = variants[idx];
    const { recipeSteps, choRecap } = buildChoScaledRecipe(items, approxChoG, slot);
    const recipeExpanded = buildExpandedRecipeNarrative(items, slot);
    return {
      label: slot,
      items,
      approxChoG,
      recipeSteps,
      choRecap,
      recipeExpanded,
    };
  });
}

/** Poids relatif pour répartir l’objectif CHO du repas entre les aliments. */
export function carbFragmentWeight(fragment: string): number {
  const t = fragment.toLowerCase();
  if (
    /^(protéine simple|glucides en priorité|éviter|légumes peu fibreux|algues)/i.test(fragment) ||
    /demander peu|éviter haricots|mushy peas|roquette symbolique/i.test(t)
  ) {
    return 0.15;
  }
  if (
    /\b(poulet|dinde|poisson|saumon|blanc de|tofu|tempeh|seitan|œuf|oeuf|volaille|jambon|escalope|protéine)\b/i.test(
      t
    ) &&
    !/nouilles|wrap|pad thaï/i.test(t)
  ) {
    return 0.35;
  }
  if (
    /\b(salade|brocoli|courgette|carotte|courge|mâche|iceberg|champignon|artichaut|épinard|ratatouille|légume|taboulé)\b/i.test(
      t
    )
  ) {
    return 0.35;
  }
  if (/\b(algues|pickle|kimchi)\b/i.test(t)) return 0.2;
  if (
    /\b(yaourt|yogourt|fromage blanc|ribot|beurre(?! vég)|crème(?! lég)|lait\b|boisson vég|lait avoine|cacao|cannelle)\b/i.test(
      t
    )
  ) {
    return 1.35;
  }
  if (/\b(jus|nectar|smoothie|compote|banane|mang|datte|fig|clément|orange|fruit|baie|pomme|poire|raisin|confiture|miel|sirop|coulis|marmelade|nectar)\b/i.test(t)) {
    return 1.45;
  }
  if (/\b(thé|café|tisane|infusion)\b/i.test(t)) return 0.05;
  return 2.1;
}

/** g CHO pour 100 g (ou 100 ml liquides « type jus/lait ») sauf exceptions. */
type ChoDensityRule = { re: RegExp; choPer100: number; mode?: "dry" | "cooked" | "as_eaten" | "liquid" };

const CHO_DENSITY_RULES: ChoDensityRule[] = [
  { re: /flocon|avoine(?! lait)|porridge|overnight/i, choPer100: 59, mode: "dry" },
  { re: /céréale|cornflake|riz soufflé|granola/i, choPer100: 82, mode: "dry" },
  { re: /riz(?! au lait)|basmati|jasmin|sushi/i, choPer100: 28, mode: "cooked" },
  { re: /semoule(?! au lait)|couscous/i, choPer100: 23, mode: "cooked" },
  { re: /quinoa/i, choPer100: 18, mode: "cooked" },
  { re: /boulgour|blé concassé/i, choPer100: 20, mode: "cooked" },
  { re: /pâtes?|penne|tagliatelles?|lasagne|nouilles?|ramen|pad thaï|vermicelle/i, choPer100: 26, mode: "cooked" },
  { re: /gnocchi/i, choPer100: 30, mode: "cooked" },
  { re: /polenta/i, choPer100: 16, mode: "cooked" },
  { re: /pizza/i, choPer100: 32, mode: "as_eaten" },
  { re: /pain|brioche|bagel|toast|naan|chapati|focaccia/i, choPer100: 48, mode: "as_eaten" },
  { re: /tortilla|wrap/i, choPer100: 45, mode: "as_eaten" },
  { re: /galette|sarrasin/i, choPer100: 20, mode: "as_eaten" },
  { re: /pancake|crêpe|waffle|gaufr|muffin|cake|viennois|madeleine|brioche|biscuit|cookie|barre|gaufrette|pain d’épices/i, choPer100: 45, mode: "as_eaten" },
  { re: /pomme de terre|purée|patate douce|gratin dauphinois|frites?/i, choPer100: 17, mode: "cooked" },
  { re: /patate\b/i, choPer100: 17, mode: "cooked" },
  { re: /riz au lait/i, choPer100: 20, mode: "as_eaten" },
  { re: /semolino|bouillie/i, choPer100: 15, mode: "cooked" },
  { re: /lentille|pois chich|haricot|légumineuses|chili|dahl/i, choPer100: 14, mode: "cooked" },
  { re: /riz sec|pâtes? secs/i, choPer100: 75, mode: "dry" },
  { re: /parmesan|feta|fromage(?! blanc)/i, choPer100: 4, mode: "as_eaten" },
  { re: /yaourt|yogourt|fromage blanc/i, choPer100: 5.5, mode: "liquid" },
  { re: /lait\b|boisson avoine|boisson céréale/i, choPer100: 5, mode: "liquid" },
  { re: /jus |nectar|smoothie malt/i, choPer100: 10, mode: "liquid" },
  { re: /compote/i, choPer100: 16, mode: "as_eaten" },
  { re: /confiture|marmelade/i, choPer100: 60, mode: "as_eaten" },
  { re: /miel|sirop|sirop d’érable|agave|coulis/i, choPer100: 78, mode: "as_eaten" },
  { re: /tahin|houmous|pesto|sauce tomate|guacamole|beurre végétal|pâte à tartiner/i, choPer100: 12, mode: "as_eaten" },
  { re: /banane/i, choPer100: 23, mode: "as_eaten" },
  { re: /datte|fig/i, choPer100: 65, mode: "dry" },
  { re: /sorbet|glace fruit/i, choPer100: 30, mode: "as_eaten" },
  { re: /chips|plantain/i, choPer100: 55, mode: "as_eaten" },
  { re: /quiche/i, choPer100: 22, mode: "as_eaten" },
  { re: /\btarte\b/i, choPer100: 22, mode: "as_eaten" },
  { re: /risotto|paella/i, choPer100: 22, mode: "cooked" },
];

export function splitMealRowIntoFragments(row: string): string[] {
  const cleaned = row.replace(/\([^)]{0,120}\)/g, " ").trim();
  return cleaned
    .split(/\s*\+\s*|\s*\/\s*|\s*—\s*/i)
    .map((s) => s.replace(/\s+/g, " ").trim())
    .flatMap((s) => (/\s\bou\s/i.test(s) ? s.split(/\s\bou\s/i) : [s]))
    .map((s) => s.replace(/^[^:]+:\s*/, "").trim())
    .filter((s) => s.length > 1);
}

export function allocateChoBudgets(totalCho: number, weights: number[]): number[] {
  const wsum = weights.reduce((a, b) => a + b, 0) || 1;
  const raw = weights.map((w) => (totalCho * w) / wsum);
  const rounded = raw.map((x) => Math.max(0, Math.round(x)));
  let diff = totalCho - rounded.reduce((a, b) => a + b, 0);
  const order = rounded.map((_, i) => i).sort((i, j) => raw[j] - raw[i]);
  let k = 0;
  while (diff !== 0 && order.length) {
    const i = order[k % order.length];
    if (diff > 0) {
      rounded[i] += 1;
      diff -= 1;
    } else if (rounded[i] > 0) {
      rounded[i] -= 1;
      diff += 1;
    }
    k += 1;
    if (k > 2000) break;
  }
  return rounded;
}

function formatQuantityForFragment(fragment: string, choG: number): string {
  const f = fragment.trim();
  const t = f.toLowerCase();
  if (choG <= 0) return `${f} (négligeable en CHO ici).`;

  if (/\b(banane)\b/i.test(t)) {
    const n = choG / 24;
    const approx = n < 0.65 ? "½ banane moyenne" : n < 1.15 ? "1 banane moyenne" : `${Math.round(n * 10) / 10} bananes moyennes`;
    return `${f} → ~${approx} (≈ ${choG} g CHO).`;
  }

  if (/\b(datte)\b/i.test(t)) {
    const n = Math.max(1, Math.round(choG / 5));
    return `${f} → ~${n} petite(s) datte(s) (≈ ${choG} g CHO).`;
  }

  if (/\b(confiture|marmelade)\b/i.test(t)) {
    const g = Math.max(15, Math.round((choG * 100) / 60));
    return `${f} → ~${g} g (≈ ${choG} g CHO).`;
  }

  if (/\bcoulis\b/i.test(t)) {
    const g = Math.max(10, Math.round((choG * 100) / 55));
    return `${f} → ~${g} g (≈ ${choG} g CHO).`;
  }

  if (
    /\b(miel|sirop d[’']?(?:érable|agave))\b/i.test(t) ||
    (/sirop\b/i.test(t) && !/sirop d[’']?(?:érable|agave)/i.test(t))
  ) {
    const càs = Math.max(0.5, Math.round(((choG / 78) * 15) * 2) / 2);
    return `${f} → ~${càs} c. à soupe rase(s) (≈ ${choG} g CHO).`;
  }

  if (/\bsmoothie\b/i.test(t)) {
    const ml = Math.round((choG * 100) / 12);
    return `${f} → ~${ml} ml (≈ ${choG} g CHO — doser flocons / fruits selon mixeur).`;
  }

  if (/\b(jus|nectar)\b/i.test(t)) {
    const ml = Math.round((choG * 100) / 10);
    return `${f} → ~${ml} ml (≈ ${choG} g CHO).`;
  }

  if (/\b(compote)\b/i.test(t)) {
    const g = Math.round((choG * 100) / 16);
    return `${f} → 1 petite portion ~${Math.max(80, g)} g ou pots cumulés (≈ ${choG} g CHO).`;
  }

  if (/\b(lait\b|boisson avoine|boisson céréale)\b/i.test(t) && !/flocon|banane|smoothie/i.test(t)) {
    const ml = Math.round((choG * 100) / Math.max(4, 5.5));
    return `${f} → ~${ml} ml (≈ ${choG} g CHO).`;
  }

  if (/\byaourt|yogourt|fromage blanc\b/i.test(t)) {
    const g = Math.round((choG * 100) / 5.5);
    return `${f} → ~${Math.max(100, g)} g (≈ ${choG} g CHO).`;
  }

  for (const rule of CHO_DENSITY_RULES) {
    if (!rule.re.test(t)) continue;
    const g = Math.max(10, Math.round((choG * 100) / rule.choPer100));
    let unit = "g";
    let prep = "";
    if (rule.mode === "dry" && !/sec/i.test(t)) prep = " (poids sec / cru)";
    if (rule.mode === "cooked") prep = " (poids cuit / prêt à manger)";
    if (rule.mode === "liquid") prep = " (ml équivalent)";
    if (rule.mode === "dry" && /lait|jus/i.test(t)) unit = "ml";

    if (rule.mode === "liquid" && /lait|boisson/i.test(t)) {
      const ml = Math.round((choG * 100) / rule.choPer100);
      return `${f} → ~${ml} ml${prep} (≈ ${choG} g CHO).`;
    }

    return `${f} → ~${g} ${unit}${prep} (≈ ${choG} g CHO).`;
  }

  const gGen = Math.round((choG * 100) / 45);
  return `${f} → portion type ~${Math.max(40, gGen)} g aliment mixte à ~45 % CHO (≈ ${choG} g CHO — affiner avec étiquette).`;
}

/** Recette chiffrée : répartition de `targetChoG` entre fragments + phrases portions. */
export function buildChoScaledRecipe(
  items: string[],
  targetChoG: number,
  _slot: MealSlot
): { recipeSteps: string[]; choRecap: string } {
  const rows = items.map((row) => splitMealRowIntoFragments(row));
  const flatParts = rows.flat();
  if (flatParts.length === 0) {
    return {
      recipeSteps: ["Ajuster les portions familières pour viser l’objectif glucidique du repas."],
      choRecap: `Objectif repas ~${targetChoG} g CHO.`,
    };
  }

  const weights = flatParts.map(carbFragmentWeight);
  const choByPart = allocateChoBudgets(targetChoG, weights);

  const steps: string[] = [];
  let idx = 0;
  for (let r = 0; r < items.length; r++) {
    const parts = rows[r];
    if (parts.length === 0) continue;
    const subCho = choByPart.slice(idx, idx + parts.length);
    idx += parts.length;
    const lineTotal = subCho.reduce((a, b) => a + b, 0);

    if (parts.length === 1) {
      steps.push(`${r + 1}. ${formatQuantityForFragment(parts[0], subCho[0])}`);
      continue;
    }

    steps.push(
      `${r + 1}. Composer ce volet (~${lineTotal} g CHO) : ${parts.map((p, i) => formatQuantityForFragment(p, subCho[i] ?? 0)).join(" ; ")}`
    );
  }

  const sum = choByPart.reduce((a, b) => a + b, 0);
  const choRecap =
    sum === targetChoG
      ? `Objectif repas : ~${targetChoG} g CHO — répartition ci-dessus (~${sum} g).`
      : `Objectif repas : ~${targetChoG} g CHO — total indicatif des lignes ~${sum} g (arrondis).`;

  return { recipeSteps: steps, choRecap };
}

// ——— Liste d’achats du jour (menus affichés uniquement), saison, fourchette prix ———

function roundShop5(n: number): number {
  if (!Number.isFinite(n)) return 0;
  if (n >= 280) return Math.round(n / 25) * 25;
  if (n >= 80) return Math.round(n / 10) * 10;
  return Math.round(n / 5) * 5;
}

function purchaseDedupeKey(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .replace(/\s+/g, "_")
    .slice(0, 36);
}

export type PrepPurchaseLine = {
  mergeKey: string;
  displayLabel: string;
  buyAmount: number;
  buyUnit: "g" | "ml" | "piece";
  shopDetail: string;
  seasonalHint?: string;
};

function fragmentToPurchaseLine(fragment: string, choG: number): PrepPurchaseLine | null {
  if (choG < 0.5) return null;
  const f = fragment.trim();
  const t = f.toLowerCase();
  if (/\bthé\b|\bcafé\b|tisane|infusion\b/i.test(t)) return null;

  if (/\bbanane\b/i.test(t)) {
    const pc = Math.max(0.5, Math.ceil((choG / 24) * 2) / 2);
    return {
      mergeKey: "piece|banane",
      displayLabel: "Bananes",
      buyAmount: pc,
      buyUnit: "piece",
      shopDetail: `Bananes : ${pc} pièce(s) moyenne(s) (≈ ${Math.round(choG)} g CHO)`,
    };
  }

  if (/\bdatte\b/i.test(t)) {
    const pc = Math.max(2, Math.round(choG / 5));
    return {
      mergeKey: "piece|datte",
      displayLabel: "Dattes",
      buyAmount: pc,
      buyUnit: "piece",
      shopDetail: `Dattes : ${pc} unités (≈ ${Math.round(choG)} g CHO)`,
    };
  }

  if (/\bconfiture|marmelade\b/i.test(t)) {
    const g = roundShop5(Math.max(25, (choG * 100) / 60));
    return {
      mergeKey: "cond|confiture",
      displayLabel: "Confiture",
      buyAmount: g,
      buyUnit: "g",
      shopDetail: `Confiture : ${g} g`,
    };
  }

  if (/\bcoulis\b/i.test(t)) {
    const g = roundShop5(Math.max(20, (choG * 100) / 55));
    return { mergeKey: "cond|coulis", displayLabel: "Coulis fruit", buyAmount: g, buyUnit: "g", shopDetail: `Coulis : ${g} g` };
  }

  if (/\bmiel\b|sirop\b/i.test(t)) {
    const g = roundShop5(Math.max(15, (choG * 100) / 78));
    return {
      mergeKey: "cond|miel_sirop",
      displayLabel: "Miel / sirop",
      buyAmount: g,
      buyUnit: "g",
      shopDetail: `Miel ou sirop : ${g} g (poids approximatif)`,
    };
  }

  if (/\bsmoothie\b/i.test(t)) {
    const ml = roundShop5(Math.max(150, (choG * 100) / 12));
    return {
      mergeKey: "liq|smoothie_base",
      displayLabel: "Ingrédients smoothie (liquide + fruits / flocons)",
      buyAmount: ml,
      buyUnit: "ml",
      shopDetail: `Prévoir fruits + base liquide pour ~${ml} ml de smoothie`,
    };
  }

  if (/\bjus\b|nectar\b/i.test(t)) {
    const ml = roundShop5(Math.max(150, (choG * 100) / 10));
    return { mergeKey: "liq|jus", displayLabel: "Jus ou nectar", buyAmount: ml, buyUnit: "ml", shopDetail: `Jus / nectar : ${ml} ml` };
  }

  if (/\bcompote\b/i.test(t)) {
    const g = roundShop5(Math.max(120, (choG * 100) / 16));
    return {
      mergeKey: "frais|compote",
      displayLabel: "Compote ou fruits pour compote",
      buyAmount: g,
      buyUnit: "g",
      shopDetail: `Compote (ou équivalent) : ${g} g`,
    };
  }

  if (/\byaourt|yogourt|fromage blanc\b/i.test(t)) {
    const g = roundShop5(Math.max(125, (choG * 100) / 5.5));
    return {
      mergeKey: "frais|yaourt",
      displayLabel: "Yaourt / fromage blanc",
      buyAmount: g,
      buyUnit: "g",
      shopDetail: `Yaourt : ${g} g (≈ ${Math.max(1, Math.round(g / 125))} pot(s) de 125 g)`,
    };
  }

  if (/\blait\b|boisson avoine|boisson céréale\b/i.test(t) && !/flocon|smoothie/i.test(t)) {
    const ml = roundShop5(Math.max(200, (choG * 100) / 5));
    return {
      mergeKey: "liq|lait_veg",
      displayLabel: "Lait ou boisson végétale",
      buyAmount: ml,
      buyUnit: "ml",
      shopDetail: `Lait / boisson végétale : ${ml} ml`,
    };
  }

  if (/riz au lait/i.test(t)) {
    const gRiz = roundShop5(Math.max(70, (choG * 0.38 * 100) / 75));
    const mlLait = roundShop5(Math.max(300, (choG * 0.42 * 100) / 5));
    return {
      mergeKey: "mix|riz_au_lait",
      displayLabel: "Riz au lait (riz rond + lait + sucre)",
      buyAmount: gRiz,
      buyUnit: "g",
      shopDetail: `Riz rond sec : ${gRiz} g ; lait : ${mlLait} ml ; sucre / vanille / cannelle selon habitude`,
    };
  }

  if (/\briz\b/i.test(t) && !/riz au lait|nouilles? de riz|vermicelle/i.test(t)) {
    const cookedG = Math.max(60, Math.round((choG * 100) / 28));
    const dryG = roundShop5(cookedG * 0.34);
    return {
      mergeKey: "sec|riz",
      displayLabel: "Riz (sec)",
      buyAmount: dryG,
      buyUnit: "g",
      shopDetail: `Riz sec : ${dryG} g (cible ~${cookedG} g cuits, ≈ ${Math.round(choG)} g CHO)`,
    };
  }

  if (/\bpâtes?\b|penne|tagliatelles?|lasagne|spaghetti/i.test(t)) {
    const cookedG = Math.max(55, Math.round((choG * 100) / 26));
    const dryG = roundShop5(cookedG * 0.33);
    return {
      mergeKey: "sec|pates",
      displayLabel: "Pâtes sèches",
      buyAmount: dryG,
      buyUnit: "g",
      shopDetail: `Pâtes sèches : ${dryG} g (≈ ${cookedG} g cuites)`,
    };
  }

  if (/gnocchi/i.test(t)) {
    const g = roundShop5(Math.max(200, (choG * 100) / 30));
    return {
      mergeKey: "frais|gnocchi",
      displayLabel: "Gnocchi (sachet ou frais)",
      buyAmount: g,
      buyUnit: "g",
      shopDetail: `Gnocchi : ${g} g prêts à chauffer / cuire`,
    };
  }

  if (/nouilles? de riz|vermicelle|pad thaï/i.test(t)) {
    const cookedG = Math.max(50, Math.round((choG * 100) / 24));
    const dryG = roundShop5(cookedG * 0.42);
    return {
      mergeKey: "sec|nouilles_riz",
      displayLabel: "Nouilles de riz sèches",
      buyAmount: dryG,
      buyUnit: "g",
      shopDetail: `Nouilles de riz : ${dryG} g`,
    };
  }

  if (/\bflocon|avoine|porridge|overnight\b/i.test(t) && !/riz soufflé/i.test(t)) {
    const dryG = roundShop5(Math.max(45, (choG * 100) / 59));
    return {
      mergeKey: "sec|avoine",
      displayLabel: "Flocons d’avoine",
      buyAmount: dryG,
      buyUnit: "g",
      shopDetail: `Flocons d’avoine : ${dryG} g`,
    };
  }

  if (/céréale|cornflake|riz soufflé|granola/i.test(t)) {
    const dryG = roundShop5(Math.max(45, (choG * 100) / 82));
    return {
      mergeKey: "sec|cereales",
      displayLabel: "Céréales petit-déjeuner",
      buyAmount: dryG,
      buyUnit: "g",
      shopDetail: `Céréales : ${dryG} g`,
    };
  }

  if (/\bcouscous\b|\bsemoule\b/i.test(t) && !/au lait/i.test(t)) {
    const cookedG = Math.max(55, Math.round((choG * 100) / 23));
    const dryG = roundShop5(cookedG * 0.31);
    return {
      mergeKey: "sec|semoule",
      displayLabel: "Semoule / couscous (sec)",
      buyAmount: dryG,
      buyUnit: "g",
      shopDetail: `Semoule / couscous sec : ${dryG} g`,
    };
  }

  if (/\bquinoa\b/i.test(t)) {
    const cookedG = Math.max(55, Math.round((choG * 100) / 18));
    const dryG = roundShop5(cookedG * 0.36);
    return {
      mergeKey: "sec|quinoa",
      displayLabel: "Quinoa (sec)",
      buyAmount: dryG,
      buyUnit: "g",
      shopDetail: `Quinoa sec : ${dryG} g`,
    };
  }

  if (/\bpolenta\b/i.test(t)) {
    const g = roundShop5(Math.max(80, (choG * 100) / 16));
    return {
      mergeKey: "sec|polenta",
      displayLabel: "Polenta / semoule de maïs",
      buyAmount: g,
      buyUnit: "g",
      shopDetail: `Polenta : ${g} g`,
    };
  }

  if (/\bpain|brioche|bagel|toast|naan|chapati\b/i.test(t)) {
    const g = roundShop5(Math.max(50, (choG * 100) / 48));
    const label = /bagel/i.test(t) ? "Bagels" : "Pain / brioche";
    return {
      mergeKey: /bagel/i.test(t) ? "pain|bagel" : "pain|pain",
      displayLabel: label,
      buyAmount: g,
      buyUnit: "g",
      shopDetail: `${label} : ${g} g (poids tranches / unités)`,
    };
  }

  if (/\btortilla|wrap\b/i.test(t)) {
    const n = Math.max(1, Math.round(choG / 32));
    return {
      mergeKey: "piece|tortilla",
      displayLabel: "Tortillas / wraps",
      buyAmount: n,
      buyUnit: "piece",
      shopDetail: `Tortillas / grands wraps : ${n} pièce(s)`,
    };
  }

  if (/pomme de terre|purée|patate douce|gratin dauphinois/i.test(t)) {
    const g = roundShop5(Math.max(150, (choG * 100) / 17));
    return {
      mergeKey: "frais|pdt",
      displayLabel: "Pommes de terre / patate douce",
      buyAmount: g,
      buyUnit: "g",
      shopDetail: `Pomme de terre ou patate douce : ${g} g crus (équivalent portions cuites)`,
    };
  }

  if (/\bpoulet|dinde|volaille|blanc de dinde\b/i.test(t)) {
    const g = roundShop5(Math.max(100, choG * 7.5));
    return {
      mergeKey: "prot|volaille",
      displayLabel: "Volaille",
      buyAmount: g,
      buyUnit: "g",
      shopDetail: `Volaille : ${g} g cru`,
    };
  }
  if (/\bpoisson|saumon\b/i.test(t)) {
    const g = roundShop5(Math.max(100, choG * 7));
    return {
      mergeKey: "prot|poisson",
      displayLabel: "Poisson",
      buyAmount: g,
      buyUnit: "g",
      shopDetail: `Poisson : ${g} g`,
    };
  }
  if (/\btofu|tempeh|seitan\b/i.test(t)) {
    const g = roundShop5(Math.max(100, choG * 11));
    return {
      mergeKey: "prot|tofu",
      displayLabel: "Tofu / tempeh / seitan",
      buyAmount: g,
      buyUnit: "g",
      shopDetail: `Protéine végétale : ${g} g`,
    };
  }

  if (/\blentille|pois chich|légumineuses?|dahl\b/i.test(t)) {
    const cookedG = Math.max(70, Math.round((choG * 100) / 14));
    const dryG = roundShop5(cookedG * 0.36);
    return {
      mergeKey: "sec|legumineuse",
      displayLabel: "Légumineuses sèches",
      buyAmount: dryG,
      buyUnit: "g",
      shopDetail: `Légumineuses sèches : ${dryG} g`,
    };
  }

  if (/\brisotto\b|arborio/i.test(t)) {
    const dryG = roundShop5(Math.max(80, (choG * 100) / 75));
    return {
      mergeKey: "sec|riz_risotto",
      displayLabel: "Riz arborio / risotto",
      buyAmount: dryG,
      buyUnit: "g",
      shopDetail: `Riz risotto : ${dryG} g`,
    };
  }

  if (/\bsalade|courgette|carotte|brocoli|courge|oignon|poireau|mâche|iceberg|champignon|ratatouille|légume\b|épinard/i.test(t)) {
    const g = roundShop5(Math.max(150, choG * 25));
    return {
      mergeKey: `leg|${purchaseDedupeKey(f)}`,
      displayLabel: f.length > 48 ? `${f.slice(0, 45)}…` : f,
      buyAmount: g,
      buyUnit: "g",
      shopDetail: `Légumes au choix : ${g} g (panier — ajuster selon recette)`,
    };
  }

  const g = roundShop5(Math.max(60, (choG * 100) / 45));
  return {
    mergeKey: `misc|${purchaseDedupeKey(f)}`,
    displayLabel: f.length > 52 ? `${f.slice(0, 49)}…` : f,
    buyAmount: g,
    buyUnit: "g",
    shopDetail: `${f} : ~${g} g (aliment type ~45 % CHO — affiner au magasin)`,
  };
}

function mergePrepPurchaseLines(lines: PrepPurchaseLine[]): PrepPurchaseLine[] {
  const m = new Map<string, PrepPurchaseLine>();
  for (const L of lines) {
    const o = m.get(L.mergeKey);
    if (!o) {
      m.set(L.mergeKey, { ...L });
    } else {
      o.buyAmount += L.buyAmount;
      if (o.buyUnit === "g")
        o.shopDetail = `${o.displayLabel} : ${roundShop5(o.buyAmount)} g — total journée (menus du jour)`;
      else if (o.buyUnit === "ml")
        o.shopDetail = `${o.displayLabel} : ${roundShop5(o.buyAmount)} ml — total journée`;
      else o.shopDetail = `${o.displayLabel} : ${roundShop5(o.buyAmount)} unité(s) — total journée`;
    }
  }
  return [...m.values()].sort((a, b) => a.displayLabel.localeCompare(b.displayLabel, "fr"));
}

/** Ingrédients à acheter pour la journée : uniquement les menus actuellement affichés (4 repas). */
export function buildDayPurchaseListFromBlocks(blocks: MealExample[]): PrepPurchaseLine[] {
  const drafts: PrepPurchaseLine[] = [];
  for (const b of blocks) {
    const rows = b.items.map((row) => splitMealRowIntoFragments(row));
    const flat = rows.flat();
    if (!flat.length) continue;
    const weights = flat.map(carbFragmentWeight);
    const cho = allocateChoBudgets(b.approxChoG, weights);
    for (let i = 0; i < flat.length; i++) {
      const line = fragmentToPurchaseLine(flat[i], cho[i] ?? 0);
      if (line) drafts.push(line);
    }
  }
  return mergePrepPurchaseLines(drafts);
}

export type SeasonKey = "hiver" | "printemps" | "été" | "automne";

const SOUTHERN_ISO2 = new Set(["AU", "NZ", "AR", "CL", "ZA", "BR", "PY", "UY", "BO", "MG", "RE", "GF", "PF", "NC"]);

function monthToSeason(m: number): SeasonKey {
  if (m >= 3 && m <= 5) return "printemps";
  if (m >= 6 && m <= 8) return "été";
  if (m >= 9 && m <= 11) return "automne";
  return "hiver";
}

function effectiveMonthForSeason(month: number, hemisphere: "north" | "south"): number {
  if (hemisphere === "north") return month;
  return ((month + 5) % 12) + 1;
}

export function getPrepSeasonContext(countryCode: string, referenceDate: Date): {
  season: SeasonKey;
  seasonLabelFr: string;
  hemisphere: "north" | "south";
} {
  const iso = (countryCode || "FR").toUpperCase().slice(0, 2);
  const hemisphere = SOUTHERN_ISO2.has(iso) ? "south" : "north";
  const m = effectiveMonthForSeason(referenceDate.getMonth() + 1, hemisphere);
  const season = monthToSeason(m);
  const labels: Record<SeasonKey, string> = {
    hiver: "hiver",
    printemps: "printemps",
    été: "été",
    automne: "automne",
  };
  return { season, seasonLabelFr: labels[season], hemisphere };
}

function seasonalHintForLabel(label: string, season: SeasonKey): string | undefined {
  const t = label.toLowerCase();
  if (/\b(fraise|framboise|cerise)\b/.test(t)) {
    if (season === "hiver") return "Hors saison locale : surgelées ou import, prix souvent plus hauts.";
    if (season === "été") return "Plein pic de saison en zone tempérée nord.";
  }
  if (/\b(tomate|courgette|melon|haricot vert)\b/.test(t)) {
    if (season === "hiver") return "Souvent serre / import — comparer les origines à l’étiquette.";
    if (season === "été") return "Disponibilité estivale bonne en local.";
  }
  if (/\b(potiron|potimarron|chou|carotte)\b/.test(t) && season === "hiver") return "Très logique en hiver (légumes de saison froids).";
  return undefined;
}

export function enrichPurchaseLinesSeasonal(lines: PrepPurchaseLine[], season: SeasonKey): PrepPurchaseLine[] {
  return lines.map((L) => ({
    ...L,
    seasonalHint: seasonalHintForLabel(L.displayLabel, season) ?? seasonalHintForLabel(L.shopDetail, season),
  }));
}

const EUR_PER_KG_RULES: { re: RegExp; min: number; max: number }[] = [
  { re: /riz|semoule|couscous|quinoa|avoine|céréale|polenta|pâtes|nouilles|légumineuses/i, min: 1.2, max: 4.5 },
  { re: /pain|bagel|brioche|tortilla/i, min: 2.5, max: 8 },
  { re: /banane|compote|coulis|confiture/i, min: 1.8, max: 6 },
  { re: /volaille|poulet|dinde/i, min: 7, max: 14 },
  { re: /poisson|saumon/i, min: 12, max: 28 },
  { re: /yaourt|lait|fromage/i, min: 2.8, max: 8 },
  { re: /jus|smoothie|nectar/i, min: 1.2, max: 3.5 },
  { re: /tofu|tempeh|seitan/i, min: 8, max: 18 },
  { re: /légume|salade|courgette|carotte|oignon|pomme de terre|patate/i, min: 1.5, max: 5 },
  { re: /datte|miel|sirop/i, min: 8, max: 22 },
];

function estimateLineEUR(line: PrepPurchaseLine): [number, number] {
  const blob = `${line.displayLabel} ${line.shopDetail}`;
  for (const r of EUR_PER_KG_RULES) {
    if (r.re.test(blob)) {
      if (line.buyUnit === "g") {
        const kg = line.buyAmount / 1000;
        return [kg * r.min, kg * r.max];
      }
      if (line.buyUnit === "ml") {
        const kg = line.buyAmount / 1000;
        return [kg * r.min, kg * r.max * 1.2];
      }
      const estKg = line.buyAmount * 0.14;
      return [estKg * r.min, estKg * r.max];
    }
  }
  const kg = line.buyUnit === "g" ? line.buyAmount / 1000 : 0.25;
  return [kg * 2.5, kg * 9];
}

/** Fourchette de prix indicative (courses « type supermarché » France / Europe occidentale). */
export function estimateDayPurchasePriceEUR(lines: PrepPurchaseLine[]): { min: number; max: number } {
  let min = 0;
  let max = 0;
  for (const L of lines) {
    const [a, b] = estimateLineEUR(L);
    min += a;
    max += b;
  }
  return {
    min: Math.round(min * 100) / 100,
    max: Math.round(max * 100) / 100,
  };
}

const GAUFRE_STEPS = [
  "Mélangez dans un grand bol ~250 g de farine (ble ou sans gluten), 2 c. à soupe de sucre, 1 pincée de sel et 2 c. à café de levure chimique (ou 1 sachet). Creusez un puits.",
  "Ajoutez 2 œufs entiers, 50–60 g de beurre fondu refroidi (ou huile neutre) et 350–400 ml de lait ; fouettez jusqu’à pâte homogène, un peu plus épaisse qu’une pâte à crêpes. Laissez reposer 10 min si vous avez le temps (texture plus moelleuse).",
  "Préchauffez le gaufrier à température max ; huilez très légèrement les plaques si nécessaire.",
  "Versez une louche au centre sans trop étaler, refermez et comptez 3 à 5 min selon l’appareil, jusqu’à couleur dorée et peu de vapeur. Posez sur une grille pour garder le croustillant.",
  "Enchaînez jusqu’à avoir la quantité voulue pour votre objectif CHO ; les garnitures (sirop, coulis, fruits) se dosent à part selon le tableau du dessus.",
];

const PANCAKE_STEPS = [
  "Homogénéisez 200 g de farine, 2 c. à soupe de sucre, 1 sachet de levure, 1 pincée de sel.",
  "Mélangez 1 œuf, 300 ml de lait et 30 g de beurre fondu ; incorporez aux farines sans trop travailler (quelques grumeaux OK).",
  "Huilez une poêle moyenne ; versez des cercles de pâte ; retournez quand des bulles se forment à la surface (1–2 min par face).",
  "Empilez et complétez avec sirop / fruits comme indiqué pour la charge CHO.",
];

const CREPE_STEPS = [
  "Battez 250 g de farine, 4 œufs, 50 cl de lait et 30 g de beurre fondu (ou équivalent) jusqu’à lisse ; option repos 30 min.",
  "Cuisez fine couche dans poêle très chaude légèrement huilée ; retournez une fois. Répétez pour la série.",
];

const PORRIDGE_STEPS = [
  "Portez à frémissement le liquide (eau + lait ou tout lait) pour ~40–50 g de flocons par portion de base.",
  "Versez les flocons en pluie en remuant ; mijotez 5–10 min à feu doux jusqu’à crème (ou overnight : flocons + lait froid au frigo 6–8 h).",
  "Hors du feu : miel, fruits, cannelle ; respectez les grammages cibles pour la charge.",
];

const RIZ_LAIT_STEPS = [
  "Rincez le riz rond ; égouttez.",
  "Portez le lait à frémissement avec sucre et vanille ; ajoutez le riz ; couvrez à demi et laissez mijoter ~35–45 min à feu très doux en remuant de temps en temps.",
  "Le grain doit être fondant et le mélange crémeux ; aromatisez (cannelle, zest) ; fraîcheur au frigo si réalisé la veille.",
];

const POLENTA_STEPS = [
  "Portez à ébullition de l’eau salée (proportion paquet : souvent 4 volumes d’eau pour 1 de polenta).",
  "Versez la semoule de maïs en pluie en fouettant ; baissez le feu ; mijotez 30–40 min en remuant souvent jusqu’à épaississement.",
  "Hors feu : parmesan ou beurre si la recette l’indique ; coulez dans un plat pour tranches froides si besoin.",
];

const PATES_CUISSON = [
  "Grand volume d’eau bouillante salée ; jetez les pâtes sèches en remuant.",
  "Cuisez le temps indiqué sur le paquet jusqu’à « al dente » ; égouttez en réservant un peu d’eau de cuisson pour laisser la sauce adhérer.",
];

const RIZ_CUISSON = [
  "Rincez le riz si nécessaire ; pour ~1 volume de riz sec, comptez ~1,5–1,8 volume d’eau (selon variété).",
  "Faites revenir 1 min le riz dans un peu de matière grasse optionnelle ; mouillez, couvrez, frémissement 12–18 min ; hors feu repos 5 min sans soulever le couvercle.",
];

export function buildExpandedRecipeNarrative(items: string[], slot: MealSlot): string[] {
  const blob = items.join(" ").toLowerCase();
  const out: string[] = [];
  const push = (titre: string, steps: string[]) => {
    out.push(`— ${titre} (méthode) —`);
    steps.forEach((s, i) => out.push(`${i + 1}. ${s}`));
  };
  if (/gaufre|waffle|gaufr/i.test(blob)) push("Gaufres", GAUFRE_STEPS);
  if (/pancake/i.test(blob)) push("Pancakes", PANCAKE_STEPS);
  if ((/crêpe|crepe/i.test(blob) || /galette\b/i.test(blob)) && !/gaufre/i.test(blob) && !/pancake/i.test(blob))
    push("Crêpes / galettes fines", CREPE_STEPS);
  if (/porridge|flocon|avoine|overnight/i.test(blob)) push("Porridge", PORRIDGE_STEPS);
  if (/riz au lait/i.test(blob)) push("Riz au lait", RIZ_LAIT_STEPS);
  if (/polenta/i.test(blob)) push("Polenta", POLENTA_STEPS);
  if (/\bpâtes?\b|penne|tagliatelles?|lasagne|spaghetti|nouilles\b/i.test(blob) && slot !== "Petit-déjeuner")
    push("Cuisson des pâtes / nouilles", PATES_CUISSON);
  if (/\briz\b/i.test(blob) && !/riz au lait|nouille/i.test(blob) && slot !== "Petit-déjeuner") push("Cuisson du riz", RIZ_CUISSON);
  return out;
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

const MEAL_SLOT_ORDER: MealSlot[] = ["Petit-déjeuner", "Déjeuner", "Collation", "Dîner"];

function fragmentsFromMealLine(line: string): string[] {
  let s = line.replace(/\([^)]{0,160}\)/g, " ");
  s = s.replace(/\[[^\]]{0,40}\]/g, " ");
  s = s.replace(/\d+[–-]\d+\s*(?:ml|g)\b/gi, " ");
  s = s.replace(/\d+\s*(?:ml|g)\b/gi, " ");
  s = s.replace(/\s+/g, " ").trim();

  const splitTail = (tail: string): string[] =>
    tail
      .split(/\s*(?:\+|\/|—|–|;)\s*|\s*,\s*|\s+\bou\b\s+|\s+\bet\b\s+/i)
      .map((x) => x.trim())
      .filter(Boolean);

  let parts: string[];
  if (/:\s/.test(s)) {
    const i = s.indexOf(":");
    const tail = s.slice(i + 1).trim();
    parts = splitTail(tail.length ? tail : s);
  } else {
    parts = splitTail(s);
  }

  return parts.flatMap((p) => (/\s\bou\s/i.test(p) ? p.split(/\s\bou\s/i) : [p])).map(trimIngredientFragment);
}

function trimIngredientFragment(s: string): string {
  return s
    .replace(/^(?:Grande|Petite|Gros|Quelques|Bol|Wrap|Tranche\s+de|Part\s+de|Type\s+)\s+/i, "")
    .replace(/^(?:gros bol|petit bol|grande portion|double ration)\s+/i, "")
    .replace(/^portion\s+/i, "")
    .replace(/\s+modéré$/i, "")
    .replace(/\s+symbolique$/i, "")
    .replace(/\s+légère$/i, "")
    .replace(/\s+si\s+.{3,}$/i, "")
    .replace(/\s+/g, " ")
    .trim();
}

function shouldSkipShoppingFragment(s: string): boolean {
  const t = s.toLowerCase();
  if (s.length < 3 || s.length > 85) return true;
  if (/^(demander|éviter|sans excès|sans farine|si coutume|si chaud|si entraînement|si toléré|si besoin|si trouvé|si sensible)/i.test(s))
    return true;
  if (/^peu de |^algues en petite|^légumes crus en fibres|^demander peu/i.test(t)) return true;
  if (/^protéine$/i.test(s) || /^glucides /i.test(t)) return true;
  if (/^légumes passés/i.test(t)) return true;
  if (/^densité énergétique$/i.test(t)) return true;
  if (/boisson habituelle$/i.test(t)) return true;
  if (/^facile à digérer$/i.test(t)) return true;
  return false;
}

function displayIngredientLabel(s: string): string {
  const t = s.trim();
  if (/^(SG|CP)$/i.test(t)) return t.toUpperCase();
  if (!t) return t;
  return t.charAt(0).toUpperCase() + t.slice(1);
}

function shoppingDedupeKey(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .replace(/\s+/g, " ")
    .trim();
}

function pickShoppingCategory(item: string): string {
  const t = item.toLowerCase();

  if (
    /\b(banane|compote|jus\b|nectar|datte|figue|figues|pomme|poire|mang|raisin|smoothie|clément|orange|fruit|baies?|marmelade|coulis|poire rôtie|citron)\b/i.test(
      t
    )
  ) {
    return "Fruits, jus & compotes";
  }

  if (
    /\b(riz|pâtes?|pates|polenta|gnocch|semoule|couscous|nouille|vermicelle|quinoa|boulgour|avoine|flocon|céréale|cornflake|maïs|sarrasin|pomme de terre|patate|purée|tortilla|pain|brioche|bagel|toast|galette|waffl|gaufr|pancake|crêpe|muffin|cake|génoise|madeleine|viennois|lasagne|gratin|risotto|wrap|pizza|quiche|frites?|chips|plantain|naan|chapati|bouillie|semolino|riz au lait|granola|flocon de riz|pad thaï|tartine|bulgur|penne|tagliatelles?|sushi|milanais|falafel)\b/i.test(
      t
    )
  ) {
    return "Féculents, céréales & pains";
  }

  if (/\b(yaourt|yogourt|fromage|lait\b|ribot|crème\b|beurre\b|parmesan|feta|œuf|oeuf)\b/i.test(t)) {
    return "Produits laitiers & œufs (ou alternatives)";
  }

  if (
    /\b(poulet|dinde|poisson|saumon|tofu|tempeh|seitan|volaille|jambon|lentille|pois chich|légumineuses?|haricot|hachée|steak soja|escalope|milanaise)\b/i.test(
      t
    )
  ) {
    return "Protéines & légumineuses";
  }

  if (/\b(thé\b|café|tisane|infusion|boisson maltée|boisson avoine|boisson céréale|cacaotée)\b/i.test(t)) {
    return "Boissons chaudes & boissons végétales";
  }

  if (/\b(barre\b|biscuit|cookie|gaufrette|trail mix|énergétique)\b/i.test(t)) {
    return "Encas & viennoiseries";
  }

  if (
    /\b(confiture|miel|sirop|pesto|sauce\b|tahin|houmous|guacamole|pickle|miso|cannelle|épices?|algues|bouillon|velouté|curry|tomate\b|écrasé|huile|pâte à tartiner|parmesan vegan)\b/i.test(
      t
    )
  ) {
    return "Condiments, épices & aides culinaires";
  }

  if (
    /\b(salade|courgette|carotte|courge|brocoli|oignon|poireau|aubergine|ratatouille|mâche|roquette|légume|champignon|maïs doux|artichaut|haricot vert|épinard|persil|taboulé|kimchi|iceberg)\b/i.test(
      t
    )
  ) {
    return "Légumes & herbes";
  }

  return "Divers";
}

export type PrepShoppingCategory = { category: string; items: string[] };

/**
 * Liste de courses « optimisée » : union dédupliquée de tous les intitulés possibles
 * dans les pools de menus pour le régime choisi (couvre tirages au hasard des exemples).
 */
export function buildPrepShoppingListFromMealPools(diet: DietStyle): PrepShoppingCategory[] {
  const pool = MEAL_ITEM_POOLS[diet];
  const byKey = new Map<string, string>();

  for (const slot of MEAL_SLOT_ORDER) {
    for (const variant of pool[slot]) {
      for (const line of variant) {
        for (const frag of fragmentsFromMealLine(line)) {
          if (shouldSkipShoppingFragment(frag)) continue;
          const label = displayIngredientLabel(frag);
          const key = shoppingDedupeKey(label);
          if (key.length < 3) continue;
          if (!byKey.has(key)) byKey.set(key, label);
        }
      }
    }
  }

  const buckets = new Map<string, string[]>();
  for (const label of byKey.values()) {
    const cat = pickShoppingCategory(label);
    const arr = buckets.get(cat) ?? [];
    arr.push(label);
    buckets.set(cat, arr);
  }

  const order = [
    "Féculents, céréales & pains",
    "Fruits, jus & compotes",
    "Protéines & légumineuses",
    "Produits laitiers & œufs (ou alternatives)",
    "Légumes & herbes",
    "Condiments, épices & aides culinaires",
    "Boissons chaudes & boissons végétales",
    "Encas & viennoiseries",
    "Divers",
  ];

  const out: PrepShoppingCategory[] = [];
  for (const category of order) {
    const items = buckets.get(category);
    if (items?.length) {
      items.sort((a, b) => a.localeCompare(b, "fr", { sensitivity: "base" }));
      out.push({ category, items });
    }
  }
  return out;
}

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
