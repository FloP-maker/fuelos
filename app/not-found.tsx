import Link from 'next/link';
import { Header } from './components/Header';

export default function NotFound() {
  return (
    <div className="fuel-page">
      <Header sticky />
      <main className="fuel-main" style={{ paddingTop: 42 }}>
        <section
          className="fuel-card"
          style={{
            padding: '28px clamp(18px, 3vw, 34px)',
            maxWidth: 760,
            margin: '0 auto',
            borderColor: 'color-mix(in srgb, var(--color-accent) 24%, var(--color-border))',
          }}
        >
          <span className="fuel-badge">Erreur 404</span>
          <h1
            className="font-display"
            style={{
              marginTop: 14,
              marginBottom: 10,
              fontSize: 'clamp(1.7rem, 3.6vw, 2.3rem)',
              fontWeight: 800,
              lineHeight: 1.15,
            }}
          >
            Page introuvable
          </h1>
          <p style={{ color: 'var(--color-text-muted)', lineHeight: 1.6, fontSize: 15 }}>
            L&apos;URL demandee n&apos;existe pas (ou plus). Vous pouvez revenir a l&apos;accueil ou continuer sur les
            sections principales de FuelOS.
          </p>

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, marginTop: 18 }}>
            <Link href="/" className="fuel-btn-pill fuel-btn-pill-accent font-display">
              Accueil
            </Link>
            <Link href="/plan" className="fuel-btn-pill">
              Plan
            </Link>
            <Link href="/produits" className="fuel-btn-pill">
              Produits
            </Link>
            <Link href="/profil?tab=insights" className="fuel-btn-pill">
              Profil (Analyses)
            </Link>
          </div>
        </section>
      </main>
    </div>
  );
}
