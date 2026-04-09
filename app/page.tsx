'use client';

import { useMemo, useState, type CSSProperties, type JSX } from 'react';
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
import { PRODUCTS } from './lib/products';

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
    title: 'Lance le mode course',
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
    title: 'PRODUITS',
    desc: `${PRODUCTS.length}+ produits (Maurten, SiS, Tailwind, Näak…). Liste de courses auto-générée`,
    href: '/produits',
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
    title: 'MODE COURSE',
    desc: 'Timer intelligent + notifications push. Recalcul dynamique si vous déviez du plan',
    href: '/race',
    accent: 'var(--color-accent)',
  },
  {
    icon: BookOpen,
    title: 'ANALYSES',
    desc: 'Débrief post-course, suivi GI, apprentissage entre les événements',
    href: '/analyses',
    accent: '#c084fc',
  },
];

type FirstUseSport = 'Course à pied' | 'Trail' | 'Cyclisme' | 'Triathlon';

type FirstUseDraft = {
  sport: FirstUseSport;
  distance: number;
  durationValue: number;
  durationUnit: 'hours' | 'minutes';
  elevationGain: number;
  weight: number;
  sweatRate: number;
  giTolerance: 'sensitive' | 'normal' | 'robust';
};

const FIRST_USE_SPORTS: FirstUseSport[] = ['Course à pied', 'Trail', 'Cyclisme', 'Triathlon'];

function sportDefaults(sport: FirstUseSport): Pick<FirstUseDraft, 'distance' | 'durationValue' | 'durationUnit' | 'elevationGain'> {
  switch (sport) {
    case 'Course à pied':
      return { distance: 10, durationValue: 60, durationUnit: 'minutes', elevationGain: 50 };
    case 'Cyclisme':
      return { distance: 80, durationValue: 3, durationUnit: 'hours', elevationGain: 600 };
    case 'Triathlon':
      return { distance: 70.3, durationValue: 5.5, durationUnit: 'hours', elevationGain: 300 };
    case 'Trail':
    default:
      return { distance: 30, durationValue: 4, durationUnit: 'hours', elevationGain: 1200 };
  }
}

export default function Home() {
  const [showFirstUse, setShowFirstUse] = useState(false);
  const [firstUseStep, setFirstUseStep] = useState<1 | 2 | 3 | 4>(1);
  const [firstUse, setFirstUse] = useState<FirstUseDraft>({
    sport: 'Trail',
    ...sportDefaults('Trail'),
    weight: 70,
    sweatRate: 1,
    giTolerance: 'normal',
  });

  const firstUseTargetTimeHours = useMemo(() => {
    if (firstUse.durationUnit === 'minutes') return firstUse.durationValue / 60;
    return firstUse.durationValue;
  }, [firstUse.durationUnit, firstUse.durationValue]);

  const firstUsePlanHref = useMemo(() => {
    const params = new URLSearchParams({
      step: 'event',
      onboarding: '1',
      sport: firstUse.sport,
      distance: String(firstUse.distance),
      targetTime: String(firstUseTargetTimeHours),
      elevationGain: String(firstUse.elevationGain),
      weight: String(firstUse.weight),
      sweatRate: String(firstUse.sweatRate),
      giTolerance: firstUse.giTolerance,
    });
    return `/plan?${params.toString()}`;
  }, [firstUse, firstUseTargetTimeHours]);

  return (
    <div className="fuel-page">
      <Header sticky />
      <main className="fuel-main" style={S.main}>
        <div style={{ textAlign: 'center', marginBottom: 56 }}>
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
          <div
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: 12,
              justifyContent: 'center',
              alignItems: 'center',
              marginBottom: 8,
            }}
          >
            <button
              type="button"
              className="fuel-btn-pill fuel-btn-pill-accent font-display"
              onClick={() => setShowFirstUse((v) => !v)}
              style={{ fontWeight: 800, fontSize: 15, padding: '0.65rem 1.35rem' }}
            >
              Première utilisation, c&apos;est par ici
            </button>
          </div>
        </div>

        {showFirstUse && (
          <div
            className="fuel-card"
            style={{
              ...S.card,
              marginBottom: 28,
              borderColor: 'color-mix(in srgb, var(--color-accent) 28%, var(--color-border))',
            }}
          >
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
            <h2 className="font-display" style={{ margin: 0, fontSize: 24, fontWeight: 800 }}>
              Première utilisation guidée
            </h2>
            <span style={{ fontSize: 12, color: 'var(--color-text-muted)', fontWeight: 700 }}>ÉTAPE {firstUseStep}/4</span>
          </div>
          <p style={{ marginTop: 8, marginBottom: 18, color: 'var(--color-text-muted)', fontSize: 14 }}>
            2 minutes pour configurer ton premier événement et générer immédiatement ton premier plan.
          </p>

          {firstUseStep === 1 && (
            <div>
              <label style={{ fontSize: 13, fontWeight: 700, display: 'block', marginBottom: 10 }}>Sport pratiqué</label>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 10 }}>
                {FIRST_USE_SPORTS.map((sport) => {
                  const selected = firstUse.sport === sport;
                  return (
                    <button
                      key={sport}
                      type="button"
                      onClick={() => {
                        const defaults = sportDefaults(sport);
                        setFirstUse((prev) => ({ ...prev, sport, ...defaults }));
                      }}
                      style={{
                        borderRadius: 10,
                        padding: '10px 12px',
                        border: `1px solid ${selected ? 'var(--color-accent)' : 'var(--color-border)'}`,
                        background: selected ? 'color-mix(in srgb, var(--color-accent) 10%, var(--color-bg-card))' : 'var(--color-bg-card)',
                        color: selected ? 'var(--color-accent)' : 'var(--color-text)',
                        fontWeight: 700,
                        cursor: 'pointer',
                      }}
                    >
                      {sport}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {firstUseStep === 2 && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 12 }}>
              <label style={{ fontSize: 13, fontWeight: 700 }}>
                Distance (km)
                <input
                  type="number"
                  min={1}
                  value={firstUse.distance}
                  onChange={(e) => setFirstUse((prev) => ({ ...prev, distance: Number(e.target.value) }))}
                  style={{ ...S.card, marginBottom: 0, marginTop: 6, padding: '10px 12px' }}
                />
              </label>
              <label style={{ fontSize: 13, fontWeight: 700 }}>
                Durée
                <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: 8, marginTop: 6 }}>
                <input
                  type="number"
                  min={firstUse.durationUnit === 'minutes' ? 30 : 0.5}
                  step={firstUse.durationUnit === 'minutes' ? 5 : 0.5}
                  value={firstUse.durationValue}
                  onChange={(e) => setFirstUse((prev) => ({ ...prev, durationValue: Number(e.target.value) }))}
                  style={{ ...S.card, marginBottom: 0, padding: '10px 12px' }}
                />
                <select
                  value={firstUse.durationUnit}
                  onChange={(e) =>
                    setFirstUse((prev) => ({ ...prev, durationUnit: e.target.value as FirstUseDraft['durationUnit'] }))
                  }
                  style={{ ...S.card, marginBottom: 0, padding: '10px 12px' }}
                >
                  <option value="hours">heures</option>
                  <option value="minutes">minutes</option>
                </select>
                </div>
              </label>
              <label style={{ fontSize: 13, fontWeight: 700 }}>
                Dénivelé (m D+)
                <input
                  type="number"
                  min={0}
                  step={50}
                  value={firstUse.elevationGain}
                  onChange={(e) => setFirstUse((prev) => ({ ...prev, elevationGain: Number(e.target.value) }))}
                  style={{ ...S.card, marginBottom: 0, marginTop: 6, padding: '10px 12px' }}
                />
              </label>
            </div>
          )}

          {firstUseStep === 3 && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 12 }}>
              <label style={{ fontSize: 13, fontWeight: 700 }}>
                Poids (kg)
                <input
                  type="number"
                  min={35}
                  max={130}
                  value={firstUse.weight}
                  onChange={(e) => setFirstUse((prev) => ({ ...prev, weight: Number(e.target.value) }))}
                  style={{ ...S.card, marginBottom: 0, marginTop: 6, padding: '10px 12px' }}
                />
              </label>
              <label style={{ fontSize: 13, fontWeight: 700 }}>
                Transpiration (L/h)
                <input
                  type="number"
                  min={0.4}
                  max={2.5}
                  step={0.1}
                  value={firstUse.sweatRate}
                  onChange={(e) => setFirstUse((prev) => ({ ...prev, sweatRate: Number(e.target.value) }))}
                  style={{ ...S.card, marginBottom: 0, marginTop: 6, padding: '10px 12px' }}
                />
              </label>
              <label style={{ fontSize: 13, fontWeight: 700 }}>
                Tolérance digestive
                <select
                  value={firstUse.giTolerance}
                  onChange={(e) =>
                    setFirstUse((prev) => ({
                      ...prev,
                      giTolerance: e.target.value as FirstUseDraft['giTolerance'],
                    }))
                  }
                  style={{ ...S.card, marginBottom: 0, marginTop: 6, padding: '10px 12px' }}
                >
                  <option value="sensitive">Sensible</option>
                  <option value="normal">Normale</option>
                  <option value="robust">Robuste</option>
                </select>
              </label>
            </div>
          )}

          {firstUseStep === 4 && (
            <div
              style={{
                padding: 14,
                borderRadius: 12,
                border: '1px solid var(--color-border)',
                background: 'color-mix(in srgb, var(--color-accent) 5%, var(--color-bg-card))',
                marginBottom: 6,
                color: 'var(--color-text-muted)',
                fontSize: 14,
                lineHeight: 1.5,
              }}
            >
              {firstUse.sport} · {firstUse.distance} km · {firstUse.durationValue}{' '}
              {firstUse.durationUnit === 'hours' ? 'h' : 'min'} · {firstUse.elevationGain} m D+ · {firstUse.weight} kg ·{' '}
              {firstUse.sweatRate} L/h
            </div>
          )}

          <div style={{ display: 'flex', gap: 10, marginTop: 16, justifyContent: 'space-between', flexWrap: 'wrap' }}>
            <button
              type="button"
              onClick={() => setFirstUseStep((s) => (s > 1 ? ((s - 1) as 1 | 2 | 3 | 4) : s))}
              disabled={firstUseStep === 1}
              className="fuel-btn-pill"
              style={{ opacity: firstUseStep === 1 ? 0.45 : 1 }}
            >
              Retour
            </button>
            {firstUseStep < 4 ? (
              <button
                type="button"
                onClick={() => setFirstUseStep((s) => (s < 4 ? ((s + 1) as 1 | 2 | 3 | 4) : s))}
                className="fuel-btn-pill fuel-btn-pill-accent font-display"
              >
                Étape suivante
              </button>
            ) : (
              <Link href={firstUsePlanHref} className="fuel-btn-pill fuel-btn-pill-accent font-display">
                Générer mon premier plan
              </Link>
            )}
          </div>
          </div>
        )}

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
            marginBottom: 32,
            overflow: 'hidden',
            padding: 0,
          }}
        >
          {[
            { value: `${PRODUCTS.length}+`, label: 'Produits catalogés' },
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
