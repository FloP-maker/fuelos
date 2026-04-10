"use client";

import { useEffect, useMemo, useState } from "react";

import { ActivityPicker } from "@/app/components/integrations/ActivityPicker";
import { GPXUpload } from "@/app/components/integrations/GPXUpload";

type ProviderCard = {
  provider: "strava" | "garmin" | "wahoo";
  connected: boolean;
  needsReconnect: boolean;
  athleteName: string | null;
  lastSyncAt: string | null;
};

export default function IntegrationsPage() {
  const [providers, setProviders] = useState<ProviderCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedProvider, setSelectedProvider] = useState<ProviderCard["provider"] | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  async function refresh() {
    setLoading(true);
    const res = await fetch("/api/integrations/providers");
    const json = (await res.json()) as { providers: ProviderCard[] };
    setProviders(json.providers ?? []);
    setLoading(false);
  }

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void refresh();
    }, 0);
    return () => window.clearTimeout(timer);
  }, []);

  const connectedProviders = useMemo(() => providers.filter((p) => p.connected), [providers]);

  return (
    <main className="mx-auto w-full max-w-md space-y-4 px-4 py-5">
      <h1 className="text-lg font-semibold">Connexions providers</h1>
      <p className="text-sm text-zinc-500">Connecte Strava, Garmin ou Wahoo pour enrichir tes rapports nutrition.</p>
      {message && <p className="rounded-lg bg-emerald-50 px-3 py-2 text-xs text-emerald-700">{message}</p>}
      {loading ? (
        <div className="space-y-2">
          <div className="h-20 animate-pulse rounded-xl bg-zinc-100 dark:bg-zinc-800" />
          <div className="h-20 animate-pulse rounded-xl bg-zinc-100 dark:bg-zinc-800" />
          <div className="h-20 animate-pulse rounded-xl bg-zinc-100 dark:bg-zinc-800" />
        </div>
      ) : (
        providers.map((p) => (
          <section key={p.provider} className="rounded-xl border border-zinc-200 p-4 dark:border-zinc-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold capitalize">{p.provider}</p>
                <p className={`text-xs ${p.connected ? "text-emerald-600" : p.needsReconnect ? "text-red-500" : "text-zinc-500"}`}>
                  {p.connected
                    ? `Connecté${p.lastSyncAt ? ` - sync ${new Date(p.lastSyncAt).toLocaleTimeString()}` : ""}`
                    : p.needsReconnect
                      ? "Reconnexion requise"
                      : "Non connecté"}
                </p>
                {p.athleteName && <p className="text-xs text-zinc-500">{p.athleteName}</p>}
              </div>
              <div className="flex gap-2">
                {!p.connected ? (
                  <button
                    type="button"
                    onClick={() => window.location.assign(`/api/integrations/${p.provider}/connect`)}
                    className="rounded-md bg-orange-500 px-3 py-2 text-xs text-white"
                  >
                    {p.needsReconnect ? "Reconnecter" : "Connecter"}
                  </button>
                ) : (
                  <>
                    <button
                      type="button"
                      onClick={() => setSelectedProvider(p.provider)}
                      className="rounded-md bg-zinc-900 px-3 py-2 text-xs text-white dark:bg-white dark:text-zinc-900"
                    >
                      Voir mes activités
                    </button>
                    <button
                      type="button"
                      onClick={async () => {
                        if (!window.confirm(`Déconnecter ${p.provider} ?`)) return;
                        await fetch(`/api/integrations/${p.provider}/disconnect`, { method: "POST" });
                        await refresh();
                      }}
                      className="rounded-md border border-zinc-300 px-3 py-2 text-xs text-zinc-600 dark:border-zinc-600 dark:text-zinc-300"
                    >
                      Déconnecter
                    </button>
                  </>
                )}
              </div>
            </div>
          </section>
        ))
      )}

      {selectedProvider && (
        <ActivityPicker
          provider={selectedProvider}
          onImported={(payload) => {
            const detail = payload as { detail?: { elevationGainM?: number }; gpxTrack?: { totalElevationGainM?: number } };
            if (detail.detail && detail.gpxTrack) {
              const planned = detail.detail.elevationGainM ?? 0;
              const real = detail.gpxTrack.totalElevationGainM ?? planned;
              const delta = planned > 0 ? Math.round(((real - planned) / planned) * 100) : 0;
              setMessage(`Activité importée. Le D+ réel est ${Math.abs(delta)}% ${delta >= 0 ? "supérieur" : "inférieur"} à l'estimation.`);
            } else {
              setMessage("Activité importée avec succès.");
            }
          }}
        />
      )}

      {connectedProviders.length === 0 && (
        <GPXUpload onUseProfile={() => setMessage("Profil GPX appliqué. Tu peux maintenant recalculer ton plan.")} />
      )}
    </main>
  );
}
