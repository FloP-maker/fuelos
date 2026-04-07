import Link from 'next/link';
import pkg from '../../package.json';

const appVersion = typeof pkg.version === 'string' ? pkg.version : '0.0.0';

export function AppFooter() {
  return (
    <footer
      style={{
        marginTop: 28,
        borderTop: '1px solid var(--color-border)',
        background: 'color-mix(in srgb, var(--color-bg) 88%, var(--color-bg-card))',
      }}
    >
      <div
        style={{
          maxWidth: 'var(--fuel-shell-max)',
          margin: '0 auto',
          padding: '18px clamp(12px, 3.5vw, 24px) 24px',
          display: 'grid',
          gap: 10,
        }}
      >
        <div style={{ fontSize: 12, lineHeight: 1.5, color: 'var(--color-text-muted)' }}>
          Ces informations ne remplacent pas un suivi medical ou nutritionnel professionnel individualise.
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 14, fontSize: 13 }}>
          <Link href="/legal">Mentions legales</Link>
          <Link href="/privacy">Confidentialite</Link>
          <Link href="/learn">Bibliotheque</Link>
          <Link href="/plan">Plan</Link>
          <Link href="/race">Mode course</Link>
        </div>
        <div style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>FuelOS v{appVersion}</div>
      </div>
    </footer>
  );
}
