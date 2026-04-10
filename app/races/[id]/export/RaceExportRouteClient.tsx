'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { getRaceEntryForExport } from '@/lib/race-export-data';
import type { RaceEntry } from '@/lib/types/race';
import { RaceExportView } from '@/components/races/RaceExportView';

type Props = {
  raceId: string;
};

export function RaceExportRouteClient({ raceId }: Props) {
  const [race, setRace] = useState<RaceEntry | null | undefined>(undefined);
  const [showLocalOnlyMessage, setShowLocalOnlyMessage] = useState(false);
  const [generatedAtIso] = useState(() => new Date().toISOString());
  const [copyDone, setCopyDone] = useState(false);

  useEffect(() => {
    let cancelled = false;
    let timer: ReturnType<typeof setTimeout> | undefined;

    if (!raceId) {
      setRace(null);
      timer = setTimeout(() => {
        if (!cancelled) setShowLocalOnlyMessage(true);
      }, 500);
      return () => {
        cancelled = true;
        if (timer) clearTimeout(timer);
      };
    }

    const found = getRaceEntryForExport(raceId);
    setRace(found);

    if (!found) {
      timer = setTimeout(() => {
        if (!cancelled) setShowLocalOnlyMessage(true);
      }, 500);
    } else {
      setShowLocalOnlyMessage(false);
    }

    return () => {
      cancelled = true;
      if (timer) clearTimeout(timer);
    };
  }, [raceId]);

  if (race === undefined) {
    return (
      <div
        className="min-h-screen bg-[var(--color-bg)] px-4 py-16 text-center text-[var(--color-text-muted)] print:hidden"
        style={{ fontFamily: 'var(--font-sans), system-ui, sans-serif' }}
      >
        Chargement…
      </div>
    );
  }

  if (!race && !showLocalOnlyMessage) {
    return (
      <div
        className="min-h-screen bg-[var(--color-bg)] px-4 py-16 text-center text-[var(--color-text-muted)] print:hidden"
        style={{ fontFamily: 'var(--font-sans), system-ui, sans-serif' }}
      >
        Chargement…
      </div>
    );
  }

  if (!race && showLocalOnlyMessage) {
    const callbackUrl =
      typeof window !== 'undefined' ? `${window.location.origin}${window.location.pathname}` : '/';
    const signInHref = `/api/auth/signin?callbackUrl=${encodeURIComponent(callbackUrl)}`;

    return (
      <div
        className="min-h-screen bg-[var(--color-bg)] px-4 py-16 print:hidden"
        style={{ fontFamily: 'var(--font-sans), system-ui, sans-serif' }}
      >
        <div className="mx-auto max-w-md rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-card)] p-8 text-center shadow-sm">
          <h1 className="font-display text-xl font-bold text-[var(--color-text)]">Course introuvable</h1>
          <p className="mt-4 text-sm leading-relaxed text-[var(--color-text-muted)]">
            Cette fiche n&apos;est pas disponible sur cet appareil. Les fiches FuelOS sont stockées localement.
            Connecte-toi avec le même compte pour y accéder.
          </p>
          <div className="mt-6 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
            <Link
              href={signInHref}
              className="inline-flex items-center justify-center rounded-lg bg-[#16a34a] px-4 py-2.5 text-sm font-bold text-white hover:bg-[#15803d]"
            >
              Se connecter
            </Link>
            <Link
              href="/races"
              className="text-sm font-semibold text-[#16a34a] underline hover:no-underline"
            >
              Retour à mes courses
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (!race) return null;

  return (
    <div
      className="min-h-screen bg-[var(--color-bg)] print:bg-white print:p-0"
      style={{ fontFamily: 'var(--font-sans), system-ui, sans-serif' }}
    >
      <header className="sticky top-0 z-20 border-b border-zinc-200 bg-white px-4 py-3 shadow-sm print:hidden">
        <div className="mx-auto flex max-w-[720px] flex-wrap items-center justify-between gap-3">
          <Link
            href={`/races/${race.id}`}
            className="text-sm font-semibold text-[#16a34a] hover:underline"
          >
            ← Retour à la fiche course
          </Link>
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => typeof window !== 'undefined' && window.print()}
              className="rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm font-semibold text-zinc-800 shadow-sm hover:bg-zinc-50"
            >
              🖨️ Imprimer / Enregistrer en PDF
            </button>
            <button
              type="button"
              onClick={() => {
                if (typeof window === 'undefined' || !navigator.clipboard?.writeText) return;
                void navigator.clipboard.writeText(window.location.href).then(() => {
                  setCopyDone(true);
                  window.setTimeout(() => setCopyDone(false), 2000);
                });
              }}
              className="rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm font-semibold text-zinc-800 shadow-sm hover:bg-zinc-50"
            >
              {copyDone ? '✓ Copié' : '🔗 Copier le lien'}
            </button>
          </div>
        </div>
      </header>

      <div className="print:w-full print:max-w-none">
        <RaceExportView race={race} generatedAtIso={generatedAtIso} />
      </div>
    </div>
  );
}
