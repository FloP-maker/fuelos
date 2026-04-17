import Link from 'next/link';
import { Header } from './components/Header';

const HOME_BLOCKS = [
  {
    title: 'Profil',
    description: 'Gere ton profil athlete et tes parametres personnels.',
    href: '/profil',
  },
  {
    title: 'Mes plans courses',
    description: 'Retrouve tes courses et tes plans de nutrition.',
    href: '/races',
  },
  {
    title: 'Mode Race',
    description: 'Lance ton mode course pour suivre ton plan en direct.',
    href: '/race',
  },
  {
    title: 'Produits',
    description: 'Consulte le catalogue des produits nutrition.',
    href: '/produits',
  },
] as const;

export default function Home() {
  return (
    <div className="fuel-page">
      <Header sticky />
      <main className="fuel-main" style={{ paddingTop: 28 }}>
        <h1
          className="font-display"
          style={{
            margin: 0,
            marginBottom: 8,
            fontSize: 'clamp(1.9rem, 4.8vw, 2.8rem)',
            fontWeight: 900,
          }}
        >
          FuelOS
        </h1>
        <p style={{ margin: 0, marginBottom: 24, color: 'var(--color-text-muted)' }}>
          Acces rapide aux 4 sections principales.
        </p>

        <section
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
            gap: 14,
          }}
          aria-label="Navigation rapide"
        >
          {HOME_BLOCKS.map((block) => (
            <Link
              key={block.href}
              href={block.href}
              className="fuel-card fuel-card-interactive block no-underline"
              style={{ padding: 18, marginBottom: 0 }}
            >
              <h2
                className="font-display"
                style={{ margin: 0, marginBottom: 6, fontSize: '1.08rem', fontWeight: 800 }}
              >
                {block.title}
              </h2>
              <p style={{ margin: 0, fontSize: 14, lineHeight: 1.5, color: 'var(--color-text-muted)' }}>
                {block.description}
              </p>
            </Link>
          ))}
        </section>
      </main>
    </div>
  );
}
