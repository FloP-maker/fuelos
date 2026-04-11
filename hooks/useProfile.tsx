"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import type { AthleteProfile } from "@/app/lib/types";
import { mergeStoredAthleteProfile } from "@/app/lib/athleteProfileData";
import {
  defaultFuelOsUserProfile,
  mergeFuelOsIntoAthlete,
  readFuelOsProfileFromStorage,
  seedFuelOsFromAthlete,
  writeFuelOsProfileToStorage,
  writeMergedAthleteToStorage,
  type FuelOsUserProfile,
} from "@/lib/fuelOsUserProfile";

export type ProfileContextValue = {
  /** Données éditables de la page Profil (localStorage `fuelos_user_profile_v1`). */
  profile: FuelOsUserProfile;
  setProfile: (next: FuelOsUserProfile | ((prev: FuelOsUserProfile) => FuelOsUserProfile)) => void;
  updateProfile: (patch: Partial<FuelOsUserProfile>) => void;
  /** Applique le profil FuelOS par-dessus un `AthleteProfile` (ex. état du wizard Plan). */
  mergeAthleteProfile: (base: AthleteProfile) => AthleteProfile;
  /** Écrit la fusion FuelOS + `athlete-profile` dans `localStorage` pour le calculateur / Mode course. */
  syncToAthleteCalculator: () => void;
};

const ProfileContext = createContext<ProfileContextValue | null>(null);

export function ProfileProvider({ children }: { children: ReactNode }) {
  const [profile, setProfileState] = useState<FuelOsUserProfile>(() => defaultFuelOsUserProfile());
  const loadedRef = useRef(false);

  useEffect(() => {
    if (loadedRef.current) return;
    loadedRef.current = true;
    const from = readFuelOsProfileFromStorage();
    if (from) {
      setProfileState(from);
      return;
    }
    try {
      const raw = typeof window !== "undefined" ? window.localStorage.getItem("athlete-profile") : null;
      const athlete = mergeStoredAthleteProfile(raw ? (JSON.parse(raw) as object) : null);
      setProfileState(seedFuelOsFromAthlete(athlete));
    } catch {
      setProfileState(defaultFuelOsUserProfile());
    }
  }, []);

  const setProfile = useCallback((next: FuelOsUserProfile | ((prev: FuelOsUserProfile) => FuelOsUserProfile)) => {
    setProfileState((prev) => {
      const n = typeof next === "function" ? (next as (p: FuelOsUserProfile) => FuelOsUserProfile)(prev) : next;
      const normalized = { ...n, version: 1 as const };
      writeFuelOsProfileToStorage(normalized);
      return normalized;
    });
  }, []);

  const updateProfile = useCallback(
    (patch: Partial<FuelOsUserProfile>) => {
      setProfile((p) => ({ ...p, ...patch, version: 1 }));
    },
    [setProfile]
  );

  const mergeAthleteProfile = useCallback(
    (base: AthleteProfile) => mergeFuelOsIntoAthlete(profile, base),
    [profile]
  );

  const syncToAthleteCalculator = useCallback(() => {
    writeMergedAthleteToStorage(profile);
  }, [profile]);

  const value = useMemo(
    () => ({
      profile,
      setProfile,
      updateProfile,
      mergeAthleteProfile,
      syncToAthleteCalculator,
    }),
    [profile, setProfile, updateProfile, mergeAthleteProfile, syncToAthleteCalculator]
  );

  return <ProfileContext.Provider value={value}>{children}</ProfileContext.Provider>;
}

export function useProfile(): ProfileContextValue {
  const ctx = useContext(ProfileContext);
  if (!ctx) {
    throw new Error("useProfile doit être utilisé à l’intérieur de <ProfileProvider>.");
  }
  return ctx;
}
