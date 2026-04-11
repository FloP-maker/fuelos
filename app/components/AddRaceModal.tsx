'use client';

import { useEffect, useId, useRef, useState, type FormEvent } from 'react';
import { createPortal } from 'react-dom';
import { addRace } from '@/lib/races';

const DISCIPLINES = ['Trail', 'Route', 'Ultra', 'Triathlon', 'Vélo'] as const;

function todayYmd(): string {
  const t = new Date();
  const y = t.getFullYear();
  const m = String(t.getMonth() + 1).padStart(2, '0');
  const d = String(t.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export type AddRaceModalProps = {
  open: boolean;
  onClose: () => void;
  /** Appelé après enregistrement réussi (course ajoutée). */
  onSaved?: () => void;
};

export function AddRaceModal({ open, onClose, onSaved }: AddRaceModalProps) {
  const titleId = useId();
  const nameRef = useRef<HTMLInputElement>(null);
  const [name, setName] = useState('');
  const [date, setDate] = useState(todayYmd());
  const [startTime, setStartTime] = useState('');
  const [sport, setSport] = useState<string>('Trail');
  /** 0 = désactivé ; défaut visuel 5 jours avant le J. */
  const [chargeDays, setChargeDays] = useState(5);
  /** 0 = désactivé ; défaut 4 jours après le J (J+1…J+4). */
  const [recoveryDays, setRecoveryDays] = useState(4);
  const [chargeLabel, setChargeLabel] = useState('');
  const [recoveryLabel, setRecoveryLabel] = useState('');
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (!open) return;
    const t = window.setTimeout(() => nameRef.current?.focus(), 16);
    return () => window.clearTimeout(t);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = prev;
    };
  }, [open, onClose]);

  if (!open || !mounted) return null;

  const minDate = todayYmd();

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed || !date) return;

    addRace({
      name: trimmed,
      date,
      startTime: startTime.trim() || undefined,
      sport,
      distance: 0,
      nutritionChargeDaysBefore: chargeDays,
      nutritionRecoveryDaysAfter: recoveryDays,
      nutritionChargeLabel: chargeLabel.trim() || undefined,
      nutritionRecoveryLabel: recoveryLabel.trim() || undefined,
    });
    setName('');
    setDate(todayYmd());
    setStartTime('');
    setSport('Trail');
    setChargeDays(5);
    setRecoveryDays(4);
    setChargeLabel('');
    setRecoveryLabel('');
    onSaved?.();
    onClose();
  };

  const node = (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
      <button
        type="button"
        className="absolute inset-0 bg-black/45"
        aria-label="Fermer la fenêtre"
        onClick={onClose}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="relative z-[1] w-full max-w-lg rounded-2xl border border-[#e5e7eb] bg-white p-6 shadow-xl"
        onClick={(ev) => ev.stopPropagation()}
      >
        <h2 id={titleId} className="mb-4 text-lg font-bold">
          Nouvelle course
        </h2>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <label htmlFor="race-name" className="mb-1 block text-sm font-medium">
              Nom de la course
            </label>
            <input
              ref={nameRef}
              id="race-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ex. UTMB, Trail des Crêtes 2026…"
              required
              className="w-full rounded-lg border border-[#e5e7eb] px-3 py-2 text-base outline-none focus:border-[#16a34a] focus:ring-1 focus:ring-[#16a34a]"
            />
          </div>

          <div>
            <label htmlFor="race-date" className="mb-1 block text-sm font-medium">
              Date
            </label>
            <input
              id="race-date"
              type="date"
              min={minDate}
              value={date}
              onChange={(e) => setDate(e.target.value)}
              required
              className="w-full rounded-lg border border-[#e5e7eb] px-3 py-2 text-base outline-none focus:border-[#16a34a] focus:ring-1 focus:ring-[#16a34a]"
            />
          </div>

          <div>
            <label htmlFor="race-time" className="mb-1 block text-sm font-medium">
              Heure de départ (optionnel)
            </label>
            <input
              id="race-time"
              type="time"
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
              className="w-full rounded-lg border border-[#e5e7eb] px-3 py-2 text-base outline-none focus:border-[#16a34a] focus:ring-1 focus:ring-[#16a34a]"
            />
          </div>

          <div>
            <span className="mb-2 block text-sm font-medium">Discipline</span>
            <div className="flex flex-wrap gap-2">
              {DISCIPLINES.map((disc) => {
                const active = sport === disc;
                return (
                  <button
                    key={disc}
                    type="button"
                    onClick={() => setSport(disc)}
                    className={[
                      'rounded-full border px-3 py-1.5 text-sm font-semibold transition',
                      active
                        ? 'border-[#16a34a] bg-[#f0fdf4] text-[#15803d]'
                        : 'border-[#e5e7eb] bg-white text-[#6b7280] hover:border-[#bbf7d0]',
                    ].join(' ')}
                  >
                    {disc}
                  </button>
                );
              })}
            </div>
          </div>

          <fieldset className="rounded-xl border border-[#e5e7eb] bg-[#fafafa] p-4">
            <legend className="px-1 text-sm font-bold text-[#374151]">Périodes nutrition (calendrier)</legend>
            <p className="mb-3 text-xs text-[#6b7280]">
              Bandeaux sur le calendrier : charge avant la course (J−n…J−1), récupération après (J+1…J+n). Mets 0
              pour désactiver une période.
            </p>
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="block text-sm font-medium text-[#374151]">
                Jours de charge avant le J
                <input
                  type="number"
                  min={0}
                  max={21}
                  value={chargeDays}
                  onChange={(e) => setChargeDays(Math.max(0, Math.min(21, Number(e.target.value) || 0)))}
                  className="mt-1 w-full rounded-lg border border-[#e5e7eb] px-3 py-2 text-base outline-none focus:border-[#16a34a]"
                />
              </label>
              <label className="block text-sm font-medium text-[#374151]">
                Jours de récup après le J
                <input
                  type="number"
                  min={0}
                  max={21}
                  value={recoveryDays}
                  onChange={(e) => setRecoveryDays(Math.max(0, Math.min(21, Number(e.target.value) || 0)))}
                  className="mt-1 w-full rounded-lg border border-[#e5e7eb] px-3 py-2 text-base outline-none focus:border-[#16a34a]"
                />
              </label>
              <label className="block text-sm font-medium text-[#374151] sm:col-span-2">
                Libellé charge (optionnel)
                <input
                  type="text"
                  value={chargeLabel}
                  onChange={(e) => setChargeLabel(e.target.value)}
                  placeholder="Ex. Charge CHO"
                  className="mt-1 w-full rounded-lg border border-[#e5e7eb] px-3 py-2 text-base outline-none focus:border-[#16a34a]"
                />
              </label>
              <label className="block text-sm font-medium text-[#374151] sm:col-span-2">
                Libellé récup (optionnel)
                <input
                  type="text"
                  value={recoveryLabel}
                  onChange={(e) => setRecoveryLabel(e.target.value)}
                  placeholder="Ex. Récup post-course"
                  className="mt-1 w-full rounded-lg border border-[#e5e7eb] px-3 py-2 text-base outline-none focus:border-[#16a34a]"
                />
              </label>
            </div>
          </fieldset>

          <div className="mt-2 flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-[#e5e7eb] px-4 py-2 text-sm font-semibold text-[#374151] hover:bg-[#f9fafb]"
            >
              Annuler
            </button>
            <button
              type="submit"
              className="rounded-lg bg-[#16a34a] px-4 py-2 text-sm font-semibold text-white hover:bg-[#15803d]"
            >
              Enregistrer
            </button>
          </div>
        </form>
      </div>
    </div>
  );

  return createPortal(node, document.body);
}
