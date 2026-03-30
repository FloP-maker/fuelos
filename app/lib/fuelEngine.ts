import type {
  AthleteProfile,
  EventDetails,
  FuelPlan,
  TimelineItem,
  ShoppingItem,
  ChoStrategy,
  ChoPhase,
  Product,
} from "./types";
import {
  getProductsByPreferences,
  getProductsByGITolerance,
  getRecommendedProductMix,
  getProductById,
  calculatePlanCost,
  getProductsForRacePhase,
  getCaffeinatedProducts,
} from "./products";

// ============ CONSTANTES ============

const CHO_PROGRESSION_PROFILES = {
  conservative: {
    phase1: 30, // g CHO/h - Phase échauffement (0-60min)
    phase2: 50, // g CHO/h - Montée progressive (60-120min)
    phase3: 70, // g CHO/h - Croisière (120min+)
  },
  moderate: {
    phase1: 40,
    phase2: 60,
    phase3: 80,
  },
  aggressive: {
    phase1: 50,
    phase2: 70,
    phase3: 90,
  },
};

// ============ FONCTION PRINCIPALE ============

/**
 * Génère un plan de ravitaillement complet avec charge glucidique progressive
 */
export function generateFuelPlan(
  profile: AthleteProfile,
  event: EventDetails
): FuelPlan {
  const warnings: string[] = [];

  // 1. Déterminer la stratégie CHO progressive
  const choStrategy = determineChoStrategy(profile, event, warnings);

  // 2. Sélectionner les produits recommandés
  const productMix = selectProducts(profile, event, choStrategy);

  // 3. Générer la timeline
  const timeline = generateTimeline(profile, event, choStrategy, productMix, warnings);

  // 4. Générer la liste de courses
  const shoppingList = generateShoppingList(timeline, event);

  // 5. Calculer les totaux
  const totals = calculateTotals(timeline, event.targetTime);

  // 6. Calculer le coût estimé
  const estimatedCost = calculatePlanCost(shoppingList);

  return {
    choPerHour: totals.avgChoPerHour,
    waterPerHour: totals.avgWaterPerHour,
    sodiumPerHour: totals.avgSodiumPerHour,
    totalCalories: totals.totalCalories,
    timeline,
    shoppingList,
    warnings,
    choStrategy,
    estimatedCost,
  };
}

// ============ STRATÉGIE CHO PROGRESSIVE ============

function determineChoStrategy(
  profile: AthleteProfile,
  event: EventDetails,
  warnings: string[]
): ChoStrategy {
  const durationMin = event.targetTime * 60;

  // Choisir le profil de progression selon la tolérance GI
  let progressionProfile = CHO_PROGRESSION_PROFILES.moderate;
  
  if (profile.giTolerance === "sensitive") {
    progressionProfile = CHO_PROGRESSION_PROFILES.conservative;
    warnings.push(
      "Stratégie conservatrice appliquée en raison d'une tolérance GI sensible"
    );
  } else if (profile.giTolerance === "robust" && event.targetTime < 6) {
    progressionProfile = CHO_PROGRESSION_PROFILES.aggressive;
  }

  // Définir les phases
  const phases: ChoPhase[] = [];

  if (durationMin <= 90) {
    // Course courte : CHO constant
    phases.push({
      startTimeMin: 0,
      endTimeMin: durationMin,
      choPerHour: progressionProfile.phase2,
      description: "Intensité constante",
    });
  } else if (durationMin <= 180) {
    // Course moyenne : 2 phases
    phases.push(
      {
        startTimeMin: 0,
        endTimeMin: 60,
        choPerHour: progressionProfile.phase1,
        description: "Phase d'échauffement",
      },
      {
        startTimeMin: 60,
        endTimeMin: durationMin,
        choPerHour: progressionProfile.phase3,
        description: "Phase de croisière",
      }
    );
  } else {
    // Course longue : 3 phases
    const phase2End = Math.min(120, durationMin * 0.4);
    
    phases.push(
      {
        startTimeMin: 0,
        endTimeMin: 60,
        choPerHour: progressionProfile.phase1,
        description: "Phase d'échauffement (adaptation digestive)",
      },
      {
        startTimeMin: 60,
        endTimeMin: phase2End,
        choPerHour: progressionProfile.phase2,
        description: "Montée en charge progressive",
      },
      {
        startTimeMin: phase2End,
        endTimeMin: durationMin,
        choPerHour: progressionProfile.phase3,
        description: "Phase de croisière (haute intensité)",
      }
    );
  }

  return {
    type: durationMin <= 90 ? "constant" : "progressive",
    phases,
  };
}

// ============ SÉLECTION DES PRODUITS ============

function selectProducts(
  profile: AthleteProfile,
  event: EventDetails,
  choStrategy: ChoStrategy
) {
  const maxChoPerHour = Math.max(...choStrategy.phases.map(p => p.choPerHour));

  // Utiliser la fonction de recommandation intelligente
  const productMix = getRecommendedProductMix(
    maxChoPerHour,
    event.targetTime,
    {
      giTolerance: profile.giTolerance,
      preferredBrands: profile.preferredProducts?.gels?.map(id => 
        getProductById(id)?.brand
      ).filter(Boolean) as string[] | undefined,
      avoidProducts: profile.avoidProducts,
      varietyLevel: event.targetTime > 6 ? "high" : "medium",
      allergens: profile.allergies,
    }
  );

  return productMix;
}

// ============ GÉNÉRATION DE LA TIMELINE ============

function generateTimeline(
  profile: AthleteProfile,
  event: EventDetails,
  choStrategy: ChoStrategy,
  productMix: ReturnType<typeof selectProducts>,
  warnings: string[]
): TimelineItem[] {
  const timeline: TimelineItem[] = [];
  const durationMin = event.targetTime * 60;

  // 🆕 Tracker les aid stations déjà utilisées
  const usedAidStations = new Set<number>();

  // Index pour alterner les produits
  let gelIndex = 0;
  let drinkIndex = 0;
  let barIndex = 0;
  let realFoodIndex = 0;

  // Parcourir la course par intervalles de 15 minutes
  for (let timeMin = 0; timeMin < durationMin; timeMin += 15) {
    // Déterminer la phase actuelle et l'objectif CHO/h
    const currentPhase = choStrategy.phases.find(
      p => timeMin >= p.startTimeMin && timeMin < p.endTimeMin
    );
    
    if (!currentPhase) continue;

    const choTarget = currentPhase.choPerHour;

    // Vérifier si on est à un ravitaillement fixe
    const aidStation = event.aidStations?.find(station => {
      const stationTime = station.estimatedTimeMin || 0;
      const stationIndex = event.aidStations?.indexOf(station) || -1;
      
      // Ne pas réutiliser une aid station déjà utilisée
      if (usedAidStations.has(stationIndex)) {
        return false;
      }
      
      // Tolérance de ±10 minutes pour matcher
      return Math.abs(stationTime - timeMin) <= 10;
    });

    if (aidStation) {
      // Marquer cette aid station comme utilisée
      const stationIndex = event.aidStations?.indexOf(aidStation) || -1;
      usedAidStations.add(stationIndex);
      
      // Utiliser les produits du ravitaillement
      const aidProducts = aidStation.availableProducts
        .map(id => getProductById(id))
        .filter(Boolean) as Product[];

      if (aidProducts.length > 0) {
        const product = aidProducts[0];
        
        timeline.push({
          timeMin,
          product: product.name,
          productId: product.id,
          quantity: `1 ${product.category}`,
          type: product.category as any,
          cho: product.cho_per_unit,
          water: product.water_per_unit,
          sodium: product.sodium_per_unit,
          choTarget,
          source: "aid-station",
          aidStationName: aidStation.name,
          alert: `📍 Ravitaillement ${aidStation.name || ""}`,
        });

        continue;
      }
    }

    // Logique de variation des produits (reste du code existant)
    const isHourMark = timeMin % 60 === 0;
    const isHalfHour = timeMin % 30 === 0 && timeMin % 60 !== 0;

    // Début de course : gel + boisson
    if (timeMin < 60) {
      if (timeMin === 0) {
        const drink = productMix.drinks[drinkIndex % productMix.drinks.length];
        if (drink) {
          timeline.push({
            timeMin,
            product: drink.name,
            productId: drink.id,
            quantity: "500ml",
            type: "drink",
            cho: drink.cho_per_unit,
            water: drink.water_per_unit,
            sodium: drink.sodium_per_unit,
            choTarget,
            source: "personal",
          });
          drinkIndex++;
        }
      } else if (timeMin === 30) {
        const gel = productMix.gels[gelIndex % productMix.gels.length];
        if (gel) {
          timeline.push({
            timeMin,
            product: gel.name,
            productId: gel.id,
            quantity: "1 gel",
            type: "gel",
            cho: gel.cho_per_unit,
            sodium: gel.sodium_per_unit,
            choTarget,
            source: "personal",
          });
          gelIndex++;
        }
      }
    } 
    // Phase intermédiaire : alterner gel/boisson + barres
    else if (timeMin < durationMin * 0.7) {
      if (isHourMark) {
        const drink = productMix.drinks[drinkIndex % productMix.drinks.length];
        if (drink) {
          timeline.push({
            timeMin,
            product: drink.name,
            productId: drink.id,
            quantity: "500ml",
            type: "drink",
            cho: drink.cho_per_unit,
            water: drink.water_per_unit,
            sodium: drink.sodium_per_unit,
            choTarget,
            source: "personal",
          });
          drinkIndex++;
        }
      } else if (isHalfHour) {
        const useBar = timeMin % 120 === 90 && productMix.bars.length > 0;
        
        if (useBar) {
          const bar = productMix.bars[barIndex % productMix.bars.length];
          timeline.push({
            timeMin,
            product: bar.name,
            productId: bar.id,
            quantity: "1 barre",
            type: "bar",
            cho: bar.cho_per_unit,
            sodium: bar.sodium_per_unit,
            choTarget,
            source: "personal",
            alert: "Variété : barre énergétique",
          });
          barIndex++;
        } else {
          const gel = productMix.gels[gelIndex % productMix.gels.length];
          if (gel) {
            timeline.push({
              timeMin,
              product: gel.name,
              productId: gel.id,
              quantity: "1 gel",
              type: "gel",
              cho: gel.cho_per_unit,
              sodium: gel.sodium_per_unit,
              choTarget,
              source: "personal",
            });
            gelIndex++;
          }
        }
      }
    }
    // Phase finale : boost caféine + real food
    else {
      if (isHourMark) {
        const drink = productMix.drinks[drinkIndex % productMix.drinks.length];
        if (drink) {
          timeline.push({
            timeMin,
            product: drink.name,
            productId: drink.id,
            quantity: "500ml",
            type: "drink",
            cho: drink.cho_per_unit,
            water: drink.water_per_unit,
            sodium: drink.sodium_per_unit,
            choTarget,
            source: "personal",
          });
          drinkIndex++;
        }
      } else if (isHalfHour) {
        const caffeineGels = getCaffeinatedProducts(50).filter(p => p.category === "gel");
        
        if (caffeineGels.length > 0 && timeMin > durationMin * 0.8) {
          const cafGel = caffeineGels[gelIndex % caffeineGels.length];
          timeline.push({
            timeMin,
            product: cafGel.name,
            productId: cafGel.id,
            quantity: "1 gel",
            type: "gel",
            cho: cafGel.cho_per_unit,
            sodium: cafGel.sodium_per_unit,
            choTarget,
            source: "personal",
            alert: `⚡ Boost caféine (${cafGel.caffeineContent}mg)`,
          });
          gelIndex++;
        } else if (productMix.realFood.length > 0 && timeMin % 90 === 45) {
          const realFood = productMix.realFood[realFoodIndex % productMix.realFood.length];
          timeline.push({
            timeMin,
            product: realFood.name,
            productId: realFood.id,
            quantity: "1 portion",
            type: "real-food",
            cho: realFood.cho_per_unit,
            sodium: realFood.sodium_per_unit,
            choTarget,
            source: "personal",
            alert: "🍌 Variété : aliment naturel",
          });
          realFoodIndex++;
        } else {
          const gel = productMix.gels[gelIndex % productMix.gels.length];
          if (gel) {
            timeline.push({
              timeMin,
              product: gel.name,
              productId: gel.id,
              quantity: "1 gel",
              type: "gel",
              cho: gel.cho_per_unit,
              sodium: gel.sodium_per_unit,
              choTarget,
              source: "personal",
            });
            gelIndex++;
          }
        }
      }
    }
  }

  return timeline;
}

// ============ GÉNÉRATION LISTE DE COURSES ============

function generateShoppingList(
  timeline: TimelineItem[],
  event: EventDetails
): ShoppingItem[] {
  const productCounts = new Map<string, number>();

  // Compter les produits personnels uniquement (pas les aid stations)
  timeline
    .filter(item => item.source === "personal")
    .forEach(item => {
      const count = productCounts.get(item.productId) || 0;
      productCounts.set(item.productId, count + 1);
    });

  return Array.from(productCounts.entries()).map(([productId, quantity]) => ({
    productId,
    quantity,
    source: "personal",
  }));
}

// ============ CALCUL DES TOTAUX ============

function calculateTotals(timeline: TimelineItem[], targetTimeHours: number) {
  const totalCho = timeline.reduce((sum, item) => sum + item.cho, 0);
  const totalWater = timeline.reduce((sum, item) => sum + (item.water || 0), 0);
  const totalSodium = timeline.reduce((sum, item) => sum + (item.sodium || 0), 0);
  const totalCalories = timeline.reduce((sum, item) => {
    const product = getProductById(item.productId);
    return sum + (product?.calories_per_unit || 0);
  }, 0);

  return {

    avgChoPerHour: Math.round(totalCho / targetTimeHours),
    avgWaterPerHour: Math.round(totalWater / targetTimeHours),
    avgSodiumPerHour: Math.round(totalSodium / targetTimeHours),
    totalCalories: Math.round(totalCalories),
  };
}