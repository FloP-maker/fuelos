import type { Product } from "./types";
import { CATALOG_ELECTROLYTE_EXTENSIONS } from "./catalogElectrolyteExtensions";

export { BRAND_CATALOG_ORIGIN, getBrandCatalogOrigin, type BrandCatalogRegion } from "./catalogElectrolyteExtensions";

const CORE_CATALOG_PRODUCTS: Product[] = [
  // ===== GELS - MAURTEN =====
  { 
    id: "maurten-gel-100", 
    name: "Gel 100", 
    brand: "Maurten", 
    category: "gel", 
    cho_per_unit: 25, 
    sodium_per_unit: 55, 
    calories_per_unit: 100, 
    price_per_unit: 3.50, 
    weight_g: 40, 
    allergens: [], 
    diet_tags: ["vegan", "gluten-free"], 
    description: "Gel hydrogel sans arôme, 25g CHO",
    sweetness: "low",
    flavors: ["neutral"],
    texture: "gel",
    caffeineContent: 0,
    recommended_for: ["sensitive-stomach", "long-distance", "high-intensity"],
    productUrl: "https://www.maurten.com/products/gel-100",
    nutritionSource: "Maurten official website"
  },
  { 
    id: "maurten-gel-100-caf", 
    name: "Gel 100 CAF 100", 
    brand: "Maurten", 
    category: "gel", 
    cho_per_unit: 25, 
    sodium_per_unit: 55, 
    calories_per_unit: 100, 
    price_per_unit: 4.00, 
    weight_g: 40, 
    allergens: [], 
    diet_tags: ["vegan", "gluten-free"], 
    description: "Gel hydrogel avec 100mg caféine",
    sweetness: "low",
    flavors: ["neutral"],
    texture: "gel",
    caffeineContent: 100,
    recommended_for: ["long-distance", "mental-boost", "late-race"],
    productUrl: "https://www.maurten.com/products/gel-100-caf-100",
    nutritionSource: "Maurten official website"
  },

  // ===== GELS - SCIENCE IN SPORT =====
  { 
    id: "sis-go-gel", 
    name: "GO Energy Gel", 
    brand: "Science in Sport", 
    category: "gel", 
    cho_per_unit: 22, 
    sodium_per_unit: 115, 
    calories_per_unit: 87, 
    price_per_unit: 1.80, 
    weight_g: 60, 
    allergens: [], 
    diet_tags: ["vegan", "gluten-free"], 
    description: "Gel isotonique avec eau, multiple saveurs",
    sweetness: "medium",
    flavors: ["citrus", "fruity", "berry"],
    texture: "liquid",
    caffeineContent: 0,
    recommended_for: ["high-intensity", "hot-weather"],
    productUrl: "https://www.scienceinsport.com/products/go-energy-gel",
    nutritionSource: "SiS official website"
  },
  { 
    id: "sis-go-gel-caf", 
    name: "GO Energy + Caffeine Gel", 
    brand: "Science in Sport", 
    category: "gel", 
    cho_per_unit: 22, 
    sodium_per_unit: 115, 
    calories_per_unit: 87, 
    price_per_unit: 2.00, 
    weight_g: 60, 
    allergens: [], 
    diet_tags: ["vegan", "gluten-free"], 
    description: "75mg caféine, idéal fin de course",
    sweetness: "medium",
    flavors: ["cola", "citrus"],
    texture: "liquid",
    caffeineContent: 75,
    recommended_for: ["mental-boost", "late-race"],
    productUrl: "https://www.scienceinsport.com/products/go-energy-caffeine-gel",
    nutritionSource: "SiS official website"
  },

  // ===== GELS - NÄAK =====
  { 
    id: "naak-gel-vegan", 
    name: "Energy Gel Ultra Vegan", 
    brand: "Näak", 
    category: "gel", 
    cho_per_unit: 25, 
    sodium_per_unit: 50, 
    calories_per_unit: 100, 
    price_per_unit: 2.90, 
    weight_g: 65, 
    allergens: [], 
    diet_tags: ["vegan", "gluten-free"], 
    description: "Version végane sans protéine d'insecte",
    sweetness: "medium",
    flavors: ["fruity", "maple"],
    texture: "gel",
    caffeineContent: 0,
    recommended_for: ["long-distance", "real-food"],
    productUrl: "https://naakbar.com/products/naak-ultra-energy-gel",
    nutritionSource: "Näak official website"
  },
  { 
    id: "naak-gel-cricket", 
    name: "Energy Gel Ultra Cricket", 
    brand: "Näak", 
    category: "gel", 
    cho_per_unit: 23, 
    sodium_per_unit: 50, 
    calories_per_unit: 110, 
    price_per_unit: 3.20, 
    weight_g: 65, 
    allergens: ["cricket-protein"], 
    diet_tags: ["gluten-free"], 
    description: "Avec protéine de cricket, 5g protéines",
    sweetness: "medium",
    flavors: ["fruity"],
    texture: "gel",
    caffeineContent: 0,
    recommended_for: ["long-distance", "ultra-endurance"],
    productUrl: "https://naakbar.com/products/naak-ultra-energy-gel-cricket",
    nutritionSource: "Näak official website"
  },

  // ===== GELS - GU ENERGY =====
  { 
    id: "gu-gel", 
    name: "Roctane Energy Gel", 
    brand: "GU Energy", 
    category: "gel", 
    cho_per_unit: 21, 
    sodium_per_unit: 125, 
    calories_per_unit: 100, 
    price_per_unit: 2.20, 
    weight_g: 32, 
    allergens: [], 
    diet_tags: [], 
    description: "Avec acides aminés, multiple saveurs",
    sweetness: "high",
    flavors: ["fruity", "chocolate", "vanilla"],
    texture: "gel",
    caffeineContent: 0,
    recommended_for: ["high-intensity", "long-distance"],
    productUrl: "https://guenergy.com/products/roctane-energy-gel",
    nutritionSource: "GU Energy official"
  },
  { 
    id: "gu-gel-original", 
    name: "Original Energy Gel", 
    brand: "GU Energy", 
    category: "gel", 
    cho_per_unit: 22, 
    sodium_per_unit: 60, 
    calories_per_unit: 100, 
    price_per_unit: 1.80, 
    weight_g: 32, 
    allergens: [], 
    diet_tags: ["vegan"], 
    description: "Gel classique, saveurs variées",
    sweetness: "high",
    flavors: ["fruity", "citrus", "vanilla"],
    texture: "gel",
    caffeineContent: 0,
    recommended_for: ["training", "race"],
    productUrl: "https://guenergy.com/products/energy-gel",
    nutritionSource: "GU Energy official"
  },
  { 
    id: "gu-gel-caf", 
    name: "Roctane Energy Gel Caffeinated", 
    brand: "GU Energy", 
    category: "gel", 
    cho_per_unit: 21, 
    sodium_per_unit: 125, 
    calories_per_unit: 100, 
    price_per_unit: 2.40, 
    weight_g: 32, 
    allergens: [], 
    diet_tags: [], 
    description: "35mg caféine + acides aminés",
    sweetness: "high",
    flavors: ["espresso", "sea-salt-chocolate"],
    texture: "gel",
    caffeineContent: 35,
    recommended_for: ["mental-boost", "long-distance"],
    productUrl: "https://guenergy.com/products/roctane-energy-gel-caffeine",
    nutritionSource: "GU Energy official"
  },

  // ===== GELS - SPRING ENERGY =====
  { 
    id: "spring-gel", 
    name: "Spring Energy Gel", 
    brand: "Spring Energy", 
    category: "gel", 
    cho_per_unit: 28, 
    sodium_per_unit: 80, 
    calories_per_unit: 120, 
    price_per_unit: 3.50, 
    weight_g: 45, 
    allergens: [], 
    diet_tags: ["real-food", "vegan"], 
    description: "Vraie nourriture sous forme de gel",
    sweetness: "low",
    flavors: ["fruity", "apple"],
    texture: "gel",
    caffeineContent: 0,
    recommended_for: ["sensitive-stomach", "real-food", "ultra-endurance"],
    productUrl: "https://www.springenergy.com",
    nutritionSource: "Spring Energy official"
  },
  { 
    id: "spring-gel-hill-aid", 
    name: "Hill Aid", 
    brand: "Spring Energy", 
    category: "gel", 
    cho_per_unit: 26, 
    sodium_per_unit: 90, 
    calories_per_unit: 115, 
    price_per_unit: 3.80, 
    weight_g: 45, 
    allergens: [], 
    diet_tags: ["real-food", "vegan"], 
    description: "Riz brun + betterave + gingembre",
    sweetness: "low",
    flavors: ["ginger", "earthy"],
    texture: "gel",
    caffeineContent: 0,
    recommended_for: ["sensitive-stomach", "real-food"],
    productUrl: "https://www.springenergy.com",
    nutritionSource: "Spring Energy official"
  },

  // ===== GELS - SKRATCH LABS =====
  { 
    id: "skratch-gel", 
    name: "Energy Chews Gel", 
    brand: "Skratch Labs", 
    category: "gel", 
    cho_per_unit: 20, 
    sodium_per_unit: 80, 
    calories_per_unit: 80, 
    price_per_unit: 2.20, 
    weight_g: 35, 
    allergens: [], 
    diet_tags: ["vegan", "gluten-free"], 
    description: "Base fruit, sans arômes artificiels",
    sweetness: "low",
    flavors: ["fruity", "citrus"],
    texture: "gel",
    caffeineContent: 0,
    recommended_for: ["sensitive-stomach", "real-food"],
    productUrl: "https://www.skratchlabs.com",
    nutritionSource: "Skratch Labs official"
  },

  // ===== GELS - TORQ =====
  { 
    id: "torq-gel", 
    name: "Energy Gel", 
    brand: "TORQ", 
    category: "gel", 
    cho_per_unit: 28, 
    sodium_per_unit: 45, 
    calories_per_unit: 116, 
    price_per_unit: 1.90, 
    weight_g: 45, 
    allergens: [], 
    diet_tags: ["vegan", "gluten-free"], 
    description: "2:1 maltodextrine:fructose",
    sweetness: "medium",
    flavors: ["fruity", "citrus", "berry"],
    texture: "gel",
    caffeineContent: 0,
    recommended_for: ["training", "race"],
    productUrl: "https://torqfitness.co.uk/product/torq-gel",
    nutritionSource: "TORQ official website"
  },
  { 
    id: "torq-gel-caf", 
    name: "Energy Gel Caffeinated", 
    brand: "TORQ", 
    category: "gel", 
    cho_per_unit: 28, 
    sodium_per_unit: 45, 
    calories_per_unit: 116, 
    price_per_unit: 2.10, 
    weight_g: 45, 
    allergens: [], 
    diet_tags: ["vegan", "gluten-free"], 
    description: "89mg caféine + guarana",
    sweetness: "medium",
    flavors: ["cola", "coffee"],
    texture: "gel",
    caffeineContent: 89,
    recommended_for: ["mental-boost", "late-race"],
    productUrl: "https://torqfitness.co.uk/product/torq-gel-caffeine",
    nutritionSource: "TORQ official website"
  },

  // ===== GELS - POWERBAR =====
  { 
    id: "powerbar-gel", 
    name: "PowerGel Hydro", 
    brand: "PowerBar", 
    category: "gel", 
    cho_per_unit: 27, 
    sodium_per_unit: 200, 
    calories_per_unit: 111, 
    price_per_unit: 1.70, 
    weight_g: 67, 
    allergens: [], 
    diet_tags: ["vegan", "gluten-free"], 
    description: "Gel liquide avec électrolytes intégrés",
    sweetness: "medium",
    flavors: ["fruity", "cola"],
    texture: "liquid",
    caffeineContent: 0,
    recommended_for: ["hot-weather", "high-intensity"],
    productUrl: "https://www.powerbar.eu/powergel-hydro",
    nutritionSource: "PowerBar official"
  },

  // ===== GELS - CLIF BAR =====
  { 
    id: "clif-gel", 
    name: "Shot Energy Gel", 
    brand: "Clif Bar", 
    category: "gel", 
    cho_per_unit: 25, 
    sodium_per_unit: 50, 
    calories_per_unit: 100, 
    price_per_unit: 1.60, 
    weight_g: 34, 
    allergens: [], 
    diet_tags: ["vegan"], 
    description: "Gel classique, multiple saveurs",
    sweetness: "high",
    flavors: ["fruity", "chocolate", "vanilla"],
    texture: "gel",
    caffeineContent: 0,
    recommended_for: ["training", "budget-friendly"],
    productUrl: "https://www.clifbar.com/products/clif-shot-energy-gel",
    nutritionSource: "Clif Bar official"
  },
  { 
    id: "clif-gel-caf", 
    name: "Shot Energy Gel Double Espresso", 
    brand: "Clif Bar", 
    category: "gel", 
    cho_per_unit: 25, 
    sodium_per_unit: 50, 
    calories_per_unit: 100, 
    price_per_unit: 1.80, 
    weight_g: 34, 
    allergens: [], 
    diet_tags: ["vegan"], 
    description: "100mg caféine naturelle",
    sweetness: "medium",
    flavors: ["coffee", "espresso"],
    texture: "gel",
    caffeineContent: 100,
    recommended_for: ["mental-boost", "late-race"],
    productUrl: "https://www.clifbar.com/products/clif-shot-energy-gel-caffeine",
    nutritionSource: "Clif Bar official"
  },

  // ===== GELS - OVERSTIM.S =====
  { 
    id: "overstim-gel", 
    name: "Antésite+ Gel", 
    brand: "Overstim.s", 
    category: "gel", 
    cho_per_unit: 22, 
    sodium_per_unit: 30, 
    calories_per_unit: 88, 
    price_per_unit: 1.50, 
    weight_g: 34, 
    allergens: [], 
    diet_tags: ["vegan", "gluten-free"], 
    description: "Marque française, saveur réglisse",
    sweetness: "medium",
    flavors: ["anise", "licorice"],
    texture: "gel",
    caffeineContent: 0,
    recommended_for: ["training"],
    productUrl: "https://www.overstims.com/fr/produit/gel-antesiteplus",
    nutritionSource: "Overstim.s official"
  },
  { 
    id: "overstim-gel-coup-de-fouet", 
    name: "Coup de Fouet Gel", 
    brand: "Overstim.s", 
    category: "gel", 
    cho_per_unit: 25, 
    sodium_per_unit: 35, 
    calories_per_unit: 100, 
    price_per_unit: 2.00, 
    weight_g: 35, 
    allergens: [], 
    diet_tags: ["vegan", "gluten-free"], 
    description: "Gel énergétique français, texture liquide",
    sweetness: "high",
    flavors: ["fruity", "red-berries"],
    texture: "liquid",
    caffeineContent: 0,
    recommended_for: ["high-intensity"],
    productUrl: "https://www.overstims.com/fr/produit/gel-coup-de-fouet",
    nutritionSource: "Overstim.s official"
  },
  { 
    id: "overstim-gel-red-tonic", 
    name: "Red Tonic Gel Sprint", 
    brand: "Overstim.s", 
    category: "gel", 
    cho_per_unit: 24, 
    sodium_per_unit: 40, 
    calories_per_unit: 96, 
    price_per_unit: 2.20, 
    weight_g: 35, 
    allergens: [], 
    diet_tags: ["vegan", "gluten-free"], 
    description: "Caféine + taurine, coup de boost",
    sweetness: "high",
    flavors: ["energy-drink"],
    texture: "gel",
    caffeineContent: 50,
    recommended_for: ["mental-boost", "high-intensity"],
    productUrl: "https://www.overstims.com/fr/produit/gel-red-tonic-sprint",
    nutritionSource: "Overstim.s official"
  },

  // ===== GELS - APTONIA (DECATHLON) =====
  { 
    id: "aptonia-gel-eco", 
    name: "Gel Énergétique Ecostrida", 
    brand: "Aptonia (Decathlon)", 
    category: "gel", 
    cho_per_unit: 20, 
    sodium_per_unit: 40, 
    calories_per_unit: 80, 
    price_per_unit: 0.90, 
    weight_g: 32, 
    allergens: [], 
    diet_tags: ["vegan", "gluten-free"], 
    description: "Gel économique Decathlon, saveur citron",
    sweetness: "medium",
    flavors: ["citrus"],
    texture: "gel",
    caffeineContent: 0,
    recommended_for: ["budget-friendly", "training"],
    productUrl: "https://www.decathlon.fr/p/gel-energetique-ecostrida/_/R-p-308766",
    nutritionSource: "Decathlon website"
  },
  { 
    id: "aptonia-gel-longue-distance", 
    name: "Gel Longue Distance", 
    brand: "Aptonia (Decathlon)", 
    category: "gel", 
    cho_per_unit: 25, 
    sodium_per_unit: 100, 
    calories_per_unit: 100, 
    price_per_unit: 1.50, 
    weight_g: 35, 
    allergens: [], 
    diet_tags: ["vegan"], 
    description: "Gel avec 2:1 maltodextrine/fructose",
    sweetness: "high",
    flavors: ["fruity", "cola"],
    texture: "gel",
    caffeineContent: 0,
    recommended_for: ["long-distance"],
    productUrl: "https://www.decathlon.fr/p/gel-energetique-longue-distance/_/R-p-105820",
    nutritionSource: "Decathlon website"
  },
  { 
    id: "aptonia-gel-cafe", 
    name: "Gel Café 100mg", 
    brand: "Aptonia (Decathlon)", 
    category: "gel", 
    cho_per_unit: 24, 
    sodium_per_unit: 90, 
    calories_per_unit: 96, 
    price_per_unit: 1.70, 
    weight_g: 35, 
    allergens: [], 
    diet_tags: ["vegan"], 
    description: "Gel caféiné goût café",
    sweetness: "low",
    flavors: ["coffee"],
    texture: "gel",
    caffeineContent: 100,
    recommended_for: ["mental-boost", "late-race"],
    productUrl: "https://www.decathlon.fr/p/gel-energetique-cafe/_/R-p-301234",
    nutritionSource: "Decathlon website"
  },

  // ===== GELS - TA ENERGY =====
  { 
    id: "ta-gel-passage-difficile", 
    name: "Gel Passage Difficile", 
    brand: "TA Energy", 
    category: "gel", 
    cho_per_unit: 26, 
    sodium_per_unit: 60, 
    calories_per_unit: 104, 
    price_per_unit: 2.20, 
    weight_g: 35, 
    allergens: [], 
    diet_tags: ["vegan", "gluten-free"], 
    description: "Gel français, texture fluide",
    sweetness: "medium",
    flavors: ["citrus", "mint"],
    texture: "liquid",
    caffeineContent: 0,
    recommended_for: ["high-intensity", "hot-weather"],
    productUrl: "https://www.ta-energy.com/gel-passage-difficile",
    nutritionSource: "TA Energy official"
  },
  { 
    id: "ta-gel-coup-de-fouet", 
    name: "Gel Coup de Fouet Caféine", 
    brand: "TA Energy", 
    category: "gel", 
    cho_per_unit: 25, 
    sodium_per_unit: 65, 
    calories_per_unit: 100, 
    price_per_unit: 2.50, 
    weight_g: 35, 
    allergens: [], 
    diet_tags: ["vegan", "gluten-free"], 
    description: "75mg caféine, goût cola",
    sweetness: "high",
    flavors: ["cola"],
    texture: "gel",
    caffeineContent: 75,
    recommended_for: ["mental-boost", "late-race"],
    productUrl: "https://www.ta-energy.com/gel-coup-de-fouet",
    nutritionSource: "TA Energy official"
  },

  // ===== GELS - MELTONIC =====
  { 
    id: "meltonic-gel-miel-gelée", 
    name: "Gel Éco Miel Gelée Royale", 
    brand: "Meltonic", 
    category: "gel", 
    cho_per_unit: 23, 
    sodium_per_unit: 20, 
    calories_per_unit: 92, 
    price_per_unit: 2.00, 
    weight_g: 32, 
    allergens: ["honey"], 
    diet_tags: ["gluten-free", "real-food"], 
    description: "Base miel français, naturel",
    sweetness: "high",
    flavors: ["honey", "neutral"],
    texture: "gel",
    caffeineContent: 0,
    recommended_for: ["real-food", "sensitive-stomach"],
    productUrl: "https://www.meltonic.com/produit/gel-eco-miel-gelee-royale",
    nutritionSource: "Meltonic official"
  },
  { 
    id: "meltonic-gel-miel-ginseng", 
    name: "Gel Tonic' Miel Ginseng", 
    brand: "Meltonic", 
    category: "gel", 
    cho_per_unit: 24, 
    sodium_per_unit: 25, 
    calories_per_unit: 96, 
    price_per_unit: 2.30, 
    weight_g: 32, 
    allergens: ["honey"], 
    diet_tags: ["gluten-free", "real-food"], 
    description: "Miel + ginseng + guarana, boost naturel",
    sweetness: "high",
    flavors: ["honey"],
    texture: "gel",
    caffeineContent: 40,
    recommended_for: ["real-food", "mental-boost"],
    productUrl: "https://www.meltonic.com/produit/gel-tonic-miel-ginseng",
    nutritionSource: "Meltonic official"
  },

  // ===== GELS - MULEBAR =====
  { 
    id: "mulebar-gel-vegan", 
    name: "Energy Gel Vegan", 
    brand: "MuleBar", 
    category: "gel", 
    cho_per_unit: 27, 
    sodium_per_unit: 70, 
    calories_per_unit: 110, 
    price_per_unit: 2.50, 
    weight_g: 37, 
    allergens: [], 
    diet_tags: ["vegan", "gluten-free", "real-food"], 
    description: "Gel base fruits, sans additifs",
    sweetness: "low",
    flavors: ["fruity", "apple"],
    texture: "gel",
    caffeineContent: 0,
    recommended_for: ["sensitive-stomach", "real-food"],
    productUrl: "https://mulebar.com/collections/gels",
    nutritionSource: "MuleBar official"
  },

  // ===== GELS - PUNCH POWER =====
  { 
    id: "punch-power-gel-turbo", 
    name: "Gel Turbo Energy", 
    brand: "Punch Power", 
    category: "gel", 
    cho_per_unit: 28, 
    sodium_per_unit: 80, 
    calories_per_unit: 112, 
    price_per_unit: 2.10, 
    weight_g: 40, 
    allergens: [], 
    diet_tags: ["vegan"], 
    description: "Gel énergétique français classique",
    sweetness: "high",
    flavors: ["fruity", "citrus"],
    texture: "gel",
    caffeineContent: 0,
    recommended_for: ["training", "budget-friendly"],
    productUrl: "https://www.punch-power.com/gel-turbo-energy",
    nutritionSource: "Punch Power official"
  },

  // ===== GELS - APURNA =====
  { 
    id: "apurna-gel-energie", 
    name: "Gel Énergie Liquide", 
    brand: "Apurna", 
    category: "gel", 
    cho_per_unit: 24, 
    sodium_per_unit: 75, 
    calories_per_unit: 96, 
    price_per_unit: 1.90, 
    weight_g: 35, 
    allergens: [], 
    diet_tags: ["vegan", "gluten-free"], 
    description: "Gel français texture liquide",
    sweetness: "medium",
    flavors: ["fruity", "citrus"],
    texture: "liquid",
    caffeineContent: 0,
    recommended_for: ["training", "race"],
    productUrl: "https://www.apurna.fr/produits/gel-energie-liquide",
    nutritionSource: "Apurna official"
  },
  { 
    id: "apurna-gel-coup-boost", 
    name: "Gel Coup de Boost Caféine", 
    brand: "Apurna", 
    category: "gel", 
    cho_per_unit: 23, 
    sodium_per_unit: 70, 
    calories_per_unit: 92, 
    price_per_unit: 2.10, 
    weight_g: 35, 
    allergens: [], 
    diet_tags: ["vegan", "gluten-free"], 
    description: "80mg caféine + taurine",
    sweetness: "high",
    flavors: ["energy-drink"],
    texture: "gel",
    caffeineContent: 80,
    recommended_for: ["mental-boost", "late-race"],
    productUrl: "https://www.apurna.fr/produits/gel-coup-de-boost",
    nutritionSource: "Apurna official"
  },

  // ===== GELS - EAFIT =====
  { 
    id: "eafit-gel-energie", 
    name: "Energy Gel", 
    brand: "Eafit", 
    category: "gel", 
    cho_per_unit: 22, 
    sodium_per_unit: 55, 
    calories_per_unit: 88, 
    price_per_unit: 1.80, 
    weight_g: 32, 
    allergens: [], 
    diet_tags: ["vegan"], 
    description: "Gel français pharmacie/sport",
    sweetness: "medium",
    flavors: ["fruity", "citrus"],
    texture: "gel",
    caffeineContent: 0,
    recommended_for: ["training"],
    productUrl: "https://www.eafit.com/energy-gel",
    nutritionSource: "Eafit official"
  },

  // ===== BOISSONS - MAURTEN =====
  { 
    id: "maurten-drink-mix-160", 
    name: "Drink Mix 160", 
    brand: "Maurten", 
    category: "drink", 
    cho_per_unit: 40, 
    water_per_unit: 500, 
    sodium_per_unit: 115, 
    calories_per_unit: 160, 
    price_per_unit: 4.50, 
    weight_g: 50, 
    allergens: [], 
    diet_tags: ["vegan", "gluten-free"], 
    description: "Boisson hydrogel 40g CHO pour 500ml",
    sweetness: "low",
    flavors: ["neutral"],
    texture: "liquid",
    caffeineContent: 0,
    recommended_for: ["sensitive-stomach", "long-distance", "race"],
    productUrl: "https://www.maurten.com/products/drink-mix-160",
    nutritionSource: "Maurten official"
  },
  { 
    id: "maurten-drink-mix-320", 
    name: "Drink Mix 320", 
    brand: "Maurten", 
    category: "drink", 
    cho_per_unit: 80, 
    water_per_unit: 500, 
    sodium_per_unit: 230, 
    calories_per_unit: 320, 
    price_per_unit: 5.50, 
    weight_g: 80, 
    allergens: [], 
    diet_tags: ["vegan", "gluten-free"], 
    description: "Haute concentration 80g CHO pour 500ml",
    sweetness: "low",
    flavors: ["neutral"],
    texture: "liquid",
    caffeineContent: 0,
    recommended_for: ["ultra-endurance", "high-intensity"],
    productUrl: "https://www.maurten.com/products/drink-mix-320",
    nutritionSource: "Maurten official"
  },

  // ===== BOISSONS - TAILWIND =====
  { 
    id: "tailwind-endurance", 
    name: "Endurance Fuel", 
    brand: "Tailwind", 
    category: "drink", 
    cho_per_unit: 50, 
    water_per_unit: 700, 
    sodium_per_unit: 310, 
    calories_per_unit: 200, 
    price_per_unit: 3.50, 
    weight_g: 54, 
    allergens: [], 
    diet_tags: ["vegan", "gluten-free"], 
    description: "Tout-en-un : CHO + électrolytes",
    sweetness: "low",
    flavors: ["fruity", "citrus", "neutral"],
    texture: "liquid",
    caffeineContent: 0,
    recommended_for: ["ultra-endurance", "sensitive-stomach"],
    productUrl: "https://www.tailwindnutrition.com/products/endurance-fuel",
    nutritionSource: "Tailwind official"
  },
  { 
    id: "tailwind-caffeinated", 
    name: "Caffeinated Endurance Fuel", 
    brand: "Tailwind", 
    category: "drink", 
    cho_per_unit: 50, 
    water_per_unit: 700, 
    sodium_per_unit: 310, 
    calories_per_unit: 200, 
    price_per_unit: 3.80, 
    weight_g: 54, 
    allergens: [], 
    diet_tags: ["vegan", "gluten-free"], 
    description: "35mg caféine naturelle par portion",
    sweetness: "low",
    flavors: ["fruity", "cola"],
    texture: "liquid",
    caffeineContent: 35,
    recommended_for: ["ultra-endurance", "mental-boost"],
    productUrl: "https://www.tailwindnutrition.com/products/caffeinated-endurance-fuel",
    nutritionSource: "Tailwind official"
  },

  // ===== BOISSONS - SCIENCE IN SPORT =====
  { 
    id: "sis-go-electrolyte", 
    name: "GO Electrolyte", 
    brand: "Science in Sport", 
    category: "drink", 
    cho_per_unit: 36, 
    water_per_unit: 500, 
    sodium_per_unit: 165, 
    calories_per_unit: 144, 
    price_per_unit: 2.50, 
    weight_g: 50, 
    allergens: [], 
    diet_tags: ["vegan", "gluten-free"], 
    description: "Boisson isotonique classique",
    sweetness: "medium",
    flavors: ["fruity", "citrus", "tropical"],
    texture: "liquid",
    caffeineContent: 0,
    recommended_for: ["training", "race", "hot-weather"],
    productUrl: "https://www.scienceinsport.com/products/go-electrolyte",
    nutritionSource: "SiS official"
  },
  { 
    id: "sis-beta-fuel", 
    name: "Beta Fuel", 
    brand: "Science in Sport", 
    category: "drink", 
    cho_per_unit: 80, 
    water_per_unit: 500, 
    sodium_per_unit: 300, 
    calories_per_unit: 320, 
    price_per_unit: 4.50, 
    weight_g: 84, 
    allergens: [], 
    diet_tags: ["vegan", "gluten-free"], 
    description: "2:1 maltodextrine:fructose, ultra haute énergie",
    sweetness: "medium",
    flavors: ["fruity", "neutral"],
    texture: "liquid",
    caffeineContent: 0,
    recommended_for: ["high-intensity", "race"],
    productUrl: "https://www.scienceinsport.com/products/beta-fuel",
    nutritionSource: "SiS official"
  },

  // ===== BOISSONS - NÄAK =====
  { 
    id: "naak-drink", 
    name: "Energy Drink Ultra", 
    brand: "Näak", 
    category: "drink", 
    cho_per_unit: 45, 
    water_per_unit: 500, 
    sodium_per_unit: 200, 
    calories_per_unit: 180, 
    price_per_unit: 3.20, 
    weight_g: 50, 
    allergens: [], 
    diet_tags: ["vegan", "gluten-free"], 
    description: "Avec électrolytes et vitamines",
    sweetness: "medium",
    flavors: ["fruity"],
    texture: "liquid",
    caffeineContent: 0,
    recommended_for: ["long-distance"],
    productUrl: "https://naakbar.com/products/naak-ultra-energy-drink-mix",
    nutritionSource: "Näak official"
  },

  // ===== BOISSONS - SKRATCH LABS =====
  { 
    id: "skratch-hydration", 
    name: "Sport Hydration Mix", 
    brand: "Skratch Labs", 
    category: "drink", 
    cho_per_unit: 21, 
    water_per_unit: 500, 
    sodium_per_unit: 380, 
    calories_per_unit: 80, 
    price_per_unit: 2.00, 
    weight_g: 35, 
    allergens: [], 
    diet_tags: ["vegan", "gluten-free"], 
    description: "Boisson légère, haute teneur sodium",
    sweetness: "low",
    flavors: ["fruity", "citrus"],
    texture: "liquid",
    caffeineContent: 0,
    recommended_for: ["hot-weather", "sensitive-stomach"],
    productUrl: "https://www.skratchlabs.com/products/sport-hydration-drink-mix",
    nutritionSource: "Skratch Labs official"
  },
  { 
    id: "skratch-super-high-carb", 
    name: "Super High Carb Mix", 
    brand: "Skratch Labs", 
    category: "drink", 
    cho_per_unit: 65, 
    water_per_unit: 500, 
    sodium_per_unit: 200, 
    calories_per_unit: 260, 
    price_per_unit: 3.80, 
    weight_g: 70, 
    allergens: [], 
    diet_tags: ["vegan", "gluten-free"], 
    description: "70g CHO / 500ml, ultra endurance",
    sweetness: "low",
    flavors: ["fruity", "neutral"],
    texture: "liquid",
    caffeineContent: 0,
    recommended_for: ["ultra-endurance", "high-intensity"],
    productUrl: "https://www.skratchlabs.com/products/super-high-carb",
    nutritionSource: "Skratch Labs official"
  },

  // ===== BOISSONS - TORQ =====
  { 
    id: "torq-drink", 
    name: "Energy Drink", 
    brand: "TORQ", 
    category: "drink", 
    cho_per_unit: 46, 
    water_per_unit: 500, 
    sodium_per_unit: 168, 
    calories_per_unit: 188, 
    price_per_unit: 2.80, 
    weight_g: 50, 
    allergens: [], 
    diet_tags: ["vegan", "gluten-free"], 
    description: "2:1 ratio, goût fruité naturel",
    sweetness: "medium",
    flavors: ["fruity", "tropical"],
    texture: "liquid",
    caffeineContent: 0,
    recommended_for: ["training", "race"],
    productUrl: "https://torqfitness.co.uk/product/torq-energy-drink",
    nutritionSource: "TORQ official"
  },

  // ===== BOISSONS - POWERBAR =====
  { 
    id: "powerbar-isoactive", 
    name: "IsoActive", 
    brand: "PowerBar", 
    category: "drink", 
    cho_per_unit: 36, 
    water_per_unit: 500, 
    sodium_per_unit: 250, 
    calories_per_unit: 148, 
    price_per_unit: 2.20, 
    weight_g: 46, 
    allergens: [], 
    diet_tags: ["vegan", "gluten-free"], 
    description: "5 électrolytes, isotonique certifié",
    sweetness: "medium",
    flavors: ["fruity", "citrus"],
    texture: "liquid",
    caffeineContent: 0,
    recommended_for: ["training", "hot-weather"],
    productUrl: "https://www.powerbar.eu/isoactive",
    nutritionSource: "PowerBar official"
  },

  // ===== BOISSONS - OVERSTIM.S =====
  { 
    id: "overstim-boisson", 
    name: "Boisson Longue Distance", 
    brand: "Overstim.s", 
    category: "drink", 
    cho_per_unit: 42, 
    water_per_unit: 500, 
    sodium_per_unit: 220, 
    calories_per_unit: 168, 
    price_per_unit: 2.40, 
    weight_g: 50, 
    allergens: [], 
    diet_tags: ["vegan", "gluten-free"], 
    description: "Formule longue distance française",
    sweetness: "medium",
    flavors: ["fruity", "citrus"],
    texture: "liquid",
    caffeineContent: 0,
    recommended_for: ["long-distance"],
    productUrl: "https://www.overstims.com/fr/produit/boisson-longue-distance",
    nutritionSource: "Overstim.s official"
  },
  { 
    id: "overstim-hydrixir", 
    name: "HYDRIXIR Boisson", 
    brand: "Overstim.s", 
    category: "drink", 
    cho_per_unit: 35, 
    water_per_unit: 500, 
    sodium_per_unit: 180, 
    calories_per_unit: 140, 
    price_per_unit: 2.20, 
    weight_g: 45, 
    allergens: [], 
    diet_tags: ["vegan", "gluten-free"], 
    description: "Boisson antioxydante française",
    sweetness: "medium",
    flavors: ["citrus", "fruity"],
    texture: "liquid",
    caffeineContent: 0,
    recommended_for: ["long-distance", "hot-weather"],
    productUrl: "https://www.overstims.com/fr/produit/hydrixir",
    nutritionSource: "Overstim.s official"
  },

  // ===== BOISSONS - APTONIA (DECATHLON) =====
  { 
    id: "aptonia-boisson-iso", 
    name: "Boisson Isotonique", 
    brand: "Aptonia (Decathlon)", 
    category: "drink", 
    cho_per_unit: 30, 
    water_per_unit: 500, 
    sodium_per_unit: 200, 
    calories_per_unit: 120, 
    price_per_unit: 1.20, 
    weight_g: 40, 
    allergens: [], 
    diet_tags: ["vegan", "gluten-free"], 
    description: "Boisson isotonique classique, orange",
    sweetness: "medium",
    flavors: ["citrus", "orange"],
    texture: "liquid",
    caffeineContent: 0,
    recommended_for: ["training", "budget-friendly"],
    productUrl: "https://www.decathlon.fr/p/boisson-isotonique-poudre/_/R-p-1547",
    nutritionSource: "Decathlon website"
  },
  { 
    id: "aptonia-boisson-endurance", 
    name: "Boisson Endurance", 
    brand: "Aptonia (Decathlon)", 
    category: "drink", 
    cho_per_unit: 45, 
    water_per_unit: 500, 
    sodium_per_unit: 250, 
    calories_per_unit: 180, 
    price_per_unit: 1.80, 
    weight_g: 55, 
    allergens: [], 
    diet_tags: ["vegan", "gluten-free"], 
    description: "Haute énergie, longue distance",
    sweetness: "medium",
    flavors: ["fruity", "citrus"],
    texture: "liquid",
    caffeineContent: 0,
    recommended_for: ["long-distance", "budget-friendly"],
    productUrl: "https://www.decathlon.fr/p/boisson-endurance/_/R-p-167459",
    nutritionSource: "Decathlon website"
  },

  // ===== BOISSONS - TA ENERGY =====
  { 
    id: "ta-boisson-endurance", 
    name: "Boisson Endurance", 
    brand: "TA Energy", 
    category: "drink", 
    cho_per_unit: 40, 
    water_per_unit: 500, 
    sodium_per_unit: 220, 
    calories_per_unit: 160, 
    price_per_unit: 2.80, 
    weight_g: 50, 
    allergens: [], 
    diet_tags: ["vegan", "gluten-free"], 
    description: "Boisson haute énergie française",
    sweetness: "medium",
    flavors: ["citrus", "fruity"],
    texture: "liquid",
    caffeineContent: 0,
    recommended_for: ["long-distance"],
    productUrl: "https://www.ta-energy.com/boisson-endurance",
    nutritionSource: "TA Energy official"
  },

  // ===== BOISSONS - PUNCH POWER =====
  { 
    id: "punch-power-boisson", 
    name: "Boisson Biodrink", 
    brand: "Punch Power", 
    category: "drink", 
    cho_per_unit: 38, 
    water_per_unit: 500, 
    sodium_per_unit: 210, 
    calories_per_unit: 152, 
    price_per_unit: 2.00, 
    weight_g: 48, 
    allergens: [], 
    diet_tags: ["vegan"], 
    description: "Boisson endurance maltodextrine",
    sweetness: "medium",
    flavors: ["citrus", "orange"],
    texture: "liquid",
    caffeineContent: 0,
    recommended_for: ["long-distance"],
    productUrl: "https://www.punch-power.com/biodrink",
    nutritionSource: "Punch Power official"
  },

  // ===== BOISSONS - APURNA =====
  { 
    id: "apurna-boisson-energie", 
    name: "Boisson Énergie", 
    brand: "Apurna", 
    category: "drink", 
    cho_per_unit: 35, 
    water_per_unit: 500, 
    sodium_per_unit: 190, 
    calories_per_unit: 140, 
    price_per_unit: 2.10, 
    weight_g: 45, 
    allergens: [], 
    diet_tags: ["vegan", "gluten-free"], 
    description: "Boisson isotonique française",
    sweetness: "medium",
    flavors: ["fruity", "citrus"],
    texture: "liquid",
    caffeineContent: 0,
    recommended_for: ["training", "race"],
    productUrl: "https://www.apurna.fr/produits/boisson-energie",
    nutritionSource: "Apurna official"
  },

  // ===== ÉLECTROLYTES - PRECISION HYDRATION =====
  { 
    id: "precision-hydration-500", 
    name: "PH 500 Electrolyte", 
    brand: "Precision Hydration", 
    category: "electrolyte", 
    cho_per_unit: 0, 
    water_per_unit: 500, 
    sodium_per_unit: 500, 
    calories_per_unit: 10, 
    price_per_unit: 1.50, 
    weight_g: 8, 
    allergens: [], 
    diet_tags: ["vegan", "gluten-free"], 
    description: "Électrolytes purs, haute teneur sodium",
    sweetness: "low",
    flavors: ["neutral"],
    texture: "liquid",
    caffeineContent: 0,
    recommended_for: ["hot-weather", "high-sweat-rate"],
    productUrl: "https://www.precisionhydration.com/products/ph-500",
    nutritionSource: "Precision Hydration official"
  },
  { 
    id: "precision-hydration-1000", 
    name: "PH 1000 Electrolyte", 
    brand: "Precision Hydration", 
    category: "electrolyte", 
    cho_per_unit: 0, 
    water_per_unit: 500, 
    sodium_per_unit: 1000, 
    calories_per_unit: 10, 
    price_per_unit: 1.80, 
    weight_g: 8, 
    allergens: [], 
    diet_tags: ["vegan", "gluten-free"], 
    description: "Ultra haute teneur sodium, chaleur extrême",
    sweetness: "low",
    flavors: ["neutral"],
    texture: "liquid",
    caffeineContent: 0,
    recommended_for: ["hot-weather", "high-sweat-rate", "ultra-endurance"],
    productUrl: "https://www.precisionhydration.com/products/ph-1000",
    nutritionSource: "Precision Hydration official"
  },
  { 
    id: "precision-hydration-1500", 
    name: "PH 1500 Electrolyte", 
    brand: "Precision Hydration", 
    category: "electrolyte", 
    cho_per_unit: 0, 
    water_per_unit: 500, 
    sodium_per_unit: 1500, 
    calories_per_unit: 10, 
    price_per_unit: 2.00, 
    weight_g: 8, 
    allergens: [], 
    diet_tags: ["vegan", "gluten-free"], 
    description: "Max sodium, ultra-trail chaleur",
    sweetness: "low",
    flavors: ["neutral"],
    texture: "liquid",
    caffeineContent: 0,
    recommended_for: ["hot-weather", "high-sweat-rate", "ultra-endurance"],
    productUrl: "https://www.precisionhydration.com/products/ph-1500",
    nutritionSource: "Precision Hydration official"
  },

  // ===== ÉLECTROLYTES - NUUN =====
  { 
    id: "nuun-sport", 
    name: "Sport Electrolyte Tablet", 
    brand: "Nuun", 
    category: "electrolyte", 
    cho_per_unit: 4, 
    water_per_unit: 500, 
    sodium_per_unit: 300, 
    calories_per_unit: 15, 
    price_per_unit: 0.80, 
    weight_g: 6, 
    allergens: [], 
    diet_tags: ["vegan", "gluten-free"], 
    description: "Pastille effervescente, légère",
    sweetness: "low",
    flavors: ["fruity", "citrus", "tropical"],
    texture: "liquid",
    caffeineContent: 0,
    recommended_for: ["hot-weather", "low-carb"],
    productUrl: "https://nuunlife.com/products/nuun-sport",
    nutritionSource: "Nuun official"
  },
  { 
    id: "nuun-endurance", 
    name: "Endurance Electrolyte", 
    brand: "Nuun", 
    category: "electrolyte", 
    cho_per_unit: 30, 
    water_per_unit: 500, 
    sodium_per_unit: 380, 
    calories_per_unit: 120, 
    price_per_unit: 1.20, 
    weight_g: 14, 
    allergens: [], 
    diet_tags: ["vegan", "gluten-free"], 
    description: "CHO + électrolytes, format sachet",
    sweetness: "low",
    flavors: ["fruity", "citrus"],
    texture: "liquid",
    caffeineContent: 0,
    recommended_for: ["long-distance", "hot-weather"],
    productUrl: "https://nuunlife.com/products/nuun-endurance",
    nutritionSource: "Nuun official"
  },

  // ===== ÉLECTROLYTES - SALTSTICK =====
  { 
    id: "salt-stick-caps", 
    name: "Fastchews", 
    brand: "SaltStick", 
    category: "electrolyte", 
    cho_per_unit: 2, 
    water_per_unit: 0, 
    sodium_per_unit: 215, 
    calories_per_unit: 10, 
    price_per_unit: 0.60, 
    weight_g: 4, 
    allergens: [], 
    diet_tags: ["vegan", "gluten-free"], 
    description: "Capsule sel mâchable, sans eau",
    sweetness: "low",
    flavors: ["neutral", "salty"],
    texture: "chewy",
    caffeineContent: 0,
    recommended_for: ["hot-weather", "cramping", "high-sweat-rate"],
    productUrl: "https://saltstick.com/products/saltstick-fastchews",
    nutritionSource: "SaltStick official"
  },

  // ===== ÉLECTROLYTES - HIGH5 =====
  { 
    id: "high5-electrolyte", 
    name: "Zero Electrolyte Tablet", 
    brand: "HIGH5", 
    category: "electrolyte", 
    cho_per_unit: 0, 
    water_per_unit: 500, 
    sodium_per_unit: 280, 
    calories_per_unit: 5, 
    price_per_unit: 0.60, 
    weight_g: 5, 
    allergens: [], 
    diet_tags: ["vegan", "gluten-free"], 
    description: "Zéro sucre, zéro calorie",
    sweetness: "low",
    flavors: ["fruity", "citrus", "berry"],
    texture: "liquid",
    caffeineContent: 0,
    recommended_for: ["hot-weather", "low-carb"],
    productUrl: "https://highfive.co.uk/product/zero",
    nutritionSource: "HIGH5 official"
  },

  // ===== BARRES - CLIF BAR =====
  { 
    id: "clif-bar", 
    name: "CLIF BAR Original", 
    brand: "Clif Bar", 
    category: "bar", 
    cho_per_unit: 45, 
    sodium_per_unit: 140, 
    calories_per_unit: 250, 
    price_per_unit: 2.80, 
    weight_g: 68, 
    allergens: ["oats", "soy"], 
    diet_tags: ["vegan"], 
    description: "Barre endurance classique",
    sweetness: "medium",
    flavors: ["chocolate", "peanut", "fruity"],
    texture: "chewy",
    caffeineContent: 0,
    recommended_for: ["pre-race", "long-distance"],
    productUrl: "https://www.clifbar.com/products/clif-bar",
    nutritionSource: "Clif Bar official"
  },

  // ===== BARRES - SCIENCE IN SPORT =====
  { 
    id: "sis-go-bar", 
    name: "GO Energy Bar", 
    brand: "Science in Sport", 
    category: "bar", 
    cho_per_unit: 46, 
    sodium_per_unit: 55, 
    calories_per_unit: 230, 
    price_per_unit: 2.20, 
    weight_g: 65, 
    allergens: ["oats"], 
    diet_tags: ["vegan", "gluten-free"], 
    description: "Barre légère, facile à digérer",
    sweetness: "medium",
    flavors: ["fruity", "chocolate"],
    texture: "chewy",
    caffeineContent: 0,
    recommended_for: ["race", "sensitive-stomach"],
    productUrl: "https://www.scienceinsport.com/products/go-energy-bar",
    nutritionSource: "SiS official"
  },

  // ===== BARRES - MAURTEN =====
  { 
    id: "maurten-solid-160", 
    name: "Solid 160", 
    brand: "Maurten", 
    category: "bar", 
    cho_per_unit: 40, 
    sodium_per_unit: 75, 
    calories_per_unit: 160, 
    price_per_unit: 4.00, 
    weight_g: 38, 
    allergens: ["oats"], 
    diet_tags: ["vegan"], 
    description: "Biscuit hydrogel Maurten",
    sweetness: "low",
    flavors: ["neutral", "oat"],
    texture: "solid",
    caffeineContent: 0,
    recommended_for: ["sensitive-stomach", "race", "variety"],
    productUrl: "https://www.maurten.com/products/solid-160",
    nutritionSource: "Maurten official"
  },

  // ===== BARRES - NÄAK =====
  { 
    id: "naak-bar-cricket", 
    name: "Ultra Bar Cricket", 
    brand: "Näak", 
    category: "bar", 
    cho_per_unit: 35, 
    sodium_per_unit: 100, 
    calories_per_unit: 200, 
    price_per_unit: 3.50, 
    weight_g: 50, 
    allergens: ["cricket-protein", "oats"], 
    diet_tags: [], 
    description: "10g protéines, endurance longue durée",
    sweetness: "medium",
    flavors: ["chocolate", "fruity"],
    texture: "chewy",
    caffeineContent: 0,
    recommended_for: ["long-distance", "ultra-endurance"],
    productUrl: "https://naakbar.com/products/naak-ultra-energy-bar",
    nutritionSource: "Näak official"
  },
  { 
    id: "naak-bar-vegan", 
    name: "Ultra Bar Vegan", 
    brand: "Näak", 
    category: "bar", 
    cho_per_unit: 36, 
    sodium_per_unit: 95, 
    calories_per_unit: 195, 
    price_per_unit: 3.20, 
    weight_g: 50, 
    allergens: ["oats"], 
    diet_tags: ["vegan", "gluten-free"], 
    description: "Protéine végétale, goût fruits rouges",
    sweetness: "medium",
    flavors: ["fruity", "berry"],
    texture: "chewy",
    caffeineContent: 0,
    recommended_for: ["long-distance", "real-food"],
    productUrl: "https://naakbar.com/products/naak-ultra-energy-bar-vegan",
    nutritionSource: "Näak official"
  },

  // ===== BARRES - SPRING ENERGY =====
  { 
    id: "spring-bar", 
    name: "Real Food Bar", 
    brand: "Spring Energy", 
    category: "bar", 
    cho_per_unit: 38, 
    sodium_per_unit: 85, 
    calories_per_unit: 200, 
    price_per_unit: 4.00, 
    weight_g: 55, 
    allergens: [], 
    diet_tags: ["real-food", "vegan"], 
    description: "Ingrédients entiers, riz + haricots",
    sweetness: "low",
    flavors: ["nutty", "earthy"],
    texture: "chewy",
    caffeineContent: 0,
    recommended_for: ["sensitive-stomach", "real-food", "ultra-endurance"],
    productUrl: "https://www.springenergy.com",
    nutritionSource: "Spring Energy official"
  },

  // ===== BARRES - TORQ =====
  { 
    id: "torq-bar", 
    name: "Organic Energy Bar", 
    brand: "TORQ", 
    category: "bar", 
    cho_per_unit: 44, 
    sodium_per_unit: 60, 
    calories_per_unit: 220, 
    price_per_unit: 2.50, 
    weight_g: 65, 
    allergens: ["oats"], 
    diet_tags: ["vegan"], 
    description: "Bio certifié, saveurs naturelles",
    sweetness: "medium",
    flavors: ["fruity", "chocolate"],
    texture: "chewy",
    caffeineContent: 0,
    recommended_for: ["training", "long-distance"],
    productUrl: "https://torqfitness.co.uk/product/torq-energy-bar",
    nutritionSource: "TORQ official"
  },

  // ===== BARRES - POWERBAR =====
  { 
    id: "powerbar-performance", 
    name: "Performance Energy Bar", 
    brand: "PowerBar", 
    category: "bar", 
    cho_per_unit: 42, 
    sodium_per_unit: 90, 
    calories_per_unit: 230, 
    price_per_unit: 2.30, 
    weight_g: 65, 
    allergens: ["oats", "soy"], 
    diet_tags: [], 
    description: "C2MAX dual source carbs",
    sweetness: "medium",
    flavors: ["chocolate", "vanilla", "fruity"],
    texture: "chewy",
    caffeineContent: 0,
    recommended_for: ["training", "race"],
    productUrl: "https://www.powerbar.eu/performance-energy-bar",
    nutritionSource: "PowerBar official"
  },

  // ===== BARRES - LÄRABAR =====
  { 
    id: "larabar-date", 
    name: "LÄRABAR Original", 
    brand: "LÄRABAR", 
    category: "bar", 
    cho_per_unit: 30, 
    sodium_per_unit: 5, 
    calories_per_unit: 200, 
    price_per_unit: 2.50, 
    weight_g: 48, 
    allergens: [], 
    diet_tags: ["vegan", "gluten-free", "real-food"], 
    description: "Dattes + noix, minimal ingrédients",
    sweetness: "high",
    flavors: ["fruity", "nutty", "date"],
    texture: "chewy",
    caffeineContent: 0,
    recommended_for: ["real-food", "pre-race", "variety"],
    productUrl: "https://www.larabar.com",
    nutritionSource: "LÄRABAR official"
  },

  // ===== BARRES - BAOUW =====
  { 
    id: "baouw-barre-cajou-banane", 
    name: "Barre Bio Cajou Banane", 
    brand: "Baouw", 
    category: "bar", 
    cho_per_unit: 32, 
    sodium_per_unit: 80, 
    calories_per_unit: 220, 
    price_per_unit: 3.00, 
    weight_g: 55, 
    allergens: ["cashew"], 
    diet_tags: ["vegan", "gluten-free", "organic", "real-food"], 
    description: "Barre bio française, ingrédients naturels",
    sweetness: "low",
    flavors: ["fruity", "nutty"],
    texture: "chewy",
    caffeineContent: 0,
    recommended_for: ["long-distance", "sensitive-stomach", "real-food"],
    productUrl: "https://www.baouw.com/products/barre-bio-cajou-banane",
    nutritionSource: "Baouw official"
  },
  { 
    id: "baouw-barre-amande-framboise", 
    name: "Barre Bio Amande Framboise", 
    brand: "Baouw", 
    category: "bar", 
    cho_per_unit: 30, 
    sodium_per_unit: 75, 
    calories_per_unit: 210, 
    price_per_unit: 3.00, 
    weight_g: 55, 
    allergens: ["almond"], 
    diet_tags: ["vegan", "gluten-free", "organic", "real-food"], 
    description: "100% naturel, 5g protéines",
    sweetness: "low",
    flavors: ["berry", "nutty"],
    texture: "chewy",
    caffeineContent: 0,
    recommended_for: ["long-distance", "real-food"],
    productUrl: "https://www.baouw.com/products/barre-bio-amande-framboise",
    nutritionSource: "Baouw official"
  },
  { 
    id: "baouw-barre-noisette-cacao", 
    name: "Barre Bio Noisette Cacao", 
    brand: "Baouw", 
    category: "bar", 
    cho_per_unit: 31, 
    sodium_per_unit: 70, 
    calories_per_unit: 215, 
    price_per_unit: 3.00, 
    weight_g: 55, 
    allergens: ["hazelnut"], 
    diet_tags: ["vegan", "gluten-free", "organic", "real-food"], 
    description: "Saveur chocolat, énergie durable",
    sweetness: "medium",
    flavors: ["chocolate", "nutty"],
    texture: "chewy",
    caffeineContent: 0,
    recommended_for: ["long-distance", "real-food"],
    productUrl: "https://www.baouw.com/products/barre-bio-noisette-cacao",
    nutritionSource: "Baouw official"
  },

  // ===== BARRES - APTONIA (DECATHLON) =====
  { 
    id: "aptonia-barre-cereales", 
    name: "Barre Céréales & Fruits Rouges", 
    brand: "Aptonia (Decathlon)", 
    category: "bar", 
    cho_per_unit: 28, 
    sodium_per_unit: 50, 
    calories_per_unit: 140, 
    price_per_unit: 1.20, 
    weight_g: 40, 
    allergens: ["oats", "gluten"], 
    diet_tags: [], 
    description: "Barre économique, facile à digérer",
    sweetness: "medium",
    flavors: ["fruity", "berry"],
    texture: "chewy",
    caffeineContent: 0,
    recommended_for: ["training", "pre-race", "budget-friendly"],
    productUrl: "https://www.decathlon.fr/p/barre-cereales-fruits-rouges/_/R-p-105623",
    nutritionSource: "Decathlon website"
  },
  { 
    id: "aptonia-barre-endurance", 
    name: "Barre Endurance Chocolat", 
    brand: "Aptonia (Decathlon)", 
    category: "bar", 
    cho_per_unit: 35, 
    sodium_per_unit: 70, 
    calories_per_unit: 190, 
    price_per_unit: 1.60, 
    weight_g: 50, 
    allergens: ["oats", "gluten"], 
    diet_tags: [], 
    description: "Barre longue distance, saveur chocolat",
    sweetness: "medium",
    flavors: ["chocolate"],
    texture: "chewy",
    caffeineContent: 0,
    recommended_for: ["long-distance", "budget-friendly"],
    productUrl: "https://www.decathlon.fr/p/barre-endurance-chocolat/_/R-p-167897",
    nutritionSource: "Decathlon website"
  },

  // ===== BARRES - OVERSTIM.S =====
  { 
    id: "overstim-barre-energie", 
    name: "Barre Énergétique", 
    brand: "Overstim.s", 
    category: "bar", 
    cho_per_unit: 40, 
    sodium_per_unit: 95, 
    calories_per_unit: 200, 
    price_per_unit: 2.40, 
    weight_g: 60, 
    allergens: ["oats", "gluten"], 
    diet_tags: [], 
    description: "Barre fruits secs et céréales",
    sweetness: "medium",
    flavors: ["fruity", "nutty"],
    texture: "chewy",
    caffeineContent: 0,
    recommended_for: ["long-distance", "pre-race"],
    productUrl: "https://www.overstims.com/fr/produit/barre-energetique",
    nutritionSource: "Overstim.s official"
  },

  // ===== BARRES - MULEBAR =====
  { 
    id: "mulebar-barre-kicks", 
    name: "Kicks Energy Bar", 
    brand: "MuleBar", 
    category: "bar", 
    cho_per_unit: 38, 
    sodium_per_unit: 100, 
    calories_per_unit: 230, 
    price_per_unit: 2.80, 
    weight_g: 65, 
    allergens: ["oats"], 
    diet_tags: ["vegan", "gluten-free"], 
    description: "Barre bio, ingrédients naturels",
    sweetness: "medium",
    flavors: ["chocolate", "peanut"],
    texture: "chewy",
    caffeineContent: 0,
    recommended_for: ["long-distance", "real-food"],
    productUrl: "https://mulebar.com/collections/energy-bars",
    nutritionSource: "MuleBar official"
  },

  // ===== CHEWS - CLIF BLOKS =====
  { 
    id: "clif-bar-bloks", 
    name: "Shot Bloks Energy Chews", 
    brand: "Clif Bar", 
    category: "chew", 
    cho_per_unit: 24, 
    sodium_per_unit: 70, 
    calories_per_unit: 100, 
    price_per_unit: 0.80, 
    weight_g: 18, 
    allergens: [], 
    diet_tags: ["vegan"], 
    description: "3 blocs par portion, facile à doser",
    sweetness: "high",
    flavors: ["fruity", "citrus", "cola"],
    texture: "chewy",
    caffeineContent: 0,
    recommended_for: ["race", "variety"],
    productUrl: "https://www.clifbar.com/products/clif-shot-bloks",
    nutritionSource: "Clif Bar official"
  },

  // ===== CHEWS - GU =====
  { 
    id: "gu-chews", 
    name: "Energy Chews", 
    brand: "GU Energy", 
    category: "chew", 
    cho_per_unit: 11, 
    sodium_per_unit: 35, 
    calories_per_unit: 45, 
    price_per_unit: 0.50, 
    weight_g: 10, 
    allergens: [], 
    diet_tags: ["vegan", "gluten-free"], 
    description: "Chew individuel, facile à doser",
    sweetness: "high",
    flavors: ["fruity", "citrus", "berry"],
    texture: "chewy",
    caffeineContent: 0,
    recommended_for: ["race", "variety"],
    productUrl: "https://guenergy.com/products/energy-chews",
    nutritionSource: "GU Energy official"
  },

  // ===== CHEWS - SKRATCH LABS =====
  { 
    id: "skratch-chews", 
    name: "Sport Energy Chews", 
    brand: "Skratch Labs", 
    category: "chew", 
    cho_per_unit: 10, 
    sodium_per_unit: 30, 
    calories_per_unit: 40, 
    price_per_unit: 0.45, 
    weight_g: 10, 
    allergens: [], 
    diet_tags: ["vegan", "gluten-free"], 
    description: "Fraise naturelle, faible en sucre",
    sweetness: "low",
    flavors: ["fruity", "berry"],
    texture: "chewy",
    caffeineContent: 0,
    recommended_for: ["sensitive-stomach", "real-food"],
    productUrl: "https://www.skratchlabs.com/products/sport-energy-chews",
    nutritionSource: "Skratch Labs official"
  },

  // ===== CHEWS - SCIENCE IN SPORT =====
  { 
    id: "sis-go-chews", 
    name: "GO Energy Bake", 
    brand: "Science in Sport", 
    category: "chew", 
    cho_per_unit: 26, 
    sodium_per_unit: 10, 
    calories_per_unit: 140, 
    price_per_unit: 1.80, 
    weight_g: 50, 
    allergens: ["gluten"], 
    diet_tags: [], 
    description: "Mini cake énergétique, texture moelleuse",
    sweetness: "medium",
    flavors: ["fruity", "vanilla"],
    texture: "solid",
    caffeineContent: 0,
    recommended_for: ["variety", "race"],
    productUrl: "https://www.scienceinsport.com/products/go-energy-bake",
    nutritionSource: "SiS official"
  },

  // ===== CHEWS - POWERBAR =====
  { 
    id: "powerbar-chews", 
    name: "PowerBar Energize Advanced Chews", 
    brand: "PowerBar", 
    category: "chew", 
    cho_per_unit: 10, 
    sodium_per_unit: 25, 
    calories_per_unit: 40, 
    price_per_unit: 0.40, 
    weight_g: 9, 
    allergens: [], 
    diet_tags: ["vegan", "gluten-free"], 
    description: "Format bonbon, facile en course",
    sweetness: "high",
    flavors: ["fruity", "cola"],
    texture: "chewy",
    caffeineContent: 0,
    recommended_for: ["race", "variety"],
    productUrl: "https://www.powerbar.eu/energize-advanced-chews",
    nutritionSource: "PowerBar official"
  },

  // ===== VRAIE NOURRITURE =====
  { 
    id: "banana", 
    name: "Banane", 
    brand: "Nature", 
    category: "real-food", 
    cho_per_unit: 27, 
    sodium_per_unit: 1, 
    calories_per_unit: 105, 
    price_per_unit: 0.30, 
    weight_g: 120, 
    allergens: [], 
    diet_tags: ["vegan", "gluten-free", "real-food"], 
    description: "Fruit naturel, potassium + CHO",
    sweetness: "medium",
    flavors: ["fruity", "banana"],
    texture: "solid",
    caffeineContent: 0,
    recommended_for: ["real-food", "pre-race", "variety"],
    productUrl: "https://nutritiondata.self.com/facts/fruits-and-fruit-juices/1846/2",
    nutritionSource: "USDA FoodData Central"
  },
  { 
    id: "medjool-dates", 
    name: "Dattes Medjool (3)", 
    brand: "Nature", 
    category: "real-food", 
    cho_per_unit: 40, 
    sodium_per_unit: 2, 
    calories_per_unit: 160, 
    price_per_unit: 0.80, 
    weight_g: 60, 
    allergens: [], 
    diet_tags: ["vegan", "gluten-free", "real-food"], 
    description: "Energie dense et naturelle",
    sweetness: "high",
    flavors: ["fruity", "date", "caramel"],
    texture: "chewy",
    caffeineContent: 0,
    recommended_for: ["real-food", "ultra-endurance", "variety"],
    productUrl: "https://nutritiondata.self.com/facts/fruits-and-fruit-juices/2039/2",
    nutritionSource: "USDA FoodData Central"
  },
  { 
    id: "boiled-potato", 
    name: "Pomme de terre (100g)", 
    brand: "Nature", 
    category: "real-food", 
    cho_per_unit: 20, 
    sodium_per_unit: 5, 
    calories_per_unit: 85, 
    price_per_unit: 0.20, 
    weight_g: 100, 
    allergens: [], 
    diet_tags: ["vegan", "gluten-free", "real-food"], 
    description: "Classique trail, avec sel si possible",
    sweetness: "low",
    flavors: ["neutral", "salty"],
    texture: "solid",
    caffeineContent: 0,
    recommended_for: ["real-food", "ultra-endurance", "sensitive-stomach"],
    productUrl: "https://nutritiondata.self.com/facts/vegetables-and-vegetable-products/2770/2",
    nutritionSource: "USDA FoodData Central"
  },
  { 
    id: "rice-ball", 
    name: "Rice Ball (riz + sel)", 
    brand: "Maison", 
    category: "real-food", 
    cho_per_unit: 35, 
    sodium_per_unit: 200, 
    calories_per_unit: 140, 
    price_per_unit: 0.40, 
    weight_g: 80, 
    allergens: [], 
    diet_tags: ["vegan", "gluten-free", "real-food"], 
    description: "Riz japonais salé, ultra digeste",
    sweetness: "low",
    flavors: ["neutral", "salty"],
    texture: "solid",
    caffeineContent: 0,
    recommended_for: ["real-food", "ultra-endurance", "sensitive-stomach"],
    productUrl: "https://nutritiondata.self.com/facts/cereal-grains-and-pasta/5806/2",
    nutritionSource: "USDA FoodData Central"
  },
  { 
    id: "white-bread-jam", 
    name: "Pain blanc + confiture", 
    brand: "Maison", 
    category: "real-food", 
    cho_per_unit: 40, 
    sodium_per_unit: 150, 
    calories_per_unit: 180, 
    price_per_unit: 0.30, 
    weight_g: 80, 
    allergens: ["gluten"], 
    diet_tags: [], 
    description: "Snack classique ravitaillement",
    sweetness: "high",
    flavors: ["fruity", "sweet"],
    texture: "solid",
    caffeineContent: 0,
    recommended_for: ["real-food", "variety"],
    productUrl: "https://nutritiondata.self.com/facts/baked-products/4872/2",
    nutritionSource: "USDA FoodData Central"
  },
  { 
    id: "fig-bar", 
    name: "Barre de figues", 
    brand: "Nature", 
    category: "real-food", 
    cho_per_unit: 28, 
    sodium_per_unit: 10, 
    calories_per_unit: 120, 
    price_per_unit: 0.60, 
    weight_g: 40, 
    allergens: [], 
    diet_tags: ["vegan", "real-food"], 
    description: "Figues séchées pressées, très digeste",
    sweetness: "high",
    flavors: ["fruity", "fig"],
    texture: "chewy",
    caffeineContent: 0,
    recommended_for: ["real-food", "sensitive-stomach", "variety"],
    productUrl: "https://nutritiondata.self.com/facts/fruits-and-fruit-juices/1882/2",
    nutritionSource: "USDA FoodData Central"
  },
  { 
    id: "salted-cracker", 
    name: "Crackers salés (5)", 
    brand: "Maison", 
    category: "real-food", 
    cho_per_unit: 15, 
    sodium_per_unit: 300, 
    calories_per_unit: 80, 
    price_per_unit: 0.20, 
    weight_g: 20, 
    allergens: ["gluten"], 
    diet_tags: [], 
    description: "Sels + glucides simples, anti-nausée",
    sweetness: "low",
    flavors: ["salty", "neutral"],
    texture: "solid",
    caffeineContent: 0,
    recommended_for: ["real-food", "variety", "nausea"],
    productUrl: "https://nutritiondata.self.com/facts/baked-products/4878/2",
    nutritionSource: "USDA FoodData Central"
  },
  { 
    id: "coca-cola-150", 
    name: "Coca-Cola (150ml)", 
    brand: "Coca-Cola", 
    category: "real-food", 
    cho_per_unit: 16, 
    sodium_per_unit: 10, 
    calories_per_unit: 65, 
    price_per_unit: 0.50, 
    weight_g: 150, 
    allergens: [], 
    diet_tags: ["vegan", "gluten-free"], 
    description: "Glucides rapides + caféine, fin de course",
    sweetness: "high",
    flavors: ["cola"],
    texture: "liquid",
    caffeineContent: 15,
    recommended_for: ["late-race", "mental-boost", "variety"],
    productUrl: "https://www.coca-cola.fr",
    nutritionSource: "Coca-Cola Nutrition Facts"
  },

  // ===== VRAIE NOURRITURE - BAOUW (PURÉES) =====
  { 
    id: "baouw-puree-bio", 
    name: "Purée Bio Amande Cacao", 
    brand: "Baouw", 
    category: "real-food", 
    cho_per_unit: 18, 
    sodium_per_unit: 40, 
    calories_per_unit: 180, 
    price_per_unit: 2.50, 
    weight_g: 37, 
    allergens: ["almond"], 
    diet_tags: ["vegan", "gluten-free", "organic", "real-food"], 
    description: "Purée énergétique bio, texture crémeuse",
    sweetness: "low",
    flavors: ["chocolate", "nutty"],
    texture: "liquid",
    caffeineContent: 0,
    recommended_for: ["sensitive-stomach", "real-food", "variety"],
    productUrl: "https://www.baouw.com/collections/purees",
    nutritionSource: "Baouw official"
  },
  { 
    id: "baouw-puree-cajou-banane", 
    name: "Purée Bio Cajou Banane", 
    brand: "Baouw", 
    category: "real-food", 
    cho_per_unit: 20, 
    sodium_per_unit: 35, 
    calories_per_unit: 170, 
    price_per_unit: 2.50, 
    weight_g: 37, 
    allergens: ["cashew"], 
    diet_tags: ["vegan", "gluten-free", "organic", "real-food"], 
    description: "Purée énergétique bio, saveur douce",
    sweetness: "medium",
    flavors: ["fruity", "nutty", "banana"],
    texture: "liquid",
    caffeineContent: 0,
    recommended_for: ["sensitive-stomach", "real-food", "variety"],
    productUrl: "https://www.baouw.com/collections/purees",
    nutritionSource: "Baouw official"
  },

  // ===== VRAIE NOURRITURE - MELTONIC =====
  { 
    id: "meltonic-pate-amande", 
    name: "Pâte d'Amande Bio", 
    brand: "Meltonic", 
    category: "real-food", 
    cho_per_unit: 25, 
    sodium_per_unit: 15, 
    calories_per_unit: 150, 
    price_per_unit: 2.50, 
    weight_g: 40, 
    allergens: ["almond"], 
    diet_tags: ["vegan", "gluten-free", "organic", "real-food"], 
    description: "Pâte d'amande énergétique bio",
    sweetness: "low",
    flavors: ["nutty", "almond"],
    texture: "solid",
    caffeineContent: 0,
    recommended_for: ["real-food", "variety", "sensitive-stomach"],
    productUrl: "https://www.meltonic.com/produits/pate-amande",
    nutritionSource: "Meltonic official"
  },
];

export const PRODUCTS: Product[] = [...CORE_CATALOG_PRODUCTS, ...CATALOG_ELECTROLYTE_EXTENSIONS];

// ===== FONCTIONS UTILITAIRES EXISTANTES =====

export function getProductsByCategory(category: Product["category"]): Product[] {
  return PRODUCTS.filter(p => p.category === category);
}

/** Produits hors catalogue (ex. localStorage) consultés en priorité pendant un calcul de plan — usage client. */
let engineProductOverlay: Product[] = [];

export function setEngineProductOverlay(products: Product[] | null): void {
  engineProductOverlay = products && products.length > 0 ? products.slice() : [];
}

function overlayProductsForCategory(
  category: Product["category"],
  preferences?: { avoidProducts?: string[]; allergens?: string[] }
): Product[] {
  return engineProductOverlay.filter((p) => {
    if (p.category !== category) return false;
    if (preferences?.avoidProducts?.includes(p.id)) return false;
    if (preferences?.allergens?.some((a) => p.allergens.includes(a))) return false;
    return true;
  });
}

/** Préfixe le catalogue par les produits custom (même IDs exclus). */
function mergeCatalogWithOverlay(
  catalog: Product[],
  category: Product["category"],
  preferences?: { avoidProducts?: string[]; allergens?: string[] }
): Product[] {
  const extra = overlayProductsForCategory(category, preferences);
  if (extra.length === 0) return catalog;
  const seen = new Set<string>();
  const out: Product[] = [];
  for (const p of [...extra, ...catalog]) {
    if (seen.has(p.id)) continue;
    seen.add(p.id);
    out.push(p);
  }
  return out;
}

export function getProductById(id: string): Product | undefined {
  const custom = engineProductOverlay.find((p) => p.id === id);
  if (custom) return custom;
  return PRODUCTS.find((p) => p.id === id);
}

export function getProductsByBrand(brand: string): Product[] {
  return PRODUCTS.filter(p => p.brand === brand);
}

export function searchProducts(query: string): Product[] {
  const q = query.toLowerCase();
  return PRODUCTS.filter(p =>
    p.name.toLowerCase().includes(q) ||
    p.brand.toLowerCase().includes(q) ||
    (p.description || "").toLowerCase().includes(q)
  );
}

export const BRANDS = [...new Set(PRODUCTS.map(p => p.brand))].sort();

// ===== 🆕 NOUVELLES FONCTIONS UTILITAIRES - FILTRAGE PAR PRÉFÉRENCES =====

/**
 * Filtre les produits selon les préférences utilisateur
 */
export function getProductsByPreferences(
  category: Product["category"],
  preferences?: {
    preferredBrands?: string[];
    avoidProducts?: string[];
    sweetness?: "low" | "medium" | "high";
    flavors?: string[];
    caffeinePreference?: "none" | "optional" | "required";
    dietTags?: string[];
    allergens?: string[];
  }
): Product[] {
  let products = getProductsByCategory(category);

  if (!preferences) return products;

  // Exclure les produits à éviter
  if (preferences.avoidProducts && preferences.avoidProducts.length > 0) {
    products = products.filter(p => !preferences.avoidProducts!.includes(p.id));
  }

  // Exclure les allergènes
  if (preferences.allergens && preferences.allergens.length > 0) {
    products = products.filter(p => 
      !p.allergens.some(allergen => preferences.allergens!.includes(allergen))
    );
  }

  // Filtrer par régime alimentaire (vegan, gluten-free, etc.)
  if (preferences.dietTags && preferences.dietTags.length > 0) {
    products = products.filter(p =>
      preferences.dietTags!.every(tag => p.diet_tags.includes(tag))
    );
  }

  // Filtrer par niveau de sucré
  if (preferences.sweetness) {
    products = products.filter(p => p.sweetness === preferences.sweetness);
  }

  // Filtrer par saveurs préférées
  if (preferences.flavors && preferences.flavors.length > 0) {
    products = products.filter(p =>
      p.flavors?.some(flavor => preferences.flavors!.includes(flavor))
    );
  }

  // Filtrer par caféine
  if (preferences.caffeinePreference === "none") {
    products = products.filter(p => (p.caffeineContent || 0) === 0);
  } else if (preferences.caffeinePreference === "required") {
    products = products.filter(p => (p.caffeineContent || 0) > 0);
  }

  // Prioriser les marques préférées (tri, pas filtre)
  if (preferences.preferredBrands && preferences.preferredBrands.length > 0) {
    products = products.sort((a, b) => {
      const aPreferred = preferences.preferredBrands!.includes(a.brand);
      const bPreferred = preferences.preferredBrands!.includes(b.brand);
      if (aPreferred && !bPreferred) return -1;
      if (!aPreferred && bPreferred) return 1;
      return 0;
    });
  }

  return products;
}

/**
 * Filtre les produits par tolérance gastro-intestinale
 */
export function getProductsByGITolerance(
  category: Product["category"],
  giTolerance: "sensitive" | "normal" | "robust"
): Product[] {
  let products = getProductsByCategory(category);

  if (giTolerance === "sensitive") {
    // Privilégier les produits liquides, neutres, et recommandés pour estomacs sensibles
    products = products.filter(p => 
      p.texture === "liquid" || 
      p.texture === "gel" ||
      p.recommended_for?.includes("sensitive-stomach") ||
      p.sweetness === "low"
    );
  } else if (giTolerance === "normal") {
    // Éviter les produits trop sucrés ou trop solides
    products = products.filter(p => p.sweetness !== "high" || p.texture !== "solid");
  }
  // "robust" : pas de filtre, tout passe

  return products;
}

/**
 * Filtre les produits par texture
 */
export function getProductsByTexture(
  texture: "liquid" | "gel" | "chewy" | "solid"
): Product[] {
  return PRODUCTS.filter(p => p.texture === texture);
}

/**
 * Filtre les produits par niveau de sucré
 */
export function getProductsBySweetness(
  sweetness: "low" | "medium" | "high"
): Product[] {
  return PRODUCTS.filter(p => p.sweetness === sweetness);
}

/**
 * Filtre les produits par contenu en caféine
 */
export function getCaffeinatedProducts(minCaffeine: number = 1): Product[] {
  return PRODUCTS.filter(p => (p.caffeineContent || 0) >= minCaffeine);
}

/**
 * Filtre les produits par tag de recommandation
 */
export function getProductsByRecommendation(
  recommendationTag: string
): Product[] {
  return PRODUCTS.filter(p => 
    p.recommended_for?.includes(recommendationTag)
  );
}

/**
 * Filtre les produits compatibles avec un régime alimentaire
 */
export function getProductsByDiet(dietTags: string[]): Product[] {
  return PRODUCTS.filter(p =>
    dietTags.every(tag => p.diet_tags.includes(tag))
  );
}

/**
 * Filtre les produits sans allergènes spécifiques
 */
export function getProductsWithoutAllergens(allergens: string[]): Product[] {
  return PRODUCTS.filter(p =>
    !p.allergens.some(allergen => allergens.includes(allergen))
  );
}

/**
 * Filtre les produits par gamme de prix
 */
export function getProductsByPriceRange(
  minPrice: number = 0,
  maxPrice: number = Infinity
): Product[] {
  return PRODUCTS.filter(p => 
    p.price_per_unit >= minPrice && p.price_per_unit <= maxPrice
  );
}

/**
 * Filtre les produits "real food" (aliments naturels)
 */
export function getRealFoodProducts(): Product[] {
  return PRODUCTS.filter(p => 
    p.diet_tags.includes("real-food") || p.category === "real-food"
  );
}

/**
 * Recommande des produits pour une phase de course spécifique
 */
export function getProductsForRacePhase(
  phase: "pre-race" | "early-race" | "mid-race" | "late-race" | "recovery"
): Product[] {
  switch (phase) {
    case "pre-race":
      return PRODUCTS.filter(p =>
        p.recommended_for?.includes("pre-race") ||
        p.category === "bar" ||
        (p.category === "real-food" && p.texture === "solid")
      );
    
    case "early-race":
      return PRODUCTS.filter(p =>
        p.category === "gel" || p.category === "drink"
      ).filter(p => 
        (p.caffeineContent || 0) === 0 && 
        p.sweetness !== "high"
      );
    
    case "mid-race":
      return PRODUCTS.filter(p =>
        p.recommended_for?.includes("long-distance") ||
        p.recommended_for?.includes("ultra-endurance")
      );
    
    case "late-race":
      return PRODUCTS.filter(p =>
        p.recommended_for?.includes("late-race") ||
        p.recommended_for?.includes("mental-boost") ||
        (p.caffeineContent || 0) > 0
      );
    
    case "recovery":
      return PRODUCTS.filter(p =>
        p.category === "drink" || 
        (p.category === "bar" && p.calories_per_unit > 200)
      );
    
    default:
      return [];
  }
}

/**
 * Recommande un mix de produits pour un profil donné
 */
export function getRecommendedProductMix(
  targetCHOPerHour: number,
  duration: number, // heures
  preferences?: {
    giTolerance?: "sensitive" | "normal" | "robust";
    preferredBrands?: string[];
    avoidProducts?: string[];
    varietyLevel?: "low" | "medium" | "high"; // Niveau de variété souhaité
    allergens?: string[];
  }
): {
  gels: Product[];
  drinks: Product[];
  bars: Product[];
  realFood: Product[];
} {
  const giTolerance = preferences?.giTolerance || "normal";
  
  // Récupérer les produits par catégorie avec filtres
  let gels = getProductsByGITolerance("gel", giTolerance);
  let drinks = getProductsByGITolerance("drink", giTolerance);
  let bars = getProductsByGITolerance("bar", giTolerance);
  let realFood = getRealFoodProducts();

  // Appliquer les préférences utilisateur
  if (preferences) {
    const filterOptions = {
      preferredBrands: preferences.preferredBrands,
      avoidProducts: preferences.avoidProducts,
      allergens: preferences.allergens,
    };

    gels = getProductsByPreferences("gel", filterOptions);
    drinks = getProductsByPreferences("drink", filterOptions);
    bars = getProductsByPreferences("bar", filterOptions);
    realFood = realFood.filter(p => 
      !preferences.avoidProducts?.includes(p.id) &&
      !p.allergens.some(a => preferences.allergens?.includes(a))
    );
  }

  const prefPick = preferences
    ? { avoidProducts: preferences.avoidProducts, allergens: preferences.allergens }
    : undefined;
  gels = mergeCatalogWithOverlay(gels, "gel", prefPick);
  drinks = mergeCatalogWithOverlay(drinks, "drink", prefPick);
  bars = mergeCatalogWithOverlay(bars, "bar", prefPick);
  realFood = mergeCatalogWithOverlay(realFood, "real-food", prefPick);

  // Niveau de variété (nombre de produits différents)
  const varietyCount = preferences?.varietyLevel === "high" ? 5 :
                       preferences?.varietyLevel === "medium" ? 3 : 2;

  return {
    gels: gels.slice(0, varietyCount),
    drinks: drinks.slice(0, varietyCount),
    bars: duration > 3 ? bars.slice(0, Math.min(2, varietyCount)) : [],
    realFood: duration > 4 ? realFood.slice(0, Math.min(3, varietyCount)) : [],
  };
}

/**
 * Calcule le coût estimé pour un plan
 */
export function calculatePlanCost(shoppingList: { productId: string; quantity: number }[]): number {
  return shoppingList.reduce((total, item) => {
    const product = getProductById(item.productId);
    if (!product) return total;
    return total + (product.price_per_unit * item.quantity);
  }, 0);
}

/**
 * Exporte toutes les saveurs disponibles
 */
export const ALL_FLAVORS = [
  ...new Set(PRODUCTS.flatMap(p => p.flavors || []))
].sort();

/**
 * Exporte tous les tags de recommandation disponibles
 */
export const ALL_RECOMMENDATION_TAGS = [
  ...new Set(PRODUCTS.flatMap(p => p.recommended_for || []))
].sort();

/**
 * Exporte tous les tags de régime alimentaire disponibles
 */
export const ALL_DIET_TAGS = [
  ...new Set(PRODUCTS.flatMap(p => p.diet_tags || []))
].sort();