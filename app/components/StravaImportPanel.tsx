'use client';

import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { useCallback, useEffect, useState, type CSSProperties } from 'react';

import type { EventDetails } from '@/app/lib/types';

import type { StravaActivityPayload } from '@/lib/strava/mapActivity';
import { stravaActivityToEventPatch } from '@/lib/strava/mapActivity';

type Status = {
  configured: boolean;
  connected: boolean;
  athleteId: string | null;
};

export function StravaImportPanel({
  weather,
  onApply,
  stravaQuery,
}: {
  weather: string;
  onApply: (patch: Partial<EventDetails>) => void;
  /** Valeur du query param `strava` après retour OAuth (`connected`, `denied`, …). */
  stravaQuery: string | null;
}) {
  const { status } = useSession();
  const router = useRouter();
  const [st, setSt] = useState<Status | null>(null);
  const [activities, setActivities] = useState<StravaActivityPayload[]>([]);
  const [loadingList, setLoadingList] = useState(false);
  const [importingId, setImportingId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [banner, setBanner] = useState<string | null>(null);

  const loadStatus = useCallback(async () => {
    const res = await fetch('/api/integrations/strava/status', { credentials: 'include' });
    if (!res.ok) {
      setSt({ configured: false, connected: false, athleteId: null });
      return;
    }
    setSt((await res.json()) as Status);
  }, []);

  useEffect(() => {
    void loadStatus();
  }, [loadStatus]);

  useEffect(() => {
    const s = stravaQuery;
    if (s === 'connected') {
      setBanner('Strava est connecté — sélectionne une activité ci-dessous pour préremplir distance, D+ et temps.');
      void loadStatus();
      router.replace('/plan?step=event', { scroll: false });
    } else if (s === 'denied') {
      setBanner('Connexion Strava annulée.');
      router.replace('/plan?step=event', { scroll: false });
    } else if (s === 'error' || s === 'badstate' || s === 'token_error') {
      setBanner('Connexion Strava impossible. Vérifie les clés API et l’URL de redirection dans le portail Strava.');
      router.replace('/plan?step=event', { scroll: false });
    }
  }, [stravaQuery, router, loadStatus]);

  const loadActivities = useCallback(async () => {
    setLoadingList(true);
    setError(null);
    try {
      const res = await fetch('/api/integrations/strava/activities?per_page=25', {
        credentials: 'include',
      });
      const data = (await res.json()) as { activities?: StravaActivityPayload[]; error?: string };
      if (!res.ok) {
        setError(data.error ?? 'Liste indisponible');
        setActivities([]);
        return;
      }
      setActivities(data.activities ?? []);
    } catch {
      setError('Réseau indisponible');
      setActivities([]);
    } finally {
      setLoadingList(false);
    }
  }, []);

  useEffect(() => {
    if (st?.connected) void loadActivities();
  }, [st?.connected, loadActivities]);

  const importActivity = async (id: number) => {
    setImportingId(id);
    setError(null);
    try {
      const res = await fetch(`/api/integrations/strava/activities/${id}`, {
        credentials: 'include',
      });
      const data = (await res.json()) as { activity?: StravaActivityPayload; error?: string };
      if (!res.ok || !data.activity) {
        setError(data.error ?? 'Import impossible');
        return;
      }
      const patch = stravaActivityToEventPatch(data.activity, { weather });
      onApply(patch);
      setBanner(
        `Importé : « ${data.activity.name} » — vérifie le temps cible et la météo, puis lance le calcul.`
      );
    } catch {
      setError('Import impossible');
    } finally {
      setImportingId(null);
    }
  };

  const disconnect = async () => {
    await fetch('/api/integrations/strava/disconnect', { method: 'POST', credentials: 'include' });
    setActivities([]);
    void loadStatus();
    setBanner(null);
  };

  if (status === 'loading') {
    return null;
  }

  if (status === 'unauthenticated') {
    return (
      <div
        style={{
          ...cardShell,
          marginBottom: 20,
        }}
      >
        <div style={{ fontWeight: 800, fontSize: 14, marginBottom: 8 }}>Strava</div>
        <p style={{ fontSize: 13, color: 'var(--color-text-muted)', margin: 0, lineHeight: 1.5 }}>
          Connecte-toi (Google ou e-mail) pour lier ton compte Strava et importer une activité passée (distance, D+,
          temps, FC).
        </p>
      </div>
    );
  }

  if (st && !st.configured) {
    return (
      <div style={{ ...cardShell, marginBottom: 20 }}>
        <div style={{ fontWeight: 800, fontSize: 14, marginBottom: 8 }}>Strava</div>
        <p style={{ fontSize: 13, color: 'var(--color-text-muted)', margin: 0, lineHeight: 1.5 }}>
          Intégration non configurée côté serveur. Renseigne{' '}
          <code style={{ fontSize: 12 }}>STRAVA_CLIENT_ID</code> et{' '}
          <code style={{ fontSize: 12 }}>STRAVA_CLIENT_SECRET</code> (voir portail développeur Strava).
        </p>
      </div>
    );
  }

  return (
    <div style={{ ...cardShell, marginBottom: 20 }}>
      <div style={{ fontWeight: 800, fontSize: 14, marginBottom: 6, display: 'flex', alignItems: 'center', gap: 8 }}>
        <span aria-hidden>🟠</span> Strava
      </div>
      <p style={{ fontSize: 13, color: 'var(--color-text-muted)', margin: '0 0 14px', lineHeight: 1.5 }}>
        Importe une activité récente pour préremplir <strong>distance</strong>, <strong>D+</strong>,{' '}
        <strong>temps de déplacement</strong> et, si disponible, les <strong>FC moyenne / max</strong>.
      </p>

      {banner && (
        <div
          style={{
            fontSize: 13,
            padding: '10px 12px',
            borderRadius: 10,
            marginBottom: 12,
            background: 'color-mix(in srgb, var(--color-accent) 9%, var(--color-bg-card))',
            border: '1px solid color-mix(in srgb, var(--color-accent) 22%, var(--color-border))',
            color: 'var(--color-text)',
          }}
        >
          {banner}
        </div>
      )}

      {!st?.connected ? (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, alignItems: 'center' }}>
          <a
            href="/api/integrations/strava/connect"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '10px 16px',
              borderRadius: 10,
              background: 'var(--color-accent)',
              color: '#052e14',
              fontWeight: 800,
              fontSize: 14,
              textDecoration: 'none',
              border: '1px solid color-mix(in srgb, var(--color-accent) 70%, #0d3d24)',
            }}
          >
            Connecter Strava
          </a>
          <span style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>
            Accès en lecture aux activités (privées incluses avec « activity:read_all »).
          </span>
        </div>
      ) : (
        <>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, alignItems: 'center', marginBottom: 12 }}>
            <button
              type="button"
              onClick={() => void loadActivities()}
              disabled={loadingList}
              style={{
                padding: '8px 14px',
                borderRadius: 8,
                border: '1px solid var(--color-border)',
                background: 'var(--color-bg)',
                color: 'var(--color-text)',
                fontWeight: 600,
                fontSize: 13,
                cursor: loadingList ? 'wait' : 'pointer',
              }}
            >
              {loadingList ? 'Chargement…' : 'Rafraîchir la liste'}
            </button>
            <button
              type="button"
              onClick={() => void disconnect()}
              style={{
                padding: '8px 14px',
                borderRadius: 8,
                border: '1px solid var(--color-border)',
                background: 'transparent',
                color: 'var(--color-text-muted)',
                fontWeight: 600,
                fontSize: 13,
                cursor: 'pointer',
              }}
            >
              Déconnecter Strava
            </button>
            <span style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>
              Athlète Strava #{st.athleteId ?? '—'}
            </span>
          </div>

          {error && (
            <p style={{ fontSize: 13, color: 'var(--color-danger)', margin: '0 0 10px' }}>{error}</p>
          )}

          {activities.length === 0 && !loadingList ? (
            <p style={{ fontSize: 13, color: 'var(--color-text-muted)', margin: 0 }}>Aucune activité récente.</p>
          ) : (
            <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column', gap: 8 }}>
              {activities.map((a) => {
                const km = (a.distance / 1000).toFixed(1);
                const tMin = Math.round((a.moving_time ?? 0) / 60);
                const dPlus = Math.round(a.total_elevation_gain ?? 0);
                return (
                  <li
                    key={a.id}
                    style={{
                      display: 'flex',
                      flexWrap: 'wrap',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: 10,
                      padding: '10px 12px',
                      borderRadius: 10,
                      border: '1px solid var(--color-border)',
                      background: 'var(--color-bg)',
                    }}
                  >
                    <div style={{ minWidth: 0, flex: '1 1 200px' }}>
                      <div style={{ fontWeight: 700, fontSize: 14, lineHeight: 1.3 }}>{a.name}</div>
                      <div style={{ fontSize: 12, color: 'var(--color-text-muted)', marginTop: 4 }}>
                        {new Date(a.start_date).toLocaleString('fr-FR', { dateStyle: 'short', timeStyle: 'short' })} ·{' '}
                        {km} km · {dPlus} m D+ · {tMin} min · {a.type}
                        {a.average_heartrate != null ? ` · FC ${Math.round(a.average_heartrate)}` : ''}
                      </div>
                    </div>
                    <button
                      type="button"
                      disabled={importingId === a.id}
                      onClick={() => void importActivity(a.id)}
                      style={{
                        padding: '8px 14px',
                        borderRadius: 8,
                        border: '1px solid var(--color-accent)',
                        background: 'color-mix(in srgb, var(--color-accent) 12%, transparent)',
                        color: 'var(--color-accent)',
                        fontWeight: 700,
                        fontSize: 13,
                        cursor: importingId === a.id ? 'wait' : 'pointer',
                        flexShrink: 0,
                      }}
                    >
                      {importingId === a.id ? '…' : 'Importer'}
                    </button>
                  </li>
                );
              })}
            </ul>
          )}

          <p style={{ fontSize: 11, color: 'var(--color-text-muted)', margin: '14px 0 0', lineHeight: 1.45 }}>
            Les données Strava complètent ton parcours ; tu peux toujours ajuster manuellement ou charger un GPX plus
            bas pour la carte. Consulte la{' '}
            <a
              href="https://www.strava.com/legal/api"
              target="_blank"
              rel="noreferrer"
              style={{ color: 'var(--color-accent)' }}
            >
              politique API Strava
            </a>
            .
          </p>
        </>
      )}
    </div>
  );
}

const cardShell: CSSProperties = {
  background: 'var(--color-bg-card)',
  border: '1px solid var(--color-border)',
  borderRadius: 'var(--radius-lg)',
  boxShadow: 'var(--shadow-xs)',
  padding: 18,
};
