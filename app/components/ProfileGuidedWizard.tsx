"use client";

import { useCallback, useState } from "react";
import type { AthleteProfile, PrimaryDiscipline, SeasonGoal } from "@/app/lib/types";
import { Button } from "@/app/components/Button";

const card: React.CSSProperties = {
  background: "var(--color-bg-card)",
  border: "1px solid var(--color-border)",
  borderRadius: "var(--radius-lg)",
  boxShadow: "var(--shadow-xs)",
  padding: 24,
  marginBottom: 20,
};

const label: React.CSSProperties = {
  display: "block",
  fontSize: 12,
  fontWeight: 600,
  color: "var(--color-text-muted)",
  marginBottom: 6,
  letterSpacing: "0.5px",
};

const select: React.CSSProperties = {
  width: "100%",
  padding: "10px 14px",
  borderRadius: 8,
  background: "var(--color-bg-card)",
  border: "1px solid var(--color-border)",
  color: "var(--color-text)",
  fontSize: 14,
  outline: "none",
  boxSizing: "border-box",
};

const input: React.CSSProperties = {
  ...select,
};

const STEPS = 4;

/**
 * Assistant 4 questions pour profils « débutant » — évite d’afficher tout le formulaire d’un coup.
 */
export function ProfileGuidedWizard({
  profile,
  setProfile,
  onSkipToFullForm,
}: {
  profile: AthleteProfile;
  setProfile: React.Dispatch<React.SetStateAction<AthleteProfile>>;
  onSkipToFullForm: () => void;
}) {
  const [step, setStep] = useState(0);
  const [primaryDiscipline, setPrimaryDiscipline] = useState<PrimaryDiscipline>(profile.primaryDiscipline);
  const [seasonGoal, setSeasonGoal] = useState<SeasonGoal>(profile.seasonGoal);
  const [weight, setWeight] = useState(profile.weight);
  const [sweatKey, setSweatKey] = useState<"low" | "mid" | "high">(
    profile.sweatRate <= 0.65 ? "low" : profile.sweatRate >= 1.2 ? "high" : "mid"
  );

  const sweatRate = sweatKey === "low" ? 0.8 : sweatKey === "high" ? 1.3 : 1.0;

  const finish = useCallback(() => {
    setProfile((prev) => ({
      ...prev,
      primaryDiscipline,
      seasonGoal,
      weight,
      sweatRate,
      giTolerance: "normal",
      profileGuidedOnboardingDone: true,
    }));
  }, [primaryDiscipline, seasonGoal, setProfile, sweatRate, weight]);

  const title = ["Discipline", "Objectif", "Poids", "Transpiration"][step] ?? "";

  return (
    <div style={card}>
      <div
        style={{
          display: "flex",
          alignItems: "baseline",
          justifyContent: "space-between",
          gap: 12,
          flexWrap: "wrap",
          marginBottom: 8,
        }}
      >
        <h2 className="font-display" style={{ fontSize: 20, fontWeight: 800, margin: 0 }}>
          Assistant profil (4 questions)
        </h2>
        <span style={{ fontSize: 12, fontWeight: 700, color: "var(--color-text-muted)" }}>
          {step + 1} / {STEPS}
        </span>
      </div>
      <p style={{ fontSize: 14, color: "var(--color-text-muted)", marginTop: 0, marginBottom: 20, lineHeight: 1.55 }}>
        Réponses simples, sans jargon. Tu pourras tout affiner ensuite dans le formulaire complet.
      </p>

      <p style={{ fontSize: 13, fontWeight: 700, color: "var(--color-text)", marginBottom: 12 }}>{title}</p>

      {step === 0 && (
        <div>
          <label style={label}>Tu pratiques surtout</label>
          <select
            style={select}
            value={primaryDiscipline}
            onChange={(e) => setPrimaryDiscipline(e.target.value as PrimaryDiscipline)}
          >
            <option value="trail">Trail</option>
            <option value="road">Route</option>
            <option value="ultra">Ultra</option>
            <option value="triathlon">Triathlon</option>
            <option value="cycling">Vélo</option>
            <option value="other">Autre</option>
          </select>
        </div>
      )}

      {step === 1 && (
        <div>
          <label style={label}>Ton objectif principal cette saison</label>
          <select style={select} value={seasonGoal} onChange={(e) => setSeasonGoal(e.target.value as SeasonGoal)}>
            <option value="finisher">Finir sereinement</option>
            <option value="performance">Progresser / chrono</option>
            <option value="podium">Tirer le maximum de moi</option>
          </select>
        </div>
      )}

      {step === 2 && (
        <div>
          <label style={label}>Poids (kg)</label>
          <input
            style={input}
            type="number"
            min={40}
            max={120}
            value={weight}
            onChange={(e) => setWeight(+e.target.value)}
          />
          <p style={{ fontSize: 12, color: "var(--color-text-muted)", marginTop: 8, lineHeight: 1.45 }}>
            Valeur indicative pour les calculs d’hydratation et d’énergie.
          </p>
        </div>
      )}

      {step === 3 && (
        <div>
          <label style={label}>À l’effort, tu transpires plutôt…</label>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {(
              [
                { k: "low" as const, t: "Peu — je reste souvent sec·che" },
                { k: "mid" as const, t: "Normalement" },
                { k: "high" as const, t: "Beaucoup — traces de sel, tee-shirt trempé vite" },
              ] as const
            ).map(({ k, t }) => (
              <label
                key={k}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  padding: "12px 14px",
                  borderRadius: 10,
                  border: `1px solid ${sweatKey === k ? "var(--color-accent)" : "var(--color-border)"}`,
                  background:
                    sweatKey === k ? "color-mix(in srgb, var(--color-accent) 12%, var(--color-bg))" : "var(--color-bg)",
                  cursor: "pointer",
                  fontSize: 14,
                }}
              >
                <input
                  type="radio"
                  name="sweat"
                  checked={sweatKey === k}
                  onChange={() => setSweatKey(k)}
                  style={{ accentColor: "var(--color-accent)" }}
                />
                {t}
              </label>
            ))}
          </div>
        </div>
      )}

      <div style={{ display: "flex", flexWrap: "wrap", gap: 10, marginTop: 24 }}>
        {step > 0 && (
          <button
            type="button"
            style={{
              padding: "10px 16px",
              borderRadius: 8,
              border: "1px solid var(--color-border)",
              background: "var(--color-bg-card)",
              color: "var(--color-text)",
              fontWeight: 600,
              fontSize: 14,
              cursor: "pointer",
            }}
            onClick={() => setStep((s) => Math.max(0, s - 1))}
          >
            Retour
          </button>
        )}
        {step < STEPS - 1 && (
          <Button type="button" variant="primary" size="md" onClick={() => setStep((s) => s + 1)}>
            Continuer
          </Button>
        )}
        {step === STEPS - 1 && (
          <Button type="button" variant="primary" size="md" onClick={finish}>
            Terminer l’assistant
          </Button>
        )}
        <button
          type="button"
          style={{
            padding: "10px 16px",
            borderRadius: 8,
            border: "none",
            background: "transparent",
            color: "var(--color-text-muted)",
            fontWeight: 600,
            fontSize: 13,
            cursor: "pointer",
            textDecoration: "underline",
            marginLeft: "auto",
          }}
          onClick={onSkipToFullForm}
        >
          Passer au formulaire complet
        </button>
      </div>
    </div>
  );
}
