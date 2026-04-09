"use client";

import { useCallback, useState, type Dispatch, type SetStateAction } from "react";
import { useSession } from "next-auth/react";
import type { AthleteProfile, PrimaryDiscipline } from "@/app/lib/types";
import { Button } from "@/app/components/Button";

type Hints = {
  weightKg?: number;
  suggestedDiscipline?: PrimaryDiscipline | null;
  firstname?: string | null;
};

/**
 * Import Strava réel (poids athlète + discipline suggérée depuis les activités).
 * Garmin : non branché — message explicite.
 */
export function ProfileStravaPanel({
  setProfile,
}: {
  setProfile: Dispatch<SetStateAction<AthleteProfile>>;
}) {
  const { status } = useSession();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const pullStrava = useCallback(async () => {
    setLoading(true);
    setError(null);
    setMessage(null);
    try {
      const res = await fetch("/api/integrations/strava/profile-hints", { credentials: "include" });
      const data = (await res.json()) as Hints & { error?: string; detail?: string };
      if (!res.ok) {
        setError(data.error ?? "Strava indisponible");
        return;
      }
      const parts: string[] = [];
      setProfile((prev) => {
        const next = { ...prev };
        if (typeof data.weightKg === "number") {
          next.weight = Math.round(data.weightKg * 10) / 10;
          parts.push(`poids ${next.weight} kg`);
        }
        if (data.suggestedDiscipline) {
          next.primaryDiscipline = data.suggestedDiscipline;
          parts.push(`discipline « ${data.suggestedDiscipline} »`);
        }
        return next;
      });
      if (parts.length === 0) {
        setMessage(
          data.firstname
            ? `Strava OK — renseigne ton poids dans Strava pour le préremplir ici, ou choisis la discipline manuellement.`
            : "Strava OK — aucun poids ni discipline détectés automatiquement (activités ou profil incomplets)."
        );
      } else {
        setMessage(`Appliqué : ${parts.join(", ")}. Vérifie et enregistre ton profil.`);
      }
    } catch {
      setError("Réseau indisponible");
    } finally {
      setLoading(false);
    }
  }, [setProfile]);

  const connectStrava = () => {
    window.location.assign("/api/integrations/strava/connect");
  };

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: 14,
      }}
    >
      <div
        style={{
          padding: "14px 16px",
          borderRadius: 10,
          border: "1px solid color-mix(in srgb, var(--color-border) 90%, var(--color-accent))",
          background: "color-mix(in srgb, var(--color-accent) 6%, var(--color-bg-card))",
        }}
      >
        <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: "var(--color-text)" }}>Strava</p>
        <p style={{ margin: "8px 0 0", fontSize: 12, color: "var(--color-text-muted)", lineHeight: 1.5 }}>
          Connexion OAuth existante : récupère le <strong>poids</strong> renseigné sur ton compte Strava et suggère une{' '}
          <strong>discipline</strong> d’après tes ~40 dernières activités.
        </p>
        {status !== "authenticated" && (
          <p style={{ margin: "10px 0 0", fontSize: 12, color: "var(--color-danger)" }}>
            Connecte-toi au compte FuelOS (en haut à droite), puis lie Strava.
          </p>
        )}
        {status === "authenticated" && (
          <div style={{ display: "flex", flexWrap: "wrap", gap: 10, marginTop: 12 }}>
            <Button type="button" variant="secondary" size="sm" onClick={connectStrava}>
              Lier / reconnecter Strava
            </Button>
            <Button type="button" variant="primary" size="sm" disabled={loading} onClick={() => void pullStrava()}>
              {loading ? "Lecture…" : "Importer poids + discipline"}
            </Button>
          </div>
        )}
        {message && (
          <p style={{ margin: "10px 0 0", fontSize: 12, color: "var(--color-accent)", fontWeight: 600 }}>{message}</p>
        )}
        {error && <p style={{ margin: "10px 0 0", fontSize: 12, color: "var(--color-danger)" }}>{error}</p>}
      </div>

      <div
        style={{
          padding: "14px 16px",
          borderRadius: 10,
          border: "1px dashed color-mix(in srgb, var(--color-border) 85%, var(--color-text-muted))",
          background: "color-mix(in srgb, var(--color-bg) 94%, var(--color-text-muted))",
        }}
      >
        <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: "var(--color-text-muted)" }}>Garmin Connect</p>
        <p style={{ margin: "8px 0 0", fontSize: 12, color: "var(--color-text-muted)", lineHeight: 1.5 }}>
          Pas encore disponible. L’objectif sera d’importer VO2max, charge d’entraînement et séances — en attendant,
          utilise Strava ou saisis FTP / VO2max à la main ci-dessus.
        </p>
      </div>
    </div>
  );
}
