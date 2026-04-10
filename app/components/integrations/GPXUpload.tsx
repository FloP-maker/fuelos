"use client";

import { useMemo, useState } from "react";

import { analyzeElevationProfile, parseGPXFile } from "@/lib/integrations/gpx";

type Props = {
  onUseProfile: (profile: ReturnType<typeof analyzeElevationProfile>) => void;
};

export function GPXUpload({ onUseProfile }: Props) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [analysis, setAnalysis] = useState<ReturnType<typeof analyzeElevationProfile> | null>(null);

  async function handleFile(file: File) {
    setLoading(true);
    setError(null);
    try {
      const text = await file.text();
      const track = parseGPXFile(text);
      const next = analyzeElevationProfile(track);
      setAnalysis(next);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Impossible de parser le GPX");
    } finally {
      setLoading(false);
    }
  }

  const preview = useMemo(() => {
    if (!analysis) return null;
    const max = Math.max(...analysis.segmentChoMultipliers, 1);
    return analysis.segmentChoMultipliers.map((v, idx) => ({
      idx,
      height: Math.max(12, Math.round((v / max) * 60)),
    }));
  }, [analysis]);

  return (
    <div className="space-y-3 rounded-xl border border-zinc-200 p-4 dark:border-zinc-700">
      <p className="text-sm font-semibold">GPX Upload (fallback)</p>
      <label className="flex cursor-pointer items-center justify-center rounded-lg border border-dashed border-zinc-300 p-6 text-sm text-zinc-500 dark:border-zinc-600">
        {loading ? "Parsing en cours..." : "Dépose un fichier GPX ou clique ici"}
        <input
          type="file"
          accept=".gpx,application/gpx+xml"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) void handleFile(file);
          }}
        />
      </label>
      {error && <p className="text-xs text-red-500">{error}</p>}
      {analysis && (
        <div className="space-y-3">
          <p className="text-xs text-zinc-500">
            D+ {Math.round(analysis.totalClimbingM)}m - D- {Math.round(analysis.totalDescendingM)}m - km le plus dur:{" "}
            {analysis.hardestKm}
          </p>
          <div className="flex items-end gap-1 rounded-md bg-zinc-50 p-2 dark:bg-zinc-900">
            {preview?.map((bar) => (
              <div key={bar.idx} className="w-2 rounded-sm bg-orange-500" style={{ height: `${bar.height}px` }} />
            ))}
          </div>
          <button
            type="button"
            onClick={() => onUseProfile(analysis)}
            className="rounded-md bg-orange-500 px-3 py-2 text-xs font-medium text-white"
          >
            Utiliser ce profil pour affiner mon plan
          </button>
        </div>
      )}
    </div>
  );
}
