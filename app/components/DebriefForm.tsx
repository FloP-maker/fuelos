'use client';

import { useMemo, useState } from 'react';
import { Button } from './Button';
import type { DebriefFeedback, EnergyLevel, PlanFollowed, StoredDebrief } from '../lib/debrief';

type DebriefSavePayload = {
  feedback: DebriefFeedback;
  energyLevel: EnergyLevel;
  notes: string;
};

export function DebriefForm({
  debrief,
  onSave,
  isSaving = false,
  mode,
}: {
  debrief: StoredDebrief;
  onSave: (payload: DebriefSavePayload) => Promise<void> | void;
  isSaving?: boolean;
  mode: 'modal' | 'inline';
}) {
  const [stomachScore, setStomachScore] = useState<number | null>(debrief.feedback?.stomachScore ?? null);
  const [planFollowed, setPlanFollowed] = useState<PlanFollowed | null>(debrief.feedback?.planFollowed ?? null);
  const [planDeviationReason, setPlanDeviationReason] = useState(debrief.feedback?.planDeviationReason ?? '');
  const [energyLevel, setEnergyLevel] = useState<EnergyLevel | null>(debrief.energyLevel ?? null);
  const [notes, setNotes] = useState(debrief.notes ?? '');

  const canSave = useMemo(
    () => !isSaving && stomachScore !== null && planFollowed !== null && energyLevel !== null,
    [isSaving, stomachScore, planFollowed, energyLevel]
  );

  return (
    <div style={{ display: 'grid', gap: 14 }}>
      <div>
        <p style={{ margin: '0 0 8px', fontSize: 13, fontWeight: 700 }}>Comment était ton estomac ?</p>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {[
            [1, '🤢 Très difficile'],
            [2, '😣 Inconfort notable'],
            [3, '😐 Passable'],
            [4, '🙂 Bien'],
            [5, '😄 Parfait'],
          ].map(([value, label]) => (
            <button
              key={value}
              type="button"
              onClick={() => setStomachScore(value as number)}
              style={{
                padding: '8px 10px',
                borderRadius: 999,
                border:
                  stomachScore === value
                    ? '1px solid color-mix(in srgb, var(--color-accent) 55%, var(--color-border))'
                    : '1px solid var(--color-border)',
                background:
                  stomachScore === value
                    ? 'color-mix(in srgb, var(--color-accent) 14%, var(--color-bg-card))'
                    : 'var(--color-bg-card)',
                fontSize: 13,
                color: 'var(--color-text)',
                cursor: 'pointer',
                fontWeight: 600,
              }}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      <div>
        <p style={{ margin: '0 0 8px', fontSize: 13, fontWeight: 700 }}>As-tu suivi le plan ?</p>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {[
            ['yes', 'Oui ✓'],
            ['partial', 'En partie'],
            ['no', 'Non ✗'],
          ].map(([value, label]) => (
            <button
              key={value}
              type="button"
              onClick={() => setPlanFollowed(value as PlanFollowed)}
              style={{
                padding: '8px 12px',
                borderRadius: 999,
                border:
                  planFollowed === value
                    ? '1px solid color-mix(in srgb, var(--color-accent) 55%, var(--color-border))'
                    : '1px solid var(--color-border)',
                background:
                  planFollowed === value
                    ? 'color-mix(in srgb, var(--color-accent) 14%, var(--color-bg-card))'
                    : 'var(--color-bg-card)',
                fontSize: 13,
                color: 'var(--color-text)',
                cursor: 'pointer',
                fontWeight: 700,
              }}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {(planFollowed === 'partial' || planFollowed === 'no') && (
        <label style={{ display: 'grid', gap: 6 }}>
          <span style={{ fontSize: 13 }}>Pourquoi ? (optionnel)</span>
          <input
            value={planDeviationReason}
            onChange={(e) => setPlanDeviationReason(e.target.value)}
            placeholder="Ex: ravitos difficiles à prendre dans la montée"
            style={{
              padding: '9px 10px',
              borderRadius: 8,
              border: '1px solid var(--color-border)',
              background: 'var(--color-bg)',
              color: 'var(--color-text)',
            }}
          />
        </label>
      )}

      <div>
        <p style={{ margin: '0 0 8px', fontSize: 13, fontWeight: 700 }}>Ton niveau d&apos;énergie ?</p>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {[
            ['good', '🔋 Bon'],
            ['ok', '⚡ Moyen'],
            ['bad', '🪫 Vide'],
          ].map(([value, label]) => (
            <button
              key={value}
              type="button"
              onClick={() => setEnergyLevel(value as EnergyLevel)}
              style={{
                padding: '8px 12px',
                borderRadius: 999,
                border:
                  energyLevel === value
                    ? '1px solid color-mix(in srgb, var(--color-accent) 55%, var(--color-border))'
                    : '1px solid var(--color-border)',
                background:
                  energyLevel === value
                    ? 'color-mix(in srgb, var(--color-accent) 14%, var(--color-bg-card))'
                    : 'var(--color-bg-card)',
                fontSize: 13,
                color: 'var(--color-text)',
                cursor: 'pointer',
                fontWeight: 700,
              }}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      <label style={{ display: 'grid', gap: 6 }}>
        <span style={{ fontSize: 13 }}>Un truc à retenir pour la prochaine fois ?</span>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={3}
          placeholder="Produit qui a bien marché, problème rencontré..."
          style={{
            padding: '9px 10px',
            borderRadius: 8,
            border: '1px solid var(--color-border)',
            background: 'var(--color-bg)',
            color: 'var(--color-text)',
            resize: 'vertical',
          }}
        />
      </label>

      <Button
        type="button"
        variant="primary"
        size={mode === 'modal' ? 'lg' : 'md'}
        fullWidth={mode === 'modal'}
        disabled={!canSave}
        onClick={() => {
          if (!stomachScore || !planFollowed || !energyLevel) return;
          void onSave({
            feedback: {
              ...debrief.feedback,
              stomachScore,
              planFollowed,
              planDeviationReason: planDeviationReason.trim(),
              autoInsight: debrief.feedback?.autoInsight ?? '',
            },
            energyLevel,
            notes: notes.trim(),
          });
        }}
      >
        {isSaving ? 'Sauvegarde…' : 'Enregistrer mon débrief →'}
      </Button>
    </div>
  );
}
