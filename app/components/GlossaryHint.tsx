'use client';

import { useEffect, useId, useRef, useState } from 'react';
import { CircleHelp } from 'lucide-react';
import { FUEL_GLOSSARY, type FuelGlossaryTermId } from '../lib/fuelGlossary';

type GlossaryHintProps = {
  term: FuelGlossaryTermId;
  /** Texte affiché à côté de l’icône (ex. lien « Qu’est-ce que le CHO ? ») */
  inlineLabel?: string;
};

export function GlossaryHint({ term, inlineLabel }: GlossaryHintProps) {
  const [open, setOpen] = useState(false);
  const id = useId();
  const panelRef = useRef<HTMLDivElement>(null);
  const wrapRef = useRef<HTMLSpanElement>(null);
  const g = FUEL_GLOSSARY[term];

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      const t = e.target as Node;
      if (wrapRef.current && !wrapRef.current.contains(t)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open]);

  return (
    <span
      ref={wrapRef}
      style={{
        position: 'relative',
        display: 'inline-flex',
        alignItems: 'center',
        gap: inlineLabel ? 6 : 0,
        verticalAlign: 'middle',
      }}
    >
      <button
        type="button"
        aria-expanded={open}
        aria-controls={`${id}-glossary-panel`}
        aria-label={`Aide : ${g.title}`}
        onClick={() => setOpen((v) => !v)}
        className="fuel-glossary-trigger touch-manipulation"
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 6,
          minHeight: 28,
          padding: inlineLabel ? '4px 10px' : '4px',
          borderRadius: 8,
          border: '1px solid var(--color-border)',
          background: open ? 'color-mix(in srgb, var(--color-accent) 12%, var(--color-bg))' : 'var(--color-bg)',
          color: 'var(--color-text-muted)',
          cursor: 'pointer',
          fontSize: inlineLabel ? 12 : undefined,
          fontWeight: inlineLabel ? 600 : undefined,
          fontFamily: 'inherit',
        }}
      >
        <CircleHelp size={inlineLabel ? 15 : 17} strokeWidth={2} aria-hidden />
        {inlineLabel ? <span style={{ color: 'var(--color-text)' }}>{inlineLabel}</span> : null}
      </button>
      {open ? (
        <div
          ref={panelRef}
          id={`${id}-glossary-panel`}
          role="dialog"
          aria-label={g.title}
          className="fuel-glossary-panel"
          style={{
            position: 'absolute',
            zIndex: 100,
            left: 0,
            top: '100%',
            marginTop: 8,
            padding: '14px 16px',
            borderRadius: 12,
            width: 'max-content',
            maxWidth: 'min(360px, calc(100vw - 32px))',
            fontSize: 13,
            lineHeight: 1.55,
            background: 'var(--color-bg-card)',
            border: '1px solid var(--color-border)',
            boxShadow: '0 10px 36px rgba(0,0,0,0.16)',
            color: 'var(--color-text)',
          }}
        >
          <p style={{ margin: '0 0 10px', fontWeight: 700, fontSize: 14, color: 'var(--color-text)' }}>{g.title}</p>
          <div style={{ whiteSpace: 'pre-line', color: 'var(--color-text-muted)' }}>{g.body}</div>
        </div>
      ) : null}
    </span>
  );
}
