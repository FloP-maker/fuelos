'use client';

import { signIn, signOut, useSession } from 'next-auth/react';
import Link from 'next/link';
import type { CSSProperties } from 'react';
import { useCallback, useEffect, useState } from 'react';

type ProviderEntry = {
  id: string;
  name: string;
  type: string;
  signinUrl: string;
  callbackUrl: string;
};

const muted: CSSProperties = {
  fontSize: 12,
  color: 'var(--color-text-muted)',
};

function hintFromAuthMessage(message: string | null): string | null {
  if (!message) return null;
  const lower = message.toLowerCase();
  // Auth.js renvoie souvent un message générique ; la cause la plus fréquente est AUTH_SECRET absent
  if (lower.includes('configuration') || lower.includes('secret')) {
    return [
      'Auth.js : configuration serveur invalide (souvent AUTH_SECRET / NEXTAUTH_SECRET).',
      '• Vercel : Project → Settings → Environment Variables — renseignez AUTH_SECRET pour Production et Preview, puis Redeploy.',
      '• Local : .env avec AUTH_SECRET=… (openssl rand -base64 32).',
      '• Test next start sans .env : AUTH_INSECURE_LOCAL_FALLBACK=true (jamais en prod publique).',
      '• Page diagnostic : /debug/auth',
    ].join(' ');
  }
  return message;
}

export function AuthMenu() {
  const { data: session, status } = useSession();
  const [providerMap, setProviderMap] = useState<Record<string, ProviderEntry> | undefined>(
    undefined
  );
  const [providersFetchFailed, setProvidersFetchFailed] = useState(false);
  const [fetchDetail, setFetchDetail] = useState<string | null>(null);
  const [email, setEmail] = useState('');
  const [emailHint, setEmailHint] = useState<'idle' | 'sending' | 'sent' | 'err'>('idle');

  const loadProviders = useCallback(() => {
    setProviderMap(undefined);
    setProvidersFetchFailed(false);
    setFetchDetail(null);
    void (async () => {
      try {
        const res = await fetch('/api/auth/providers', {
          credentials: 'include',
          headers: { Accept: 'application/json' },
        });
        const data: unknown = await res.json().catch(() => null);
        if (!res.ok) {
          const rawMsg =
            data &&
            typeof data === 'object' &&
            data !== null &&
            'message' in data &&
            typeof (data as { message: unknown }).message === 'string'
              ? (data as { message: string }).message
              : null;
          setProviderMap({});
          setProvidersFetchFailed(true);
          setFetchDetail(hintFromAuthMessage(rawMsg) ?? `Erreur HTTP ${res.status}`);
          return;
        }
        if (data && typeof data === 'object' && !Array.isArray(data)) {
          setProviderMap(data as Record<string, ProviderEntry>);
          return;
        }
        setProviderMap({});
        setProvidersFetchFailed(true);
        setFetchDetail('Réponse inattendue du serveur d’authentification.');
      } catch {
        setProviderMap({});
        setProvidersFetchFailed(true);
        setFetchDetail('Réseau indisponible ou réponse non JSON.');
      }
    })();
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
      <div className="flex flex-wrap items-center justify-end gap-2 sm:gap-2.5">
        <span
          style={{
            ...muted,
            maxWidth: 140,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
          title={session.user.email ?? undefined}
        >
          {label}
        </span>
        <button type="button" className="fuel-btn-pill max-w-[200px] truncate" onClick={() => void signOut()}>
          Déconnexion
        </button>
      </div>
    );
  }

  if (providersFetchFailed) {
    return (
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'flex-end',
          gap: 8,
          maxWidth: 340,
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            flexWrap: 'wrap',
            justifyContent: 'flex-end',
          }}
        >
          <span style={{ ...muted, textAlign: 'right' }}>Connexion — chargement impossible</span>
          <button type="button" className="fuel-btn-pill fuel-btn-pill-accent" onClick={() => loadProviders()}>
            Réessayer
          </button>
        </div>
        {fetchDetail && (
          <span style={{ fontSize: 11, color: 'var(--color-danger)', textAlign: 'right', lineHeight: 1.45 }}>
            {fetchDetail}
          </span>
        )}
        <span style={{ fontSize: 11, color: 'var(--color-text-muted)', textAlign: 'right', lineHeight: 1.45 }}>
          Si vous aviez une ancienne version du site : désinscrivez le service worker (DevTools → Application), puis
          rechargez la page.
        </span>
      </div>
    );
  }

  const ids = Object.keys(providerMap);
  if (ids.length === 0) {
    return (
      <span style={{ ...muted, maxWidth: 320, textAlign: 'right', lineHeight: 1.45 }}>
        Connexion indisponible —{' '}
        <Link href="/debug/auth" style={{ color: 'var(--color-accent)', fontWeight: 600 }} prefetch={false}>
          diagnostic
        </Link>{' '}
        · configurez Google ou Resend côté serveur.
      </span>
    );
  }

  /** Google est enregistré comme `oidc`, pas `oauth` — les deux doivent afficher un bouton. */
  const oauthIds = ids.filter((id) => {
    const t = providerMap[id].type;
    return t === 'oauth' || t === 'oidc';
  });
  const emailProviderId = ids.find((id) => providerMap[id].type === 'email');

  return (
    <div className="flex flex-wrap items-center justify-end gap-2 sm:gap-2.5">
      {oauthIds.map((id) => (
        <button
          key={id}
          type="button"
          className="fuel-btn-pill fuel-btn-pill-accent max-w-[200px] truncate"
          title={id === 'google' ? 'Connexion avec Google' : undefined}
          aria-label={id === 'google' ? 'Connexion avec Google' : undefined}
          onClick={() => void signIn(id)}
        >
          {id === 'google' ? 'Google' : providerMap[id].name}
        </button>
      ))}
      {emailProviderId && (
        <form
          className="flex flex-wrap items-center gap-2"
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
            className="fuel-input-compact w-[168px] max-w-[46vw] sm:w-[180px]"
          />
          <button type="submit" disabled={emailHint === 'sending'} className="fuel-btn-pill fuel-btn-pill-accent">
            Lien magique
          </button>
        </form>
      )}
      {emailHint === 'sent' && (
        <span
          className="w-full text-right text-xs font-semibold sm:text-[13px]"
          style={{ color: 'var(--color-accent)' }}
        >
          E-mail envoyé — ouvrez le lien reçu.
        </span>
      )}
      {emailHint === 'err' && (
        <span
          className="w-full text-right text-xs font-medium sm:text-[13px]"
          style={{ color: 'var(--color-danger)' }}
        >
          Envoi impossible. Réessayez plus tard.
        </span>
      )}
    </div>
  );
}
