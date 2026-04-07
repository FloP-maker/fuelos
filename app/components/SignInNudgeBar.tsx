'use client';

import { signIn, useSession } from 'next-auth/react';
import { useEffect, useState } from 'react';

const STORAGE_KEY = 'fuelos_signin_nudge_dismissed';

/**
 * Bandeau sous le header pour les visiteurs non connectés : avantages de la connexion Google + CTA.
 * Peut être masqué (« Masquer ») ; le choix est mémorisé dans localStorage.
 * Affiché seulement si le fournisseur Google est configuré côté serveur.
 */
export function SignInNudgeBar() {
  const { data: session, status } = useSession();
  /** `null` = pas encore lu (évite flash + mismatch SSR). */
  const [dismissed, setDismissed] = useState<boolean | null>(null);
  const [googleAvailable, setGoogleAvailable] = useState<boolean | null>(null);

  useEffect(() => {
    void Promise.resolve().then(() => {
      try {
        setDismissed(localStorage.getItem(STORAGE_KEY) === '1');
      } catch {
        setDismissed(false);
      }
    });
    void (async () => {
      try {
        const res = await fetch('/api/auth/providers', {
          credentials: 'include',
          headers: { Accept: 'application/json' },
        });
        const data: unknown = await res.json().catch(() => null);
        const hasGoogle = Boolean(
          data &&
            typeof data === "object" &&
            !Array.isArray(data) &&
            "google" in (data as Record<string, unknown>)
        );
        setGoogleAvailable(res.ok && hasGoogle);
      } catch {
        setGoogleAvailable(false);
      }
    })();
  }, []);

  if (status === 'loading' || session?.user) return null;
  if (googleAvailable !== true) return null;
  if (dismissed === null || dismissed) return null;

  const dismiss = () => {
    try {
      localStorage.setItem(STORAGE_KEY, '1');
    } catch {
      /* ignore */
    }
    setDismissed(true);
  };

  const handleGoogleSignIn = async () => {
    try {
      const callbackUrl =
        typeof window === 'undefined'
          ? '/'
          : `${window.location.origin}/plan?step=profile`;
      const result = await signIn('google', { callbackUrl, redirect: true });
      if (result && typeof result === 'object' && result.error && typeof window !== 'undefined') {
        window.location.assign(`/api/auth/signin/google?callbackUrl=${encodeURIComponent(callbackUrl)}`);
      }
    } catch {
      if (typeof window !== 'undefined') {
        const callbackUrl = `${window.location.origin}/plan?step=profile`;
        window.location.assign(`/api/auth/signin/google?callbackUrl=${encodeURIComponent(callbackUrl)}`);
      }
    }
  };

  return (
    <div
      className="fuel-header-signin-nudge"
      role="region"
      aria-label="Avantages de la connexion avec Google"
    >
      <p className="fuel-header-signin-nudge__text">
        <strong className="fuel-header-signin-nudge__lead">Compte gratuit · </strong>
        synchronise ton plan et tes profils sur <strong>tous tes appareils</strong>, avec un{' '}
        <strong>historique cloud illimité</strong> (courses, débriefs, prépa).
      </p>
      <div className="fuel-header-signin-nudge__actions">
        <button
          type="button"
          className="fuel-header-cta fuel-header-cta--compact shrink-0"
          onClick={() => void handleGoogleSignIn()}
        >
          Se connecter avec Google
        </button>
        <button type="button" className="fuel-header-text-btn shrink-0" onClick={dismiss}>
          Masquer
        </button>
      </div>
    </div>
  );
}
