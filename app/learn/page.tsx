'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Flag, ArrowRight } from 'lucide-react';
import { useSession } from 'next-auth/react';
import usePageTitle from '../lib/hooks/usePageTitle';
import { Header } from '../components/Header';
import { SectionBreadcrumb } from '../components/SectionBreadcrumb';
import { Button } from '../components/Button';
import { DebriefForm } from '../components/DebriefForm';
import {
  buildAutoInsight,
  computeCompliance,
  insightTone,
  isDebriefCompleted,
  normalizeDebrief,
  stomachEmoji,
  type EnergyLevel,
  type StoredDebrief,
} from '../lib/debrief';
import { useNutritionProfile } from '@/hooks/useNutritionProfile';
import {
  NutritionProfileCard,
  NutritionProfileSkeleton,
} from '../components/insights/NutritionProfileCard';
import { NutritionPatternsSection } from '../components/insights/NutritionPatternsSection';

const DEBRIEFS_STORAGE_KEY = 'fuelos_debriefs';

type LearnItem = {
  id: string;
  category: 'Repère' | 'Conseil';
  title: string;
  subtitle: string;
  value: string;
  why: string;
  details: string[];
  imageUrl: string;
  imageAlt: string;
  sourceLabel: string;
  sourceUrl: string;
};

const keyNumbers: LearnItem[] = [
  {
    id: 'cho-endurance',
    category: 'Repère',
    title: 'Apport glucidique en endurance',
    subtitle: 'Carburant principal sur efforts longs',
    value: '30-60 g/h (jusqu’à 90 g/h si intestin entraîné)',
    why: 'Aide à maintenir la performance et limiter la baisse d’énergie sur efforts prolongés.',
    details: [
      'Commencer plutôt vers la borne basse puis augmenter progressivement.',
      'Fractionner les prises toutes les 15-20 minutes pour mieux tolérer.',
      'Tester les produits en conditions proches de la course.',
    ],
    imageUrl:
      'https://images.unsplash.com/photo-1517649763962-0c623066013b?auto=format&fit=crop&w=1200&q=80',
    imageAlt: 'Coureuse en tenue d’endurance sur route',
    sourceLabel: 'AIS Sports Supplement Framework',
    sourceUrl: 'https://www.ais.gov.au/nutrition/supplements/group_a',
  },
  {
    id: 'hydration-base',
    category: 'Repère',
    title: 'Hydratation de base à l’effort',
    subtitle: 'Volume ajustable selon environnement',
    value: 'Environ 400-800 ml/h selon chaleur, intensité et sudation',
    why: 'Réduit le risque de déshydratation sans surconsommation hydrique.',
    details: [
      'Visez une stratégie flexible selon météo et durée.',
      'Le poids avant/après séance peut aider à mieux calibrer les besoins.',
      'Éviter de boire uniquement à la sensation de soif sur efforts longs.',
    ],
    imageUrl:
      'https://images.unsplash.com/photo-1461896836934-ffe607ba8211?auto=format&fit=crop&w=1200&q=80',
    imageAlt: 'Athlète qui boit pendant une sortie longue',
    sourceLabel: 'American College of Sports Medicine',
    sourceUrl:
      'https://journals.lww.com/acsm-msse/fulltext/2016/03000/exercise_and_fluid_replacement.22.aspx',
  },
  {
    id: 'sodium-long',
    category: 'Repère',
    title: 'Sodium pendant l’effort long',
    subtitle: 'Ajustement selon pertes sudorales',
    value: '300-600 mg/h (ajuster selon perte sudorale)',
    why: 'Peut aider à maintenir l’équilibre hydrique chez les athlètes qui transpirent beaucoup.',
    details: [
      'Particulièrement utile en ambiance chaude et humide.',
      'À intégrer via boisson, gels ou capsules selon tolérance.',
      'Les besoins varient fortement d’un athlète à l’autre.',
    ],
    imageUrl:
      'https://images.unsplash.com/photo-1486218119243-13883505764c?auto=format&fit=crop&w=1200&q=80',
    imageAlt: 'Boissons et nutrition sportive posés sur une table',
    sourceLabel: 'IOC Consensus Statement (Dietary Supplements and the High-Performance Athlete)',
    sourceUrl: 'https://bjsm.bmj.com/content/52/7/439',
  },
  {
    id: 'caffeine-performance',
    category: 'Repère',
    title: 'Caféine pour la performance',
    subtitle: 'Effet ergogène dose-dépendant',
    value: '3-6 mg/kg, 30-60 min avant',
    why: 'Peut améliorer vigilance, perception de l’effort et performance en endurance.',
    details: [
      'Commencer bas si sensibilité à la caféine.',
      'Éviter de tester une première fois le jour J.',
      'Prendre en compte la qualité du sommeil autour de la course.',
    ],
    imageUrl:
      'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?auto=format&fit=crop&w=1200&q=80',
    imageAlt: 'Tasse de café sur table en bois',
    sourceLabel: 'International Society of Sports Nutrition Position Stand',
    sourceUrl: 'https://jissn.biomedcentral.com/articles/10.1186/s12970-021-00445-4',
  },
];

const practicalTips: LearnItem[] = [
  {
    id: 'test-training',
    category: 'Conseil',
    title: 'Tester en entraînement, pas en jour de course',
    subtitle: 'Sécuriser la stratégie avant l’événement',
    value: 'Répéter la même stratégie sur sorties clés',
    why: 'Permet de valider la tolérance digestive et la praticité logistique.',
    details: [
      'Simuler horaires et intensités de la course.',
      'Noter ce qui passe bien ou non juste après la séance.',
      'Ajuster un paramètre à la fois pour isoler les effets.',
    ],
    imageUrl:
      'https://images.unsplash.com/photo-1552674605-db6ffd4facb5?auto=format&fit=crop&w=1200&q=80',
    imageAlt: 'Athlète en séance d’entraînement extérieur',
    sourceLabel: 'Australian Institute of Sport - Competition nutrition',
    sourceUrl: 'https://www.ais.gov.au/nutrition',
  },
  {
    id: 'glucose-fructose',
    category: 'Conseil',
    title: 'Combiner glucose + fructose',
    subtitle: 'Stratégie multi-transportable',
    value: 'Mélange multi-transportable pour apports élevés',
    why: 'Peut augmenter l’oxydation des glucides exogènes et limiter l’inconfort chez certains athlètes.',
    details: [
      'Utile quand l’objectif est de monter au-delà de 60 g/h.',
      'Vérifier la tolérance digestive de la marque choisie.',
      'Associer à une hydratation régulière pour faciliter l’absorption.',
    ],
    imageUrl:
      'https://images.unsplash.com/photo-1605296867304-46d5465a13f1?auto=format&fit=crop&w=1200&q=80',
    imageAlt: 'Produits nutrition sportive et gels énergétiques',
    sourceLabel: 'Jeukendrup - Carbohydrate intake during exercise',
    sourceUrl: 'https://pubmed.ncbi.nlm.nih.gov/19478342/',
  },
  {
    id: 'schedule-intake',
    category: 'Conseil',
    title: 'Planifier la prise avant d’avoir faim/soif',
    subtitle: 'Régularité plutôt que compensation tardive',
    value: 'Rappels toutes les 15-20 minutes',
    why: 'Aide à lisser les apports et éviter les gros écarts en fin d’épreuve.',
    details: [
      'Programmer une alerte montre peut simplifier le suivi.',
      'Adapter les quantités par tranche selon allure et terrain.',
      'Éviter les grosses prises ponctuelles difficiles à tolérer.',
    ],
    imageUrl:
      'https://images.unsplash.com/photo-1599058917765-a780eda07a3e?auto=format&fit=crop&w=1200&q=80',
    imageAlt: 'Montre de sport affichant un chronomètre',
    sourceLabel: 'ACSM hydration and fueling guidance',
    sourceUrl:
      'https://journals.lww.com/acsm-msse/fulltext/2016/03000/exercise_and_fluid_replacement.22.aspx',
  },
  {
    id: 'adjust-context',
    category: 'Conseil',
    title: 'Ajuster selon conditions',
    subtitle: 'Personnalisation en temps réel',
    value: 'Chaleur, altitude, durée, intensité modifient les besoins',
    why: 'La stratégie optimale varie selon le contexte et le profil de l’athlète.',
    details: [
      'Prévoir une version A (standard) et B (chaleur) du plan.',
      'Revoir les besoins si allure, température ou durée changent.',
      'Apprendre de chaque course pour affiner la prochaine.',
    ],
    imageUrl:
      'https://images.unsplash.com/photo-1476480862126-209bfaa8edc8?auto=format&fit=crop&w=1200&q=80',
    imageAlt: 'Route de montagne avec conditions variables',
    sourceLabel: 'IOC Consensus on Sports Nutrition',
    sourceUrl: 'https://bjsm.bmj.com/content/52/7/439',
  },
];

function Card({ item }: { item: LearnItem }) {
  return (
    <details
      style={{
        border: '1px solid var(--color-border)',
        borderRadius: 14,
        padding: 0,
        background: 'var(--color-bg-card)',
        overflow: 'hidden',
      }}
    >
      <summary style={{ listStyle: 'none', cursor: 'pointer' }}>
        <img src={item.imageUrl} alt={item.imageAlt} style={{ width: '100%', height: 140, objectFit: 'cover' }} />
        <div style={{ padding: 14 }}>
          <div style={{ display: 'inline-block', padding: '4px 8px', borderRadius: 99, fontSize: 11, border: '1px solid var(--color-border)', marginBottom: 8 }}>
            {item.category}
          </div>
          <h3 style={{ margin: 0, fontSize: 16 }}>{item.title}</h3>
          <p style={{ margin: '4px 0 8px', color: 'var(--color-text-muted)', fontSize: 13 }}>{item.subtitle}</p>
          <p style={{ margin: 0, fontWeight: 700 }}>{item.value}</p>
          <p style={{ marginTop: 10, fontSize: 13, color: 'var(--color-text-muted)' }}>Cliquer pour afficher les détails</p>
        </div>
      </summary>
      <div style={{ padding: '0 14px 14px' }}>
        <p style={{ margin: '0 0 12px', color: 'var(--color-text-muted)' }}>{item.why}</p>
        <ul style={{ margin: '0 0 14px', paddingLeft: 18, display: 'grid', gap: 6 }}>
          {item.details.map((detail) => (
            <li key={detail}>{detail}</li>
          ))}
        </ul>
        <a href={item.sourceUrl} target="_blank" rel="noopener noreferrer">
          Source: {item.sourceLabel}
        </a>
      </div>
    </details>
  );
}

function formatFinishedAt(iso: string) {
  try {
    return new Date(iso).toLocaleString('fr-FR', {
      dateStyle: 'medium',
      timeStyle: 'short',
    });
  } catch {
    return iso;
  }
}

function formatElapsed(ms: number) {
  const totalMin = Math.max(0, Math.floor(ms / 60000));
  const h = Math.floor(totalMin / 60);
  const m = totalMin % 60;
  if (h === 0) return `${m} min`;
  return `${h} h ${m} min`;
}

function DebriefCard({
  debrief,
  rank,
  onSaveDebrief,
  isSaving,
}: {
  debrief: StoredDebrief;
  rank: number;
  onSaveDebrief: (payload: {
    feedback: StoredDebrief['feedback'];
    energyLevel: EnergyLevel;
    notes: string;
  }) => Promise<void>;
  isSaving: boolean;
}) {
  const { event, plan } = debrief;
  const raceState = debrief.raceState ?? { consumedItems: [], deviations: [], elapsedMs: 0 };
  const finishedAt = debrief.finishedAt ?? debrief.savedAt ?? new Date(0).toISOString();
  const title =
    event != null
      ? `${event.sport} · ${event.distance} km`
      : plan != null
        ? `Course · plan ${plan.choPerHour} g CHO/h`
        : `Course ${rank}`;
  const timelineLen = plan?.timeline?.length ?? 0;
  const consumed = raceState?.consumedItems?.length ?? 0;
  const deviations = raceState?.deviations ?? [];
  const [editing, setEditing] = useState(!isDebriefCompleted(debrief));
  const compliance = debrief.compliance ?? computeCompliance(debrief);
  const insight = debrief.feedback?.autoInsight ?? '';
  const insightIsGood = insightTone(insight) === 'good';

  return (
    <details
      style={{
        border: '1px solid var(--color-border)',
        borderRadius: 14,
        padding: 0,
        background: 'var(--color-bg-card)',
        overflow: 'hidden',
      }}
    >
      <summary style={{ listStyle: 'none', cursor: 'pointer', padding: 16 }}>
        <div style={{ fontSize: 12, color: 'var(--color-text-muted)', marginBottom: 6 }}>
          {formatFinishedAt(finishedAt)}
        </div>
        <h3 style={{ margin: '0 0 8px', fontSize: 17 }}>{title}</h3>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, fontSize: 13, color: 'var(--color-text-muted)' }}>
          <span>Temps chronomètre : {formatElapsed(raceState?.elapsedMs ?? 0)}</span>
          {timelineLen > 0 && (
            <span>
              Prises notées : {consumed} / {timelineLen}
            </span>
          )}
          {deviations.length > 0 && <span>Écarts : {deviations.length}</span>}
        </div>
        <p style={{ margin: '10px 0 0', fontSize: 13, color: 'var(--color-text-muted)' }}>
          Cliquer pour le détail
        </p>
      </summary>
      <div style={{ padding: '0 16px 16px', borderTop: '1px solid var(--color-border)' }}>
        {event != null && (
          <ul style={{ margin: '12px 0', paddingLeft: 18, fontSize: 14, color: 'var(--color-text-muted)' }}>
            <li>Dénivelé : {event.elevationGain} m D+</li>
            <li>Objectif temps : {event.targetTime} h</li>
            <li>Météo / relief : {event.weather} · {event.elevation}</li>
          </ul>
        )}
        {deviations.length > 0 && (
          <div style={{ marginTop: 12 }}>
            <p style={{ margin: '0 0 6px', fontWeight: 600, fontSize: 14 }}>Écarts notés</p>
            <ul style={{ margin: 0, paddingLeft: 18, fontSize: 14 }}>
              {deviations.map((d) => (
                <li key={d}>{d}</li>
              ))}
            </ul>
          </div>
        )}
        {plan != null && plan.warnings.length > 0 && (
          <div style={{ marginTop: 12 }}>
            <p style={{ margin: '0 0 6px', fontWeight: 600, fontSize: 14 }}>Alertes du plan</p>
            <ul style={{ margin: 0, paddingLeft: 18, fontSize: 14, color: 'var(--color-text-muted)' }}>
              {plan.warnings.map((w) => (
                <li key={w}>{w}</li>
              ))}
            </ul>
          </div>
        )}
        <div style={{ marginTop: 14, borderTop: '1px solid var(--color-border)', paddingTop: 14 }}>
          <p style={{ margin: '0 0 10px', fontWeight: 700, fontSize: 14 }}>Débrief express post-course</p>
          {isDebriefCompleted(debrief) && !editing ? (
            <div style={{ display: 'grid', gap: 10 }}>
              <div style={{ fontSize: 14 }}>
                {stomachEmoji(debrief.feedback?.stomachScore ?? null)} Estomac · {debrief.feedback?.stomachScore}/5
              </div>
              <div style={{ fontSize: 14 }}>
                Plan · {debrief.feedback?.planFollowed === 'yes' ? 'Oui ✓' : debrief.feedback?.planFollowed === 'partial' ? 'En partie' : 'Non ✗'}
              </div>
              <div style={{ fontSize: 14 }}>
                Énergie · {debrief.energyLevel === 'good' ? '🔋 Bon' : debrief.energyLevel === 'ok' ? '⚡ Moyen' : '🪫 Vide'}
              </div>
              {debrief.notes ? (
                <div style={{ fontSize: 14, color: 'var(--color-text-muted)' }}>Note · {debrief.notes}</div>
              ) : null}
              {insight ? (
                <div
                  style={{
                    borderRadius: 10,
                    padding: '10px 12px',
                    border: insightIsGood ? '1px solid #16a34a' : '1px solid #ea580c',
                    background: insightIsGood
                      ? 'color-mix(in srgb, #16a34a 10%, var(--color-bg-card))'
                      : 'color-mix(in srgb, #ea580c 10%, var(--color-bg-card))',
                    fontSize: 13,
                  }}
                >
                  {insight}
                </div>
              ) : null}
              <div style={{ fontSize: 13, color: 'var(--color-text-muted)' }}>Compliance: {compliance}%</div>
              <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                <Button type="button" variant="secondary" size="sm" onClick={() => setEditing(true)}>
                  Modifier
                </Button>
              </div>
            </div>
          ) : (
            <DebriefForm
              debrief={debrief}
              mode="inline"
              isSaving={isSaving}
              onSave={async (payload) => {
                await onSaveDebrief({
                  feedback: payload.feedback,
                  energyLevel: payload.energyLevel,
                  notes: payload.notes,
                });
                setEditing(false);
              }}
            />
          )}
        </div>
      </div>
    </details>
  );
}

const heroCardStyle = {
  border: '1px solid var(--color-border)',
  borderRadius: 14,
  padding: 16,
  background: 'var(--color-bg-card)',
};

function DebriefsEmptyIllustration() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 360 200"
      fill="none"
      aria-hidden
      style={{ width: '100%', height: 'auto', maxWidth: 320, display: 'block', margin: '0 auto' }}
    >
      <defs>
        <linearGradient id="learn-empty-bg" x1="0" y1="0" x2="360" y2="200" gradientUnits="userSpaceOnUse">
          <stop stopColor="var(--color-accent)" stopOpacity="0.12" />
          <stop offset="1" stopColor="var(--color-energy)" stopOpacity="0.08" />
        </linearGradient>
        <linearGradient id="learn-empty-line" x1="40" y1="140" x2="300" y2="56" gradientUnits="userSpaceOnUse">
          <stop stopColor="var(--color-accent)" />
          <stop offset="1" stopColor="var(--color-energy)" />
        </linearGradient>
      </defs>
      <rect x="8" y="12" width="344" height="176" rx="18" fill="url(#learn-empty-bg)" stroke="var(--color-border)" strokeWidth="1" />
      <rect x="36" y="44" width="52" height="100" rx="8" fill="var(--color-accent)" fillOpacity={0.1} />
      <rect x="100" y="72" width="52" height="72" rx="8" fill="var(--color-accent)" fillOpacity={0.18} />
      <rect x="164" y="56" width="52" height="88" rx="8" fill="var(--color-accent)" fillOpacity={0.08} />
      <rect x="228" y="88" width="52" height="56" rx="8" fill="var(--color-text-muted)" fillOpacity={0.12} />
      <path
        d="M44 132 C 100 118, 140 52, 308 64"
        stroke="url(#learn-empty-line)"
        strokeWidth="3"
        strokeLinecap="round"
        strokeDasharray="6 8"
        opacity="0.85"
      />
      <circle cx="308" cy="64" r="10" fill="var(--color-bg-card)" stroke="var(--color-accent)" strokeWidth="2.5" />
      <path
        d="M304 64 L307 67 L314 58"
        stroke="var(--color-accent)"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <text
        x="180"
        y="178"
        textAnchor="middle"
        fill="var(--color-text-muted)"
        fontFamily="var(--font-sans), system-ui, sans-serif"
        fontSize={11}
        fontWeight={600}
      >
        Débrief · nutrition · GI
      </text>
    </svg>
  );
}

export default function LearnPage() {
  usePageTitle('Analyses');
  const { status } = useSession();
  const { profile: nutritionProfile, isComputing: isNutritionProfileComputing, refresh: refreshNutritionProfile } =
    useNutritionProfile();
  const [activeTab, setActiveTab] = useState<'debriefs' | 'library'>('debriefs');
  const [debriefs, setDebriefs] = useState<StoredDebrief[]>([]);
  const [savingDebriefKey, setSavingDebriefKey] = useState<string | null>(null);
  const firstItem = keyNumbers[0];

  const persistDebriefsLocal = (nextDebriefs: StoredDebrief[]) => {
    try {
      localStorage.setItem(DEBRIEFS_STORAGE_KEY, JSON.stringify(nextDebriefs.slice(0, 10)));
    } catch {
      // localStorage best effort
    }
  };

  useEffect(() => {
    const loadLocal = (): StoredDebrief[] => {
      try {
        const raw = localStorage.getItem(DEBRIEFS_STORAGE_KEY);
        const parsed = raw ? (JSON.parse(raw) as StoredDebrief[]) : [];
        if (!Array.isArray(parsed)) return [];
        return parsed.map((d) => normalizeDebrief(d));
      } catch {
        return [];
      }
    };

    void (async () => {
      const local = loadLocal();
      if (status !== 'authenticated') {
        setDebriefs(local);
        return;
      }

      try {
        const r = await fetch('/api/user/debriefs?limit=200', { credentials: 'include' });
        if (!r.ok) {
          setDebriefs(local);
          return;
        }
        const j = (await r.json()) as {
          debriefs?: { id: string; payload: unknown; finishedAt: string }[];
        };
        const fromCloud: StoredDebrief[] = (j.debriefs ?? []).map((row) => {
          const p =
            row.payload && typeof row.payload === 'object'
              ? (row.payload as StoredDebrief)
              : ({} as StoredDebrief);
          return normalizeDebrief({
            ...p,
            cloudId: row.id,
            finishedAt: row.finishedAt ?? p?.finishedAt ?? p?.savedAt ?? new Date(0).toISOString(),
          });
        });
        const byFinished = new Map<string, StoredDebrief>();
        for (const d of local) {
          if (d?.finishedAt) byFinished.set(d.finishedAt, d);
        }
        for (const d of fromCloud) {
          if (!d?.finishedAt) continue;
          const existing = byFinished.get(d.finishedAt);
          if (!existing) {
            byFinished.set(d.finishedAt, d);
            continue;
          }
          byFinished.set(d.finishedAt, normalizeDebrief({ ...d, ...existing, cloudId: d.cloudId }));
        }
        const merged = [...byFinished.values()].sort(
          (a, b) =>
            new Date(b.finishedAt ?? b.savedAt ?? new Date(0).toISOString()).getTime() -
            new Date(a.finishedAt ?? a.savedAt ?? new Date(0).toISOString()).getTime()
        );
        setDebriefs(merged);
      } catch {
        setDebriefs(local);
      }
    })();
  }, [status]);

  const tabButton = (tab: 'debriefs' | 'library', label: string) => {
    const active = activeTab === tab;
    return (
      <Button
        type="button"
        onClick={() => setActiveTab(tab)}
        variant={active ? 'primary' : 'secondary'}
        size="md"
      >
        {label}
      </Button>
    );
  };

  const handleSaveDebrief = async (
    debrief: StoredDebrief,
    payload: { feedback: StoredDebrief['feedback']; energyLevel: EnergyLevel; notes: string }
  ) => {
    const debriefKey = debrief.finishedAt ?? debrief.savedAt ?? '';
    if (!debriefKey) return;
    setSavingDebriefKey(debriefKey);
    try {
      const nextDebriefs = debriefs.map((item) =>
        (item.finishedAt ?? item.savedAt ?? '') === debriefKey
          ? normalizeDebrief({
              ...item,
              feedback: payload.feedback ?? item.feedback,
              energyLevel: payload.energyLevel,
              notes: payload.notes,
            })
          : item
      );
      const updatedDebrief = nextDebriefs.find((item) => (item.finishedAt ?? item.savedAt ?? '') === debriefKey);
      if (updatedDebrief?.feedback) {
        updatedDebrief.feedback.autoInsight = buildAutoInsight(updatedDebrief);
      }
      setDebriefs(nextDebriefs);
      persistDebriefsLocal(nextDebriefs);

      if (status === 'authenticated' && debrief.cloudId) {
        const updatedPayload = nextDebriefs.find(
          (item) => (item.finishedAt ?? item.savedAt ?? '') === debriefKey
        );
        if (updatedPayload) {
          await fetch('/api/user/debriefs', {
            method: 'PATCH',
            credentials: 'include',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              id: debrief.cloudId,
              payload: updatedPayload,
            }),
          });
        }
      }
      refreshNutritionProfile();
    } finally {
      setSavingDebriefKey(null);
    }
  };

  return (
    <div className="fuel-page">
      <Header sticky />
      <main className="fuel-main" style={{ paddingTop: 28 }}>
      <SectionBreadcrumb />
      <div
        className="fuel-card"
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          gap: 16,
          alignItems: 'center',
          padding: 20,
          marginBottom: 24,
          borderColor: 'color-mix(in srgb, var(--color-accent) 22%, var(--color-border))',
          background:
            'linear-gradient(120deg, color-mix(in srgb, var(--color-accent) 14%, var(--color-bg-card)) 0%, var(--color-bg-card) 48%)',
        }}
      >
        <div>
          <h1 className="font-display" style={{ margin: 0, fontSize: 32, fontWeight: 800 }}>
            Analyses
          </h1>
          <p style={{ marginTop: 8, color: 'var(--color-text-muted)' }}>
            Débriefs des courses terminées dans le mode course et bibliothèque de repères nutrition vérifiables.
          </p>
        </div>
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: 8,
            alignItems: 'center',
            justifyContent: 'flex-end',
          }}
        >
          {tabButton('debriefs', 'Débriefs')}
          {tabButton('library', 'Bibliothèque')}
        </div>
      </div>

      {activeTab === 'debriefs' && (
        <section style={{ marginTop: 24 }}>
          <h2 style={{ marginBottom: 10 }}>Courses passées</h2>
          <p style={{ marginTop: 0, color: 'var(--color-text-muted)', marginBottom: 18 }}>
            Chaque fin de course enregistre un débrief avec un questionnaire express pour construire ta
            mémoire nutritionnelle (10 derniers sur cet appareil ; compte Google pour l’historique cloud
            plus long).
          </p>
          {isNutritionProfileComputing ? (
            <NutritionProfileSkeleton />
          ) : nutritionProfile && nutritionProfile.debriefCount >= 1 ? (
            <NutritionProfileCard profile={nutritionProfile} />
          ) : null}
          <NutritionPatternsSection />
          {debriefs.length === 0 ? (
            <div
              style={{
                ...heroCardStyle,
                padding: 'clamp(28px, 5vw, 44px) clamp(20px, 4vw, 36px)',
                textAlign: 'center',
                borderColor: 'color-mix(in srgb, var(--color-accent) 20%, var(--color-border))',
                background:
                  'linear-gradient(165deg, color-mix(in srgb, var(--color-accent) 10%, var(--color-bg-card)) 0%, var(--color-bg-card) 55%)',
              }}
            >
              <div style={{ marginBottom: 20 }}>
                <DebriefsEmptyIllustration />
              </div>
              <h3
                className="font-display"
                style={{
                  margin: '0 0 10px',
                  fontSize: 'clamp(1.25rem, 2.5vw, 1.5rem)',
                  fontWeight: 800,
                  letterSpacing: '-0.02em',
                  color: 'var(--color-text)',
                }}
              >
                Ta première analyse t&apos;attend — lance une course !
              </h3>
              <p
                style={{
                  margin: '0 auto 22px',
                  maxWidth: 440,
                  fontSize: 15,
                  lineHeight: 1.55,
                  color: 'var(--color-text-muted)',
                }}
              >
                Termine une sortie dans le <strong style={{ color: 'var(--color-text)', fontWeight: 600 }}>mode course</strong> pour
                enregistrer ton débrief nutrition, le suivi digestif et les repères pour la prochaine fois. Tout
                s&apos;affichera ici automatiquement.
              </p>
              <div
                style={{
                  display: 'grid',
                  gap: 10,
                  gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
                  textAlign: 'left',
                  margin: '0 auto 20px',
                  maxWidth: 760,
                }}
              >
                {[
                  {
                    title: 'Résumé de course',
                    desc: 'durée, sport, distance, météo et contexte du jour',
                    emoji: '🏁',
                  },
                  {
                    title: 'Exécution nutrition',
                    desc: 'prises suivies vs plan (consommées, passées, compliance)',
                    emoji: '⚡',
                  },
                  {
                    title: 'Signal digestif (GI)',
                    desc: "points d'attention et écarts notés pour ajuster la prochaine stratégie",
                    emoji: '🧪',
                  },
                  {
                    title: 'Pistes d’amélioration',
                    desc: 'ce qui a marché / moins marché pour préparer la prochaine course',
                    emoji: '📈',
                  },
                ].map((item) => (
                  <div
                    key={item.title}
                    style={{
                      border: '1px solid var(--color-border)',
                      borderRadius: 12,
                      padding: '12px 12px',
                      background: 'var(--color-bg-card)',
                    }}
                  >
                    <div style={{ fontSize: 18, marginBottom: 6 }}>{item.emoji}</div>
                    <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 4 }}>{item.title}</div>
                    <div style={{ color: 'var(--color-text-muted)', fontSize: 12, lineHeight: 1.45 }}>{item.desc}</div>
                  </div>
                ))}
              </div>
              <Link
                href="/race"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 10,
                  padding: '14px 24px',
                  borderRadius: 12,
                  fontWeight: 700,
                  fontSize: 15,
                  textDecoration: 'none',
                  color: 'var(--color-on-primary)',
                  background: 'var(--color-accent)',
                  border: '1px solid color-mix(in srgb, var(--color-accent) 55%, var(--color-primary-dark))',
                  boxShadow: '0 4px 14px color-mix(in srgb, var(--color-accent) 35%, transparent)',
                  transition: 'transform 0.15s ease, box-shadow 0.15s ease',
                }}
              >
                <Flag size={20} strokeWidth={2.25} aria-hidden />
                Ouvrir le mode course
                <ArrowRight size={18} strokeWidth={2.25} aria-hidden />
              </Link>
              <p style={{ margin: '12px 0 0', fontSize: 12, color: 'var(--color-text-muted)' }}>
                Dès ta première course terminée, un débrief complet est créé ici automatiquement.
              </p>
              <p style={{ margin: '18px 0 0', fontSize: 13, color: 'var(--color-text-muted)' }}>
                Astuce : prépare ton plan sur la page <Link href="/plan" style={{ color: 'var(--color-accent)', fontWeight: 600 }}>Plan</Link>{' '}
                avant de partir.
              </p>
            </div>
          ) : (
            <div style={{ display: 'grid', gap: 12 }}>
              {debriefs.map((debrief, i) => (
                <DebriefCard
                  key={`${debrief.finishedAt}-${debrief.feedback?.stomachScore ?? 'x'}-${debrief.feedback?.planFollowed ?? 'x'}-${debrief.energyLevel ?? 'x'}-${(debrief.notes ?? '').length}-${i}`}
                  debrief={debrief}
                  rank={i + 1}
                  onSaveDebrief={(payload) => handleSaveDebrief(debrief, payload)}
                  isSaving={savingDebriefKey === (debrief.finishedAt ?? debrief.savedAt ?? '')}
                />
              ))}
            </div>
          )}
        </section>
      )}

      {activeTab === 'library' && (
        <>
          <section style={{ marginTop: 24, display: 'grid', gap: 16, gridTemplateColumns: '1.6fr 1fr' }}>
            <article style={{ ...heroCardStyle, overflow: 'hidden', padding: 0 }}>
              <img src={firstItem.imageUrl} alt={firstItem.imageAlt} style={{ width: '100%', height: 220, objectFit: 'cover' }} />
              <div style={{ padding: 16 }}>
                <div style={{ display: 'inline-block', padding: '4px 10px', borderRadius: 99, fontSize: 12, border: '1px solid var(--color-border)', marginBottom: 10 }}>
                  Mise en avant
                </div>
                <h2 style={{ margin: '0 0 6px' }}>{firstItem.title}</h2>
                <p style={{ margin: '0 0 12px', color: 'var(--color-text-muted)' }}>{firstItem.subtitle}</p>
                <p style={{ margin: 0, fontWeight: 700 }}>{firstItem.value}</p>
              </div>
            </article>

            <aside style={heroCardStyle}>
              <h3 style={{ marginTop: 0 }}>Comment utiliser cette page</h3>
              <p style={{ marginTop: 0, color: 'var(--color-text-muted)' }}>
                Ouvre les cartes pour lire les détails actionnables et garder une trace des recommandations utiles pour tes prochaines courses.
              </p>
              <p style={{ marginBottom: 0, color: 'var(--color-text-muted)', fontSize: 14 }}>
                Chaque article inclut une source cliquable afin de vérifier facilement la référence.
              </p>
            </aside>
          </section>

          <section style={{ marginTop: 26 }}>
            <h2 style={{ marginBottom: 10 }}>Repères utiles</h2>
            <p style={{ marginTop: 0, color: 'var(--color-text-muted)' }}>
              Ces chiffres servent de base, puis se personnalisent selon votre réponse individuelle.
            </p>
            <div style={{ display: 'grid', gap: 12, gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))' }}>
              {keyNumbers.map((item) => (
                <Card key={item.id} item={item} />
              ))}
            </div>
          </section>

          <section style={{ marginTop: 28 }}>
            <h2 style={{ marginBottom: 10 }}>Conseils pratiques</h2>
            <p style={{ marginTop: 0, color: 'var(--color-text-muted)' }}>
              Objectif : rendre la stratégie exécutable en entraînement puis en compétition.
            </p>
            <div style={{ display: 'grid', gap: 12, gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))' }}>
              {practicalTips.map((item) => (
                <Card key={item.id} item={item} />
              ))}
            </div>
          </section>
        </>
      )}
      </main>
    </div>
  );
}
