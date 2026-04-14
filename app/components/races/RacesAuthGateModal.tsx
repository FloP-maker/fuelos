"use client";

import { useEffect, useId, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { signIn } from "next-auth/react";
import { authGateCopyForReturnPath } from "@/app/lib/navSections";

export type RacesAuthGateModalProps = {
  open: boolean;
  onClose: () => void;
  /**
   * Chemin de retour après connexion (ex. `/race`, `/history`).
   * URL absolue acceptée ; défaut `/races` si absent.
   */
  returnTo?: string;
};

function toAbsoluteCallbackUrl(returnTo: string | undefined): string {
  if (typeof window === "undefined") {
    return returnTo?.startsWith("http") ? returnTo! : `/races`;
  }
  if (!returnTo?.trim()) {
    return `${window.location.origin}/races`;
  }
  if (returnTo.startsWith("http://") || returnTo.startsWith("https://")) {
    return returnTo;
  }
  const path = returnTo.startsWith("/") ? returnTo : `/${returnTo}`;
  return new URL(path, window.location.origin).href;
}

function pathForCopy(returnTo: string | undefined): string {
  if (!returnTo?.trim()) return "/races";
  try {
    if (returnTo.startsWith("http://") || returnTo.startsWith("https://")) {
      return new URL(returnTo).pathname;
    }
  } catch {
    /* ignore */
  }
  return returnTo.startsWith("/") ? returnTo : `/${returnTo}`;
}

export function RacesAuthGateModal({ open, onClose, returnTo }: RacesAuthGateModalProps) {
  const titleId = useId();
  const [mounted, setMounted] = useState(false);

  const copy = useMemo(() => authGateCopyForReturnPath(pathForCopy(returnTo)), [returnTo]);

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

  const handleGoogle = () => {
    const url = toAbsoluteCallbackUrl(returnTo);
    void signIn("google", { callbackUrl: url });
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
          {copy.title}
        </h2>
        <p className="mt-3 text-sm leading-relaxed text-[var(--color-text-muted)]">{copy.description}</p>
        <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-[var(--color-border-subtle)] px-4 py-2.5 text-sm font-medium text-[var(--color-text)] transition hover:bg-[var(--color-bg-elevated)]/60"
          >
            Annuler
          </button>
          <button
            type="button"
            onClick={() => void handleGoogle()}
            className="rounded-xl bg-[var(--color-accent)] px-4 py-2.5 text-sm font-semibold text-black transition hover:opacity-90"
          >
            Se connecter avec Google
          </button>
        </div>
      </div>
    </div>
  );

  return createPortal(node, document.body);
}
