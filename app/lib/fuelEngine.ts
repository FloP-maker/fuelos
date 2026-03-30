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
    phase1: 30,
    phase2: 45,
    phase3: 45,
  },
  moderate: {
    phase1: 40,
    phase2: 60,
    phase3: 60,
  },
  aggressive: {
    phase1: 50,
    phase2: 70,
    phase3: 90,
  },
};

// ============ FONCTION PRINCIPALE ============

export function generateFuelPlan(
  profile: AthleteProfile,
  event: EventDetails
): FuelPlan {
  const warnings: string[] = [];

  const choStrategy = determineChoStrategy(profile, event, warnings);
  const productMix = selectProducts(profile, event, choStrategy);
  const timeline = generateTimeline(profile, event, choStrategy, productMix, warnings);
  const shoppingList = generateShoppingList(timeline, event);
  const totals = calculateTotals(timeline, event.targetTime);
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

  const giCaps = {
    sensitive: 45,
    normal: 60,
    robust: 90
  };
  
  const maxCHO = giCaps[profile.giTolerance];

  let progressionProfile = CHO_PROGRESSION_PROFILES.moderate;
  
  if (profile.giTolerance === "sensitive") {
    progressionProfile = CHO_PROGRESSION_PROFILES.conservative;
    warnings.push(
      "Stratégie conservatrice appliquée en raison d'une tolérance GI sensible"
    );
  } else if (profile.giTolerance === "robust" && event.targetTime < 6) {
    progressionProfile = CHO_PROGRESSION_PROFILES.aggressive;
  }

  progressionProfile = {
    phase1: Math.min(progressionProfile.phase1, maxCHO),
    phase2: Math.min(progressionProfile.phase2, maxCHO),
    phase3: Math.min(progressionProfile.phase3, maxCHO),
  };

  const phases: ChoPhase[] = [];

  if (durationMin <= 90) {
    phases.push({
      startTimeMin: 0,
      endTimeMin: durationMin,
      choPerHour: progressionProfile.phase2,
      description: "Intensité constante",
    });
  } else if (durationMin <= 180) {
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

  const usedAidStations = new Set<number>();
  const choPerHourTracker: { [hour: number]: number } = {};

  let gelIndex = 0;
  let drinkIndex = 0;
  let barIndex = 0;
  let realFoodIndex = 0;

  for (let timeMin = 0; timeMin < durationMin; timeMin += 15) {
    const currentPhase = choStrategy.phases.find(
      p => timeMin >= p.startTimeMin && timeMin < p.endTimeMin
    );
    
    if (!currentPhase) continue;

    const choTarget = currentPhase.choPerHour;
    const currentHour = Math.floor(timeMin / 60);

    // Vérifier d'abord si on est à un ravitaillement fixe (priorité absolue)
    const aidStation = event.aidStations?.find(station => {
      const stationTime = station.estimatedTimeMin || 0;
      const stationIndex = event.aidStations?.indexOf(station) || -1;
      
      if (usedAidStations.has(stationIndex)) {
        return false;
      }
      
      return Math.abs(stationTime - timeMin) <= 10;
    });

    if (aidStation) {
      const stationIndex = event.aidStations?.indexOf(aidStation) || -1;
      usedAidStations.add(stationIndex);
      
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

    // Vérifier le quota horaire avec tolérance scientifique
    const choThisHour = choPerHourTracker[currentHour] || 0;
    
    // Helper avec tolérance de 5% (scientifiquement acceptable)
    const canAddProduct = (productCho: number) => {
      const strictTarget = choTarget;
      const maxTolerance = strictTarget * 1.05; // 5% de marge
      
      // Stop si on a déjà atteint le target strict
      if (choThisHour >= strictTarget) {
        return false;
      }
      
      // Accepter si ça ne dépasse pas la tolérance
      return (choThisHour + productCho) <= maxTolerance;
    };

    const isHourMark = timeMin % 60 === 0;
    const isHalfHour = timeMin % 30 === 0 && timeMin % 60 !== 0;

    // Début de course
    if (timeMin < 60) {
      if (timeMin === 0) {
        const drink = productMix.drinks[drinkIndex % productMix.drinks.length];
        if (drink && canAddProduct(drink.cho_per_unit)) {
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
          choPerHourTracker[currentHour] = choThisHour + drink.cho_per_unit;
          drinkIndex++;
        }
      } else if (timeMin === 30) {
        const gel = productMix.gels[gelIndex % productMix.gels.length];
        if (gel && canAddProduct(gel.cho_per_unit)) {
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
          choPerHourTracker[currentHour] = choThisHour + gel.cho_per_unit;
          gelIndex++;
        }
      }
    } 
    else if (timeMin < durationMin * 0.7) {
      if (isHourMark) {
        const drink = productMix.drinks[drinkIndex % productMix.drinks.length];
        if (drink && canAddProduct(drink.cho_per_unit)) {
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
          choPerHourTracker[currentHour] = choThisHour + drink.cho_per_unit;
          drinkIndex++;
        }
      } else if (isHalfHour) {
        const useBar = timeMin % 120 === 90 && productMix.bars.length > 0;
        
        if (useBar) {
          const bar = productMix.bars[barIndex % productMix.bars.length];
          if (canAddProduct(bar.cho_per_unit)) {
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
            choPerHourTracker[currentHour] = choThisHour + bar.cho_per_unit;
            barIndex++;
          }
        } else {
          const gel = productMix.gels[gelIndex % productMix.gels.length];
          if (gel && canAddProduct(gel.cho_per_unit)) {
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
            choPerHourTracker[currentHour] = choThisHour + gel.cho_per_unit;
            gelIndex++;
          }
        }
      }
    }
    else {
      if (isHourMark) {
        const drink = productMix.drinks[drinkIndex % productMix.drinks.length];
        if (drink && canAddProduct(drink.cho_per_unit)) {
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
          choPerHourTracker[currentHour] = choThisHour + drink.cho_per_unit;
          drinkIndex++;
        }
      } else if (isHalfHour) {
        const caffeineGels = getCaffeinatedProducts(50).filter(p => p.category === "gel");
        
        if (caffeineGels.length > 0 && timeMin > durationMin * 0.8) {
          const cafGel = caffeineGels[gelIndex % caffeineGels.length];
          if (canAddProduct(cafGel.cho_per_unit)) {
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
            choPerHourTracker[currentHour] = choThisHour + cafGel.cho_per_unit;
            gelIndex++;
          }
        } else if (productMix.realFood.length > 0 && timeMin % 90 === 45) {
          const realFood = productMix.realFood[realFoodIndex % productMix.realFood.length];
          if (canAddProduct(realFood.cho_per_unit)) {
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
            choPerHourTracker[currentHour] = choThisHour + realFood.cho_per_unit;
            realFoodIndex++;
          }
        } else {
          const gel = productMix.gels[gelIndex % productMix.gels.length];
          if (gel && canAddProduct(gel.cho_per_unit)) {
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
            choPerHourTracker[currentHour] = choThisHour + gel.cho_per_unit;
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