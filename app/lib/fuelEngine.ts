import type {
  AthleteProfile,
  EventDetails,
  FuelPlan,
  FuelPlanGenerationResult,
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
import { computeRelativeIntensity } from "./scienceMetrics";
import {
  buildTimeDistancePacing,
  distanceKmAtRaceTime,
  distanceKmAtRaceTimePaced,
  gradientPercentAtKm,
} from "./courseGeometry";

function clamp(n: number, lo: number, hi: number): number {
  return Math.min(hi, Math.max(lo, n));
}

// ============ CONSTANTES ============

const CHO_PROGRESSION_PROFILES = {
  conservative: {
    phase1: 30,
    phase2: 50,
    phase3: 70,
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

// ============ MÉTÉO : variantes hydratation / sodium ============

const WEATHER_HOT = new Set(["Chaud (20-30°C)", "Très chaud (>30°C)"]);
const WEATHER_COLD = new Set(["Froid (<10°C)"]);

function scaleDrinkQuantity(quantity: string, waterMl: number): string {
  if (waterMl > 0) return `${waterMl}ml`;
  return quantity;
}

/** Clone un plan en appliquant des facteurs sur les volumes d’eau et le sodium (missions boissons / produits). */
export function clonePlanHydrationAdjusted(
  plan: FuelPlan,
  waterScale: number,
  sodiumScale: number,
  targetTimeHours: number
): FuelPlan {
  const timeline: TimelineItem[] = plan.timeline.map((item) => {
    const rawW = item.water ?? 0;
    const rawS = item.sodium ?? 0;
    const nextWater = rawW > 0 ? Math.round(rawW * waterScale) : rawW;
    const nextSodium = rawS > 0 ? Math.round(rawS * sodiumScale) : rawS;
    let quantity = item.quantity;
    if (item.type === "drink" && rawW > 0 && nextWater > 0) {
      quantity = scaleDrinkQuantity(quantity, nextWater);
    }
    return {
      ...item,
      water: rawW > 0 ? nextWater : item.water,
      sodium: rawS > 0 ? nextSodium : item.sodium,
      quantity,
    };
  });

  const totals = calculateTotals(timeline, targetTimeHours, undefined);

  return {
    ...plan,
    timeline,
    waterPerHour: totals.avgWaterPerHour,
    sodiumPerHour: totals.avgSodiumPerHour,
    warnings: [...(plan.warnings || [])],
  };
}

function buildWeatherAltExplanation(
  kind: "heat" | "cold",
  profile: AthleteProfile,
  mainPlan: FuelPlan,
  altPlan: FuelPlan,
  waterPct: number,
  sodiumPct: number
): string {
  const sr = profile.sweatRate;
  const srMain = Math.round(sr * 100) / 100;
  const srAlt =
    kind === "heat"
      ? Math.round(sr * (1 + waterPct / 100) * 100) / 100
      : Math.round(sr * (1 - waterPct / 100) * 100) / 100;
  const wMain = mainPlan.waterPerHour;
  const wAlt = altPlan.waterPerHour;
  const naMain = mainPlan.sodiumPerHour;
  const naAlt = altPlan.sodiumPerHour;

  if (kind === "heat") {
    return [
      `Taux de sudation saisi : ${srMain} L/h.`,
      `Plan chaleur : sudation majorée de ${waterPct} % → ${srAlt} L/h (hypothèse de référence).`,
      `Les volumes d’eau des prises boisson sont multipliés par ${1 + waterPct / 100} (${wMain} ml/h → ${wAlt} ml/h en moyenne sur la timeline).`,
      `Le sodium de chaque prise est multiplié par ${1 + sodiumPct / 100} (+${sodiumPct} %) → ${naMain} mg/h → ${naAlt} mg/h en moyenne.`,
    ].join("\n");
  }

  return [
    `Taux de sudation saisi : ${srMain} L/h.`,
    `Plan froid : sudation réduite de ${waterPct} % → ${srAlt} L/h (hypothèse de référence).`,
    `Les volumes d’eau des prises boisson sont multipliés par ${1 - waterPct / 100} (${wMain} ml/h → ${wAlt} ml/h en moyenne).`,
    `Le sodium de chaque prise est multiplié par ${1 - sodiumPct / 100} (−${sodiumPct} %) → ${naMain} mg/h → ${naAlt} mg/h en moyenne.`,
  ].join("\n");
}

// ============ FONCTION PRINCIPALE ============

export function buildFuelPlan(profile: AthleteProfile, event: EventDetails): FuelPlan {
  const warnings: string[] = [];

  const choStrategy = determineChoStrategy(profile, event, warnings);
  const productMix = selectProducts(profile, event, choStrategy);
  const timeline = generateTimeline(profile, event, choStrategy, productMix, warnings);
  refineIntakeTimesForCourse(timeline, event, warnings);
  appendChoHourGapWarnings(timeline, choStrategy, event, warnings);
  const shoppingList = generateShoppingList(timeline, event);
  const totals = calculateTotals(timeline, event.targetTime, warnings);
  const estimatedCost = calculatePlanCost(shoppingList);

  if (profile.giTolerance === "sensitive" && totals.avgChoPerHour < 40) {
    warnings.push(
      "💡 Apport glucidique conservateur adapté à votre sensibilité digestive. " +
        "Testez ce plan à l'entraînement avant de l'augmenter progressivement sur 8-12 semaines."
    );
  }

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

export function generateFuelPlan(
  profile: AthleteProfile,
  event: EventDetails
): FuelPlanGenerationResult {
  const mainPlan = buildFuelPlan(profile, event);

  if (WEATHER_HOT.has(event.weather)) {
    const altPlan = clonePlanHydrationAdjusted(mainPlan, 1.3, 1.2, event.targetTime);
    altPlan.warnings = [
      ...(altPlan.warnings || []),
      "🌡 Variante chaleur : +30 % sur les volumes d’eau des boissons, +20 % sur le sodium des prises (vs plan principal).",
    ];
    return {
      mainPlan,
      altPlan,
      altPlanLabel: "Plan Chaleur",
      altPlanExplanation: buildWeatherAltExplanation("heat", profile, mainPlan, altPlan, 30, 20),
    };
  }

  if (WEATHER_COLD.has(event.weather)) {
    const altPlan = clonePlanHydrationAdjusted(mainPlan, 0.7, 0.8, event.targetTime);
    altPlan.warnings = [
      ...(altPlan.warnings || []),
      "❄️ Variante froid : −30 % sur les volumes d’eau des boissons, −20 % sur le sodium des prises (vs plan principal).",
    ];
    return {
      mainPlan,
      altPlan,
      altPlanLabel: "Plan Froid",
      altPlanExplanation: buildWeatherAltExplanation("cold", profile, mainPlan, altPlan, 30, 20),
    };
  }

  return { mainPlan };
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
    ); } else if (profile.giTolerance === "robust") {
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

  const ri = computeRelativeIntensity(profile, event);
  const terrainScale = clamp(0.92 + 0.35 * (ri - 0.58), 0.85, 1.15);
  for (const ph of phases) {
    ph.choPerHour = Math.round(ph.choPerHour * terrainScale);
    ph.choPerHour = Math.min(ph.choPerHour, maxCHO);
  }
  if (terrainScale >= 1.07) {
    warnings.push(
      "⛰ Intensité relative élevée (allure + dénivelé) : cibles CHO par phase légèrement majorées vs un profil plus plat."
    );
  } else if (terrainScale <= 0.9) {
    warnings.push(
      "🏃 Intensité relative plus modérée : cibles CHO par phase légèrement réduites — ajustez selon votre ressenti réel."
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
          caloriesPerUnit: product.calories_per_unit,
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
            caloriesPerUnit: drink.calories_per_unit,
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
            caloriesPerUnit: gel.calories_per_unit,
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
            caloriesPerUnit: drink.calories_per_unit,
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
              caloriesPerUnit: bar.calories_per_unit,
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
              caloriesPerUnit: gel.calories_per_unit,
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
            caloriesPerUnit: drink.calories_per_unit,
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
              caloriesPerUnit: cafGel.calories_per_unit,
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
              caloriesPerUnit: realFood.calories_per_unit,
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
              caloriesPerUnit: gel.calories_per_unit,
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

const INTAKE_SHIFT_WINDOW_MIN = 25;
const INTAKE_SHIFT_STEP_MIN = 5;

/** Recale les prises « perso » sur le meilleur passage (pente minimale), fenêtre ±25 min autour de l’horaire d’origine. */
function refineIntakeTimesForCourse(
  timeline: TimelineItem[],
  event: EventDetails,
  warnings: string[]
): void {
  const geo = event.courseGeometry;
  if (!geo || !event.adjustIntakesToCourse) return;

  const durationMin = event.targetTime * 60;
  const distKm = event.distance;
  if (distKm <= 0 || durationMin < 30) return;

  const pacing = buildTimeDistancePacing(geo, durationMin);
  const kmAtTime = (t: number) =>
    pacing ? distanceKmAtRaceTimePaced(t, pacing, durationMin) : distanceKmAtRaceTime(t, durationMin, distKm);

  let anyMoved = false;
  for (const item of timeline) {
    if (item.source === "aid-station") continue;

    const originalT = item.timeMin;
    let bestT = originalT;
    const origKm = kmAtTime(originalT);
    let bestGrad = gradientPercentAtKm(geo, origKm);

    const tEnd = Math.min(
      durationMin - 1,
      Math.floor((originalT + INTAKE_SHIFT_WINDOW_MIN) / INTAKE_SHIFT_STEP_MIN) * INTAKE_SHIFT_STEP_MIN
    );
    const tStart = Math.max(
      0,
      Math.ceil((originalT - INTAKE_SHIFT_WINDOW_MIN) / INTAKE_SHIFT_STEP_MIN) * INTAKE_SHIFT_STEP_MIN
    );

    for (let t = tStart; t <= tEnd; t += INTAKE_SHIFT_STEP_MIN) {
      const km = kmAtTime(t);
      const g = gradientPercentAtKm(geo, km);
      if (g < bestGrad - 1e-6) {
        bestGrad = g;
        bestT = t;
      } else if (Math.abs(g - bestGrad) <= 1e-6 && Math.abs(t - originalT) < Math.abs(bestT - originalT)) {
        bestT = t;
      }
    }

    if (bestT !== originalT) {
      anyMoved = true;
      item.timeMin = bestT;
    }
  }

  timeline.sort((a, b) => a.timeMin - b.timeMin);
  for (let i = 1; i < timeline.length; i++) {
    if (timeline[i]!.timeMin <= timeline[i - 1]!.timeMin) {
      timeline[i]!.timeMin = Math.min(durationMin - 1, timeline[i - 1]!.timeMin + INTAKE_SHIFT_STEP_MIN);
    }
  }

  if (anyMoved) {
    const pacingHint = pacing
      ? " La relation temps ↔ distance tient compte d’une allure plus lente en montée et plus rapide en descente."
      : "";
    warnings.push(
      "🗺 Créneaux ajustés au profil GPX : chaque prise personnelle est recalée vers le passage le plus favorable (pente minimale) dans une fenêtre de ±25 min autour de l’horaire initial — les créneaux peuvent donc chevaucher deux heures civiles." +
        pacingHint +
        " Vérifiez la cohérence avec vos ravitaillements fixes."
    );
  }
}

function choTargetAtMinute(choStrategy: ChoStrategy, timeMin: number): number {
  const ph =
    choStrategy.phases.find((p) => timeMin >= p.startTimeMin && timeMin < p.endTimeMin) ??
    choStrategy.phases[choStrategy.phases.length - 1];
  return ph?.choPerHour ?? 0;
}

/** Détecte les heures où l’apport CHO réalisé reste nettement sous l’objectif (effet quota +5 % / produits calibrés). */
function appendChoHourGapWarnings(
  timeline: TimelineItem[],
  choStrategy: ChoStrategy,
  event: EventDetails,
  warnings: string[]
): void {
  const durationMin = event.targetTime * 60;
  const nHours = Math.max(1, Math.ceil(durationMin / 60));

  for (let h = 0; h < nHours; h++) {
    const t0 = h * 60;
    const t1 = Math.min((h + 1) * 60, durationMin);
    const spanH = (t1 - t0) / 60;
    if (spanH <= 0) continue;

    const targetH = choTargetAtMinute(choStrategy, t0);
    if (targetH < 22) continue;

    const expectedChunk = targetH * spanH;
    const actual = timeline
      .filter((it) => it.timeMin >= t0 && it.timeMin < t1)
      .reduce((s, it) => s + it.cho, 0);

    if (actual < expectedChunk * 0.88) {
      warnings.push(
        `⚠️ Trou possible autour de l’heure ${h + 1} : ~${Math.round(actual)} g CHO prévus sur cette période pour ~${Math.round(expectedChunk)} g cibles — le plafond horaire à +5 % peut empêcher d’ajouter un gel/barre. Essayez des produits un peu moins chargés en CHO ou ajustez manuellement.`
      );
    }
  }
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

function calculateTotals(
  timeline: TimelineItem[],
  targetTimeHours: number,
  warnings: string[] | undefined
) {
  const totalCho = timeline.reduce((sum, item) => sum + item.cho, 0);
  const totalWater = timeline.reduce((sum, item) => sum + (item.water || 0), 0);
  const totalSodium = timeline.reduce((sum, item) => sum + (item.sodium || 0), 0);

  let usedChoCalorieEstimate = false;
  let missingCalorieData = false;

  const totalCalories = timeline.reduce((sum, item) => {
    const catalog = getProductById(item.productId);
    let cal = item.caloriesPerUnit ?? catalog?.calories_per_unit;
    if (cal != null && cal > 0) {
      return sum + cal;
    }
    if (item.cho > 0) {
      usedChoCalorieEstimate = true;
      return sum + item.cho * 4;
    }
    if (!catalog && (item.caloriesPerUnit == null || item.caloriesPerUnit === 0)) {
      missingCalorieData = true;
    }
    return sum;
  }, 0);

  if (warnings) {
    if (usedChoCalorieEstimate) {
      warnings.push(
        "💡 Calories totales : partie estimée à 4 kcal/g CHO faute de données caloriques sur certains produits."
      );
    }
    if (missingCalorieData) {
      warnings.push(
        "⚠️ Au moins une ligne du plan n’a ni calories catalogue ni CHO : kcal sous-estimées pour ces prises."
      );
    }
  }

  return {
    avgChoPerHour: Math.round(totalCho / targetTimeHours),
    avgWaterPerHour: Math.round(totalWater / targetTimeHours),
    avgSodiumPerHour: Math.round(totalSodium / targetTimeHours),
    totalCalories: Math.round(totalCalories),
  };
}

/** Recalcule CHO/h, eau/h, Na⁺/h, kcal et liste de courses à partir d’une timeline modifiée (éditeur manuel). */
export function recalculateFuelPlanFromTimeline(
  basePlan: FuelPlan,
  timeline: TimelineItem[],
  targetTimeHours: number,
  event: EventDetails
): FuelPlan {
  const hours = Math.max(0.25, targetTimeHours);
  const totals = calculateTotals(timeline, hours, undefined);
  return {
    ...basePlan,
    timeline,
    choPerHour: totals.avgChoPerHour,
    waterPerHour: totals.avgWaterPerHour,
    sodiumPerHour: totals.avgSodiumPerHour,
    totalCalories: totals.totalCalories,
    shoppingList: generateShoppingList(timeline, event),
  };
}

/** Met à jour les champs nutritionnels d’une prise à partir d’un produit catalogue. */
export function timelineItemWithProduct(item: TimelineItem, product: Product): TimelineItem {
  let type: TimelineItem["type"];
  switch (product.category) {
    case "gel":
      type = "gel";
      break;
    case "drink":
    case "electrolyte":
      type = "drink";
      break;
    case "bar":
      type = "bar";
      break;
    case "chew":
      type = "chew";
      break;
    case "real-food":
      type = "real-food";
      break;
    default:
      type = item.type;
  }

  const w = product.water_per_unit;
  const quantity =
    type === "drink" && w && w > 0
      ? `${w}ml`
      : type === "gel"
        ? "1 gel"
        : type === "bar"
          ? "1 barre"
          : type === "chew"
            ? "1 sachet"
            : type === "real-food"
              ? "1 portion"
              : item.quantity;

  return {
    ...item,
    productId: product.id,
    product: product.name,
    type,
    quantity,
    cho: product.cho_per_unit,
    water: w && w > 0 ? w : undefined,
    sodium: product.sodium_per_unit && product.sodium_per_unit > 0 ? product.sodium_per_unit : undefined,
    caloriesPerUnit: product.calories_per_unit,
  };
}

export function swapTimelineItemTimesAtSortedIndices(
  timeline: TimelineItem[],
  sortedFrom: number,
  sortedTo: number
): TimelineItem[] {
  const sorted = [...timeline].sort((a, b) => a.timeMin - b.timeMin);
  if (
    sortedFrom < 0 ||
    sortedTo < 0 ||
    sortedFrom >= sorted.length ||
    sortedTo >= sorted.length ||
    sortedFrom === sortedTo
  ) {
    return sorted;
  }
  const a = sorted[sortedFrom]!;
  const b = sorted[sortedTo]!;
  const t = a.timeMin;
  return sorted.map((item, i) => {
    if (i === sortedFrom) return { ...item, timeMin: b.timeMin };
    if (i === sortedTo) return { ...item, timeMin: t };
    return item;
  });
}

export function deleteTimelineItemAtSortedIndex(timeline: TimelineItem[], sortedIdx: number): TimelineItem[] {
  const sorted = [...timeline].sort((a, b) => a.timeMin - b.timeMin);
  if (sortedIdx < 0 || sortedIdx >= sorted.length) return sorted;
  sorted.splice(sortedIdx, 1);
  return sorted;
}

export function nudgeTimelineItemTime(
  timeline: TimelineItem[],
  sortedIdx: number,
  deltaMin: number,
  raceDurationMin: number
): TimelineItem[] {
  const sorted = [...timeline].sort((a, b) => a.timeMin - b.timeMin);
  if (sortedIdx < 0 || sortedIdx >= sorted.length) return sorted;
  const item = sorted[sortedIdx]!;
  const step = 5;
  const next = Math.round((item.timeMin + deltaMin) / step) * step;
  const clamped = Math.min(raceDurationMin, Math.max(0, next));
  sorted[sortedIdx] = { ...item, timeMin: clamped };
  return sorted;
}