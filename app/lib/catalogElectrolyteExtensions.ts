import type { Product } from "./types";

/** Région de référence catalogue (🇫🇷 / 🌍). */
export type BrandCatalogRegion = "FR" | "INT";

function electrolyteRef(
  id: string,
  brand: string,
  productName: string,
  sodiumMg: number,
  extras?: Partial<Product>
): Product {
  const base: Product = {
    id,
    name: productName,
    brand,
    category: "electrolyte",
    cho_per_unit: 3,
    water_per_unit: 500,
    sodium_per_unit: sodiumMg,
    calories_per_unit: 12,
    price_per_unit: 0.89,
    weight_g: 6,
    allergens: [],
    diet_tags: ["vegan", "gluten-free"],
    description:
      "Référence catalogue — pastille / sachet pour ~500 ml (électrolytes Na⁺, K⁺, Mg²⁺). Valeurs indicatives : vérifier l’étiquette du produit.",
    sweetness: "low",
    flavors: ["citrus", "neutral"],
    texture: "liquid",
    caffeineContent: 0,
    recommended_for: ["hot-weather", "hydration", "electrolytes", "long-distance"],
    nutritionSource: "Repères type produit électrolyte — confirmer sur emballage officiel",
  };
  const merged: Product = { ...base, ...extras, id, brand, category: "electrolyte" };
  merged.name = extras?.name ?? productName;
  return merged;
}

/**
 * Produits « électrolytes » ajoutés pour couvrir les marques listées au catalogue (FR + international).
 * Les marques déjà présentes avec pastilles/sels dédiés (Nuun, SaltStick, HIGH5 Zero, Precision Hydration) ne sont pas dupliquées ici.
 */
export const CATALOG_ELECTROLYTE_EXTENSIONS: Product[] = [
  // —— 🇫🇷 France ——
  electrolyteRef("overstim-sels-effort", "Overstim.s", "Sels d’effort / pastilles (500 ml)", 340),
  electrolyteRef("apurna-electrolyte-tabs", "Apurna", "Pastilles isotoniques (500 ml)", 310),
  electrolyteRef("nutripure-hydration", "Nutripure", "Hydratation & électrolytes (500 ml)", 300),
  electrolyteRef("punch-power-iso-tabs", "Punch Power", "Pastilles isotoniques (500 ml)", 320),
  electrolyteRef("baouw-electrolyte", "Baouw", "Sels / boisson électrolyte (500 ml)", 280),
  electrolyteRef("mulebar-salt-drink", "MuleBar", "Boisson électrolyte (500 ml)", 290),
  electrolyteRef("meltonic-electrolyte", "Meltonic", "Pastilles électrolytes (500 ml)", 300),
  electrolyteRef("fenioux-multisport-iso", "Fenioux Multisport", "Boisson isotonique électrolytes (500 ml)", 330),
  electrolyteRef("stc-nutrition-hydro", "STC Nutrition", "Hydratation électrolytes (500 ml)", 310),
  electrolyteRef("eafit-isotonic", "Eafit", "Pastilles isotoniques (500 ml)", 300),
  electrolyteRef("eric-favre-hydration", "Eric Favre", "Boisson électrolyte (500 ml)", 320),
  electrolyteRef("stimium-electrolyte", "Stimium", "Sels & électrolytes (500 ml)", 340),
  electrolyteRef("yam-nutrition-hydro", "YAM Nutrition", "Hydratation électrolytes (500 ml)", 305),
  electrolyteRef("aqeelab-electrolyte", "AqeeLab Nutrition", "Pastilles électrolytes (500 ml)", 295),
  electrolyteRef("atlet-nutrition-salt", "Atlet Nutrition", "Sels d’effort (500 ml)", 315),
  electrolyteRef("ta-energy-iso", "TA Energy", "Pastilles isotoniques (500 ml)", 325),
  electrolyteRef("authentic-nutrition-hydro", "Authentic Nutrition", "Électrolytes (500 ml)", 300),
  electrolyteRef("andros-sport-hydration", "Andros Sport", "Boisson électrolyte (500 ml)", 290),
  electrolyteRef("aptonia-electrolyte-tabs", "Aptonia (Decathlon)", "Pastilles électrolytes (500 ml)", 280),
  electrolyteRef("ergysport-electrolyte", "Ergysport", "Boisson isotonique (500 ml)", 310),
  electrolyteRef("plus-watt-sels", "+Watt", "Sels minéraux / pastilles (500 ml)", 330),
  electrolyteRef("nomio-electrolyte", "Nomio", "Pastilles électrolytes (500 ml)", 300),
  electrolyteRef("victus-hydration", "Victus", "Hydratation électrolytes (500 ml)", 315),
  electrolyteRef("cooknrun-electrolyte", "Cooknrun", "Sels d’effort (500 ml)", 295),
  electrolyteRef("hydratis-tabs", "Hydratis", "Pastilles hydratation & sels (500 ml)", 270),
  electrolyteRef("plasmaide-electrolyte", "Plasmaide", "Boisson électrolyte (500 ml)", 320),

  // —— 🌍 Europe & international ——
  electrolyteRef("maurten-electrolyte-mix", "Maurten", "Complément électrolytes (500 ml)", 260, {
    description:
      "Référence catalogue — ligne hydratation / sels compatible effort longue durée. Vérifier gamme officielle Maurten.",
  }),
  electrolyteRef("sis-go-hydro-tablet", "Science in Sport", "GO Hydro — pastilles (500 ml)", 300, {
    description: "Référence type SiS GO Hydro — électrolytes sans sucre ou faible CHO selon variante.",
    productUrl: "https://www.scienceinsport.com/collections/hydration",
  }),
  electrolyteRef("226ers-salts", "226ERS", "Sels / pastilles isotoniques (500 ml)", 340),
  electrolyteRef("amacx-electrolyte", "Amacx", "Boisson électrolyte (500 ml)", 320),
  electrolyteRef("gu-hydration-tabs", "GU Energy", "Hydration Drink Tabs (500 ml)", 310, {
    description: "Référence type GU Hydration Drink Tabs — pastilles effervescentes.",
    productUrl: "https://guenergy.com/collections/hydration",
  }),
  electrolyteRef("clif-hydration-electrolyte", "Clif Bar", "Mélange électrolytes (500 ml)", 290),
  electrolyteRef("tailwind-electrolyte-only", "Tailwind", "Endurance Fuel — repère sels (500 ml)", 310, {
    description:
      "Repère catalogue Tailwind (souvent CHO+électrolytes) — ajuster selon sachet Naked / classique sur emballage.",
    cho_per_unit: 25,
    calories_per_unit: 100,
    price_per_unit: 2.1,
    weight_g: 27,
  }),
  electrolyteRef("torq-hydration-tabs", "TORQ", "Pastilles hydratation (500 ml)", 305),
  electrolyteRef("veloforte-electrolyte", "Veloforte", "Sels naturels / hydratation (500 ml)", 285),
  electrolyteRef("skratch-hyper-hydration", "Skratch Labs", "Hyper Hydration / sels (500 ml)", 360, {
    description: "Référence type gamme hydratation Skratch — teneurs variables selon produit.",
  }),
  electrolyteRef("neversecond-hydration", "NeverSecond", "Électrolytes / hydratation (500 ml)", 315),
  electrolyteRef("styrkr-electrolyte", "Styrkr", "Pastilles électrolytes (500 ml)", 320),
  electrolyteRef("chimpanzee-iso-tabs", "Chimpanzee", "Pastilles isotoniques (500 ml)", 300),
  electrolyteRef("etixx-isotonic", "Etixx", "Boisson isotonique électrolytes (500 ml)", 310),
  electrolyteRef("santa-madre-salts", "Santa Madre", "Sels d’effort (500 ml)", 350),
  electrolyteRef("powerbar-electrolyte", "PowerBar", "Pastilles électrolytes (500 ml)", 295),
  electrolyteRef("sponser-electrolyte", "Sponser", "Boisson électrolyte (500 ml)", 325),
  electrolyteRef("naak-electrolyte", "Näak", "Pastilles / sels hydratation (500 ml)", 305),
  electrolyteRef("isostar-powertabs", "Isostar", "Power Tabs (500 ml)", 315, {
    productUrl: "https://www.isostar.fr/",
  }),
  electrolyteRef("3action-electrolyte", "3Action Sports Nutrition", "Pastilles électrolytes (500 ml)", 300),
  electrolyteRef("mx3-electrolyte", "MX3", "Sels / hydratation (500 ml)", 335),
  electrolyteRef("spring-electrolyte", "Spring Energy", "Complément électrolytes (500 ml)", 270, {
    description: "Référence catalogue — Spring Energy (gels naturels) : ligne sels / hydratation selon gamme.",
  }),
  electrolyteRef("lmnt-electrolyte-stick", "LMNT", "Stick électrolyte haute teneur Na⁺ (500 ml)", 1000, {
    cho_per_unit: 0,
    calories_per_unit: 8,
    price_per_unit: 2.4,
    weight_g: 5,
    description:
      "Référence type LMNT — très riche en sodium (usage fractionné possible) : respecter la dilution recommandée sur l’emballage.",
  }),
  electrolyteRef("osmo-nutrition-hydration", "Osmo", "Nutrition hydratation active (500 ml)", 290),
  electrolyteRef("liquid-iv-electrolyte", "Liquid I.V.", "Stick hydratation électrolytes (500 ml)", 500, {
    cho_per_unit: 11,
    calories_per_unit: 45,
    price_per_unit: 1.9,
    description: "Référence type Liquid I.V. — mélange glucides + électrolytes : confirmer sur sachet.",
  }),
  electrolyteRef("pillar-performance-electrolyte", "Pillar Performance", "Électrolytes performance (500 ml)", 310),
];

/**
 * Origine catalogue par marque (liste utilisateur 🇫🇷 / 🌍 + marques déjà dans le fichier principal).
 */
export const BRAND_CATALOG_ORIGIN: Record<string, BrandCatalogRegion> = {
  // 🇫🇷
  "Overstim.s": "FR",
  Apurna: "FR",
  Nutripure: "FR",
  "Punch Power": "FR",
  Baouw: "FR",
  MuleBar: "FR",
  Meltonic: "FR",
  "Fenioux Multisport": "FR",
  "STC Nutrition": "FR",
  Eafit: "FR",
  "Eric Favre": "FR",
  Stimium: "FR",
  "YAM Nutrition": "FR",
  "AqeeLab Nutrition": "FR",
  "Atlet Nutrition": "FR",
  "TA Energy": "FR",
  "Authentic Nutrition": "FR",
  "Andros Sport": "FR",
  "Aptonia (Decathlon)": "FR",
  Ergysport: "FR",
  "+Watt": "FR",
  Nomio: "FR",
  Victus: "FR",
  Cooknrun: "FR",
  Hydratis: "FR",
  Plasmaide: "FR",

  // 🌍
  Maurten: "INT",
  "Science in Sport": "INT",
  HIGH5: "INT",
  "Precision Hydration": "INT",
  "Precision Fuel & Hydration": "INT",
  "226ERS": "INT",
  Amacx: "INT",
  "GU Energy": "INT",
  "Clif Bar": "INT",
  Tailwind: "INT",
  TORQ: "INT",
  Veloforte: "INT",
  "Skratch Labs": "INT",
  NeverSecond: "INT",
  Styrkr: "INT",
  Chimpanzee: "INT",
  Etixx: "INT",
  "Santa Madre": "INT",
  PowerBar: "INT",
  Sponser: "INT",
  Näak: "INT",
  Isostar: "INT",
  "3Action Sports Nutrition": "INT",
  MX3: "INT",
  "Spring Energy": "INT",
  Nuun: "INT",
  LMNT: "INT",
  Osmo: "INT",
  "Liquid I.V.": "INT",
  SaltStick: "INT",
  "Pillar Performance": "INT",
  "High5 Zero": "INT",
  "SiS Go Hydro": "INT",
  "GU Hydration Tabs": "INT",
};

export function getBrandCatalogOrigin(brand: string): BrandCatalogRegion | undefined {
  return BRAND_CATALOG_ORIGIN[brand];
}
