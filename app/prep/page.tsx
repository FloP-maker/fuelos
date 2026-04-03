'use client';

import { useCallback, useEffect, useMemo, useState, type CSSProperties } from 'react';
import Link from 'next/link';
import type { AthleteProfile, EventDetails, FuelPlan } from '../lib/types';
import usePageTitle from '../lib/hooks/usePageTitle';
import { Header } from '../components/Header';
import {
  type CarbDayKey,
  type CarbLoadWindow,
  type DietStyle,
  CARB_DAY_ORDER,
  RACE_MATERIAL_CHECKLIST,
  buildDayPurchaseListFromBlocks,
  buildPostRaceProtocol,
  carbDayChecklist,
  carbDayMeta,
  dailyChoFromBody,
  defaultCarbGPerKg,
  enrichPurchaseLinesSeasonal,
  estimateDayPurchasePriceEUR,
  getPrepSeasonContext,
  inferDietFromProfile,
  pickCarbMealExamples,
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
  detailsRecipe: {
    marginTop: 12,
    borderRadius: 10,
    border: '1px solid color-mix(in srgb, #fb923c 28%, var(--color-border))',
    padding: '12px 14px',
    background: 'color-mix(in srgb, var(--color-bg) 94%, transparent)',
  } as CSSProperties,
  detailsSummary: {
    cursor: 'pointer',
    fontWeight: 800,
    fontSize: 14,
    listStyle: 'none',
  } as CSSProperties,
};

const SHOP_COUNTRY_OPTIONS: { code: string; label: string }[] = [
  { code: 'FR', label: 'France' },
  { code: 'BE', label: 'Belgique' },
  { code: 'CH', label: 'Suisse' },
  { code: 'DE', label: 'Allemagne' },
  { code: 'ES', label: 'Espagne' },
  { code: 'IT', label: 'Italie' },
  { code: 'GB', label: 'Royaume-Uni' },
  { code: 'CA', label: 'Canada' },
  { code: 'US', label: 'États-Unis' },
  { code: 'AU', label: 'Australie' },
  { code: 'NZ', label: 'Nouvelle-Zélande' },
  { code: 'RE', label: 'La Réunion (hémisphère sud)' },
];

type ActiveBundle = {
  fuelPlan?: FuelPlan;
  profile?: AthleteProfile;
  event?: EventDetails;
};

type DropBagRow = { id: string; cpLabel: string; distanceKm: string; contents: string };

type PrepPersisted = {
  carbWindow: CarbLoadWindow;
  carbGPerKg: Record<CarbDayKey, number>;
  mealIdeasSalt: Record<CarbDayKey, number>;
  dietStyle: DietStyle;
  checkedCarb: Record<string, boolean>;
  checkedRaceMat: Record<string, boolean>;
  breakfastTime: string;
  breakfastComposition: string;
  breakfastQuantityNote: string;
  preStartProtocol: string;
  dropBags: DropBagRow[];
  recoveryCryotherapy: boolean;
  recoveryNaturalCare: boolean;
  recoveryMassage: boolean;
  recoverySaunaOk: boolean;
  shoppingCountryCode: string;
  shoppingCity: string;
  seasonDateMode: 'today' | 'custom';
  seasonCustomDate: string;
};

const DEFAULT_PRESTART = `—3h00 : Petit-déjeuner (voir encadré) + hydra habituelle
—2h00 : Dernière grande boisson si besoin (400–500 ml), puis petites gorgées régulières
—60 min : 200–300 ml eau ou boisson + électrolytes si chaud / effort long
—20–15 min : 1 gel d’échauffement (~25–30 g CHO) si validé à l’entraînement
—45–60 min avant le départ : caféine prévue (ex. espresso) si stratégie habituelle`;

function normalizeCarbGPerKg(
  stored: Partial<Record<CarbDayKey, number>> | undefined,
  window: CarbLoadWindow
): Record<CarbDayKey, number> {
  const base = defaultCarbGPerKg(window);
  if (!stored) return { ...base };
  const out = { ...base };
  for (const k of CARB_DAY_ORDER) {
    const v = stored[k];
    if (typeof v === 'number' && !Number.isNaN(v)) out[k] = v;
  }
  return out;
}

function normalizeMealIdeasSalt(stored: Partial<Record<CarbDayKey, number>> | undefined): Record<CarbDayKey, number> {
  const out = Object.fromEntries(CARB_DAY_ORDER.map((k) => [k, 0])) as Record<CarbDayKey, number>;
  if (!stored) return out;
  for (const k of CARB_DAY_ORDER) {
    const v = stored[k];
    if (typeof v === 'number' && !Number.isNaN(v)) out[k] = v;
  }
  return out;
}

function loadOrInitPrep(): PrepPersisted {
  const empty = (): PrepPersisted => {
    const w: CarbLoadWindow = '3';
    return {
      carbWindow: w,
      carbGPerKg: defaultCarbGPerKg(w),
      mealIdeasSalt: normalizeMealIdeasSalt(undefined),
      dietStyle: 'omnivore',
      checkedCarb: {},
      checkedRaceMat: {},
      breakfastTime: '06:30',
      breakfastComposition: '',
      breakfastQuantityNote: '',
      preStartProtocol: DEFAULT_PRESTART,
      dropBags: [],
      recoveryCryotherapy: false,
      recoveryNaturalCare: false,
      recoveryMassage: false,
      recoverySaunaOk: false,
      shoppingCountryCode: 'FR',
      shoppingCity: '',
      seasonDateMode: 'today',
      seasonCustomDate: '',
    };
  };
  if (typeof window === 'undefined') {
    return empty();
  }
  try {
    const raw = localStorage.getItem(PREP_STORAGE_KEY);
    if (raw) {
      const p = JSON.parse(raw) as Partial<PrepPersisted> & { mealIdeasSalt?: unknown };
      const carbWindow: CarbLoadWindow =
        p.carbWindow === '7' || p.carbWindow === '3' ? p.carbWindow : '3';
      const rawSalt = p.mealIdeasSalt;
      let mealIdeasSalt: Record<CarbDayKey, number>;
      if (typeof rawSalt === 'number') {
        mealIdeasSalt = normalizeMealIdeasSalt(undefined);
        for (const k of CARB_DAY_ORDER) mealIdeasSalt[k] = rawSalt;
      } else {
        mealIdeasSalt = normalizeMealIdeasSalt(
          rawSalt && typeof rawSalt === 'object' ? (rawSalt as Partial<Record<CarbDayKey, number>>) : undefined
        );
      }
      return {
        carbWindow,
        carbGPerKg: normalizeCarbGPerKg(p.carbGPerKg, carbWindow),
        mealIdeasSalt,
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
        recoveryCryotherapy: !!p.recoveryCryotherapy,
        recoveryNaturalCare: !!p.recoveryNaturalCare,
        recoveryMassage: !!p.recoveryMassage,
        recoverySaunaOk: !!p.recoverySaunaOk,
        shoppingCountryCode:
          typeof p.shoppingCountryCode === 'string' && p.shoppingCountryCode.length === 2
            ? p.shoppingCountryCode.toUpperCase()
            : 'FR',
        shoppingCity: typeof p.shoppingCity === 'string' ? p.shoppingCity : '',
        seasonDateMode: p.seasonDateMode === 'custom' ? 'custom' : 'today',
        seasonCustomDate: typeof p.seasonCustomDate === 'string' ? p.seasonCustomDate : '',
      };
    }
  } catch {
    /* ignore */
  }
  return empty();
}

function newBagId(): string {
  return `bag-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export default function PrepPage() {
  usePageTitle('Pré/post course');
  const [bundle, setBundle] = useState<ActiveBundle | null>(null);
  const [prep, setPrep] = useState<PrepPersisted>(() => loadOrInitPrep());
  const [section, setSection] = useState<'carb' | 'race' | 'drop' | 'post'>('carb');
  const [shopCopiedDayKey, setShopCopiedDayKey] = useState<CarbDayKey | null>(null);

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

  const carbDaysVisible = useMemo(() => carbDayMeta(prep.carbWindow), [prep.carbWindow]);

  const carbChecklistAll = useMemo(() => {
    const out: { id: string; label: string }[] = [];
    for (const d of carbDaysVisible) {
      for (const item of carbDayChecklist(d.key, d.title)) {
        out.push(item);
      }
    }
    return out;
  }, [carbDaysVisible]);

  const seasonReferenceDate = useMemo(() => {
    if (prep.seasonDateMode === 'custom' && prep.seasonCustomDate.trim()) {
      const d = new Date(`${prep.seasonCustomDate.trim()}T12:00:00`);
      return Number.isNaN(d.getTime()) ? new Date() : d;
    }
    return new Date();
  }, [prep.seasonDateMode, prep.seasonCustomDate]);

  const postRaceBlocks = useMemo(
    () =>
      buildPostRaceProtocol(
        {
          cryotherapy: prep.recoveryCryotherapy,
          naturalCare: prep.recoveryNaturalCare,
          massage: prep.recoveryMassage,
          saunaOk: prep.recoverySaunaOk,
        },
        profile?.giTolerance
      ),
    [
      prep.recoveryCryotherapy,
      prep.recoveryNaturalCare,
      prep.recoveryMassage,
      prep.recoverySaunaOk,
      profile?.giTolerance,
    ]
  );

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

  const defCarbG = defaultCarbGPerKg(prep.carbWindow);

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
          PRÉPARATION & RÉCUPÉRATION
        </p>
        <h1 style={S.h1}>Pré/post course — charge, jour J & drop bags</h1>
        <p style={{ ...S.muted, margin: '0 0 20px' }}>
          Assistant carb-loading (3 ou 7 jours avant la course), liste d’achats par journée (menus affichés + lieu + saison),
          checklists, petit-déjeuner & protocole pré-départ, récup post-épreuve. Les données du{' '}
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

        <nav style={S.navPills} aria-label="Sections Pré/post course">
          {(
            [
              ['carb', 'Carb loading'],
              ['race', 'Jour J'],
              ['drop', 'Drop bags'],
              ['post', 'Après course'],
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
              <h2 style={S.h2}>Fenêtre de charge</h2>
              <p style={S.muted}>
                Charge courte (J−3 à J−1) ou semaine complète (J−7 à J−1) selon votre calendrier et l’avis de votre entourage
                pro.
              </p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, marginTop: 12 }}>
                <button
                  type="button"
                  style={prep.carbWindow === '3' ? S.pillActive : S.pill}
                  onClick={() =>
                    persist({
                      ...prep,
                      carbWindow: '3',
                      carbGPerKg: normalizeCarbGPerKg(prep.carbGPerKg, '3'),
                    })
                  }
                >
                  3 jours (J−3 → J−1)
                </button>
                <button
                  type="button"
                  style={prep.carbWindow === '7' ? S.pillActive : S.pill}
                  onClick={() =>
                    persist({
                      ...prep,
                      carbWindow: '7',
                      carbGPerKg: normalizeCarbGPerKg(prep.carbGPerKg, '7'),
                    })
                  }
                >
                  7 jours (J−7 → J−1)
                </button>
              </div>
            </div>

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
                {carbDaysVisible.map((d) => {
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
                        onChange={(e) => setCarbG(d.key, parseFloat(e.target.value) || defCarbG[d.key])}
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

              <div style={{ marginTop: 22, paddingTop: 18, borderTop: '1px solid var(--color-border)' }}>
                <h3 style={{ ...S.h2, margin: '0 0 10px', fontSize: 15 }}>Localisation & saison des courses</h3>
                <p style={{ ...S.muted, fontSize: 13, margin: '0 0 12px' }}>
                  La saison (fruits / légumes, dispo, prix) s’adapte au pays (hémisphère) et à la date de référence. La ville
                  sert de repère pour vos habitudes d’achat.
                </p>
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                    gap: 14,
                  }}
                >
                  <div>
                    <label style={{ display: 'block', fontWeight: 700, fontSize: 12, marginBottom: 6 }}>Pays</label>
                    <select
                      value={prep.shoppingCountryCode}
                      onChange={(e) => persist({ ...prep, shoppingCountryCode: e.target.value })}
                      style={S.inputWide}
                    >
                      {SHOP_COUNTRY_OPTIONS.map((o) => (
                        <option key={o.code} value={o.code}>
                          {o.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label style={{ display: 'block', fontWeight: 700, fontSize: 12, marginBottom: 6 }}>Ville / région</label>
                    <input
                      type="text"
                      value={prep.shoppingCity}
                      onChange={(e) => persist({ ...prep, shoppingCity: e.target.value })}
                      placeholder="Ex. : Lyon, Genève…"
                      style={S.inputWide}
                    />
                  </div>
                  <div style={{ gridColumn: '1 / -1' }}>
                    <span style={{ display: 'block', fontWeight: 700, fontSize: 12, marginBottom: 8 }}>
                      Date pour calcul de saison (fruits / légumes)
                    </span>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, alignItems: 'center' }}>
                      <button
                        type="button"
                        style={prep.seasonDateMode === 'today' ? S.pillActive : S.pill}
                        onClick={() => persist({ ...prep, seasonDateMode: 'today' })}
                      >
                        Aujourd’hui
                      </button>
                      <button
                        type="button"
                        style={prep.seasonDateMode === 'custom' ? S.pillActive : S.pill}
                        onClick={() => persist({ ...prep, seasonDateMode: 'custom' })}
                      >
                        Date au choix
                      </button>
                      {prep.seasonDateMode === 'custom' && (
                        <input
                          type="date"
                          value={prep.seasonCustomDate}
                          onChange={(e) => persist({ ...prep, seasonCustomDate: e.target.value })}
                          style={{ ...S.inputWide, maxWidth: 200 }}
                        />
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {carbDaysVisible.map((d) => {
              const daily = dailyChoFromBody(weight, prep.carbGPerKg[d.key]);
              const blocks = pickCarbMealExamples(effectiveDiet, daily, d.key, prep.mealIdeasSalt[d.key]);
              const seasonCtx = getPrepSeasonContext(prep.shoppingCountryCode, seasonReferenceDate);
              const purchaseLines = enrichPurchaseLinesSeasonal(
                buildDayPurchaseListFromBlocks(blocks),
                seasonCtx.season
              );
              const priceEst = estimateDayPurchasePriceEUR(purchaseLines);
              const locHint =
                `Saison (${seasonCtx.hemisphere === 'south' ? 'hémisphère sud' : 'hémisphère nord'}) : ${seasonCtx.seasonLabelFr}` +
                (prep.shoppingCity.trim()
                  ? ` — lieu de courses : ${prep.shoppingCity.trim()}, ${prep.shoppingCountryCode}.`
                  : ` — pays : ${prep.shoppingCountryCode}.`);
              const checklist = carbDayChecklist(d.key, d.title);
              return (
                <div key={d.key} style={S.card}>
                  <div
                    style={{
                      display: 'flex',
                      flexWrap: 'wrap',
                      alignItems: 'flex-start',
                      justifyContent: 'space-between',
                      gap: 12,
                      marginBottom: 4,
                    }}
                  >
                    <h2 style={{ ...S.h2, margin: 0, flex: '1 1 200px' }}>
                      {d.title} — exemples concrets (~{daily} g CHO visés)
                    </h2>
                    <button
                      type="button"
                      style={S.btnOutline}
                      title="Tirer d’autres idées au hasard dans les suggestions"
                      onClick={() =>
                        persist({
                          ...prep,
                          mealIdeasSalt: {
                            ...prep.mealIdeasSalt,
                            [d.key]: (prep.mealIdeasSalt[d.key] ?? 0) + 1,
                          },
                        })
                      }
                    >
                      ↻ Nouvelles idées
                    </button>
                  </div>
                  <p style={{ ...S.muted, fontSize: 12, margin: '0 0 14px' }}>
                    Chaque clic mélange des suggestions différentes pour le même objectif glucidique.
                  </p>
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
                        <details style={S.detailsRecipe}>
                          <summary style={S.detailsSummary}>▼ Recette détaillée, quantités & pas à pas</summary>
                          <div style={{ marginTop: 12 }}>
                            <p style={{ ...S.muted, fontSize: 12, margin: '0 0 10px' }}>{b.choRecap}</p>
                            <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 6 }}>Quantités pour ce créneau</div>
                            <ol
                              style={{
                                ...S.muted,
                                margin: '0 0 14px',
                                paddingLeft: 20,
                                fontSize: 13,
                                lineHeight: 1.55,
                              }}
                            >
                              {b.recipeSteps.map((step, si) => (
                                <li key={`${b.label}-${si}`} style={{ marginBottom: 6 }}>
                                  {step}
                                </li>
                              ))}
                            </ol>
                            {b.recipeExpanded.length > 0 && (
                              <>
                                <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 6 }}>
                                  Préparation (méthode détaillée selon le type de plat)
                                </div>
                                <div style={{ ...S.muted, fontSize: 13, lineHeight: 1.6 }}>
                                  {b.recipeExpanded.map((step, ei) => (
                                    <p key={`${b.label}-ex-${ei}`} style={{ margin: '0 0 8px' }}>
                                      {step}
                                    </p>
                                  ))}
                                </div>
                              </>
                            )}
                            <p style={{ ...S.muted, fontSize: 11, margin: '12px 0 0', fontStyle: 'italic' }}>
                              Repères pour ~{b.approxChoG} g CHO sur ce repas ; affiner avec les étiquettes et votre tolérance
                              digestive.
                            </p>
                          </div>
                        </details>
                      </div>
                    ))}
                  </div>

                  <div
                    style={{
                      marginTop: 18,
                      marginBottom: 0,
                      padding: 18,
                      borderRadius: 12,
                      border: '1px solid color-mix(in srgb, #4ade80 35%, var(--color-border))',
                      background: 'color-mix(in srgb, #4ade80 7%, var(--color-bg))',
                    }}
                  >
                    <div
                      style={{
                        display: 'flex',
                        flexWrap: 'wrap',
                        justifyContent: 'space-between',
                        gap: 10,
                        alignItems: 'flex-start',
                      }}
                    >
                      <h3 style={{ ...S.h2, margin: 0, fontSize: 15 }}>Liste d’achats — {d.title}</h3>
                      <button
                        type="button"
                        style={S.btnOutline}
                        onClick={() => {
                          const head = `${d.title} — ${prep.shoppingCity || '—'}, ${prep.shoppingCountryCode} — saison ${seasonCtx.seasonLabelFr}\nEstimation prix : ${priceEst.min.toFixed(2)}–${priceEst.max.toFixed(2)} € (fourchette indicative)\n\n`;
                          const body = purchaseLines
                            .map((L) => {
                              const hint = L.seasonalHint ? ` (${L.seasonalHint})` : '';
                              return `• ${L.shopDetail}${hint}`;
                            })
                            .join('\n');
                          void navigator.clipboard.writeText(head + body).then(() => {
                            setShopCopiedDayKey(d.key);
                            window.setTimeout(() => setShopCopiedDayKey(null), 2000);
                          });
                        }}
                      >
                        {shopCopiedDayKey === d.key ? 'Copié' : 'Copier cette journée'}
                      </button>
                    </div>
                    <p style={{ ...S.muted, fontSize: 12, margin: '10px 0 0' }}>{locHint}</p>
                    <p style={{ ...S.muted, fontSize: 13, margin: '10px 0 0' }}>
                      <strong>Total estimé (courses type supermarché) :</strong> {priceEst.min.toFixed(2)} € —{' '}
                      {priceEst.max.toFixed(2)} €. Les montants changent si vous cliquez sur « Nouvelles idées » (menus différents).
                    </p>
                    <p style={{ ...S.muted, fontSize: 12, margin: '8px 0 0' }}>
                      Quantités <strong>cumulées pour les 4 menus affichés</strong> pour cette journée uniquement (achat sec / liquide
                      / pièces selon la ligne).
                    </p>
                    {effectiveDiet === 'gluten_free' && (
                      <p style={{ ...S.muted, fontSize: 12, margin: '8px 0 0' }}>
                        Sans gluten : vérifiez farines, pain, sauces et céréales au rayon dédié.
                      </p>
                    )}
                    {purchaseLines.length === 0 && (
                      <p style={{ ...S.muted, margin: '12px 0 0' }}>Aucun ingrédient chiffré pour cette journée.</p>
                    )}
                    <ul style={{ listStyle: 'none', padding: 0, margin: '14px 0 0', display: 'grid', gap: 10 }}>
                      {purchaseLines.map((L) => (
                        <li
                          key={L.mergeKey}
                          style={{
                            padding: '10px 12px',
                            borderRadius: 8,
                            border: '1px solid var(--color-border)',
                            fontSize: 14,
                            background: 'var(--color-bg)',
                          }}
                        >
                          <div style={{ fontWeight: 700 }}>{L.displayLabel}</div>
                          <div style={S.muted}>{L.shopDetail}</div>
                          {L.seasonalHint && (
                            <div style={{ ...S.muted, fontSize: 12, marginTop: 6, color: '#4ade80' }}>{L.seasonalHint}</div>
                          )}
                        </li>
                      ))}
                    </ul>
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
              <h2 style={S.h2}>
                Progression charge ({prep.carbWindow === '7' ? 'J−7 → J−1' : 'J−3 → J−1'})
              </h2>
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

        {section === 'post' && (
          <>
            <div style={S.card}>
              <h2 style={S.h2}>Préférences récupération</h2>
              <p style={S.muted}>
                Cochez ce que vous utilisez déjà ou souhaitez voir dans le protocole. Rien n’est obligatoire — contenu indicatif
                seulement.
              </p>
              <ul style={{ listStyle: 'none', padding: 0, margin: '14px 0 0' }}>
                <li style={{ marginBottom: 12 }}>
                  <label style={{ display: 'flex', gap: 12, alignItems: 'flex-start', cursor: 'pointer', fontSize: 14 }}>
                    <input
                      type="checkbox"
                      checked={prep.recoveryNaturalCare}
                      onChange={() => persist({ ...prep, recoveryNaturalCare: !prep.recoveryNaturalCare })}
                      style={{ marginTop: 3 }}
                    />
                    <span>
                      <strong style={{ display: 'block' }}>Soins « naturels »</strong>
                      <span style={S.muted}>Douche/mobilisation légère, compression douce, tisanes…</span>
                    </span>
                  </label>
                </li>
                <li style={{ marginBottom: 12 }}>
                  <label style={{ display: 'flex', gap: 12, alignItems: 'flex-start', cursor: 'pointer', fontSize: 14 }}>
                    <input
                      type="checkbox"
                      checked={prep.recoveryMassage}
                      onChange={() => persist({ ...prep, recoveryMassage: !prep.recoveryMassage })}
                      style={{ marginTop: 3 }}
                    />
                    <span>
                      <strong style={{ display: 'block' }}>Massage</strong>
                      <span style={S.muted}>Repères si vous avez l’habitude du toucher post-effort</span>
                    </span>
                  </label>
                </li>
                <li style={{ marginBottom: 12 }}>
                  <label style={{ display: 'flex', gap: 12, alignItems: 'flex-start', cursor: 'pointer', fontSize: 14 }}>
                    <input
                      type="checkbox"
                      checked={prep.recoveryCryotherapy}
                      onChange={() => persist({ ...prep, recoveryCryotherapy: !prep.recoveryCryotherapy })}
                      style={{ marginTop: 3 }}
                    />
                    <span>
                      <strong style={{ display: 'block' }}>Cryo / bain froid</strong>
                      <span style={S.muted}>Uniquement si déjà validé à l’entraînement</span>
                    </span>
                  </label>
                </li>
                <li style={{ marginBottom: 12 }}>
                  <label style={{ display: 'flex', gap: 12, alignItems: 'flex-start', cursor: 'pointer', fontSize: 14 }}>
                    <input
                      type="checkbox"
                      checked={prep.recoverySaunaOk}
                      onChange={() => persist({ ...prep, recoverySaunaOk: !prep.recoverySaunaOk })}
                      style={{ marginTop: 3 }}
                    />
                    <span>
                      <strong style={{ display: 'block' }}>Sauna possible</strong>
                      <span style={S.muted}>Prudent : hydratation et sensation du jour</span>
                    </span>
                  </label>
                </li>
              </ul>
            </div>

            <div style={S.card}>
              <h2 style={S.h2}>Protocole post-course</h2>
              <p style={S.muted}>
                Nutrition de récupération, hydratation et repères temporels. Le ton digestif s’adapte si votre profil indique une
                sensibilité GI (onglet Plan).
              </p>
              <div style={{ display: 'grid', gap: 18, marginTop: 16 }}>
                {postRaceBlocks.map((block) => (
                  <div
                    key={block.title}
                    style={{
                      padding: 14,
                      borderRadius: 10,
                      border: '1px solid color-mix(in srgb, #4ade80 22%, var(--color-border))',
                    }}
                  >
                    <div style={{ fontWeight: 800, marginBottom: 8 }}>{block.title}</div>
                    <ul style={{ ...S.muted, margin: 0, paddingLeft: 18 }}>
                      {block.items.map((line) => (
                        <li key={line} style={{ marginBottom: 6 }}>
                          {line}
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}

        <p style={{ ...S.muted, fontSize: 12, marginTop: 8 }}>
          Informations éducatives — ne remplacent pas un suivi médical ou nutritionnel individualisé.
        </p>
      </main>
    </div>
  );
}
