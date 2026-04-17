import Link from 'next/link';
import { Header } from './components/Header';

const HOME_BLOCKS = [
  {
    title: 'Profil',
    description: 'Gere ton profil athlete et tes parametres personnels.',
    href: '/profil',
    cta: 'Ouvrir le profil',
  },
  {
    title: 'Mes plans courses',
    description: 'Retrouve tes courses et tes plans de nutrition.',
    href: '/races',
    cta: 'Voir mes plans',
  },
  {
    title: 'Mode Race',
    description: 'Lance ton mode course pour suivre ton plan en direct.',
    href: '/race',
    cta: 'Demarrer le mode Race',
  },
  {
    title: 'Produits',
    description: 'Consulte le catalogue des produits nutrition.',
    href: '/produits',
    cta: 'Explorer les produits',
  },
] as const;

export default function Home() {
  return (
    <div className="fuel-page">
      <Header sticky />
      <main className="fuel-main" style={{ paddingTop: 28 }}>
        <section
          className="fuel-card"
          style={{
            padding: '18px 18px 16px',
            marginBottom: 14,
            borderColor: 'color-mix(in srgb, var(--color-accent) 20%, var(--color-border))',
            background: 'color-mix(in srgb, var(--color-bg-card) 92%, var(--color-bg))',
          }}
          aria-label="Presentation"
        >
          <h1
            className="font-display"
            style={{
              margin: 0,
              marginBottom: 6,
              fontSize: 'clamp(1.9rem, 4.8vw, 2.8rem)',
              fontWeight: 900,
              lineHeight: 1.05,
            }}
          >
            FuelOS
          </h1>
          <p style={{ margin: 0, color: 'var(--color-text-muted)', lineHeight: 1.5 }}>
            Va droit a l&apos;essentiel. Choisis une section pour continuer.
          </p>
        </section>

        <section
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(230px, 1fr))',
            gap: 14,
          }}
          aria-label="Navigation rapide"
        >
          {HOME_BLOCKS.map((block) => (
            <Link
              key={block.href}
              href={block.href}
              className="fuel-card fuel-card-interactive block no-underline"
              style={{
                padding: 18,
                marginBottom: 0,
                display: 'grid',
                gap: 10,
                alignContent: 'space-between',
                minHeight: 146,
              }}
              aria-label={block.cta}
            >
              <div>
                <h2
                  className="font-display"
                  style={{ margin: 0, marginBottom: 6, fontSize: '1.08rem', fontWeight: 800 }}
                >
                  {block.title}
                </h2>
                <p style={{ margin: 0, fontSize: 14, lineHeight: 1.5, color: 'var(--color-text-muted)' }}>
                  {block.description}
                </p>
              </div>
              <span
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                  fontSize: 12,
                  fontWeight: 700,
                  color: 'var(--color-accent)',
                }}
              >
                {block.cta}
                <span aria-hidden>→</span>
              </span>
            </Link>
          ))}
        </section>
      </main>
    </div>
  );
}
