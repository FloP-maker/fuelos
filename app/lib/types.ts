// ============ CORE TYPES ============

export interface AthleteProfile {
  weight: number;          // kg
    age: number;
      gender: "M" | "F";
        sweatRate: number;       // L/h
          giTolerance: "sensitive" | "normal" | "robust";
            allergies: string[];     // e.g. ["gluten", "dairy"]
            }

            export interface EventDetails {
              sport: string;
                distance: number;        // km
                  elevationGain: number;   // m D+
                    targetTime: number;      // hours
                      weather: string;
                        elevation: string;
                        }

                        export interface TimelineItem {
                          timeMin: number;         // minutes from start
                            product: string;         // product name
                              productId: string;
                                quantity: string;        // "1 gel", "500ml", etc.
                                  type: "gel" | "drink" | "bar" | "chew" | "real-food";
                                    cho: number;             // g carbs
                                      water?: number;          // ml
                                        sodium?: number;         // mg
                                          alert?: string;          // optional note
                                          }

                                          export interface ShoppingItem {
                                            productId: string;
                                              quantity: number;
                                              }

                                              export interface FuelPlan {
                                                choPerHour: number;
                                                  waterPerHour: number;    // ml/h
                                                    sodiumPerHour: number;   // mg/h
                                                      totalCalories: number;
                                                        timeline: TimelineItem[];
                                                          shoppingList: ShoppingItem[];
                                                            warnings: string[];
                                                            }

                                                            export interface Product {
                                                              id: string;
                                                                name: string;
                                                                  brand: string;
                                                                    category: "gel" | "drink" | "bar" | "chew" | "real-food" | "electrolyte";
                                                                      cho_per_unit: number;    // g carbs per serving
                                                                        water_per_unit?: number; // ml per serving
                                                                          sodium_per_unit?: number;// mg sodium per serving
                                                                            calories_per_unit: number;
                                                                              price_per_unit: number;  // EUR
                                                                                weight_g: number;        // grams per unit
                                                                                  allergens: string[];
                                                                                    diet_tags: string[];     // ["vegan", "gluten-free", etc.]
                                                                                      description?: string;
                                                                                      }

                                                                                      export interface SavedPlan {
                                                                                        plan: FuelPlan;
                                                                                          profile: AthleteProfile;
                                                                                            event: EventDetails;
                                                                                              savedAt: string;
                                                                                              }

                                                                                              export interface RaceState {
                                                                                                status: "idle" | "running" | "paused" | "finished";
                                                                                                  startTime: number | null;       // Date.now() when started
                                                                                                    elapsedMs: number;              // ms since start (updated on pause)
                                                                                                      currentItemIndex: number;
                                                                                                        consumedItems: number[];        // indices of consumed timeline items
                                                                                                          deviations: string[];
                                                                                                          }