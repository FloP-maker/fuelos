'use client';

import type { CSSProperties, JSX } from 'react';
import Link from 'next/link';
import { ThemeToggle } from './app/components/ThemeToggle';

const S = {
  page: { minHeight: '100vh', background: 'var(--color-bg)', color: 'var(--color-text)', fontFamily: 'system-ui, sans-serif' } as CSSProperties,
  header: { borderBottom: '1px solid var(--color-border)', padding: '16px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' } as CSSProperties,
  logo: { display: 'flex', alignItems: 'center', gap: 10 } as CSSProperties,
  logoIcon: { width: 32, height: 32, background: 'var(--color-accent)', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 18, color: '#000' } as CSSProperties,
  main: { maxWidth: 960, margin: '0 auto', padding: '60px 24px' } as CSSProperties,
  card: { background: 'var(--color-bg-card)', border: '1px solid var(--color-border)', borderRadius: 12, padding: 24, marginBottom: 20 } as CSSProperties,
  btn: { padding: '14px 28px', borderRadius: 10, background: 'var(--color-accent)', color: '#000', fontWeight: 700, fontSize: 16, border: 'none', cursor: 'pointer', textDecoration: 'none', display: 'inline-block' } as CSSProperties,
  btnOutline: { padding: '14px 28px', borderRadius: 10, background: 'transparent', color: 'var(--color-text)', fontWeight: 600, fontSize: 16, border: '1px solid var(--color-border)', cursor: 'pointer', textDecoration: 'none', display: 'inline-block' } as CSSProperties,
  badge: { display: 'inline-flex', alignItems: 'center', padding: '4px 12px', borderRadius: 99, fontSize: 12, fontWeight: 700, letterSpacing: '0.5px', border: '1px solid var(--color-accent)', color: 'var(--color-accent)', background: 'rgba(74,222,128,0.08)' } as CSSProperties,
};

function IconStepProfile({ style }: { style?: CSSProperties }) {
  return (
    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" aria-hidden style={style}>
      <path
        d="M12 11.25a3.75 3.75 0 100-7.5 3.75 3.75 0 000 7.5zM6 20.25c0-3.315 2.686-6 6-6s6 2.685 6 6"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function IconStepCourse({ style }: { style?: CSSProperties }) {
  return (
    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" aria-hidden style={style}>
      <path
        d="M12 3l8 4v6c0 5-3.5 9-8 10-4.5-1-8-5-8-10V7l8-4z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
      <path d="M9 12l2 2 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function IconStepRace({ style }: { style?: CSSProperties }) {
  return (
    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" aria-hidden style={style}>
      <path
        d="M13 2L3 14h8l-1 8 10-12h-8l1-8z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
        strokeLinecap="round"
      />
    </svg>
  );
}

const HOW_IT_WORKS_STEPS: {
  icon: (p: { style?: CSSProperties }) => JSX.Element;
  title: string;
  desc: string;
}[] = [
  {
    icon: IconStepProfile,
    title: 'Crée ton profil athlète',
    desc: 'Indique ton poids, ta transpiration et ta tolérance GI pour des besoins nutritionnels sur mesure.',
  },
  {
    icon: IconStepCourse,
    title: 'Configure ta course',
    desc: 'Distance, dénivelé, météo et tempo : le moteur calcule un plan cohérent avec ta stratégie.',
  },
  {
    icon: IconStepRace,
    title: 'Lance le Race Mode',
    desc: 'Timer, alertes et suivi en direct pour rester aligné avec ton plan le jour J.',
  },
];

const NAV = [
  { href: '/plan', label: 'Plan' },
  { href: '/shop', label: 'Shop' },
  { href: '/race', label: 'Race Mode' },
  { href: '/learn', label: 'Learn' },
];

const FEATURE_CARDS = [
  { icon: '🎯', title: 'PLAN', desc: 'CHO/h, hydratation, sodium calculés selon votre profil, la météo et le dénivelé', href: '/plan', accent: '#60a5fa' },
  { icon: '🛒', title: 'SHOP', desc: '500+ produits (Maurten, SiS, Tailwind, Näak…). Liste de courses auto-générée', href: '/shop', accent: '#4ade80' },
  { icon: '⚡', title: 'RACE MODE', desc: 'Timer intelligent + notifications push. Recalcul dynamique si vous déviez du plan', href: '/race', accent: 'var(--color-accent)' },
  { icon: '📊', title: 'LEARN', desc: 'Débrief post-course, suivi GI, apprentissage entre les événements', href: '/learn', accent: '#c084fc' },
];

export default function Home() {
  return (
    <div style={S.page}>
      <header style={S.header}>
        <div style={S.logo}>
          <div style={S.logoIcon}>F</div>
          <span style={{ fontWeight: 700, fontSize: 20 }}>FuelOS</span>
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          {NAV.map(item => (
            <Link
              key={item.href}
              href={item.href}
              style={{ padding: '8px 14px', borderRadius: 8, fontSize: 13, fontWeight: 600, color: 'var(--color-text-muted)', border: '1px solid transparent', textDecoration: 'none' }}
            >
              {item.label}
            </Link>
          ))}
          <ThemeToggle />
        </div>
      </header>

      <main style={S.main}>
        <div style={{ textAlign: 'center', marginBottom: 60 }}>
          <div style={{ marginBottom: 20 }}>
            <span style={S.badge}>Multi-marques · Multi-sports · Race Day Ready</span>
          </div>
          <h1 style={{ fontSize: '2.8rem', fontWeight: 700, marginBottom: 16, lineHeight: 1.2 }}>
            Votre nutrition endurance<br />
            <span style={{ color: 'var(--color-accent)' }}>pilotée par la data</span>
          </h1>
          <p style={{ fontSize: 18, color: 'var(--color-text-muted)', marginBottom: 40, maxWidth: 560, margin: '0 auto 40px' }}>
            Planifiez, achetez et exécutez votre stratégie nutritionnelle. Timer intelligent, alertes push, recalcul dynamique le jour J.
          </p>
          <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link href="/plan" style={S.btn}>Créer mon plan →</Link>
            <Link href="/race" style={S.btnOutline}>Race Mode ⚡</Link>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16, marginBottom: 60 }}>
          {FEATURE_CARDS.map(card => (
            <Link
              key={card.href}
              href={card.href}
              style={{ ...S.card, borderColor: card.accent === 'var(--color-accent)' ? 'var(--color-accent)' : card.accent + '55', textDecoration: 'none', color: 'var(--color-text)', display: 'block', marginBottom: 0 }}
            >
              <div style={{ fontSize: 32, marginBottom: 12 }}>{card.icon}</div>
              <h3 style={{ fontWeight: 700, fontSize: 15, marginBottom: 8, color: card.accent }}>{card.title}</h3>
              <p style={{ fontSize: 13, color: 'var(--color-text-muted)', lineHeight: 1.6, margin: 0 }}>{card.desc}</p>
            </Link>
          ))}
        </div>

        <section style={{ marginBottom: 48 }}>
          <h2
            style={{
              fontSize: '1.35rem',
              fontWeight: 800,
              marginBottom: 8,
              letterSpacing: '-0.02em',
            }}
          >
            Comment ça marche
          </h2>
          <p style={{ fontSize: 14, color: 'var(--color-text-muted)', marginBottom: 24, maxWidth: 520 }}>
            Trois étapes pour passer du profil à l&apos;exécution sur la ligne de départ.
          </p>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
              gap: 20,
            }}
          >
            {HOW_IT_WORKS_STEPS.map((item, i) => (
              <div
                key={item.title}
                style={{
                  ...S.card,
                  marginBottom: 0,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'flex-start',
                  borderColor: 'color-mix(in srgb, var(--color-accent) 22%, var(--color-border))',
                }}
              >
                <div
                  style={{
                    width: 64,
                    height: 64,
                    borderRadius: 12,
                    background: 'color-mix(in srgb, var(--color-accent) 12%, transparent)',
                    color: 'var(--color-accent)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginBottom: 16,
                  }}
                >
                  {item.icon({})}
                </div>
                <div
                  style={{
                    fontSize: 11,
                    fontWeight: 800,
                    letterSpacing: '0.06em',
                    color: 'var(--color-text-muted)',
                    marginBottom: 6,
                  }}
                >
                  ÉTAPE {i + 1}
                </div>
                <h3 style={{ fontWeight: 800, fontSize: 16, margin: '0 0 8px', lineHeight: 1.3 }}>
                  {item.title}
                </h3>
                <p style={{ fontSize: 13, color: 'var(--color-text-muted)', lineHeight: 1.55, margin: 0 }}>
                  {item.desc}
                </p>
              </div>
            ))}
          </div>
        </section>

        <div style={{ ...S.card, display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', textAlign: 'center', gap: 0, marginBottom: 0 }}>
          {[
            { value: '500+', label: 'Produits catalogés' },
            { value: '4', label: 'Sports couverts' },
            { value: '∞', label: 'Combinaisons de plans' },
          ].map((stat, i) => (
            <div key={i} style={{ padding: '16px 8px', borderRight: i < 2 ? '1px solid var(--color-border)' : undefined }}>
              <div style={{ fontSize: 32, fontWeight: 700, color: 'var(--color-accent)', marginBottom: 4 }}>{stat.value}</div>
              <div style={{ fontSize: 13, color: 'var(--color-text-muted)' }}>{stat.label}</div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
