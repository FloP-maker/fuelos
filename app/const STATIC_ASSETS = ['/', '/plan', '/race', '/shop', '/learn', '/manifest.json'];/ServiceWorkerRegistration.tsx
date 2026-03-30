"use client";
import { useEffect } from "react";

export default function ServiceWorkerRegistration() {
  useEffect(() => {
      if ("serviceWorker" in navigator) {
            navigator.serviceWorker.register("/sw.js").then((reg) => {
                    console.log("[FuelOS SW] Registered:", reg.scope);
                          }).catch((err) => {
                                  console.warn("[FuelOS SW] Registration failed:", err);
                                        });
                                            }
                                              }, []);
                                                return null;
                                                }