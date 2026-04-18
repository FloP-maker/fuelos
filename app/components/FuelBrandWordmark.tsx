import type { CSSProperties } from 'react';

export type FuelBrandWordmarkProps = {
  className?: string;
  style?: CSSProperties;
  /** Taille du texte (px), défaut alignée header */
  size?: number;
};

/**
 * Logo mot « FUELOS » sombre (référence landing / connexion), sans pictogramme dégradé.
 */
export function FuelBrandWordmark({ className, style, size = 22 }: FuelBrandWordmarkProps) {
  return (
    <span
      className={['font-display fuel-brand-wordmark', className].filter(Boolean).join(' ')}
      style={{
        fontWeight: 900,
        lineHeight: 1,
        fontSize: size,
        ...style,
      }}
    >
      FUELOS
    </span>
  );
}
