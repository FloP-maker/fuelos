'use client';

import Link from 'next/link';
import { signIn, useSession } from 'next-auth/react';
import { type FormEvent, useEffect, useMemo, useState } from 'react';

type ProviderEntry = {
  id: string;
  name: string;
  type: string;
};

function isRecord(v: unknown): v is Record<string, unknown> {
  return Boolean(v) && typeof v === 'object' && !Array.isArray(v);
}

function oauthButtonLabel(id: string, p: ProviderEntry): string {
  if (id === 'google') return 'Continuer avec Google';
  if (id === 'apple') return 'Continuer avec Apple';
  return `Continuer avec ${p.name || id}`;
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
  const [magicEmail, setMagicEmail] = useState('');
  const [magicHint, setMagicHint] = useState<'idle' | 'sending' | 'sent' | 'err'>('idle');

  const [pwdMode, setPwdMode] = useState<'signin' | 'register'>('signin');
  const [pwdEmail, setPwdEmail] = useState('');
  const [pwdPassword, setPwdPassword] = useState('');
  const [pwdConfirm, setPwdConfirm] = useState('');
  const [pwdBusy, setPwdBusy] = useState(false);
  const [pwdMsg, setPwdMsg] = useState<{ kind: 'ok' | 'err'; text: string } | null>(null);

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
  const hasCredentials = Boolean(providerMap?.credentials?.type === 'credentials');

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

  const submitPassword = (e: FormEvent) => {
    e.preventDefault();
    setPwdMsg(null);
    const email = pwdEmail.trim().toLowerCase();
    const password = pwdPassword;
    if (!email || !password) {
      setPwdMsg({ kind: 'err', text: 'Renseignez l’e-mail et le mot de passe.' });
      return;
    }
    if (pwdMode === 'register') {
      if (password.length < 8) {
        setPwdMsg({ kind: 'err', text: 'Le mot de passe doit contenir au moins 8 caractères.' });
        return;
      }
      if (password !== pwdConfirm) {
        setPwdMsg({ kind: 'err', text: 'Les mots de passe ne correspondent pas.' });
        return;
      }
      setPwdBusy(true);
      void fetch('/api/auth/register-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      })
        .then(async (res) => {
          const body: unknown = await res.json().catch(() => ({}));
          const err =
            isRecord(body) && typeof body.error === 'string' ? body.error : 'Inscription impossible.';
          if (!res.ok) {
            setPwdMsg({ kind: 'err', text: err });
            return;
          }
          const r = await signIn('credentials', {
            email,
            password,
            callbackUrl,
            redirect: false,
          });
          if (r?.ok) {
            window.location.assign(callbackUrl);
            return;
          }
          setPwdMsg({
            kind: 'err',
            text: 'Compte créé, mais la connexion a échoué. Réessayez avec « Connexion ».',
          });
        })
        .catch(() => {
          setPwdMsg({ kind: 'err', text: 'Erreur réseau. Réessayez.' });
        })
        .finally(() => setPwdBusy(false));
      return;
    }

    setPwdBusy(true);
    void signIn('credentials', { email, password, callbackUrl, redirect: false })
      .then((r) => {
        if (r?.ok) {
          window.location.assign(callbackUrl);
          return;
        }
        setPwdMsg({
          kind: 'err',
          text: 'E-mail ou mot de passe incorrect.',
        });
      })
      .catch(() => {
        setPwdMsg({ kind: 'err', text: 'Connexion impossible. Réessayez.' });
      })
      .finally(() => setPwdBusy(false));
  };

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
      ) : (
        <div style={{ display: 'grid', gap: 14 }}>
          {sortedOAuth.length > 0 && (
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
                    {oauthButtonLabel(id, p)}
                  </button>
                );
              })}
            </div>
          )}

          {emailProviderId && (
            <>
              {sortedOAuth.length > 0 ? (
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,
                    color: 'var(--color-text-muted)',
                    fontSize: 11,
                    fontWeight: 800,
                    letterSpacing: '0.06em',
                  }}
                >
                  <span style={{ flex: 1, height: 1, background: 'var(--color-border)' }} />
                  OU SANS MOT DE PASSE
                  <span style={{ flex: 1, height: 1, background: 'var(--color-border)' }} />
                </div>
              ) : null}
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  const trimmed = magicEmail.trim();
                  if (!trimmed) return;
                  setMagicHint('sending');
                  void signIn(emailProviderId, { email: trimmed, redirect: false }).then((res) => {
                    if (res?.ok) setMagicHint('sent');
                    else setMagicHint('err');
                  });
                }}
                style={{ display: 'grid', gap: 10 }}
              >
                <div style={{ fontSize: 12, fontWeight: 800, color: 'var(--color-text-muted)', lineHeight: 1.45 }}>
                  Lien magique : nous vous envoyons un e-mail avec un lien valable quelques minutes. Aucun mot de
                  passe à mémoriser.
                </div>
                <label style={{ display: 'grid', gap: 6 }}>
                  <span style={{ fontSize: 11, fontWeight: 900, letterSpacing: '0.08em', color: 'var(--color-text-muted)' }}>
                    E-MAIL
                  </span>
                  <input
                    type="email"
                    value={magicEmail}
                    onChange={(e) => {
                      setMagicEmail(e.target.value);
                      if (magicHint !== 'idle') setMagicHint('idle');
                    }}
                    placeholder="vous@exemple.com"
                    autoComplete="email"
                    className="fuel-input-compact"
                    style={{ padding: '0.75rem 0.85rem', fontSize: 14 }}
                  />
                </label>
                <button
                  type="submit"
                  disabled={magicHint === 'sending'}
                  className="fuel-btn-pill fuel-touch-btn"
                  style={{
                    justifyContent: 'center',
                    width: '100%',
                    borderRadius: 14,
                    padding: '0.85rem 1rem',
                    fontSize: 14,
                    fontWeight: 800,
                  }}
                >
                  Recevoir un lien magique
                </button>
                {magicHint === 'sent' && (
                  <div style={{ fontSize: 12, fontWeight: 800, color: 'var(--color-accent)' }}>
                    E-mail envoyé — ouvrez le lien reçu (vérifiez les indésirables).
                  </div>
                )}
                {magicHint === 'err' && (
                  <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--color-danger)' }}>
                    Envoi impossible. Réessayez plus tard.
                  </div>
                )}
              </form>
            </>
          )}

          {hasCredentials && (
            <>
              {(sortedOAuth.length > 0 || emailProviderId) && (
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,
                    color: 'var(--color-text-muted)',
                    fontSize: 11,
                    fontWeight: 800,
                    letterSpacing: '0.06em',
                  }}
                >
                  <span style={{ flex: 1, height: 1, background: 'var(--color-border)' }} />
                  E-MAIL ET MOT DE PASSE
                  <span style={{ flex: 1, height: 1, background: 'var(--color-border)' }} />
                </div>
              )}
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                <button
                  type="button"
                  className="fuel-btn-pill fuel-touch-btn"
                  style={{
                    padding: '0.45rem 0.75rem',
                    fontSize: 12,
                    fontWeight: 800,
                    borderRadius: 999,
                    opacity: pwdMode === 'signin' ? 1 : 0.55,
                  }}
                  onClick={() => {
                    setPwdMode('signin');
                    setPwdMsg(null);
                  }}
                >
                  Connexion
                </button>
                <button
                  type="button"
                  className="fuel-btn-pill fuel-touch-btn"
                  style={{
                    padding: '0.45rem 0.75rem',
                    fontSize: 12,
                    fontWeight: 800,
                    borderRadius: 999,
                    opacity: pwdMode === 'register' ? 1 : 0.55,
                  }}
                  onClick={() => {
                    setPwdMode('register');
                    setPwdMsg(null);
                  }}
                >
                  Créer un compte
                </button>
              </div>
              <form onSubmit={submitPassword} style={{ display: 'grid', gap: 10 }}>
                <label style={{ display: 'grid', gap: 6 }}>
                  <span style={{ fontSize: 11, fontWeight: 900, letterSpacing: '0.08em', color: 'var(--color-text-muted)' }}>
                    E-MAIL
                  </span>
                  <input
                    type="email"
                    value={pwdEmail}
                    onChange={(e) => setPwdEmail(e.target.value)}
                    autoComplete="email"
                    className="fuel-input-compact"
                    style={{ padding: '0.75rem 0.85rem', fontSize: 14 }}
                    required
                  />
                </label>
                <label style={{ display: 'grid', gap: 6 }}>
                  <span style={{ fontSize: 11, fontWeight: 900, letterSpacing: '0.08em', color: 'var(--color-text-muted)' }}>
                    MOT DE PASSE
                  </span>
                  <input
                    type="password"
                    value={pwdPassword}
                    onChange={(e) => setPwdPassword(e.target.value)}
                    autoComplete={pwdMode === 'register' ? 'new-password' : 'current-password'}
                    className="fuel-input-compact"
                    style={{ padding: '0.75rem 0.85rem', fontSize: 14 }}
                    required
                    minLength={pwdMode === 'register' ? 8 : undefined}
                  />
                </label>
                {pwdMode === 'register' && (
                  <label style={{ display: 'grid', gap: 6 }}>
                    <span style={{ fontSize: 11, fontWeight: 900, letterSpacing: '0.08em', color: 'var(--color-text-muted)' }}>
                      CONFIRMER
                    </span>
                    <input
                      type="password"
                      value={pwdConfirm}
                      onChange={(e) => setPwdConfirm(e.target.value)}
                      autoComplete="new-password"
                      className="fuel-input-compact"
                      style={{ padding: '0.75rem 0.85rem', fontSize: 14 }}
                      required
                      minLength={8}
                    />
                  </label>
                )}
                <button
                  type="submit"
                  disabled={pwdBusy}
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
                  {pwdMode === 'register' ? 'S’inscrire et se connecter' : 'Se connecter'}
                </button>
                {pwdMsg && (
                  <div
                    style={{
                      fontSize: 12,
                      fontWeight: 700,
                      color: pwdMsg.kind === 'ok' ? 'var(--color-accent)' : 'var(--color-danger)',
                    }}
                  >
                    {pwdMsg.text}
                  </div>
                )}
              </form>
            </>
          )}

          <div style={{ fontSize: 11, color: 'var(--color-text-muted)', lineHeight: 1.55, paddingTop: 2 }}>
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
