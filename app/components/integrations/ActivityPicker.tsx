"use client";

import { useMemo, useState } from "react";

import type { ActivitySummary } from "@/types/integrations";

type Props = {
  provider: "strava" | "garmin" | "wahoo";
  onImported: (payload: unknown) => void;
};

export function ActivityPicker({ provider, onImported }: Props) {
  const [activities, setActivities] = useState<ActivitySummary[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sportFilter, setSportFilter] = useState("all");
  const [importingId, setImportingId] = useState<string | null>(null);

  async function loadActivities() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/integrations/${provider}/activities?limit=20`);
      const json = (await res.json()) as { activities?: ActivitySummary[]; error?: string };
      if (!res.ok) throw new Error(json.error ?? "Fetch error");
      setActivities(json.activities ?? []);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur inconnue");
    } finally {
      setLoading(false);
    }
  }

  async function importActivity(activityId: string) {
    setImportingId(activityId);
    setError(null);
    try {
      const res = await fetch(`/api/integrations/${provider}/import`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ activityId }),
      });
      const json = (await res.json()) as Record<string, unknown>;
      if (!res.ok) throw new Error((json.error as string) ?? "Import error");
      onImported(json);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur inconnue");
    } finally {
      setImportingId(null);
    }
  }

  const sports = useMemo(() => ["all", ...Array.from(new Set(activities.map((a) => a.sport)))], [activities]);
  const filtered = sportFilter === "all" ? activities : activities.filter((a) => a.sport === sportFilter);

  return (
    <div className="space-y-3 rounded-xl border border-zinc-200 p-4 dark:border-zinc-700">
      <div className="flex items-center justify-between gap-2">
        <p className="text-sm font-semibold">Activity Picker</p>
        <button
          type="button"
          onClick={() => void loadActivities()}
          className="rounded-md bg-zinc-900 px-3 py-2 text-xs text-white disabled:opacity-50 dark:bg-white dark:text-zinc-900"
          disabled={loading}
        >
          {loading ? "Chargement..." : "Voir mes activités"}
        </button>
      </div>
      <div className="flex gap-2 overflow-x-auto">
        {sports.map((sport) => (
          <button
            key={sport}
            type="button"
            onClick={() => setSportFilter(sport)}
            className={`rounded-full px-3 py-1 text-xs ${sportFilter === sport ? "bg-orange-500 text-white" : "bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-200"}`}
          >
            {sport}
          </button>
        ))}
      </div>
      {error && <p className="text-xs text-red-500">{error}</p>}
      <div className="space-y-2">
        {filtered.map((activity) => (
          <div key={activity.id} className="flex items-center justify-between rounded-lg border border-zinc-200 p-3 dark:border-zinc-700">
            <div>
              <p className="text-sm font-medium">{activity.name}</p>
              <p className="text-xs text-zinc-500">
                {new Date(activity.startDate).toLocaleDateString()} - {activity.distanceKm.toFixed(1)} km -{" "}
                {Math.round(activity.durationMin)} min
              </p>
            </div>
            <button
              type="button"
              disabled={importingId === activity.id}
              onClick={() => void importActivity(activity.id)}
              className="rounded-md bg-orange-500 px-3 py-2 text-xs font-medium text-white disabled:opacity-50"
            >
              {importingId === activity.id ? "Import..." : "Importer cette activité"}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
