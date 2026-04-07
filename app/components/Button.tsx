'use client';

import type { ButtonHTMLAttributes, CSSProperties, ReactNode } from 'react';

type ButtonVariant = 'primary' | 'secondary' | 'danger' | 'ghost';
type ButtonSize = 'sm' | 'md' | 'lg';

type ButtonProps = {
  children: ReactNode;
  variant?: ButtonVariant;
  size?: ButtonSize;
  fullWidth?: boolean;
  style?: CSSProperties;
} & ButtonHTMLAttributes<HTMLButtonElement>;

const sizeStyles: Record<ButtonSize, CSSProperties> = {
  sm: { minHeight: 34, padding: '8px 12px', fontSize: 12, fontWeight: 700, borderRadius: 8 },
  md: { minHeight: 40, padding: '10px 16px', fontSize: 14, fontWeight: 700, borderRadius: 8 },
  lg: { minHeight: 48, padding: '14px 18px', fontSize: 15, fontWeight: 800, borderRadius: 10 },
};

const variantStyles: Record<ButtonVariant, CSSProperties> = {
  primary: {
    background: 'var(--color-accent)',
    color: '#000',
    border: '1px solid color-mix(in srgb, var(--color-accent) 40%, #000)',
  },
  secondary: {
    background: 'var(--color-bg-card)',
    color: 'var(--color-text)',
    border: '1px solid var(--color-border)',
  },
  danger: {
    background: 'var(--color-danger)',
    color: '#fff',
    border: '1px solid color-mix(in srgb, var(--color-danger) 40%, #000)',
  },
  ghost: {
    background: 'color-mix(in srgb, var(--color-bg) 80%, transparent)',
    color: 'var(--color-text-muted)',
    border: '1px solid var(--color-border)',
  },
};

export function Button({
  children,
  variant = 'secondary',
  size = 'md',
  fullWidth = false,
  style,
  disabled,
  ...rest
}: ButtonProps) {
  const finalStyle: CSSProperties = {
    ...sizeStyles[size],
    ...variantStyles[variant],
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    lineHeight: 1.2,
    boxSizing: 'border-box',
    textAlign: 'center',
    touchAction: 'manipulation',
    width: fullWidth ? '100%' : undefined,
    cursor: disabled ? 'not-allowed' : 'pointer',
    opacity: disabled ? 0.55 : 1,
    textDecoration: 'none',
    transition: 'all 0.15s ease',
    ...style,
  };
  return (
    <button {...rest} disabled={disabled} style={finalStyle}>
      {children}
    </button>
  );
}
