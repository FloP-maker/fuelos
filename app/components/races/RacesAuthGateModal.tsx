"use client";

import { useEffect, useId, useState } from "react";
import { createPortal } from "react-dom";
import { signIn } from "next-auth/react";

export type RacesAuthGateModalProps = {
  open: boolean;
  onClose: () => void;
  /** Connexion refusée : continuer avec le stockage local uniquement. */
  onContinueLocal: () => void;
};

export function RacesAuthGateModal({ open, onClose, onContinueLocal }: RacesAuthGateModalProps) {
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

  if (!open || !mounted) return null;

  const callbackUrl =
    typeof window !== "undefined" ? `${window.location.origin}/races` : "/races";

  const handleGoogle = () => {
    void signIn("google", { callbackUrl });
  };

  const node = (
    <div className="fixed inset-0 z-[210] flex items-center justify-center p-4">
      <button type="button" className="absolute inset-0 bg-black/50" aria-label="Fermer" onClick={onClose} />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="relative z-[1] w-full max-w-md rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg-card)] p-6 shadow-lg ring-1 ring-[var(--color-border-subtle)]"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 id={titleId} className="text-lg font-semibold text-[var(--color-text)]">
          Compte FuelOS
        </h2>
        <p className="mt-3 text-sm leading-relaxed text-[var(--color-text-muted)]">
          Connecte-toi pour synchroniser tes courses et ton historique sur tous tes appareils. Sans compte, tu peux
          quand même ajouter une course sur cet appareil (données locales).
        </p>
        <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:justify-end">
          <button
            type="button"
            onClick={() => {
              onClose();
              onContinueLocal();
            }}
            className="order-3 rounded-xl border border-[var(--color-border-subtle)] px-4 py-2.5 text-sm font-medium text-[var(--color-text)] transition hover:bg-[var(--color-bg-elevated)]/60 sm:order-1"
          >
            Continuer sans compte
          </button>
          <button
            type="button"
            onClick={onClose}
            className="order-2 rounded-xl border border-[var(--color-border-subtle)] px-4 py-2.5 text-sm font-medium text-[var(--color-text)] transition hover:bg-[var(--color-bg-elevated)]/60"
          >
            Annuler
          </button>
          <button
            type="button"
            onClick={() => void handleGoogle()}
            className="order-1 rounded-xl bg-[var(--color-accent)] px-4 py-2.5 text-sm font-semibold text-black transition hover:opacity-90 sm:order-3"
          >
            Se connecter avec Google
          </button>
        </div>
      </div>
    </div>
  );

  return createPortal(node, document.body);
}
