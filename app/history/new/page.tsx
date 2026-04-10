'use client';

import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { Header } from '@/app/components/Header';
import { Button } from '@/app/components/Button';
import { NutritionScoreBadge } from '@/app/components/history/NutritionScoreBadge';
import { InsightCard } from '@/app/components/history/InsightCard';
import { PRODUCTS } from '@/app/lib/products';
import type { Product } from '@/app/lib/types';
import {
  parseActivePlanBundle,
  plannedNutritionFromFuelPlan,
  mapEventSportToRaceSport,
  readWeatherFromEvent,
} from '@/lib/nutrition/activePlanNutrition';
import { finalizeRaceEventScores, sumProductQuantities } from '@/lib/nutrition/raceHistory';
import {
  clearRaceHistoryDraft,
  enqueueRaceHistorySave,
  loadRaceHistoryDraft,
  saveRaceHistoryDraft,
} from '@/lib/raceHistoryLocal';
import type {
  GISymptom,
  GISymptomType,
  ProductItem,
  RaceEvent,
  RaceSport,
  RaceWeatherCondition,
} from '@/types/race';

const ACTIVE_PLAN_KEY = 'fuelos_active_plan';
const CUSTOM_PRODUCTS_KEY = 'fuelos_custom_products';

const SPORTS: { id: RaceSport; label: string }[] = [
  { id: 'trail', label: 'Trail' },
  { id: 'marathon', label: 'Marathon' },
  { id: 'triathlon', label: 'Triathlon' },
  { id: 'cyclisme', label: 'Cyclisme' },
  { id: 'autre', label: 'Autre' },
];

const CONDITIONS: { id: RaceWeatherCondition; label: string }[] = [
  { id: 'soleil', label: 'Soleil' },
  { id: 'nuageux', label: 'Nuageux' },
  { id: 'pluie', label: 'Pluie' },
  { id: 'chaleur', label: 'Chaleur' },
  { id: 'froid', label: 'Froid' },
];

const SYMPTOM_TYPES: { id: GISymptomType; label: string }[] = [
  { id: 'nausées', label: 'Nausées' },
  { id: 'crampes', label: 'Crampes' },
  { id: 'ballonnements', label: 'Ballonnements' },
  { id: 'vomissements', label: 'Vomissements' },
  { id: 'diarrhée', label: 'Diarrhée' },
  { id: 'reflux', label: 'Reflux' },
  { id: 'aucun', label: 'Aucun' },
];

const GI_FACE = ['🤢', '😕', '😐', '🙂', '😄'] as const;

const INP =
  'w-full min-h-11 rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-bg-card)] px-3 py-2 text-[14px] text-[var(--color-text)]';

type PlannedRow = {
  key: string;
  productId: string;
  name: string;
  qtyPlanned: number;
  takenQty: number;
  takenAtKm: number;
};

type DraftV1 = {
  step: number;
  meta: {
    name: string;
    sport: RaceSport;
    date: string;
    distanceKm: string;
    elevationGainM: string;
    durationMin: string;
    tempC: string;
    humidity: string;
    conditions: RaceWeatherCondition;
  };
  plannedRows: PlannedRow[];
  noPlanPlanned: { cho: string; sodium: string; fluid: string; intakeTarget: string };
  extras: ProductItem[];
  giOverall: 1 | 2 | 3 | 4 | 5;
  symptomDraft: Partial<Record<GISymptomType, { km: string; sev: 1 | 2 | 3 }>>;
  giNotes: string;
  missedSecondHalf: string;
};

function loadCustomProducts(): Product[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(CUSTOM_PRODUCTS_KEY);
    if (!raw) return [];
    const p = JSON.parse(raw) as unknown;
    return Array.isArray(p) ? (p as Product[]) : [];
  } catch {
    return [];
  }
}

function randomKey(): string {
  return `k_${Math.random().toString(36).slice(2, 10)}`;
}

function parseNum(s: string, fallback: number): number {
  const n = Number(String(s).replace(',', '.'));
  return Number.isFinite(n) ? n : fallback;
}

function macroFromItems(items: ProductItem[], catalog: Product[], durationHours: number): Pick<
  RaceEvent['actualNutrition'],
  'choPerHour' | 'sodiumPerHour' | 'fluidPerHour'
> {
  const h = Math.max(durationHours, 1 / 60);
  let cho = 0;
  let na = 0;
  let ml = 0;
  const byId = new Map(catalog.map((p) => [p.id, p]));
  for (const it of items) {
    const p = byId.get(it.productId);
    const q = Math.max(0, it.quantity);
    if (!p) continue;
    cho += p.cho_per_unit * q;
    na += (p.sodium_per_unit ?? 0) * q;
    ml += (p.water_per_unit ?? 0) * q;
  }
  return {
    choPerHour: cho / h,
    sodiumPerHour: na / h,
    fluidPerHour: ml / h,
  };
}

function defaultDraft(): DraftV1 {
  const today = new Date();
  const iso = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
  return {
    step: 1,
    meta: {
      name: '',
      sport: 'trail',
      date: iso,
      distanceKm: '42',
      elevationGainM: '0',
      durationMin: '240',
      tempC: '18',
      humidity: '50',
      conditions: 'soleil',
    },
    plannedRows: [],
    noPlanPlanned: { cho: '70', sodium: '800', fluid: '600', intakeTarget: '12' },
    extras: [],
    giOverall: 4,
    symptomDraft: {},
    giNotes: '',
    missedSecondHalf: '0',
  };
}

export default function NewRaceHistoryPage() {
  const { data: session, status } = useSession();
  const catalog = useMemo(() => [...loadCustomProducts(), ...PRODUCTS], []);

  const [draft, setDraft] = useState<DraftV1>(defaultDraft);
  const [planHint, setPlanHint] = useState<string | null>(null);
  const [saveMsg, setSaveMsg] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const saved = loadRaceHistoryDraft<DraftV1>();
    if (saved && typeof saved.step === 'number') {
      setDraft({ ...defaultDraft(), ...saved, meta: { ...defaultDraft().meta, ...saved.meta } });
    } else {
      try {
        const raw = localStorage.getItem(ACTIVE_PLAN_KEY);
        if (!raw) return;
        const bundle = parseActivePlanBundle(JSON.parse(raw) as unknown);
        if (!bundle) return;
        const pn = plannedNutritionFromFuelPlan(bundle.plan, bundle.event);
        const w = readWeatherFromEvent(bundle.event);
        const rows: PlannedRow[] = pn.totalProducts.map((p) => ({
          key: randomKey(),
          productId: p.productId,
          name: p.name,
          qtyPlanned: Math.max(1, p.quantity),
          takenQty: Math.max(1, p.quantity),
          takenAtKm: p.takenAtKm,
        }));
        setPlanHint(`Plan actif chargé : ${bundle.event.distance} km / ${bundle.event.targetTime} h objectif.`);
        setDraft((d) => ({
          ...d,
          meta: {
            ...d.meta,
            sport: mapEventSportToRaceSport(bundle.event.sport),
            distanceKm: String(bundle.event.distance),
            elevationGainM: String(bundle.event.elevationGain ?? 0),
            durationMin: String(Math.max(1, Math.round(bundle.event.targetTime * 60))),
            tempC: String(w.tempC),
            humidity: String(w.humidity),
            conditions: w.conditions,
          },
          plannedRows: rows,
          noPlanPlanned: {
            cho: String(Math.round(pn.choPerHour)),
            sodium: String(Math.round(pn.sodiumPerHour)),
            fluid: String(Math.round(pn.fluidPerHour)),
            intakeTarget: String(sumProductQuantities(pn.totalProducts)),
          },
        }));
      } catch {
        /* ignore */
      }
    }
  }, []);

  useEffect(() => {
    saveRaceHistoryDraft(draft);
  }, [draft]);

  const previewRace = useMemo((): RaceEvent | null => {
    try {
      return buildRaceEventFromDraft(draft, session?.user?.id ?? 'offline', catalog);
    } catch {
      return null;
    }
  }, [draft, session?.user?.id, catalog]);

  const previewFinal = useMemo(() => (previewRace ? finalizeRaceEventScores(previewRace) : null), [previewRace]);

  const go = (step: number) => setDraft((d) => ({ ...d, step }));

  const addExtra = () => {
    const p = catalog[0];
    setDraft((d) => ({
      ...d,
      extras: [
        ...d.extras,
        {
          productId: p?.id ?? '_unknown',
          name: p?.name ?? 'Produit',
          quantity: 1,
          takenAtKm: 0,
        },
      ],
    }));
  };

  const handleSave = async () => {
    if (!previewRace) return;
    setSaving(true);
    setSaveMsg(null);
    const finalized = finalizeRaceEventScores(previewRace);
    const body = {
      ...finalized,
      createdAt: finalized.createdAt.toISOString(),
      updatedAt: finalized.updatedAt.toISOString(),
      date: finalized.date.toISOString(),
    };

    const online = typeof navigator !== 'undefined' && navigator.onLine;
    if (!online || status !== 'authenticated') {
      enqueueRaceHistorySave(body);
      setSaveMsg('Hors ligne ou non connecté : course mise en file d’attente (stockage local).');
      setSaving(false);
      return;
    }

    const res = await fetch('/api/user/race-events', {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    setSaving(false);
    if (!res.ok) {
      enqueueRaceHistorySave(body);
      setSaveMsg('Échec API — sauvegarde locale en file d’attente. Réessaie plus tard.');
      return;
    }
    clearRaceHistoryDraft();
    setSaveMsg('Course enregistrée !');
    window.location.href = '/history';
  };

  const stepper =
    'flex flex-wrap gap-2 border-b border-[var(--color-border)] pb-4 mb-6 text-[12px] font-extrabold';

  return (
    <div className="min-h-[100dvh] bg-[var(--color-bg)] text-[var(--color-text)]">
      <Header sticky />
      <main className="mx-auto w-full max-w-[var(--fuel-shell-max)] px-4 pb-20 pt-6" style={{ minWidth: 0 }}>
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <Link href="/history" className="text-[13px] font-bold text-[var(--color-accent)] hover:underline">
            ← Historique
          </Link>
          <button
            type="button"
            className="text-[12px] font-bold text-[var(--color-text-muted)] underline"
            onClick={() => {
              clearRaceHistoryDraft();
              setDraft(defaultDraft());
              setPlanHint(null);
            }}
          >
            Réinitialiser le brouillon
          </button>
        </div>

        <h1 className="font-display text-2xl font-extrabold">Nouvelle course</h1>
        <p className="font-medium mt-2 max-w-prose text-[14px] text-[var(--color-text-muted)]">
          Quatre étapes — le brouillon est conservé sur cet appareil (localStorage) et synchronisé quand tu es en ligne.
        </p>
        {planHint ? <p className="mt-3 text-[13px] font-semibold text-[var(--color-accent)]">{planHint}</p> : null}

        <nav className={stepper} aria-label="Étapes">
          {[1, 2, 3, 4].map((n) => (
            <button
              key={n}
              type="button"
              className={`min-h-10 rounded-full px-3.5 ${
                draft.step === n
                  ? 'bg-[var(--color-accent)] text-black'
                  : 'bg-[var(--color-bg-card)] text-[var(--color-text-muted)] border border-[var(--color-border)]'
              }`}
              onClick={() => go(n)}
            >
              {n}. {n === 1 ? 'Course' : n === 2 ? 'Prises' : n === 3 ? 'GI' : 'Résumé'}
            </button>
          ))}
        </nav>

        {draft.step === 1 ? (
          <section className="space-y-4">
            <Field label="Nom de la course">
              <input
                className={INP}
                value={draft.meta.name}
                onChange={(e) => setDraft((d) => ({ ...d, meta: { ...d.meta, name: e.target.value } }))}
                placeholder="UTMB 2025"
              />
            </Field>
            <Field label="Sport">
              <select
                className={INP}
                value={draft.meta.sport}
                onChange={(e) =>
                  setDraft((d) => ({
                    ...d,
                    meta: { ...d.meta, sport: e.target.value as RaceSport },
                  }))
                }
              >
                {SPORTS.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.label}
                  </option>
                ))}
              </select>
            </Field>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Date">
                <input
                  type="date"
                  className={INP}
                  value={draft.meta.date}
                  onChange={(e) => setDraft((d) => ({ ...d, meta: { ...d.meta, date: e.target.value } }))}
                />
              </Field>
              <Field label="Durée réelle (min)">
                <input
                  inputMode="numeric"
                  className={INP}
                  value={draft.meta.durationMin}
                  onChange={(e) =>
                    setDraft((d) => ({ ...d, meta: { ...d.meta, durationMin: e.target.value } }))
                  }
                />
              </Field>
              <Field label="Distance (km)">
                <input
                  inputMode="decimal"
                  className={INP}
                  value={draft.meta.distanceKm}
                  onChange={(e) =>
                    setDraft((d) => ({ ...d, meta: { ...d.meta, distanceKm: e.target.value } }))
                  }
                />
              </Field>
              <Field label="D+ (m)">
                <input
                  inputMode="numeric"
                  className={INP}
                  value={draft.meta.elevationGainM}
                  onChange={(e) =>
                    setDraft((d) => ({ ...d, meta: { ...d.meta, elevationGainM: e.target.value } }))
                  }
                />
              </Field>
            </div>
            <div className="grid gap-4 sm:grid-cols-3">
              <Field label="Température (°C)">
                <input
                  inputMode="decimal"
                  className={INP}
                  value={draft.meta.tempC}
                  onChange={(e) => setDraft((d) => ({ ...d, meta: { ...d.meta, tempC: e.target.value } }))}
                />
              </Field>
              <Field label="Humidité %">
                <input
                  inputMode="numeric"
                  className={INP}
                  value={draft.meta.humidity}
                  onChange={(e) =>
                    setDraft((d) => ({ ...d, meta: { ...d.meta, humidity: e.target.value } }))
                  }
                />
              </Field>
              <Field label="Conditions">
                <select
                  className={INP}
                  value={draft.meta.conditions}
                  onChange={(e) =>
                    setDraft((d) => ({
                      ...d,
                      meta: { ...d.meta, conditions: e.target.value as RaceWeatherCondition },
                    }))
                  }
                >
                  {CONDITIONS.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.label}
                    </option>
                  ))}
                </select>
              </Field>
            </div>
            <div className="flex justify-end">
              <Button type="button" variant="primary" onClick={() => go(2)}>
                Suivant
              </Button>
            </div>
          </section>
        ) : null}

        {draft.step === 2 ? (
          <section className="space-y-6">
            {draft.plannedRows.length === 0 ? (
              <div className="rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-bg-card)] p-4">
                <p className="text-[13px] font-bold text-[var(--color-text)]">Aucun plan détecté</p>
                <p className="mt-1 text-[13px] text-[var(--color-text-muted)]">
                  Saisis les objectifs prévus pour comparer au réel.
                </p>
                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  <Field label="CHO/h prévu (g)">
                    <input
                      className={INP}
                      value={draft.noPlanPlanned.cho}
                      onChange={(e) =>
                        setDraft((d) => ({
                          ...d,
                          noPlanPlanned: { ...d.noPlanPlanned, cho: e.target.value },
                        }))
                      }
                    />
                  </Field>
                  <Field label="Sodium/h prévu (mg)">
                    <input
                      className={INP}
                      value={draft.noPlanPlanned.sodium}
                      onChange={(e) =>
                        setDraft((d) => ({
                          ...d,
                          noPlanPlanned: { ...d.noPlanPlanned, sodium: e.target.value },
                        }))
                      }
                    />
                  </Field>
                  <Field label="Fluides/h prévu (ml)">
                    <input
                      className={INP}
                      value={draft.noPlanPlanned.fluid}
                      onChange={(e) =>
                        setDraft((d) => ({
                          ...d,
                          noPlanPlanned: { ...d.noPlanPlanned, fluid: e.target.value },
                        }))
                      }
                    />
                  </Field>
                  <Field label="Prises prévues (unités)">
                    <input
                      className={INP}
                      value={draft.noPlanPlanned.intakeTarget}
                      onChange={(e) =>
                        setDraft((d) => ({
                          ...d,
                          noPlanPlanned: { ...d.noPlanPlanned, intakeTarget: e.target.value },
                        }))
                      }
                    />
                  </Field>
                </div>
              </div>
            ) : (
              <div>
                <h2 className="mb-2 font-display text-lg font-extrabold">Produits prévus</h2>
                <p className="mb-3 text-[13px] text-[var(--color-text-muted)]">
                  Ajuste les quantités réellement prises (0 = sauté).
                </p>
                <ul className="space-y-3">
                  {draft.plannedRows.map((row, idx) => (
                    <li
                      key={row.key}
                      className="rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-bg-card)] p-3"
                    >
                      <div className="text-[13px] font-extrabold [overflow-wrap:anywhere]">{row.name}</div>
                      <div className="mt-2 grid gap-2 sm:grid-cols-3">
                        <Field label="Prévu (unités)">
                          <input
                            inputMode="numeric"
                            className={INP}
                            value={row.qtyPlanned}
                            onChange={(e) => {
                              const n = Math.max(0, parseNum(e.target.value, 0));
                              setDraft((d) => {
                                const next = [...d.plannedRows];
                                next[idx] = { ...row, qtyPlanned: n, takenQty: Math.min(row.takenQty, n) };
                                return { ...d, plannedRows: next };
                              });
                            }}
                          />
                        </Field>
                        <Field label="Pris (unités)">
                          <input
                            inputMode="numeric"
                            className={INP}
                            value={row.takenQty}
                            onChange={(e) => {
                              const n = Math.max(0, parseNum(e.target.value, 0));
                              setDraft((d) => {
                                const next = [...d.plannedRows];
                                next[idx] = { ...row, takenQty: Math.min(n, row.qtyPlanned) };
                                return { ...d, plannedRows: next };
                              });
                            }}
                          />
                        </Field>
                        <Field label="Au km">
                          <input
                            inputMode="decimal"
                            className={INP}
                            value={row.takenAtKm}
                            onChange={(e) => {
                              const n = Math.max(0, parseNum(e.target.value, 0));
                              setDraft((d) => {
                                const next = [...d.plannedRows];
                                next[idx] = { ...row, takenAtKm: n };
                                return { ...d, plannedRows: next };
                              });
                            }}
                          />
                        </Field>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <div>
              <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                <h2 className="font-display text-lg font-extrabold">Produits hors plan</h2>
                <Button type="button" variant="secondary" size="sm" onClick={addExtra}>
                  + Ajouter
                </Button>
              </div>
              <ul className="space-y-3">
                {draft.extras.map((ex, idx) => (
                  <li
                    key={idx}
                    className="rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-bg-card)] p-3"
                  >
                    <div className="grid gap-2 sm:grid-cols-3">
                      <Field label="Produit">
                        <select
                          className={INP}
                          value={ex.productId}
                          onChange={(e) => {
                            const id = e.target.value;
                            const p = catalog.find((c) => c.id === id);
                            setDraft((d) => {
                              const next = [...d.extras];
                              next[idx] = { ...ex, productId: id, name: p?.name ?? id };
                              return { ...d, extras: next };
                            });
                          }}
                        >
                          {catalog.slice(0, 200).map((p) => (
                            <option key={p.id} value={p.id}>
                              {p.name}
                            </option>
                          ))}
                        </select>
                      </Field>
                      <Field label="Quantité">
                        <input
                          inputMode="numeric"
                          className={INP}
                          value={ex.quantity}
                          onChange={(e) => {
                            const n = Math.max(0, parseNum(e.target.value, 0));
                            setDraft((d) => {
                              const next = [...d.extras];
                              next[idx] = { ...ex, quantity: n };
                              return { ...d, extras: next };
                            });
                          }}
                        />
                      </Field>
                      <Field label="Km">
                        <input
                          inputMode="decimal"
                          className={INP}
                          value={ex.takenAtKm}
                          onChange={(e) => {
                            const n = Math.max(0, parseNum(e.target.value, 0));
                            setDraft((d) => {
                              const next = [...d.extras];
                              next[idx] = { ...ex, takenAtKm: n };
                              return { ...d, extras: next };
                            });
                          }}
                        />
                      </Field>
                    </div>
                    <button
                      type="button"
                      className="font-bold mt-2 text-[12px] text-[var(--color-danger)]"
                      onClick={() =>
                        setDraft((d) => ({
                          ...d,
                          extras: d.extras.filter((_, j) => j !== idx),
                        }))
                      }
                    >
                      Retirer
                    </button>
                  </li>
                ))}
              </ul>
            </div>

            <Field label="Prises manquantes en 2ᵉ moitié (estimation)">
              <input
                inputMode="numeric"
                className={`${INP} max-w-[200px]`}
                value={draft.missedSecondHalf}
                onChange={(e) => setDraft((d) => ({ ...d, missedSecondHalf: e.target.value }))}
              />
            </Field>

            <div className="flex flex-wrap justify-between gap-3">
              <Button type="button" variant="secondary" onClick={() => go(1)}>
                Retour
              </Button>
              <Button type="button" variant="primary" onClick={() => go(3)}>
                Suivant
              </Button>
            </div>
          </section>
        ) : null}

        {draft.step === 3 ? (
          <section className="space-y-5">
            <div>
              <h2 className="mb-2 font-display text-lg font-extrabold">Ressenti gastro-intestinal</h2>
              <p className="text-[13px] text-[var(--color-text-muted)]">Score global (1 = très mauvais, 5 = parfait)</p>
              <div className="mt-3 flex flex-wrap gap-2">
                {[1, 2, 3, 4, 5].map((n) => (
                  <button
                    key={n}
                    type="button"
                    className={`min-h-12 min-w-12 rounded-full border text-xl ${
                      draft.giOverall === n
                        ? 'border-[var(--color-accent)] bg-[var(--color-accent-muted)]'
                        : 'border-[var(--color-border)] bg-[var(--color-bg-card)]'
                    }`}
                    onClick={() => setDraft((d) => ({ ...d, giOverall: n as 1 | 2 | 3 | 4 | 5 }))}
                    aria-label={`Score GI ${n}`}
                  >
                    {GI_FACE[n - 1]}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <h3 className="text-[14px] font-extrabold">Symptômes</h3>
              <p className="text-[12px] text-[var(--color-text-muted)]">
                Coche et indique le km. « Aucun » efface les autres à l’enregistrement.
              </p>
              <ul className="mt-3 space-y-3">
                {SYMPTOM_TYPES.map((s) => (
                  <li
                    key={s.id}
                    className="flex flex-wrap items-end gap-3 rounded-[var(--radius-md)] border border-[var(--color-border-subtle)] bg-[var(--color-bg-card)] p-3"
                  >
                    <label className="flex items-center gap-2 text-[13px] font-bold">
                      <input
                        type="checkbox"
                        checked={!!draft.symptomDraft[s.id]}
                        onChange={(e) =>
                          setDraft((d) => {
                            const next = { ...d.symptomDraft };
                            if (e.target.checked) {
                              if (s.id === 'aucun') {
                                next.aucun = { km: '0', sev: 1 };
                                for (const k of Object.keys(next) as GISymptomType[]) {
                                  if (k !== 'aucun') delete next[k];
                                }
                              } else {
                                delete next.aucun;
                                next[s.id] = next[s.id] ?? { km: '0', sev: 1 };
                              }
                            } else {
                              delete next[s.id];
                            }
                            return { ...d, symptomDraft: next };
                          })
                        }
                      />
                      {s.label}
                    </label>
                    {draft.symptomDraft[s.id] && s.id !== 'aucun' ? (
                      <>
                        <Field label="km">
                          <input
                            className={`${INP} w-24 min-h-10`}
                            value={draft.symptomDraft[s.id]?.km ?? '0'}
                            onChange={(e) =>
                              setDraft((d) => ({
                                ...d,
                                symptomDraft: {
                                  ...d.symptomDraft,
                                  [s.id]: {
                                    km: e.target.value,
                                    sev: (d.symptomDraft[s.id]?.sev ?? 1) as 1 | 2 | 3,
                                  },
                                },
                              }))
                            }
                          />
                        </Field>
                        <Field label="Sévérité">
                          <select
                            className={`${INP} w-28 min-h-10`}
                            value={draft.symptomDraft[s.id]?.sev ?? 1}
                            onChange={(e) =>
                              setDraft((d) => ({
                                ...d,
                                symptomDraft: {
                                  ...d.symptomDraft,
                                  [s.id]: {
                                    km: d.symptomDraft[s.id]?.km ?? '0',
                                    sev: Number(e.target.value) as 1 | 2 | 3,
                                  },
                                },
                              }))
                            }
                          >
                            <option value={1}>Léger</option>
                            <option value={2}>Modéré</option>
                            <option value={3}>Sévère</option>
                          </select>
                        </Field>
                      </>
                    ) : null}
                  </li>
                ))}
              </ul>
            </div>

            <Field label="Notes libres">
              <textarea
                className={`${INP} min-h-[88px]`}
                value={draft.giNotes}
                onChange={(e) => setDraft((d) => ({ ...d, giNotes: e.target.value }))}
              />
            </Field>

            <div className="flex flex-wrap justify-between">
              <Button type="button" variant="secondary" onClick={() => go(2)}>
                Retour
              </Button>
              <Button type="button" variant="primary" onClick={() => go(4)}>
                Suivant
              </Button>
            </div>
          </section>
        ) : null}

        {draft.step === 4 ? (
          <section className="space-y-6">
            {!previewFinal ? (
              <p className="text-[var(--color-danger)] text-[14px]">Données incomplètes — vérifie l’étape 1.</p>
            ) : (
              <>
                <div className="rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-bg-card)] p-5">
                  <div className="flex flex-wrap items-center gap-3">
                    <NutritionScoreBadge score={previewFinal.nutritionScore} />
                    <span className="text-[14px] text-[var(--color-text-muted)]">
                      Prêt à enregistrer : {previewFinal.name}
                    </span>
                  </div>
                </div>
                <div>
                  <h2 className="font-display mb-2 text-lg font-extrabold">Insights</h2>
                  <div className="flex flex-col gap-3">
                    {previewFinal.insights.map((t, i) => (
                      <InsightCard key={i} text={t} />
                    ))}
                  </div>
                </div>
                {saveMsg ? (
                  <p className="text-[14px] font-semibold text-[var(--color-accent)]">{saveMsg}</p>
                ) : null}
                <div className="flex flex-wrap justify-between gap-3">
                  <Button type="button" variant="secondary" onClick={() => go(3)}>
                    Retour
                  </Button>
                  <Button type="button" variant="primary" disabled={saving} onClick={() => void handleSave()}>
                    {saving ? '…' : 'Sauvegarder cette course'}
                  </Button>
                </div>
              </>
            )}
          </section>
        ) : null}
      </main>
    </div>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1 block text-[11px] font-extrabold uppercase tracking-wide text-[var(--color-text-muted)]">
        {label}
      </span>
      {children}
    </label>
  );
}

function buildRaceEventFromDraft(
  draft: DraftV1,
  userId: string,
  catalog: Product[]
): RaceEvent {
  const m = draft.meta;
  const parts = m.date.split('-').map(Number);
  const date = new Date(parts[0], (parts[1] ?? 1) - 1, parts[2] ?? 1);
  const now = new Date();

  const distanceKm = parseNum(m.distanceKm, 0);
  const elevationGainM = parseNum(m.elevationGainM, 0);
  const durationMin = parseNum(m.durationMin, 1);

  const hasRows = draft.plannedRows.length > 0;
  let plannedNutrition: RaceEvent['plannedNutrition'];
  if (hasRows) {
    const totalProducts: ProductItem[] = draft.plannedRows.map((r) => ({
      productId: r.productId,
      name: r.name,
      quantity: r.qtyPlanned,
      takenAtKm: r.takenAtKm,
    }));
    const sums = macroFromItems(totalProducts, catalog, durationMin / 60);
    plannedNutrition = {
      choPerHour: parseNum(draft.noPlanPlanned.cho, sums.choPerHour),
      sodiumPerHour: parseNum(draft.noPlanPlanned.sodium, sums.sodiumPerHour),
      fluidPerHour: parseNum(draft.noPlanPlanned.fluid, sums.fluidPerHour),
      totalProducts,
    };
  } else {
    plannedNutrition = {
      choPerHour: parseNum(draft.noPlanPlanned.cho, 0),
      sodiumPerHour: parseNum(draft.noPlanPlanned.sodium, 0),
      fluidPerHour: parseNum(draft.noPlanPlanned.fluid, 0),
      totalProducts: [
        {
          productId: '_planned_intake',
          name: 'Prises prévues (agrégat)',
          quantity: Math.max(0, parseNum(draft.noPlanPlanned.intakeTarget, 0)),
          takenAtKm: 0,
        },
      ],
    };
  }

  const takenFromPlan: ProductItem[] = draft.plannedRows.flatMap((r) =>
    r.takenQty > 0
      ? [
          {
            productId: r.productId,
            name: r.name,
            quantity: r.takenQty,
            takenAtKm: r.takenAtKm,
          },
        ]
      : []
  );
  const takenProducts = [...takenFromPlan, ...draft.extras.filter((e) => e.quantity > 0)];
  const plannedUnits = hasRows
    ? sumProductQuantities(draft.plannedRows.map((r) => ({ quantity: r.qtyPlanned })))
    : Math.max(0, parseNum(draft.noPlanPlanned.intakeTarget, 0));
  const takenUnits = sumProductQuantities(takenProducts);
  const missedIntakes = Math.max(0, plannedUnits - takenUnits);

  const durationH = durationMin / 60;
  const macroA = macroFromItems(takenProducts, catalog, durationH);
  const missedSecondHalf = Math.max(0, parseNum(draft.missedSecondHalf, 0));

  const symptoms: GISymptom[] = (() => {
    const out: GISymptom[] = [];
    if (draft.symptomDraft.aucun) {
      return [{ type: 'aucun', severity: 1, kmMark: 0, note: '' }];
    }
    for (const [type, v] of Object.entries(draft.symptomDraft) as [
      GISymptomType,
      { km: string; sev: 1 | 2 | 3 } | undefined,
    ][]) {
      if (!v || type === 'aucun') continue;
      out.push({ type, severity: v.sev, kmMark: parseNum(v.km, 0), note: '' });
    }
    return out.length ? out : [{ type: 'aucun', severity: 1, kmMark: 0, note: '' }];
  })();

  const idPlaceholder = 'pending';

  return {
    id: idPlaceholder,
    userId,
    createdAt: now,
    updatedAt: now,
    name: m.name.trim() || 'Course sans titre',
    sport: m.sport,
    date,
    distanceKm,
    elevationGainM,
    durationMin,
    weather: {
      tempC: parseNum(m.tempC, 18),
      humidity: parseNum(m.humidity, 50),
      conditions: m.conditions,
    },
    plannedNutrition,
    actualNutrition: {
      choPerHour: macroA.choPerHour,
      sodiumPerHour: macroA.sodiumPerHour,
      fluidPerHour: macroA.fluidPerHour,
      takenProducts,
      missedIntakes,
      ...(missedSecondHalf > 0 ? { missedIntakesSecondHalf: missedSecondHalf } : {}),
    },
    giLog: {
      overallScore: draft.giOverall,
      symptoms,
      notes: draft.giNotes.slice(0, 4000),
    },
    nutritionScore: 0,
    insights: [],
  };
}
