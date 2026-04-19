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

  const buildCallbackUrl = useCallback(() => {
    if (typeof window === 'undefined') return '/mes-plans-courses';
    return `${window.location.origin}/mes-plans-courses`;
  }, []);

  const forceProviderRedirect = useCallback(
    (providerId: string) => {
      if (typeof window === 'undefined') return;
      const callbackUrl = encodeURIComponent(buildCallbackUrl());
      window.location.assign(`/api/auth/signin/${providerId}?callbackUrl=${callbackUrl}`);
    },
    [buildCallbackUrl]
  );

  const handleProviderSignIn = useCallback(
    async (providerId: string) => {
      try {
        const callbackUrl = buildCallbackUrl();
        const fallbackTimer = window.setTimeout(() => {
          forceProviderRedirect(providerId);
        }, 1200);
        await signIn(providerId, { callbackUrl, redirect: true });
        window.clearTimeout(fallbackTimer);
      } catch {
        forceProviderRedirect(providerId);
      }
    },
    [buildCallbackUrl, forceProviderRedirect]
  );

  if (status === 'loading' || providerMap === undefined) {
    return (
      <span style={{ fontSize: 13, color: 'var(--color-text-muted)' }} aria-live="polite">
        Compte…
      </span>
    );
  }

  if (session?.user) {
    return (
      <div className="flex flex-wrap items-center justify-end gap-2 sm:gap-3">
        <button
          type="button"
          className="fuel-landing-v2__login-btn shrink-0"
          aria-label="Déconnexion"
          onClick={() => void signOut()}
        >
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
          <span style={{ ...muted, textAlign: 'right' }}>Se connecter — chargement impossible</span>
          <button type="button" className="fuel-header-text-btn shrink-0" onClick={() => loadProviders()}>
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
        Se connecter indisponible —{' '}
        <Link href="/debug/auth" style={{ color: 'var(--color-accent)', fontWeight: 600 }} prefetch={false}>
          diagnostic
        </Link>{' '}
        · configurez Google côté serveur.
      </span>
    );
  }

  /** Google est enregistré comme `oidc`, pas `oauth` — les deux sont valides ici. */
  const oauthIds = ids.filter((id) => {
    const t = providerMap[id].type;
    return t === 'oauth' || t === 'oidc';
  });
  const preferredProviderId = oauthIds.find((id) => id === 'google') ?? oauthIds[0] ?? null;

  return (
    <div className="flex flex-wrap items-center justify-end gap-2 sm:gap-3">
      {preferredProviderId && (
        <button
          type="button"
          className="fuel-landing-v2__login-btn shrink-0"
          title="Connexion pour activer la synchronisation cloud (plans, profils, historique)"
          aria-label="Connexion compte utilisateur"
          onClick={() => void handleProviderSignIn(preferredProviderId)}
        >
          Connexion
        </button>
      )}
    </div>
  );
}
