'use client';

import type { CSSProperties } from 'react';

export type ToggleOption<T extends string> = {
  value: T;
  label: string;
};

type ToggleGroupProps<T extends string> = {
  value: T;
  onChange: (value: T) => void;
  options: ToggleOption<T>[];
  ariaLabel: string;
};

const baseBtn: CSSProperties = {
  flex: 1,
  minWidth: 0,
  padding: '10px 12px',
  borderRadius: 10,
  border: '1px solid var(--color-border)',
  background: 'var(--color-bg-card)',
  color: 'var(--color-text-muted)',
  fontSize: 13,
  fontWeight: 700,
  cursor: 'pointer',
  transition: 'all 0.15s ease',
};

const activeBtn: CSSProperties = {
  border: '1px solid var(--color-accent)',
  background: 'color-mix(in srgb, var(--color-accent) 14%, var(--color-bg-card))',
  color: 'var(--color-text)',
  boxShadow: '0 0 0 1px color-mix(in srgb, var(--color-accent) 24%, transparent)',
};

export function ToggleGroup<T extends string>({ value, onChange, options, ariaLabel }: ToggleGroupProps<T>) {
  return (
    <div role="group" aria-label={ariaLabel} style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
      {options.map((opt) => {
        const selected = opt.value === value;
        return (
          <button
            key={opt.value}
            type="button"
            onClick={() => onChange(opt.value)}
            aria-pressed={selected}
            style={selected ? { ...baseBtn, ...activeBtn } : baseBtn}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}
