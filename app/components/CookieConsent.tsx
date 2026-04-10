'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';

type ConsentChoice = 'accepted_all' | 'rejected_optional' | 'custom';

type ConsentState = {
  choice: ConsentChoice;
  analytics: boolean;
  marketing: boolean;
  updatedAt: number;
  v: 1;
};

const COOKIE_NAME = 'fuelos_cookie_consent';
const STORAGE_KEY = 'fuelos_cookie_consent';

function readStoredConsent(): ConsentState | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed: unknown = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object') return null;
    const obj = parsed as Partial<ConsentState>;
    if (obj.v !== 1) return null;
    if (obj.choice !== 'accepted_all' && obj.choice !== 'rejected_optional' && obj.choice !== 'custom') return null;
    if (typeof obj.analytics !== 'boolean' || typeof obj.marketing !== 'boolean' || typeof obj.updatedAt !== 'number')
      return null;
    return obj as ConsentState;
  } catch {
    return null;
  }
}

function writeConsent(consent: ConsentState) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(consent));
  } catch {
    // ignore
  }
  try {
    const value = encodeURIComponent(JSON.stringify(consent));
    const maxAge = 365 * 24 * 60 * 60;
    document.cookie = `${COOKIE_NAME}=${value}; Max-Age=${maxAge}; Path=/; SameSite=Lax`;
  } catch {
    // ignore
  }
}

export function CookieConsent() {
  const [loaded, setLoaded] = useState(false);
  const [consent, setConsent] = useState<ConsentState | null>(null);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const c = readStoredConsent();
    void Promise.resolve().then(() => {
      setConsent(c);
      setLoaded(true);
    });
  }, []);

  const show = loaded && consent === null;

  const initialPrefs = useMemo(() => {
    if (consent) return { analytics: consent.analytics, marketing: consent.marketing };
    return { analytics: false, marketing: false };
  }, [consent]);

  const [draftAnalytics, setDraftAnalytics] = useState(initialPrefs.analytics);
  const [draftMarketing, setDraftMarketing] = useState(initialPrefs.marketing);

  useEffect(() => {
    void Promise.resolve().then(() => {
      setDraftAnalytics(initialPrefs.analytics);
      setDraftMarketing(initialPrefs.marketing);
    });
  }, [initialPrefs.analytics, initialPrefs.marketing]);

  if (!show && !open) return null;

  const acceptAll = () => {
    const next: ConsentState = {
      v: 1,
      choice: 'accepted_all',
      analytics: true,
      marketing: true,
      updatedAt: Date.now(),
    };
    writeConsent(next);
    setConsent(next);
    setOpen(false);
  };

  const rejectOptional = () => {
    const next: ConsentState = {
      v: 1,
      choice: 'rejected_optional',
      analytics: false,
      marketing: false,
      updatedAt: Date.now(),
    };
    writeConsent(next);
    setConsent(next);
    setOpen(false);
  };

  const saveCustom = () => {
    const next: ConsentState = {
      v: 1,
      choice: 'custom',
      analytics: draftAnalytics,
      marketing: draftMarketing,
      updatedAt: Date.now(),
    };
    writeConsent(next);
    setConsent(next);
    setOpen(false);
  };

  return (
    <>
      {show && (
        <div
          role="region"
          aria-label="Préférences cookies"
          style={{
            position: 'fixed',
            left: 0,
            right: 0,
            bottom: 0,
            zIndex: 70,
            padding: '12px max(12px, env(safe-area-inset-left, 0px)) max(12px, env(safe-area-inset-bottom, 0px)) max(12px, env(safe-area-inset-right, 0px))',
          }}
        >
          <div
            className="fuel-card"
            style={{
              maxWidth: 'min(980px, calc(100vw - 24px))',
              margin: '0 auto',
              padding: 14,
              display: 'grid',
              gap: 12,
              alignItems: 'center',
              gridTemplateColumns: '1fr',
              borderColor: 'color-mix(in srgb, var(--color-accent) 24%, var(--color-border))',
              background: 'color-mix(in srgb, var(--color-bg-card) 92%, var(--color-bg))',
              boxShadow: 'var(--shadow-md)',
            }}
          >
            <div style={{ minWidth: 0 }}>
              <div className="font-display" style={{ fontWeight: 800, fontSize: 14, marginBottom: 6 }}>
                Cookies
              </div>
              <p style={{ margin: 0, color: 'var(--color-text-muted)', fontSize: 13, lineHeight: 1.55 }}>
                On utilise des cookies essentiels au fonctionnement. Vous pouvez accepter ou refuser les cookies optionnels
                (mesure d&apos;audience, marketing).{' '}
                <Link href="/privacy" style={{ color: 'var(--color-accent)', fontWeight: 700 }}>
                  En savoir plus
                </Link>
                .
              </p>
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, justifyContent: 'flex-end' }}>
              <button type="button" className="fuel-btn-pill fuel-btn-pill-ghost" onClick={() => setOpen(true)}>
                Personnaliser
              </button>
              <button type="button" className="fuel-btn-pill" onClick={rejectOptional}>
                Refuser
              </button>
              <button type="button" className="fuel-btn-pill fuel-btn-pill-accent font-display" onClick={acceptAll}>
                Tout accepter
              </button>
            </div>
          </div>
        </div>
      )}

      {open && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Personnaliser les cookies"
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 75,
            background: 'rgba(0,0,0,0.45)',
            display: 'grid',
            placeItems: 'center',
            padding: 16,
          }}
          onClick={() => setOpen(false)}
        >
          <div
            className="fuel-card"
            style={{ width: 'min(560px, 100%)', padding: 18, boxShadow: 'var(--shadow-md)' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="font-display" style={{ fontWeight: 800, fontSize: 18, marginBottom: 6 }}>
              Préférences cookies
            </div>
            <p style={{ margin: '0 0 14px', color: 'var(--color-text-muted)', fontSize: 13, lineHeight: 1.55 }}>
              Les cookies essentiels sont toujours actifs. Les autres nous aident à améliorer l&apos;expérience.
            </p>

            <div style={{ display: 'grid', gap: 10, marginBottom: 16 }}>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  justifyContent: 'space-between',
                  gap: 12,
                  padding: 12,
                  borderRadius: 12,
                  border: '1px solid var(--color-border)',
                  background: 'color-mix(in srgb, var(--color-bg-card) 92%, var(--color-bg))',
                }}
              >
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontWeight: 800, fontSize: 13 }}>Essentiels</div>
                  <div style={{ color: 'var(--color-text-muted)', fontSize: 12, lineHeight: 1.5 }}>
                    Nécessaires au fonctionnement (session, sécurité).
                  </div>
                </div>
                <span style={{ fontSize: 12, fontWeight: 800, color: 'var(--color-text-muted)' }}>Toujours actif</span>
              </div>

              <label
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  justifyContent: 'space-between',
                  gap: 12,
                  padding: 12,
                  borderRadius: 12,
                  border: '1px solid var(--color-border)',
                  background: 'var(--color-bg-card)',
                  cursor: 'pointer',
                }}
              >
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontWeight: 800, fontSize: 13 }}>Mesure d&apos;audience</div>
                  <div style={{ color: 'var(--color-text-muted)', fontSize: 12, lineHeight: 1.5 }}>
                    Statistiques anonymisées pour comprendre l&apos;usage.
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={draftAnalytics}
                  onChange={(e) => setDraftAnalytics(e.target.checked)}
                  style={{ width: 18, height: 18, marginTop: 2 }}
                />
              </label>

              <label
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  justifyContent: 'space-between',
                  gap: 12,
                  padding: 12,
                  borderRadius: 12,
                  border: '1px solid var(--color-border)',
                  background: 'var(--color-bg-card)',
                  cursor: 'pointer',
                }}
              >
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontWeight: 800, fontSize: 13 }}>Marketing</div>
                  <div style={{ color: 'var(--color-text-muted)', fontSize: 12, lineHeight: 1.5 }}>
                    Personnalisation et campagnes (optionnel).
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={draftMarketing}
                  onChange={(e) => setDraftMarketing(e.target.checked)}
                  style={{ width: 18, height: 18, marginTop: 2 }}
                />
              </label>
            </div>

            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, justifyContent: 'flex-end' }}>
              <button type="button" className="fuel-btn-pill fuel-btn-pill-ghost" onClick={() => setOpen(false)}>
                Annuler
              </button>
              <button type="button" className="fuel-btn-pill" onClick={rejectOptional}>
                Tout refuser
              </button>
              <button type="button" className="fuel-btn-pill fuel-btn-pill-accent font-display" onClick={saveCustom}>
                Enregistrer
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

