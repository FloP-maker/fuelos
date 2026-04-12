"use client";

import { useEffect, useId, useState } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import type { RaceEntry } from "@/lib/types/race";
import { buildPlanWizardUrlFromRace } from "@/lib/racePlanPrefill";
import type { FuelOsUserProfile } from "@/lib/fuelOsUserProfile";

export type RacePlanFollowupModalProps = {
  open: boolean;
  race: RaceEntry | null;
  fuelProfile: FuelOsUserProfile;
  onClose: () => void;
};

export function RacePlanFollowupModal({ open, race, fuelProfile, onClose }: RacePlanFollowupModalProps) {
  const titleId = useId();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [open, onClose]);

  if (!open || !mounted || !race) return null;

  const planHref = buildPlanWizardUrlFromRace(race, fuelProfile);

  const node = (
    <div className="fixed inset-0 z-[205] flex items-center justify-center p-4">
      <button type="button" className="absolute inset-0 bg-black/45" aria-label="Fermer" onClick={onClose} />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="relative z-[1] w-full max-w-md rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg-card)] p-6 shadow-lg ring-1 ring-[var(--color-border-subtle)]"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 id={titleId} className="text-lg font-semibold text-[var(--color-text)]">
          Plan nutrition
        </h2>
        <p className="mt-3 text-sm leading-relaxed text-[var(--color-text-muted)]">
          La course « <span className="font-medium text-[var(--color-text)]">{race.name}</span> » est enregistrée.
          Souhaites-tu ouvrir le planificateur avec ton profil athlète (poids, sudation, tolérance digestive…) et les
          infos course déjà renseignées ?
        </p>
        <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-[var(--color-border-subtle)] px-4 py-2.5 text-sm font-medium text-[var(--color-text)] transition hover:bg-[var(--color-bg-elevated)]/60"
          >
            Plus tard
          </button>
          <Link
            href={planHref}
            onClick={onClose}
            className="inline-flex items-center justify-center rounded-xl bg-[var(--color-accent)] px-4 py-2.5 text-center text-sm font-semibold text-black transition hover:opacity-90"
          >
            Préparer mon plan
          </Link>
        </div>
      </div>
    </div>
  );

  return createPortal(node, document.body);
}
