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

function displayName(id: string, p: ProviderEntry): string {
  if (id === 'google') return 'Continuer avec Google';
  if (id === 'apple') return 'Continuer avec Apple';
  if (p.type === 'email') return 'Continuer par e-mail';
  return `Continuer avec ${p.name || id}`;
}

export function LandingAuthPanel({
  title = 'Créer un compte (optionnel)',
  subtitle = 'Synchronisez vos plans, profils et historique sur tous vos appareils.',
  callbackPath = '/plan?step=profile',
}: {
  title?: string;
  subtitle?: string;
  callbackPath?: string;
}) {
  const { data: session, status } = useSession();
  const [providerMap, setProviderMap] = useState<Record<string, ProviderEntry> | null>(null);
  const [providersFetchFailed, setProvidersFetchFailed] = useState(false);
  const [email, setEmail] = useState('');
  const [emailHint, setEmailHint] = useState<'idle' | 'sending' | 'sent' | 'err'>('idle');

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

  const providerIds = providerMap ? Object.keys(providerMap) : [];
  const oauthIds = providerIds.filter((id) => {
    const t = providerMap?.[id]?.type;
    return t === 'oauth' || t === 'oidc';
  });
  const emailProviderId = providerIds.find((id) => providerMap?.[id]?.type === 'email') ?? null;

  const sortedOAuth = [...oauthIds].sort((a, b) => {
    const rank = (id: string) => (id === 'google' ? 0 : id === 'apple' ? 1 : 2);
    return rank(a) - rank(b);
  });

  const handleProvider = async (providerId: string) => {
    try {
      const fallbackTimer = window.setTimeout(() => {
        window.location.assign(`/api/auth/signin/${providerId}?callbackUrl=${encodeURIComponent(callbackUrl)}`);
      }, 1200);
      await signIn(providerId, { callbackUrl, redirect: true });
      window.clearTimeout(fallbackTimer);
    } catch {
      window.location.assign(`/api/auth/signin/${providerId}?callbackUrl=${encodeURIComponent(callbackUrl)}`);
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
            <Link href="/plan?step=profile" style={{ color: 'var(--color-accent)', fontWeight: 800 }}>
              votre profil
            </Link>
            .
          </div>
        </div>
      ) : providersFetchFailed ? (
        <div style={{ fontSize: 13, color: 'var(--color-danger)', lineHeight: 1.55 }}>
          Connexion indisponible pour le moment. Vérifiez la configuration Auth (/debug/auth).
        </div>
      ) : (
        <div style={{ display: 'grid', gap: 10 }}>
          {sortedOAuth.map((id) => {
            const p = providerMap?.[id];
            if (!p) return null;
            return (
              <button
                key={id}
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
                onClick={() => void handleProvider(id)}
              >
                {displayName(id, p)}
              </button>
            );
          })}

          {emailProviderId && (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                const trimmed = email.trim();
                if (!trimmed) return;
                setEmailHint('sending');
                void signIn(emailProviderId, { email: trimmed, redirect: false }).then((res) => {
                  if (res?.ok) setEmailHint('sent');
                  else setEmailHint('err');
                });
              }}
              style={{
                display: 'grid',
                gap: 10,
                paddingTop: sortedOAuth.length ? 6 : 0,
              }}
            >
              <label style={{ display: 'grid', gap: 6 }}>
                <span style={{ fontSize: 11, fontWeight: 900, letterSpacing: '0.08em', color: 'var(--color-text-muted)' }}>
                  E-MAIL
                </span>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (emailHint !== 'idle') setEmailHint('idle');
                  }}
                  placeholder="vous@exemple.com"
                  autoComplete="email"
                  className="fuel-input-compact"
                  style={{ padding: '0.75rem 0.85rem', fontSize: 14 }}
                />
              </label>
              <button
                type="submit"
                disabled={emailHint === 'sending'}
                className="fuel-btn-pill fuel-btn-pill-accent fuel-touch-btn font-display"
                style={{
                  justifyContent: 'center',
                  width: '100%',
                  borderRadius: 14,
                  padding: '0.85rem 1rem',
                  fontSize: 14,
                  fontWeight: 900,
                }}
              >
                Continuer par e-mail
              </button>
              {emailHint === 'sent' && (
                <div style={{ fontSize: 12, fontWeight: 800, color: 'var(--color-accent)' }}>
                  E-mail envoyé — ouvrez le lien reçu.
                </div>
              )}
              {emailHint === 'err' && (
                <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--color-danger)' }}>
                  Envoi impossible. Réessayez plus tard.
                </div>
              )}
            </form>
          )}

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

