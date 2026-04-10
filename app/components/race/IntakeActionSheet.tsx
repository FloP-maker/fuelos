'use client';

import { useMemo, useState } from 'react';
import type { Product } from '@/app/lib/types';
import { PRODUCTS } from '@/app/lib/products';
import type { ActualIntake, IntakeStatus, PlannedIntake } from '@/types/race-session';

export type IntakeActionSheetProps = {
  open: boolean;
  intake: PlannedIntake | null;
  currentMin: number;
  currentKm: number;
  onClose: () => void;
  onAction: (input: {
    action: IntakeStatus;
    actualIntake?: Partial<ActualIntake> | null;
    skipReason?: string;
  }) => void;
};

export function IntakeActionSheet({
  open,
  intake,
  currentMin,
  currentKm,
  onClose,
  onAction,
}: IntakeActionSheetProps) {
  const [showAlt, setShowAlt] = useState(false);

  const catalogSlice = useMemo(() => {
    if (!intake) return PRODUCTS.slice(0, 12);
    const preferredCat =
      intake.intakeType === 'gel'
        ? 'gel'
        : intake.intakeType === 'barre'
          ? 'bar'
          : intake.intakeType === 'boisson'
            ? 'drink'
            : 'gel';
    return PRODUCTS.filter((p) => p.category === preferredCat).slice(0, 12);
  }, [intake]);

  if (!open || !intake) return null;

  const fireTaken = () => {
    onAction({
      action: 'taken',
      actualIntake: {
        takenAtMin: currentMin,
        takenAtKm: currentKm,
        product: { ...intake.product },
        choG: intake.choG,
        sodiumMg: intake.sodiumMg,
        fluidMl: intake.fluidMl,
        note: '',
        giReaction: 'none',
      },
    });
    setShowAlt(false);
    onClose();
  };

  const fireSkipped = () => {
    onAction({ action: 'skipped', skipReason: '' });
    setShowAlt(false);
    onClose();
  };

  const fireVomit = () => {
    onAction({
      action: 'vomited',
      actualIntake: {
        takenAtMin: currentMin,
        takenAtKm: currentKm,
        product: { ...intake.product },
        choG: intake.choG,
        sodiumMg: intake.sodiumMg,
        fluidMl: intake.fluidMl,
        note: '',
        giReaction: 'severe',
      },
    });
    setShowAlt(false);
    onClose();
  };

  const fireModified = (p: Product) => {
    const qty = 1;
    onAction({
      action: 'modified',
      actualIntake: {
        takenAtMin: currentMin,
        takenAtKm: currentKm,
        product: {
          productId: p.id,
          name: p.name,
          quantity: qty,
          takenAtKm: currentKm,
        },
        choG: p.cho_per_unit * qty,
        sodiumMg: (p.sodium_per_unit ?? 0) * qty,
        fluidMl: (p.water_per_unit ?? 0) * qty,
        note: '',
        giReaction: 'none',
      },
    });
    setShowAlt(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[200] flex flex-col justify-end" role="dialog" aria-modal="true">
      <button type="button" className="absolute inset-0 bg-black/45" aria-label="Fermer" onClick={onClose} />
      <div className="relative max-h-[78vh] overflow-y-auto rounded-t-2xl border border-[var(--color-border)] bg-[var(--color-bg-card)] px-3 pb-[max(12px,env(safe-area-inset-bottom))] pt-3 shadow-[0_-12px_40px_rgba(0,0,0,0.18)]">
        <div className="mx-auto mb-3 max-w-md">
          <div className="text-[13px] font-extrabold text-[var(--color-text)]">{intake.product.name}</div>
          <div className="text-[12px] text-[var(--color-text-muted)]">
            Plan : {intake.scheduledAtMin}′ · {Math.round(intake.choG)}g CHO
          </div>
        </div>

        {!showAlt ? (
          <div className="mx-auto grid max-w-md grid-cols-2 gap-2">
            <button
              type="button"
              className="rounded-xl border border-[var(--color-border)] bg-[var(--color-accent)] py-4 text-[15px] font-extrabold text-black active:scale-[0.98]"
              onClick={fireTaken}
            >
              ✓ Pris
            </button>
            <button
              type="button"
              className="rounded-xl border border-[var(--color-border)] bg-[var(--color-bg)] py-4 text-[15px] font-extrabold active:scale-[0.98]"
              onClick={fireSkipped}
            >
              ✗ Sauté
            </button>
            <button
              type="button"
              className="rounded-xl border border-sky-500/50 bg-sky-500/10 py-4 text-[15px] font-extrabold active:scale-[0.98]"
              onClick={() => setShowAlt(true)}
            >
              ↔ Modifié
            </button>
            <button
              type="button"
              className="rounded-xl border border-red-500/50 bg-red-500/10 py-4 text-[15px] font-extrabold active:scale-[0.98]"
              onClick={fireVomit}
            >
              🤢 Vomi
            </button>
          </div>
        ) : (
          <div className="mx-auto max-w-md">
            <button
              type="button"
              className="mb-2 text-[13px] font-bold text-[var(--color-text-muted)]"
              onClick={() => setShowAlt(false)}
            >
              ← Retour
            </button>
            <div className="mb-2 text-[11px] font-bold uppercase tracking-wide text-[var(--color-text-muted)]">
              Remplacer par…
            </div>
            <div className="flex max-h-52 flex-col gap-1 overflow-y-auto">
              {catalogSlice.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  className="rounded-lg border border-[var(--color-border)] px-2 py-2 text-left text-[13px] font-semibold active:bg-[var(--color-bg)]"
                  onClick={() => fireModified(p)}
                >
                  {p.name}
                  <span className="ml-2 text-[11px] text-[var(--color-text-muted)]">{p.cho_per_unit}g CHO</span>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
