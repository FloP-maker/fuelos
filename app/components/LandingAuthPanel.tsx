'use client';

import Link from 'next/link';
import { signIn, useSession } from 'next-auth/react';
import { useEffect, useMemo, useState } from 'react';

type ProviderEntry = {
  id: string;
  name: string;
  type: string;
};

function isRecord(v: unknown): v is Record<string, unknown> {
  return Boolean(v) && typeof v === 'object' && !Array.isArray(v);
}

export function LandingAuthPanel({
  title = 'Créer un compte (optionnel)',
  subtitle = 'Synchronisez vos plans, profils et historique sur tous vos appareils.',
  callbackPath = '/profil',
}: {
  title?: string;
  subtitle?: string;
  callbackPath?: string;
}) {
  const { data: session, status } = useSession();
  const [providerMap, setProviderMap] = useState<Record<string, ProviderEntry> | null>(null);
  const [providersFetchFailed, setProvidersFetchFailed] = useState(false);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const res = await fetch('/api/auth/providers', {
          credentials: 'include',
          headers: { Accept: 'application/json' },
        });
        const data: unknown = await res.json().catch(() => null);
        if (cancelled) return;
        if (!res.ok || !isRecord(data)) {
          setProviderMap({});
          setProvidersFetchFailed(true);
          return;
        }
        const cleaned: Record<string, ProviderEntry> = {};
        for (const [id, val] of Object.entries(data)) {
          if (!isRecord(val)) continue;
          const type = typeof val.type === 'string' ? val.type : '';
          const name = typeof val.name === 'string' ? val.name : id;
          cleaned[id] = { id, name, type };
        }
        setProviderMap(cleaned);
      } catch {
        if (cancelled) return;
        setProviderMap({});
        setProvidersFetchFailed(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const callbackUrl = useMemo(() => {
    if (typeof window === 'undefined') return callbackPath;
    return `${window.location.origin}${callbackPath.startsWith('/') ? '' : '/'}${callbackPath}`;
  }, [callbackPath]);

  const hasGoogle = Boolean(providerMap?.google);

  const handleGoogle = async () => {
    try {
      const fallbackTimer = window.setTimeout(() => {
        window.location.assign(`/api/auth/signin/google?callbackUrl=${encodeURIComponent(callbackUrl)}`);
      }, 1200);
      await signIn('google', { callbackUrl, redirect: true });
      window.clearTimeout(fallbackTimer);
    } catch {
      window.location.assign(`/api/auth/signin/google?callbackUrl=${encodeURIComponent(callbackUrl)}`);
    }
  };

  const signedIn = Boolean(session?.user);

  return (
    <section
      className="fuel-card"
      style={{
        padding: 18,
        borderColor: 'color-mix(in srgb, var(--color-accent) 22%, var(--color-border))',
        background:
          'linear-gradient(180deg, color-mix(in srgb, var(--color-accent) 8%, var(--color-bg-card)) 0%, var(--color-bg-card) 70%)',
      }}
      aria-label="Création de compte"
    >
      <div style={{ marginBottom: 12 }}>
        <div className="font-display" style={{ fontWeight: 900, fontSize: 18, marginBottom: 6, lineHeight: 1.15 }}>
          {title}
        </div>
        <p style={{ margin: 0, color: 'var(--color-text-muted)', fontSize: 13, lineHeight: 1.55 }}>{subtitle}</p>
      </div>

      {status === 'loading' || providerMap === null ? (
        <div style={{ fontSize: 13, color: 'var(--color-text-muted)' }} aria-live="polite">
          Chargement…
        </div>
      ) : signedIn ? (
        <div style={{ display: 'grid', gap: 10 }}>
          <div style={{ fontSize: 13, color: 'var(--color-text-muted)', lineHeight: 1.55 }}>
            Vous êtes connecté. Vous pouvez aller directement à{' '}
            <Link href="/profil" style={{ color: 'var(--color-accent)', fontWeight: 800 }}>
              votre profil
            </Link>
            .
          </div>
        </div>
      ) : providersFetchFailed ? (
        <div style={{ fontSize: 13, color: 'var(--color-danger)', lineHeight: 1.55 }}>
          Connexion indisponible pour le moment. Vérifiez la configuration Auth (/debug/auth).
        </div>
      ) : !hasGoogle ? (
        <div style={{ fontSize: 13, color: 'var(--color-text-muted)', lineHeight: 1.55 }}>
          Connexion Google non configurée (variables <code style={{ fontSize: 12 }}>AUTH_GOOGLE_ID</code> /{' '}
          <code style={{ fontSize: 12 }}>AUTH_GOOGLE_SECRET</code>). Voir /debug/auth.
        </div>
      ) : (
        <div style={{ display: 'grid', gap: 10 }}>
          <button
            type="button"
            className="fuel-btn-pill fuel-touch-btn"
            style={{
              justifyContent: 'center',
              width: '100%',
              borderRadius: 14,
              padding: '0.8rem 1rem',
              fontSize: 14,
              fontWeight: 800,
            }}
            onClick={() => void handleGoogle()}
          >
            Continuer avec Google
          </button>

          <div style={{ fontSize: 11, color: 'var(--color-text-muted)', lineHeight: 1.55, paddingTop: 6 }}>
            En continuant, vous acceptez nos{' '}
            <Link href="/legal" style={{ color: 'var(--color-accent)', fontWeight: 800 }}>
              mentions légales
            </Link>{' '}
            et notre{' '}
            <Link href="/privacy" style={{ color: 'var(--color-accent)', fontWeight: 800 }}>
              politique de confidentialité
            </Link>
            .
          </div>
        </div>
      )}
    </section>
  );
}
