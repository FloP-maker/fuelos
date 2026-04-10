"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useSession } from "next-auth/react";
import { normalizeDebrief, type StoredDebrief } from "@/app/lib/debrief";
import {
  computeNutritionProfile,
  type LearnedNutritionProfile,
} from "@/lib/nutrition-profile";
import type { RaceEntry } from "@/lib/types/race";
import { loadRaces } from "@/lib/races";

const LEARNED_PROFILE_KEY = "fuelos_learned_profile";
const DEBRIEFS_STORAGE_KEY = "fuelos_debriefs";
const CACHE_MS = 3600000;

function isFresh(computedAt: string | undefined): boolean {
  if (!computedAt) return false;
  const t = new Date(computedAt).getTime();
  if (!Number.isFinite(t)) return false;
  return Date.now() - t < CACHE_MS;
}

function readCachedProfile(): LearnedNutritionProfile | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(LEARNED_PROFILE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as LearnedNutritionProfile;
    if (
      !parsed ||
      typeof parsed !== "object" ||
      typeof parsed.computedAt !== "string" ||
      typeof parsed.debriefCount !== "number"
    ) {
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

function readDebriefsForCompute(): StoredDebrief[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(DEBRIEFS_STORAGE_KEY);
    const parsed = raw ? (JSON.parse(raw) as StoredDebrief[]) : [];
    if (!Array.isArray(parsed)) return [];
    return parsed.map((d) => normalizeDebrief(d));
  } catch {
    return [];
  }
}

function readRacesForCompute(): RaceEntry[] {
  if (typeof window === "undefined") return [];
  try {
    return loadRaces();
  } catch {
    return [];
  }
}

function persistProfile(profile: LearnedNutritionProfile): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(LEARNED_PROFILE_KEY, JSON.stringify(profile));
  } catch {
    /* best effort */
  }
}

function syncInsightsToCloud(profile: LearnedNutritionProfile): void {
  if (typeof window === "undefined") return;
  void (async () => {
    try {
      const res = await fetch("/api/user/athlete-profiles", { credentials: "include" });
      if (!res.ok) return;
      const j = (await res.json()) as {
        profiles?: { id: string; isDefault?: boolean; data?: Record<string, unknown> }[];
      };
      const profiles = j.profiles ?? [];
      const def = profiles.find((p) => p.isDefault) ?? profiles[0];
      if (!def?.id || !def.data || typeof def.data !== "object") return;
      const merged = { ...def.data, learnedInsights: profile.insights };
      await fetch(`/api/user/athlete-profiles/${def.id}`, {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ data: merged }),
      });
    } catch {
      /* fire-and-forget */
    }
  })();
}

export function useNutritionProfile(): {
  profile: LearnedNutritionProfile | null;
  isComputing: boolean;
  refresh: () => void;
} {
  const { status } = useSession();
  const [profile, setProfile] = useState<LearnedNutritionProfile | null>(null);
  const [isComputing, setIsComputing] = useState(true);
  const mounted = useRef(true);

  const runCompute = useCallback(() => {
    if (typeof window === "undefined") return;
    setIsComputing(true);
    const debriefs = readDebriefsForCompute();
    const races = readRacesForCompute();
    const next = computeNutritionProfile(debriefs, races);
    persistProfile(next);
    if (status === "authenticated") {
      syncInsightsToCloud(next);
    }
    if (mounted.current) {
      setProfile(next);
      setIsComputing(false);
    }
  }, [status]);

  const refresh = useCallback(() => {
    runCompute();
  }, [runCompute]);

  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const cached = readCachedProfile();
    if (cached && isFresh(cached.computedAt)) {
      setProfile(cached);
      setIsComputing(false);
      return;
    }

    runCompute();
  }, [runCompute]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const onDebriefSaved = () => {
      runCompute();
    };
    window.addEventListener("fuelos:debrief-saved", onDebriefSaved as EventListener);
    return () => window.removeEventListener("fuelos:debrief-saved", onDebriefSaved as EventListener);
  }, [runCompute]);

  return { profile, isComputing, refresh };
}
