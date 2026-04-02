'use client';

import { signIn, signOut, useSession } from 'next-auth/react';
import type { CSSProperties } from 'react';

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

  if (status === 'loading') {
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

  return (
    <button
      type="button"
      style={{ ...btn, borderColor: 'var(--color-accent)', color: 'var(--color-accent)' }}
      onClick={() => void signIn('google')}
    >
      Connexion Google
    </button>
  );
}
