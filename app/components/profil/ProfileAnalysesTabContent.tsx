"use client";

import Link from "next/link";
import { useSession } from "next-auth/react";
import { LineChart, Sparkles } from "lucide-react";
import { Button } from "@/app/components/Button";
import {
  NutritionProfileCard,
  NutritionProfileSkeleton,
} from "@/app/components/insights/NutritionProfileCard";
import { NutritionPatternsSection } from "@/app/components/insights/NutritionPatternsSection";
import { useNutritionProfile } from "@/hooks/useNutritionProfile";

export function ProfileAnalysesTabContent() {
  const { status } = useSession();
  const { profile: nutritionProfile, isComputing: isNutritionProfileComputing, refresh: refreshNutritionProfile } =
    useNutritionProfile();

  if (status === "unauthenticated") {
    return (
      <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg-card)] p-6 shadow-sm">
        <p className="races-section-eyebrow mb-2">Analyses nutrition</p>
        <p className="text-sm leading-relaxed text-[var(--color-text-muted)]">
          Connecte-toi pour voir ton profil nutrition calculé à partir de tes débriefs et courses enregistrées.
        </p>
        <Link
          href={`/api/auth/signin?callbackUrl=${encodeURIComponent("/profil")}`}
          className="mt-4 inline-block"
        >
          <Button variant="primary" size="md" className="min-h-11">
            Se connecter
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="races-section-eyebrow mb-1">Analyses</p>
          <h2 className="font-display text-xl font-extrabold tracking-tight text-[var(--color-text)] md:text-2xl">
            Tes indicateurs nutrition
          </h2>
          <p className="mt-1 max-w-prose text-sm text-[var(--color-text-muted)]">
            Synthèse issue de tes débriefs et de ton historique — comme un tableau de bord Strava, orienté carburant.
          </p>
        </div>
        <Link href="/analyses">
          <Button variant="secondary" size="md" className="inline-flex min-h-11 items-center gap-2">
            <LineChart className="h-4 w-4 opacity-80" aria-hidden />
            Page Analyses
          </Button>
        </Link>
      </div>

      <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg-card)] p-4 shadow-sm md:p-5">
        <div className="mb-4 flex items-center gap-2">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[var(--color-accent-muted)] text-[var(--color-primary)] dark:text-[var(--color-accent)]">
            <Sparkles className="h-4 w-4" aria-hidden />
          </span>
          <div>
            <h3 className="font-display text-base font-bold text-[var(--color-text)]">Profil nutrition</h3>
            <p className="text-xs text-[var(--color-text-muted)]">Mis à jour quand tu enregistres un débrief</p>
          </div>
          <button
            type="button"
            className="ml-auto text-xs font-semibold text-[var(--color-primary)] underline-offset-2 hover:underline dark:text-[var(--color-accent)]"
            onClick={() => void refreshNutritionProfile()}
          >
            Rafraîchir
          </button>
        </div>

        {isNutritionProfileComputing ? (
          <NutritionProfileSkeleton />
        ) : nutritionProfile && nutritionProfile.debriefCount >= 1 ? (
          <NutritionProfileCard profile={nutritionProfile} />
        ) : (
          <div className="rounded-xl border border-dashed border-[var(--color-border)] bg-[var(--color-bg-subtle)] px-4 py-6 text-center text-sm text-[var(--color-text-muted)]">
            Pas encore assez de débriefs pour une synthèse complète. Termine une course en{" "}
            <Link href="/race" className="font-semibold text-[var(--color-text)] underline-offset-2 hover:underline">
              mode course
            </Link>{" "}
            pour alimenter cette section.
          </div>
        )}
      </div>

      <NutritionPatternsSection />

      <div className="rounded-xl border border-[var(--color-border)] bg-[color-mix(in_srgb,var(--color-bg-elevated)_40%,var(--color-bg-card))] px-4 py-3 text-center text-xs text-[var(--color-text-muted)]">
        Débriefs détaillés, bibliothèque de repères et exports :{" "}
        <Link href="/analyses" className="font-semibold text-[var(--color-primary)] underline-offset-2 hover:underline dark:text-[var(--color-accent)]">
          tout voir dans Analyses
        </Link>
      </div>
    </div>
  );
}
