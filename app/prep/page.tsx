'use client';

import { useCallback, useEffect, useMemo, useState, type CSSProperties } from 'react';
import Link from 'next/link';
import type { AthleteProfile, EventDetails, FuelPlan } from '../lib/types';
import usePageTitle from '../lib/hooks/usePageTitle';
import { Header } from '../components/Header';
import {
  type CarbDayKey,
  type DietStyle,
  DEFAULT_CARB_G_PER_KG,
  RACE_MATERIAL_CHECKLIST,
  carbDayChecklist,
  dailyChoFromBody,
  getCarbLoadingMealBlocks,
  inferDietFromProfile,
  seedDropBagsFromAid,
  summarizeRaceNutritionFromPlan,
} from '../lib/prepContent';

const PREP_STORAGE_KEY = 'fuelos_prep_state';
const ACTIVE_PLAN_KEY = 'fuelos_active_plan';

const S = {
  page: {
    minHeight: '100vh',
    background: 'var(--color-bg)',
    color: 'var(--color-text)',
    fontFamily: 'system-ui, sans-serif',
  } as CSSProperties,
  main: { maxWidth: 920, margin: '0 auto', padding: '28px 24px 56px' } as CSSProperties,
  card: {
    background: 'var(--color-bg-card)',
    border: '1px solid var(--color-border)',
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
  } as CSSProperties,
  muted: { color: 'var(--color-text-muted)', fontSize: 14, lineHeight: 1.55 } as CSSProperties,
  h1: { fontWeight: 900, fontSize: 'clamp(1.35rem, 2.5vw, 1.75rem)', margin: '0 0 8px' } as CSSProperties,
  h2: { fontWeight: 800, fontSize: 16, margin: '0 0 12px' } as CSSProperties,
  navPills: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 20,
  } as CSSProperties,
  pill: {
    padding: '8px 14px',
    borderRadius: 99,
    fontSize: 13,
    fontWeight: 700,
    border: '1px solid var(--color-border)',
    background: 'transparent',
    color: 'var(--color-text-muted)',
    cursor: 'pointer',
    textDecoration: 'none',
  } as CSSProperties,
  pillActive: {
    padding: '8px 14px',
    borderRadius: 99,
    fontSize: 13,
    fontWeight: 800,
    border: '1px solid #fb923c',
    background: 'color-mix(in srgb, #fb923c 14%, transparent)',
    color: 'var(--color-text)',
    cursor: 'pointer',
  } as CSSProperties,
  input: {
    width: '100%',
    maxWidth: 120,
    padding: '8px 10px',
    borderRadius: 8,
    border: '1px solid var(--color-border)',
    background: 'var(--color-bg)',
    color: 'var(--color-text)',
    fontSize: 14,
  } as CSSProperties,
  inputWide: {
    width: '100%',
    padding: '8px 10px',
    borderRadius: 8,
    border: '1px solid var(--color-border)',
    background: 'var(--color-bg)',
    color: 'var(--color-text)',
    fontSize: 14,
  } as CSSProperties,
  textarea: {
    width: '100%',
    minHeight: 120,
    padding: '10px 12px',
    borderRadius: 10,
    border: '1px solid var(--color-border)',
    background: 'var(--color-bg)',
    color: 'var(--color-text)',
    fontSize: 14,
    lineHeight: 1.5,
    resize: 'vertical' as const,
  } as CSSProperties,
  progressBar: {
    height: 8,
    borderRadius: 99,
    background: 'var(--color-border)',
    overflow: 'hidden',
    marginTop: 8,
  } as CSSProperties,
  progressFill: (pct: number) =>
    ({
      height: '100%',
      width: `${pct}%`,
      background: 'linear-gradient(90deg, #fb923c, #4ade80)',
      transition: 'width 0.2s ease',
    }) as CSSProperties,
  btnOutline: {
    padding: '8px 14px',
    borderRadius: 8,
    background: 'transparent',
    color: 'var(--color-text)',
    fontWeight: 600,
    fontSize: 13,
    border: '1px solid var(--color-border)',
    cursor: 'pointer',
  } as CSSProperties,
  btnSm: {
    padding: '6px 12px',
    borderRadius: 8,
    background: 'var(--color-accent)',
    color: '#000',
    fontWeight: 700,
    fontSize: 12,
    border: 'none',
    cursor: 'pointer',
  } as CSSProperties,
};

type ActiveBundle = {
  fuelPlan?: FuelPlan;
  profile?: AthleteProfile;
  event?: EventDetails;
};

type DropBagRow = { id: string; cpLabel: string; distanceKm: string; contents: string };

type PrepPersisted = {
  carbGPerKg: Record<CarbDayKey, number>;
  dietStyle: DietStyle;
  checkedCarb: Record<string, boolean>;
  checkedRaceMat: Record<string, boolean>;
  breakfastTime: string;
  breakfastComposition: string;
  breakfastQuantityNote: string;
  preStartProtocol: string;
  dropBags: DropBagRow[];
};

const DEFAULT_PRESTART = `—3h00 : Petit-déjeuner (voir encadré) + hydra habituelle
—2h00 : Dernière grande boisson si besoin (400–500 ml), puis petites gorgées régulières
—60 min : 200–300 ml eau ou boisson + électrolytes si chaud / effort long
—20–15 min : 1 gel d’échauffement (~25–30 g CHO) si validé à l’entraînement
—45–60 min avant le départ : caféine prévue (ex. espresso) si stratégie habituelle`;

const CARB_DAYS: { key: CarbDayKey; title: string; subtitle: string }[] = [
  { key: 'j3', title: 'J−3', subtitle: 'Lancement doux de la charge' },
  { key: 'j2', title: 'J−2', subtitle: 'Pic glucidique principal' },
  { key: 'j1', title: 'J−1', subtitle: 'Maintien + faciliter digestion' },
];

function loadOrInitPrep(): PrepPersisted {
  if (typeof window === 'undefined') {
    return {
      carbGPerKg: { ...DEFAULT_CARB_G_PER_KG },
      dietStyle: 'omnivore',
      checkedCarb: {},
      checkedRaceMat: {},
      breakfastTime: '06:30',
      breakfastComposition: '',
      breakfastQuantityNote: '',
      preStartProtocol: DEFAULT_PRESTART,
      dropBags: [],
    };
  }
  try {
    const raw = localStorage.getItem(PREP_STORAGE_KEY);
    if (raw) {
      const p = JSON.parse(raw) as Partial<PrepPersisted>;
      return {
        carbGPerKg: {
          j3: typeof p.carbGPerKg?.j3 === 'number' ? p.carbGPerKg.j3 : DEFAULT_CARB_G_PER_KG.j3,
          j2: typeof p.carbGPerKg?.j2 === 'number' ? p.carbGPerKg.j2 : DEFAULT_CARB_G_PER_KG.j2,
          j1: typeof p.carbGPerKg?.j1 === 'number' ? p.carbGPerKg.j1 : DEFAULT_CARB_G_PER_KG.j1,
        },
        dietStyle: p.dietStyle && ['omnivore', 'vegetarian', 'vegan', 'gluten_free'].includes(p.dietStyle)
          ? p.dietStyle
          : 'omnivore',
        checkedCarb: typeof p.checkedCarb === 'object' && p.checkedCarb !== null ? p.checkedCarb : {},
        checkedRaceMat: typeof p.checkedRaceMat === 'object' && p.checkedRaceMat !== null ? p.checkedRaceMat : {},
        breakfastTime: typeof p.breakfastTime === 'string' ? p.breakfastTime : '06:30',
        breakfastComposition: typeof p.breakfastComposition === 'string' ? p.breakfastComposition : '',
        breakfastQuantityNote: typeof p.breakfastQuantityNote === 'string' ? p.breakfastQuantityNote : '',
        preStartProtocol: typeof p.preStartProtocol === 'string' && p.preStartProtocol.trim()
          ? p.preStartProtocol
          : DEFAULT_PRESTART,
        dropBags: Array.isArray(p.dropBags) ? p.dropBags : [],
      };
    }
  } catch {
    /* ignore */
  }
  return {
    carbGPerKg: { ...DEFAULT_CARB_G_PER_KG },
    dietStyle: 'omnivore',
    checkedCarb: {},
    checkedRaceMat: {},
    breakfastTime: '06:30',
    breakfastComposition: '',
    breakfastQuantityNote: '',
    preStartProtocol: DEFAULT_PRESTART,
    dropBags: [],
  };
}

function newBagId(): string {
  return `bag-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export default function PrepPage() {
  usePageTitle('Prep');
  const [bundle, setBundle] = useState<ActiveBundle | null>(null);
  const [prep, setPrep] = useState<PrepPersisted>(() => loadOrInitPrep());
  const [section, setSection] = useState<'carb' | 'race' | 'drop'>('carb');

  useEffect(() => {
    try {
      const raw = localStorage.getItem(ACTIVE_PLAN_KEY);
      if (raw) {
        const b = JSON.parse(raw) as ActiveBundle;
        setBundle(b);
      }
    } catch {
      setBundle(null);
    }

    const onStorage = (e: StorageEvent) => {
      if (e.key === ACTIVE_PLAN_KEY && e.newValue) {
        try {
          setBundle(JSON.parse(e.newValue) as ActiveBundle);
        } catch {
          /* ignore */
        }
      }
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  const persist = useCallback((next: PrepPersisted) => {
    setPrep(next);
    try {
      localStorage.setItem(PREP_STORAGE_KEY, JSON.stringify(next));
    } catch {
      /* ignore */
    }
  }, []);

  const profile = bundle?.profile ?? null;
  const event = bundle?.event ?? null;
  const plan = bundle?.fuelPlan ?? null;

  const weight = profile?.weight && profile.weight > 0 ? profile.weight : 70;
  const dietFromProfile = inferDietFromProfile(profile);

  const effectiveDiet = useMemo(() => {
    if (prep.dietStyle === 'omnivore' && dietFromProfile === 'gluten_free') {
      return 'gluten_free' as DietStyle;
    }
    return prep.dietStyle;
  }, [prep.dietStyle, dietFromProfile]);

  const nutritionSummary = useMemo(() => summarizeRaceNutritionFromPlan(plan), [plan]);

  const carbChecklistAll = useMemo(() => {
    const out: { id: string; label: string }[] = [];
    for (const d of CARB_DAYS) {
      for (const item of carbDayChecklist(d.key, d.title)) {
        out.push(item);
      }
    }
    return out;
  }, []);

  const carbProgress = useMemo(() => {
    const total = carbChecklistAll.length;
    const done = carbChecklistAll.filter((c) => prep.checkedCarb[c.id]).length;
    return { total, done, pct: total ? Math.round((done / total) * 100) : 0 };
  }, [carbChecklistAll, prep.checkedCarb]);

  const raceMatProgress = useMemo(() => {
    const total = RACE_MATERIAL_CHECKLIST.length;
    const done = RACE_MATERIAL_CHECKLIST.filter((c) => prep.checkedRaceMat[c.id]).length;
    return { total, done, pct: total ? Math.round((done / total) * 100) : 0 };
  }, [prep.checkedRaceMat]);

  const toggleCarb = (id: string) => {
    persist({
      ...prep,
      checkedCarb: { ...prep.checkedCarb, [id]: !prep.checkedCarb[id] },
    });
  };

  const toggleRaceMat = (id: string) => {
    persist({
      ...prep,
      checkedRaceMat: { ...prep.checkedRaceMat, [id]: !prep.checkedRaceMat[id] },
    });
  };

  const setCarbG = (key: CarbDayKey, value: number) => {
    const v = Math.min(12, Math.max(4, value));
    persist({ ...prep, carbGPerKg: { ...prep.carbGPerKg, [key]: v } });
  };

  const importAidToDropBags = () => {
    const seeds = seedDropBagsFromAid(event?.aidStations);
    const existing = prep.dropBags;
    const rows: DropBagRow[] = seeds.map((s) => ({
      id: newBagId(),
      cpLabel: s.cpLabel,
      distanceKm: s.distanceKm,
      contents: '',
    }));
    persist({
      ...prep,
      dropBags: [...existing, ...rows.filter((r) => !existing.some((e) => e.cpLabel === r.cpLabel && e.distanceKm === r.distanceKm))],
    });
  };

  const breakfastDefaultHint =
    'Ex. : flocons d’avoine 70–80 g + banane + miel ; ou pain / confiture + jus ; café si habitude. Adapter au profil digestif.';

  return (
    <div style={S.page}>
      <Header activePage="prep" />
      <main style={S.main}>
        <p style={{ ...S.muted, margin: '0 0 6px', fontSize: 12, fontWeight: 700, letterSpacing: '0.08em', color: '#fb923c' }}>
          PRÉPARATION PRÉ-COURSE
        </p>
        <h1 style={S.h1}>Prep — charge, jour J & drop bags</h1>
        <p style={{ ...S.muted, margin: '0 0 20px' }}>
          Assistant carb-loading (J−3 à J−1), checklists, petit-déjeuner & protocole pré-départ. Les données du{' '}
          <Link href="/plan" style={{ color: '#fb923c', fontWeight: 700 }}>
            plan actif
          </Link>{' '}
          alimentent les repères gels / flasques quand disponibles.
        </p>

        {!bundle?.fuelPlan && (
          <div
            style={{
              ...S.card,
              borderColor: 'color-mix(in srgb, #fb923c 35%, var(--color-border))',
              marginBottom: 24,
            }}
          >
            <strong style={{ display: 'block', marginBottom: 6 }}>Aucun plan actif détecté</strong>
            <p style={{ ...S.muted, margin: 0 }}>
              Générez un plan dans l’onglet Plan pour afficher automatiquement le nombre de gels prévus et importer les CP du
              parcours dans le builder de sacs.
            </p>
          </div>
        )}

        <nav style={S.navPills} aria-label="Sections Prep">
          {(
            [
              ['carb', 'Carb loading'],
              ['race', 'Jour J'],
              ['drop', 'Drop bags'],
            ] as const
          ).map(([key, label]) => (
            <button
              key={key}
              type="button"
              onClick={() => setSection(key)}
              style={section === key ? S.pillActive : S.pill}
            >
              {label}
            </button>
          ))}
        </nav>

        {section === 'carb' && (
          <>
            <div style={S.card}>
              <h2 style={S.h2}>Objectifs glucides (g CHO / kg / jour)</h2>
              <p style={S.muted}>
                Repères usuels en charge : ~6–10 g/kg selon tolérance digestive et volume d’entraînement. Ajustez avec votre
                praticien si besoin. Poids utilisé pour le calcul :{' '}
                <strong>
                  {weight} kg{profile ? '' : ' (défaut — renseignez le profil dans Plan)'}
                </strong>
                .
              </p>
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                  gap: 16,
                  marginTop: 16,
                }}
              >
                {CARB_DAYS.map((d) => {
                  const gKg = prep.carbGPerKg[d.key];
                  const total = dailyChoFromBody(weight, gKg);
                  return (
                    <div
                      key={d.key}
                      style={{
                        padding: 14,
                        borderRadius: 10,
                        border: '1px solid var(--color-border)',
                        background: 'color-mix(in srgb, var(--color-bg) 90%, transparent)',
                      }}
                    >
                      <div style={{ fontWeight: 800, fontSize: 15, marginBottom: 4 }}>{d.title}</div>
                      <div style={{ ...S.muted, fontSize: 12, marginBottom: 10 }}>{d.subtitle}</div>
                      <label style={{ display: 'block', fontSize: 12, fontWeight: 700, marginBottom: 6 }}>
                        g CHO / kg
                      </label>
                      <input
                        type="number"
                        min={4}
                        max={12}
                        step={0.5}
                        value={gKg}
                        onChange={(e) => setCarbG(d.key, parseFloat(e.target.value) || DEFAULT_CARB_G_PER_KG[d.key])}
                        style={S.input}
                      />
                      <div style={{ marginTop: 10, fontSize: 14, fontWeight: 700 }}>
                        ≈ {total} g CHO / jour
                      </div>
                    </div>
                  );
                })}
              </div>

              <div style={{ marginTop: 20 }}>
                <label style={{ display: 'block', fontWeight: 700, fontSize: 13, marginBottom: 8 }}>
                  Régime pour les exemples de repas
                </label>
                <select
                  value={prep.dietStyle}
                  onChange={(e) =>
                    persist({ ...prep, dietStyle: e.target.value as DietStyle })
                  }
                  style={{ ...S.inputWide, maxWidth: 280 }}
                >
                  <option value="omnivore">Omnivore</option>
                  <option value="vegetarian">Végétarien</option>
                  <option value="vegan">Vegan</option>
                  <option value="gluten_free">Sans gluten</option>
                </select>
                {dietFromProfile === 'gluten_free' && prep.dietStyle === 'omnivore' && (
                  <p style={{ ...S.muted, fontSize: 13, marginTop: 8 }}>
                    Votre profil mentionne une sensibilité au gluten — pensez à basculer sur « Sans gluten » pour les suggestions.
                  </p>
                )}
              </div>
            </div>

            {CARB_DAYS.map((d) => {
              const daily = dailyChoFromBody(weight, prep.carbGPerKg[d.key]);
              const blocks = getCarbLoadingMealBlocks(effectiveDiet, daily);
              const checklist = carbDayChecklist(d.key, d.title);
              return (
                <div key={d.key} style={S.card}>
                  <h2 style={S.h2}>
                    {d.title} — exemples concrets (~{daily} g CHO visés)
                  </h2>
                  <div style={{ display: 'grid', gap: 14 }}>
                    {blocks.map((b) => (
                      <div
                        key={b.label}
                        style={{
                          padding: 14,
                          borderRadius: 10,
                          border: '1px solid color-mix(in srgb, #fb923c 22%, var(--color-border))',
                        }}
                      >
                        <div style={{ fontWeight: 800, marginBottom: 8 }}>
                          {b.label}{' '}
                          <span style={{ ...S.muted, fontWeight: 600, fontSize: 12 }}>~{b.approxChoG} g CHO</span>
                        </div>
                        <ul style={{ margin: 0, paddingLeft: 18, ...S.muted }}>
                          {b.items.map((line) => (
                            <li key={line} style={{ marginBottom: 4 }}>
                              {line}
                            </li>
                          ))}
                        </ul>
                      </div>
                    ))}
                  </div>

                  <h3 style={{ ...S.h2, marginTop: 22, fontSize: 15 }}>Checklist {d.title}</h3>
                  <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                    {checklist.map((item) => (
                      <li key={item.id} style={{ marginBottom: 10 }}>
                        <label
                          style={{
                            display: 'flex',
                            gap: 12,
                            alignItems: 'flex-start',
                            cursor: 'pointer',
                            fontSize: 14,
                          }}
                        >
                          <input
                            type="checkbox"
                            checked={!!prep.checkedCarb[item.id]}
                            onChange={() => toggleCarb(item.id)}
                            style={{ marginTop: 3 }}
                          />
                          <span>{item.label}</span>
                        </label>
                      </li>
                    ))}
                  </ul>
                </div>
              );
            })}

            <div style={S.card}>
              <h2 style={S.h2}>Progression charge (J−3 → J−1)</h2>
              <div style={{ fontSize: 14, fontWeight: 700 }}>
                {carbProgress.done} / {carbProgress.total} étapes cochées
              </div>
              <div style={S.progressBar}>
                <div style={S.progressFill(carbProgress.pct)} />
              </div>
            </div>
          </>
        )}

        {section === 'race' && (
          <>
            {plan && (
              <div style={S.card}>
                <h2 style={S.h2}>Repères depuis le plan actif</h2>
                <ul style={{ ...S.muted, paddingLeft: 18, margin: 0 }}>
                  <li>
                    <strong>Gels prévus sur la timeline :</strong> {nutritionSummary.gelCount} (~{nutritionSummary.gelChoG} g CHO
                    cumulés)
                  </li>
                  <li>
                    <strong>Prises avec hydratation marquée (repère flasques) :</strong> ~{nutritionSummary.flaskHints} segment(s)
                  </li>
                </ul>
              </div>
            )}

            <div style={S.card}>
              <h2 style={S.h2}>Checklist matériel nutrition</h2>
              <p style={S.muted}>Valide chaque point avant de partir — la liste reste stockée sur cet appareil.</p>
              <ul style={{ listStyle: 'none', padding: 0, margin: '12px 0 0' }}>
                {RACE_MATERIAL_CHECKLIST.map((item) => (
                  <li key={item.id} style={{ marginBottom: 10 }}>
                    <label
                      style={{
                        display: 'flex',
                        gap: 12,
                        alignItems: 'flex-start',
                        cursor: 'pointer',
                        fontSize: 14,
                      }}
                    >
                      <input
                        type="checkbox"
                        checked={!!prep.checkedRaceMat[item.id]}
                        onChange={() => toggleRaceMat(item.id)}
                        style={{ marginTop: 3 }}
                      />
                      <span>{item.label}</span>
                    </label>
                  </li>
                ))}
              </ul>
              <div style={{ marginTop: 16 }}>
                <div style={{ fontSize: 14, fontWeight: 700 }}>
                  {raceMatProgress.done} / {raceMatProgress.total}
                </div>
                <div style={S.progressBar}>
                  <div style={S.progressFill(raceMatProgress.pct)} />
                </div>
              </div>
            </div>

            <div style={S.card}>
              <h2 style={S.h2}>Petit-déjeuner jour J</h2>
              <div style={{ display: 'grid', gap: 14, maxWidth: 520 }}>
                <div>
                  <label style={{ display: 'block', fontWeight: 700, fontSize: 13, marginBottom: 6 }}>Heure cible</label>
                  <input
                    type="time"
                    value={prep.breakfastTime}
                    onChange={(e) => persist({ ...prep, breakfastTime: e.target.value })}
                    style={S.inputWide}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontWeight: 700, fontSize: 13, marginBottom: 6 }}>
                    Composition (repères)
                  </label>
                  <textarea
                    value={prep.breakfastComposition}
                    onChange={(e) => persist({ ...prep, breakfastComposition: e.target.value })}
                    placeholder={breakfastDefaultHint}
                    style={S.textarea}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontWeight: 700, fontSize: 13, marginBottom: 6 }}>
                    Quantités / notes digestives
                  </label>
                  <textarea
                    value={prep.breakfastQuantityNote}
                    onChange={(e) => persist({ ...prep, breakfastQuantityNote: e.target.value })}
                    placeholder="Ex. : viser 3–4 g/kg CHO si fenêtre courte ; éviter nouveaux aliments ; boisson habituelle."
                    style={{ ...S.textarea, minHeight: 80 }}
                  />
                </div>
              </div>
            </div>

            <div style={S.card}>
              <h2 style={S.h2}>Protocole pré-départ</h2>
              <p style={S.muted}>
                Hydratation, gel d’échauffement, caféine : personnalisez selon ce que vous avez testé. Gardez la même structure que
                vos sorties clés.
              </p>
              <textarea
                value={prep.preStartProtocol}
                onChange={(e) => persist({ ...prep, preStartProtocol: e.target.value })}
                style={{ ...S.textarea, minHeight: 160 }}
              />
            </div>
          </>
        )}

        {section === 'drop' && (
          <div style={S.card}>
            <h2 style={S.h2}>Drop bag builder (ultras & ravitos avancés)</h2>
            <p style={S.muted}>
              Pour chaque point : notez le contenu (vêtements, réserves gels, barres, stick lubrifiant, frontale, etc.). Les CP
              viennent du plan si vous les avez saisis à l’étape « course ».
            </p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, marginBottom: 16 }}>
              <button type="button" style={S.btnSm} onClick={() => importAidToDropBags()}>
                Importer les CP du plan
              </button>
              <button
                type="button"
                style={S.btnOutline}
                onClick={() =>
                  persist({
                    ...prep,
                    dropBags: [...prep.dropBags, { id: newBagId(), cpLabel: '', distanceKm: '', contents: '' }],
                  })
                }
              >
                + Sac vide
              </button>
            </div>
            <div style={{ display: 'grid', gap: 16 }}>
              {prep.dropBags.length === 0 && (
                <p style={S.muted}>Ajoutez un sac ou importez les CP depuis le plan.</p>
              )}
              {prep.dropBags.map((row, idx) => (
                <div
                  key={row.id}
                  style={{
                    padding: 16,
                    borderRadius: 10,
                    border: '1px solid var(--color-border)',
                    background: 'color-mix(in srgb, var(--color-bg) 88%, transparent)',
                  }}
                >
                  <div style={{ fontWeight: 800, fontSize: 13, marginBottom: 12, color: '#fb923c' }}>
                    Sac {idx + 1}
                  </div>
                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
                      gap: 12,
                      marginBottom: 12,
                    }}
                  >
                    <div>
                      <label style={{ fontSize: 11, fontWeight: 700, display: 'block', marginBottom: 4 }}>CP / lieu</label>
                      <input
                        value={row.cpLabel}
                        onChange={(e) => {
                          const next = prep.dropBags.map((r) =>
                            r.id === row.id ? { ...r, cpLabel: e.target.value } : r
                          );
                          persist({ ...prep, dropBags: next });
                        }}
                        placeholder="Ex. : Arnouvaz km 43"
                        style={S.inputWide}
                      />
                    </div>
                    <div>
                      <label style={{ fontSize: 11, fontWeight: 700, display: 'block', marginBottom: 4 }}>Distance (km)</label>
                      <input
                        value={row.distanceKm}
                        onChange={(e) => {
                          const next = prep.dropBags.map((r) =>
                            r.id === row.id ? { ...r, distanceKm: e.target.value } : r
                          );
                          persist({ ...prep, dropBags: next });
                        }}
                        placeholder="43"
                        style={S.inputWide}
                      />
                    </div>
                  </div>
                  <label style={{ fontSize: 11, fontWeight: 700, display: 'block', marginBottom: 4 }}>Contenu</label>
                  <textarea
                    value={row.contents}
                    onChange={(e) => {
                      const next = prep.dropBags.map((r) =>
                        r.id === row.id ? { ...r, contents: e.target.value } : r
                      );
                      persist({ ...prep, dropBags: next });
                    }}
                    placeholder="Gels ×2, surchemise, pinces multiprise, 500 ml poudre…"
                    style={{ ...S.textarea, minHeight: 90 }}
                  />
                  <button
                    type="button"
                    style={{ ...S.btnOutline, marginTop: 10, color: 'var(--color-danger)', borderColor: 'var(--color-danger)' }}
                    onClick={() =>
                      persist({ ...prep, dropBags: prep.dropBags.filter((r) => r.id !== row.id) })
                    }
                  >
                    Supprimer ce sac
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        <p style={{ ...S.muted, fontSize: 12, marginTop: 8 }}>
          Informations éducatives — ne remplacent pas un suivi médical ou nutritionnel individualisé.
        </p>
      </main>
    </div>
  );
}
