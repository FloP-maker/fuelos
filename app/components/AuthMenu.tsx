'use client';

import { getProviders, signIn, signOut, useSession } from 'next-auth/react';
import type { CSSProperties } from 'react';
import { useCallback, useEffect, useState } from 'react';

type ProviderEntry = NonNullable<Awaited<ReturnType<typeof getProviders>>>[string];

const btn: CSSProperties = {
  padding: '8px 14px',
  borderRadius: 8,
  fontSize: 13,
  fontWeight: 600,
  border: '1px solid var(--color-border)',
  background: 'var(--color-bg-card)',
  color: 'var(--color-text)',
  cursor: 'pointer',
  maxWidth: 200,
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
};

export function AuthMenu() {
  const { data: session, status } = useSession();
  const [providerMap, setProviderMap] = useState<Record<string, ProviderEntry> | undefined>(
    undefined
  );
  const [providersFetchFailed, setProvidersFetchFailed] = useState(false);
  const [email, setEmail] = useState('');
  const [emailHint, setEmailHint] = useState<'idle' | 'sending' | 'sent' | 'err'>('idle');

  const loadProviders = useCallback(() => {
    setProviderMap(undefined);
    setProvidersFetchFailed(false);
    void getProviders().then((p) => {
      if (p === null) {
        setProviderMap({});
        setProvidersFetchFailed(true);
        return;
      }
      setProviderMap(p);
    });
  }, []);

  useEffect(() => {
    loadProviders();
  }, [loadProviders]);

  if (status === 'loading' || providerMap === undefined) {
    return (
      <span style={{ fontSize: 13, color: 'var(--color-text-muted)' }} aria-live="polite">
        Compte…
      </span>
    );
  }

  if (session?.user) {
    const label = session.user.name || session.user.email || 'Compte';
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <span
          style={{
            fontSize: 12,
            color: 'var(--color-text-muted)',
            maxWidth: 140,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
          title={session.user.email ?? undefined}
        >
          {label}
        </span>
        <button type="button" style={btn} onClick={() => void signOut()}>
          Déconnexion
        </button>
      </div>
    );
  }

  if (providersFetchFailed) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
        <span style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>Connexion — chargement impossible</span>
        <button type="button" style={{ ...btn, borderColor: 'var(--color-accent)', color: 'var(--color-accent)' }} onClick={() => loadProviders()}>
          Réessayer
        </button>
      </div>
    );
  }

  const ids = Object.keys(providerMap);
  if (ids.length === 0) {
    return (
      <span
        style={{ fontSize: 12, color: 'var(--color-text-muted)', maxWidth: 280 }}
        title="Définissez au moins Google (AUTH_GOOGLE_ID + AUTH_GOOGLE_SECRET ou GOOGLE_CLIENT_ID + GOOGLE_CLIENT_SECRET) ou Resend (AUTH_RESEND_KEY ou RESEND_API_KEY), plus AUTH_SECRET."
      >
        Connexion indisponible (voir .env)
      </span>
    );
  }

  const oauthIds = ids.filter((id) => providerMap[id].type === 'oauth');
  const emailProviderId = ids.find((id) => providerMap[id].type === 'email');

  return (
    <div
      style={{
        display: 'flex',
        flexWrap: 'wrap',
        alignItems: 'center',
        gap: 8,
        justifyContent: 'flex-end',
      }}
    >
      {oauthIds.map((id) => (
        <button
          key={id}
          type="button"
          style={{ ...btn, borderColor: 'var(--color-accent)', color: 'var(--color-accent)' }}
          onClick={() => void signIn(id)}
        >
          {id === 'google' ? 'Connexion Google' : providerMap[id].name}
        </button>
      ))}
      {emailProviderId && (
        <form
          style={{ display: 'flex', flexWrap: 'wrap', gap: 6, alignItems: 'center' }}
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
        >
          <input
            type="email"
            name="emailInput"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              if (emailHint !== 'idle') setEmailHint('idle');
            }}
            placeholder="E-mail"
            autoComplete="email"
            style={{
              padding: '8px 10px',
              borderRadius: 8,
              border: '1px solid var(--color-border)',
              background: 'var(--color-bg)',
              color: 'var(--color-text)',
              fontSize: 13,
              width: 168,
              maxWidth: '46vw',
            }}
          />
          <button
            type="submit"
            disabled={emailHint === 'sending'}
            style={{ ...btn, borderColor: 'var(--color-accent)', color: 'var(--color-accent)' }}
          >
            Lien magique
          </button>
        </form>
      )}
      {emailHint === 'sent' && (
        <span style={{ fontSize: 12, color: 'var(--color-accent)', flexBasis: '100%', textAlign: 'right' }}>
          E-mail envoyé — ouvrez le lien reçu.
        </span>
      )}
      {emailHint === 'err' && (
        <span style={{ fontSize: 12, color: '#f87171', flexBasis: '100%', textAlign: 'right' }}>
          Envoi impossible. Réessayez plus tard.
        </span>
      )}
    </div>
  );
}
