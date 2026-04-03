'use client';

import type { CSSProperties, JSX } from 'react';
import Link from 'next/link';
import type { LucideIcon } from 'lucide-react';
import {
  BookOpen,
  ChefHat,
  Crosshair,
  ShoppingBag,
  UserRound,
  Zap,
} from 'lucide-react';
import { Header } from './components/Header';

const S = {
  main: { paddingTop: 48 } as CSSProperties,
  card: {
    padding: 22,
    marginBottom: 20,
  } as CSSProperties,
};

function IconStepProfile({ style }: { style?: CSSProperties }) {
  return <UserRound width={48} height={48} strokeWidth={1.25} aria-hidden style={style} />;
}

function IconStepCourse({ style }: { style?: CSSProperties }) {
  return <Crosshair width={48} height={48} strokeWidth={1.25} aria-hidden style={style} />;
}

function IconStepRace({ style }: { style?: CSSProperties }) {
  return <Zap width={48} height={48} strokeWidth={1.25} aria-hidden style={style} />;
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

const FEATURE_CARDS: {
  icon: LucideIcon;
  title: string;
  desc: string;
  href: string;
  accent: string;
}[] = [
  {
    icon: Crosshair,
    title: 'PLAN',
    desc: 'CHO/h, hydratation, sodium calculés selon votre profil, la météo et le dénivelé',
    href: '/plan',
    accent: '#60a5fa',
  },
  {
    icon: ShoppingBag,
    title: 'SHOP',
    desc: '500+ produits (Maurten, SiS, Tailwind, Näak…). Liste de courses auto-générée',
    href: '/shop',
    accent: '#4ade80',
  },
  {
    icon: ChefHat,
    title: 'PRÉ/POST',
    desc: 'Charge 3 ou 7 j, liste de courses des menus, jour J, drop bags & récup',
    href: '/prep',
    accent: '#fb923c',
  },
  {
    icon: Zap,
    title: 'RACE MODE',
    desc: 'Timer intelligent + notifications push. Recalcul dynamique si vous déviez du plan',
    href: '/race',
    accent: 'var(--color-accent)',
  },
  {
    icon: BookOpen,
    title: 'LEARN',
    desc: 'Débrief post-course, suivi GI, apprentissage entre les événements',
    href: '/learn',
    accent: '#c084fc',
  },
];

export default function Home() {
  return (
    <div className="fuel-page">
      <Header sticky />
      <main className="fuel-main" style={S.main}>
        <div style={{ textAlign: 'center', marginBottom: 56 }}>
          <div style={{ marginBottom: 22 }}>
            <span className="fuel-badge">Multi-marques · Multi-sports · Race Day Ready</span>
          </div>
          <h1
            className="font-display"
            style={{
              fontSize: 'clamp(2rem, 5vw, 3.15rem)',
              fontWeight: 800,
              marginBottom: 18,
              lineHeight: 1.08,
            }}
          >
            Votre nutrition endurance
            <br />
            <span
              style={{
                background: 'linear-gradient(100deg, var(--color-accent) 0%, color-mix(in srgb, var(--color-energy) 55%, var(--color-accent)) 100%)',
                WebkitBackgroundClip: 'text',
                backgroundClip: 'text',
                color: 'transparent',
              }}
            >
              pilotée par la data
            </span>
          </h1>
          <p
            style={{
              fontSize: 18,
              lineHeight: 1.6,
              color: 'var(--color-text-muted)',
              marginBottom: 36,
              maxWidth: 540,
              margin: '0 auto 36px',
            }}
          >
            Planifiez, achetez et exécutez votre stratégie nutritionnelle. Timer intelligent, alertes push, recalcul
            dynamique le jour J.
          </p>
          <div className="flex w-full max-w-md flex-col items-stretch justify-center gap-3 sm:mx-auto sm:max-w-none sm:flex-row sm:flex-wrap sm:items-center sm:gap-3.5">
            <Link href="/plan" className="fuel-cta w-full justify-center sm:w-auto" style={{ color: '#052e14' }}>
              Créer mon plan
              <span aria-hidden>→</span>
            </Link>
            <Link href="/race" className="fuel-cta-outline w-full justify-center sm:w-auto">
              Race Mode
              <Zap size={18} strokeWidth={2.25} aria-hidden />
            </Link>
          </div>
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))',
            gap: 16,
            marginBottom: 56,
          }}
        >
          {FEATURE_CARDS.map((card) => {
            const Icon = card.icon;
            const borderAccent =
              card.accent === 'var(--color-accent)'
                ? 'color-mix(in srgb, var(--color-accent) 35%, var(--color-border))'
                : `${card.accent}66`;
            return (
              <Link
                key={card.href}
                href={card.href}
                className="fuel-card fuel-card-interactive block no-underline"
                style={{
                  ...S.card,
                  marginBottom: 0,
                  borderColor: borderAccent,
                  color: 'var(--color-text)',
                }}
              >
                <div
                  style={{
                    width: 48,
                    height: 48,
                    borderRadius: 14,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginBottom: 14,
                    color: card.accent,
                    background: `color-mix(in srgb, ${card.accent} 16%, var(--color-bg-card))`,
                  }}
                >
                  <Icon size={26} strokeWidth={1.75} aria-hidden />
                </div>
                <h3
                  className="font-display"
                  style={{
                    fontWeight: 800,
                    fontSize: 14,
                    letterSpacing: '0.04em',
                    marginBottom: 8,
                    color: card.accent,
                  }}
                >
                  {card.title}
                </h3>
                <p style={{ fontSize: 13, color: 'var(--color-text-muted)', lineHeight: 1.6, margin: 0 }}>
                  {card.desc}
                </p>
              </Link>
            );
          })}
        </div>

        <section style={{ marginBottom: 48 }}>
          <h2
            className="font-display"
            style={{
              fontSize: '1.5rem',
              fontWeight: 800,
              marginBottom: 8,
            }}
          >
            Comment ça marche
          </h2>
          <p style={{ fontSize: 15, color: 'var(--color-text-muted)', marginBottom: 26, maxWidth: 520, lineHeight: 1.55 }}>
            Trois étapes pour passer du profil à l&apos;exécution sur la ligne de départ.
          </p>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(228px, 1fr))',
              gap: 18,
            }}
          >
            {HOW_IT_WORKS_STEPS.map((item, i) => (
              <div
                key={item.title}
                className="fuel-card"
                style={{
                  ...S.card,
                  marginBottom: 0,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'flex-start',
                  borderColor: 'color-mix(in srgb, var(--color-accent) 20%, var(--color-border))',
                }}
              >
                <div
                  style={{
                    width: 64,
                    height: 64,
                    borderRadius: 16,
                    background: 'color-mix(in srgb, var(--color-accent) 12%, var(--color-bg-card))',
                    color: 'var(--color-accent)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginBottom: 16,
                    boxShadow: 'var(--shadow-xs)',
                  }}
                >
                  {item.icon({})}
                </div>
                <div
                  style={{
                    fontSize: 11,
                    fontWeight: 800,
                    fontFamily: 'var(--font-display)',
                    letterSpacing: '0.08em',
                    color: 'var(--color-text-muted)',
                    marginBottom: 6,
                  }}
                >
                  ÉTAPE {i + 1}
                </div>
                <h3 className="font-display" style={{ fontWeight: 800, fontSize: 17, margin: '0 0 8px', lineHeight: 1.3 }}>
                  {item.title}
                </h3>
                <p style={{ fontSize: 14, color: 'var(--color-text-muted)', lineHeight: 1.55, margin: 0 }}>
                  {item.desc}
                </p>
              </div>
            ))}
          </div>
        </section>

        <div
          className="fuel-card"
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            textAlign: 'center',
            gap: 0,
            marginBottom: 0,
            overflow: 'hidden',
            padding: 0,
          }}
        >
          {[
            { value: '500+', label: 'Produits catalogés' },
            { value: '4', label: 'Sports couverts' },
            { value: '∞', label: 'Combinaisons de plans' },
          ].map((stat, i) => (
            <div
              key={stat.label}
              style={{
                padding: '22px 12px',
                borderRight: i < 2 ? '1px solid var(--color-border-subtle)' : undefined,
                background:
                  i === 1
                    ? 'color-mix(in srgb, var(--color-accent) 5%, var(--color-bg-card))'
                    : undefined,
              }}
            >
              <div
                className="font-display"
                style={{
                  fontSize: 'clamp(1.75rem, 4vw, 2.25rem)',
                  fontWeight: 800,
                  background: 'linear-gradient(95deg, var(--color-accent), color-mix(in srgb, var(--color-energy) 40%, var(--color-accent)))',
                  WebkitBackgroundClip: 'text',
                  backgroundClip: 'text',
                  color: 'transparent',
                  marginBottom: 6,
                }}
              >
                {stat.value}
              </div>
              <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--color-text-muted)' }}>{stat.label}</div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
