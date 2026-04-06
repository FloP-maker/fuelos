'use client';

import {
  useState,
  useEffect,
  useRef,
  useCallback,
  useMemo,
  useId,
  type CSSProperties,
  type ReactNode,
} from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Suspense } from 'react';
import type { FuelPlan, AthleteProfile, EventDetails, TimelineItem } from '../lib/types';
import usePageTitle from '../lib/hooks/usePageTitle';
import { Header } from '../components/Header';
import { SectionBreadcrumb } from '../components/SectionBreadcrumb';

const ONBOARDING_PROFILE_KEY = 'fuelos_onboarding_profile_done';
const ONBOARDING_EVENT_KEY = 'fuelos_onboarding_event_done';
const ONBOARDING_EVENT_STEP_KEY = 'fuelos_onboarding_event_step_done';

const S = {
  btnOutline: {
    padding: '10px 20px',
    borderRadius: 8,
    background: 'transparent',
    color: 'var(--color-text)',
    fontWeight: 600,
    fontSize: 14,
    border: '1px solid var(--color-border)',
    cursor: 'pointer',
    textDecoration: 'none',
  } as CSSProperties,
  main: { paddingTop: 28 } as CSSProperties,
  card: {
    background: 'var(--color-bg-card)',
    border: '1px solid var(--color-border)',
    borderRadius: 'var(--radius-lg)',
    boxShadow: 'var(--shadow-xs)',
    padding: 18,
  } as CSSProperties,
  cardTitle: { fontWeight: 800, fontSize: 14 } as CSSProperties,
  muted: { color: 'var(--color-text-muted)' } as CSSProperties,
  monoTime: {
    fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
    fontWeight: 900,
    fontSize: 52,
    letterSpacing: '-0.04em',
  } as CSSProperties,
  btnPrimary: {
    width: '100%',
    padding: '14px 18px',
    borderRadius: 10,
    background: 'var(--color-accent)',
    color: '#000',
    fontWeight: 800,
    fontSize: 16,
    border: 'none',
    cursor: 'pointer',
  } as CSSProperties,
  btnDanger: {
    width: '100%',
    padding: '14px 18px',
    borderRadius: 10,
    background: 'var(--color-danger)',
    color: '#fff',
    fontWeight: 800,
    fontSize: 16,
    border: 'none',
    cursor: 'pointer',
  } as CSSProperties,
  btnSecondary: {
    width: '100%',
    padding: '14px 18px',
    borderRadius: 10,
    background: 'transparent',
    color: 'var(--color-text)',
    fontWeight: 700,
    fontSize: 15,
    border: '1px solid var(--color-border)',
    cursor: 'pointer',
  } as CSSProperties,
  badge: {
    display: 'inline-flex',
    alignItems: 'center',
    padding: '4px 10px',
    borderRadius: 99,
    fontSize: 11,
    fontWeight: 800,
    letterSpacing: '0.5px',
    border: '1px solid var(--color-border)',
    background: 'color-mix(in srgb, var(--color-bg-card) 65%, transparent)',
  } as CSSProperties,
  stepperRail: {
    position: 'absolute',
    left: 15,
    top: 36,
    bottom: 36,
    width: 2,
    background: 'var(--color-border)',
    borderRadius: 1,
  } as CSSProperties,
  confirmBackdrop: {
    position: 'fixed',
    inset: 0,
    zIndex: 100,
    background: 'color-mix(in srgb, #000 52%, transparent)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  } as CSSProperties,
  confirmPanel: {
    width: '100%',
    maxWidth: 400,
    background: 'var(--color-bg-card)',
    border: '1px solid var(--color-border)',
    borderRadius: 14,
    padding: 22,
    boxShadow: '0 18px 50px color-mix(in srgb, #000 35%, transparent)',
  } as CSSProperties,
  simSpeedBtn: {
    width: '100%',
    padding: '10px 6px',
    borderRadius: 8,
    background: 'transparent',
    color: 'var(--color-text)',
    fontWeight: 600,
    fontSize: 12,
    border: '1px solid var(--color-border)',
    cursor: 'pointer',
  } as CSSProperties,
  simSpeedBtnActive: {
    width: '100%',
    padding: '10px 6px',
    borderRadius: 8,
    background: 'color-mix(in srgb, #7c3aed 16%, var(--color-bg-card))',
    color: 'var(--color-text)',
    fontWeight: 800,
    fontSize: 12,
    border: '1px solid color-mix(in srgb, #7c3aed 45%, var(--color-border))',
    cursor: 'pointer',
  } as CSSProperties,
  prepProgressTrack: {
    height: 8,
    borderRadius: 99,
    background: 'var(--color-border)',
    overflow: 'hidden',
    marginBottom: 6,
  } as CSSProperties,
  /** Zone sous le timer : suivi, stats, timeline */
  raceBottomDock: {
    display: 'flex',
    flexDirection: 'column',
    gap: 18,
    marginTop: 6,
    paddingTop: 22,
    paddingBottom: 'max(32px, env(safe-area-inset-bottom, 0px))',
    borderTop: '1px solid color-mix(in srgb, var(--color-accent) 24%, var(--color-border))',
    background:
      'linear-gradient(180deg, color-mix(in srgb, var(--color-accent) 7%, transparent) 0%, transparent 100px)',
  } as CSSProperties,
  raceStatCell: {
    borderRadius: 16,
    padding: '14px 10px',
    textAlign: 'center' as const,
    border: '1px solid color-mix(in srgb, var(--color-accent) 20%, var(--color-border))',
    background:
      'linear-gradient(165deg, color-mix(in srgb, var(--color-accent) 10%, var(--color-bg-card)) 0%, var(--color-bg-card) 60%)',
    boxShadow: 'var(--shadow-xs)',
  } as CSSProperties,
  raceInfoCard: {
    borderRadius: 16,
    padding: '14px 16px',
    border: '1px solid var(--color-border)',
    background: 'color-mix(in srgb, var(--color-bg-card) 97%, var(--color-bg))',
    boxShadow: 'var(--shadow-xs)',
  } as CSSProperties,
  raceTimelineShell: {
    borderRadius: 20,
    overflow: 'hidden',
    border: '1px solid color-mix(in srgb, var(--color-accent) 22%, var(--color-border))',
    background: 'var(--color-bg-card)',
    boxShadow: '0 10px 40px color-mix(in srgb, #000 10%, transparent)',
  } as CSSProperties,
  raceTimelineHeader: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    flexWrap: 'wrap' as const,
    padding: '14px 18px',
    background:
      'linear-gradient(95deg, color-mix(in srgb, var(--color-accent) 14%, var(--color-bg-card)) 0%, var(--color-bg-card) 55%)',
    borderBottom: '1px solid color-mix(in srgb, var(--color-border) 80%, transparent)',
  } as CSSProperties,
  raceNextCard: {
    borderRadius: 18,
    padding: '16px 18px',
    border: '1px solid color-mix(in srgb, var(--color-accent) 28%, var(--color-border))',
    background:
      'linear-gradient(145deg, color-mix(in srgb, var(--color-accent) 9%, var(--color-bg-card)) 0%, var(--color-bg-card) 100%)',
    boxShadow: 'var(--shadow-sm)',
  } as CSSProperties,
  raceTimelineBody: {
    padding: '16px 14px 20px',
    background: 'color-mix(in srgb, var(--color-bg) 55%, var(--color-bg-card))',
  } as CSSProperties,
  raceTimelineHourLabel: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    marginBottom: 12,
    paddingLeft: 2,
  } as CSSProperties,
};

const SIMULATION_SPEEDS = [1, 10, 20, 30] as const;

function DestructiveConfirmOverlay({
  open,
  title,
  confirmLabel,
  onCancel,
  onConfirm,
  children,
}: {
  open: boolean;
  title: string;
  confirmLabel: string;
  onCancel: () => void;
  onConfirm: () => void;
  children: ReactNode;
}) {
  const titleId = useId();
  if (!open) return null;
  return (
    <div role="dialog" aria-modal="true" aria-labelledby={titleId} style={S.confirmBackdrop}>
      <div style={S.confirmPanel}>
        <h2 id={titleId} style={{ fontWeight: 900, fontSize: 18, margin: '0 0 14px' }}>
          {title}
        </h2>
        <div style={{ marginBottom: 20 }}>{children}</div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          <button type="button" onClick={onCancel} style={S.btnSecondary}>
            Annuler
          </button>
          <button type="button" onClick={onConfirm} style={S.btnDanger}>
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

type SimulationSpeed = (typeof SIMULATION_SPEEDS)[number];

interface RaceState {
  status: 'idle' | 'running' | 'paused' | 'finished';
  startTime: number | null;
  elapsedMs: number;
  currentItemIndex: number;
  consumedItems: number[];
  skippedItems: number[];
  choConsumed: number;
  waterConsumed: number;
  sodiumConsumed: number;
  /** 1 = temps réel ; 10–30 = simulation accélérée (×10 / ×20 / ×30). */
  simulationSpeed: SimulationSpeed;
}

const INITIAL_RACE_STATE: RaceState = {
  status: 'idle',
  startTime: null,
  elapsedMs: 0,
  currentItemIndex: 0,
  consumedItems: [],
  skippedItems: [],
  choConsumed: 0,
  waterConsumed: 0,
  sodiumConsumed: 0,
  simulationSpeed: 1,
};

function formatDuration(ms: number): string {
  const totalSec = Math.floor(ms / 1000);
  const h = Math.floor(totalSec / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  const s = totalSec % 60;
  if (h > 0) return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function sendNotification(title: string, body: string, tag: string) {
  if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
    navigator.serviceWorker.controller.postMessage({ type: 'SHOW_NOTIFICATION', title, body, tag });
  } else if ('Notification' in window && Notification.permission === 'granted') {
    new Notification(title, { body, tag, icon: '/favicon.ico' });
  }
}

async function requestNotificationPermission(): Promise<boolean> {
  if (!('Notification' in window)) return false;
  if (Notification.permission === 'granted') return true;
  if (Notification.permission === 'denied') return false;
  const result = await Notification.requestPermission();
  return result === 'granted';
}

function RaceContent() {
  const searchParams = useSearchParams();

  const [raceState, setRaceState] = useState<RaceState>(INITIAL_RACE_STATE);

  const [mainPlan, setMainPlan] = useState<FuelPlan | null>(null);
  const [altPlan, setAltPlan] = useState<FuelPlan | null>(null);
  const [altPlanLabel, setAltPlanLabel] = useState<string | null>(null);
  const [racePlanVariant, setRacePlanVariant] = useState<'main' | 'alt'>('main');

  const plan =
    mainPlan != null && racePlanVariant === 'alt' && altPlan != null ? altPlan : mainPlan;

  const [profile, setProfile] = useState<AthleteProfile | null>(null);
  const [event, setEvent] = useState<EventDetails | null>(null);
  const [onboarding, setOnboarding] = useState({
    profileDone: false,
    eventStepDone: false,
    hasPlanInStorage: false,
  });
  const [alertItem, setAlertItem] = useState<TimelineItem | null>(null);
  const [showAlert, setShowAlert] = useState(false);
  const [showFinishConfirm, setShowFinishConfirm] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [choDeficit, setChoDeficit] = useState(0);
  const [notifEnabled, setNotifEnabled] = useState(false);
  const [timingOffsetMin, setTimingOffsetMin] = useState(0);
  const [completedAtMinByItem, setCompletedAtMinByItem] = useState<Record<number, number>>({});
  /** Évite d’afficher la checklist avant la fin du chargement cloud / localStorage. */
  const [planLoadResolved, setPlanLoadResolved] = useState(false);

  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const alertShownRef = useRef<Set<number>>(new Set());
  const audioContextRef = useRef<AudioContext | null>(null);

  const ensureAudioContext = useCallback(() => {
    if (typeof window === 'undefined') return;
    if (!audioContextRef.current) {
      audioContextRef.current = new window.AudioContext();
    }
    if (audioContextRef.current.state === 'suspended') {
      audioContextRef.current.resume().catch(() => undefined);
    }
  }, []);

  const playSoundCue = useCallback(
    (type: 'soon' | 'due' | 'confirm') => {
      const ctx = audioContextRef.current;
      if (!ctx) return;
      const now = ctx.currentTime;
      const pattern =
        type === 'soon'
          ? [740]
          : type === 'due'
          ? [880, 1100]
          : [660];

      pattern.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.value = freq;
        gain.gain.setValueAtTime(0.0001, now + idx * 0.16);
        gain.gain.exponentialRampToValueAtTime(0.09, now + idx * 0.16 + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + idx * 0.16 + 0.12);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now + idx * 0.16);
        osc.stop(now + idx * 0.16 + 0.13);
      });
    },
    []
  );

  const refreshOnboarding = useCallback(() => {
    try {
      const savedPlan = localStorage.getItem('fuelos_active_plan');
      let hasPlanInStorage = false;
      if (savedPlan) {
        const data = JSON.parse(savedPlan) as { fuelPlan?: FuelPlan; plan?: FuelPlan };
        const p = data.fuelPlan || data.plan;
        hasPlanInStorage = !!(p && Array.isArray(p.timeline) && p.timeline.length > 0);
      }
      const eventStepDone =
        localStorage.getItem(ONBOARDING_EVENT_STEP_KEY) === '1' ||
        localStorage.getItem(ONBOARDING_EVENT_KEY) === '1';
      setOnboarding({
        profileDone: localStorage.getItem(ONBOARDING_PROFILE_KEY) === '1',
        eventStepDone,
        hasPlanInStorage,
      });
    } catch {
      setOnboarding({ profileDone: false, eventStepDone: false, hasPlanInStorage: false });
    }
  }, []);

  useEffect(() => {
    refreshOnboarding();
    const onVis = () => refreshOnboarding();
    const onStorage = (e: StorageEvent) => {
      if (
        e.key === ONBOARDING_PROFILE_KEY ||
        e.key === ONBOARDING_EVENT_KEY ||
        e.key === ONBOARDING_EVENT_STEP_KEY ||
        e.key === 'fuelos_active_plan'
      ) {
        refreshOnboarding();
      }
    };
    document.addEventListener('visibilitychange', onVis);
    window.addEventListener('focus', onVis);
    window.addEventListener('storage', onStorage);
    return () => {
      document.removeEventListener('visibilitychange', onVis);
      window.removeEventListener('focus', onVis);
      window.removeEventListener('storage', onStorage);
    };
  }, [refreshOnboarding]);

  useEffect(() => {
    const applyBundle = (data: {
      plan?: FuelPlan;
      fuelPlan?: FuelPlan;
      altFuelPlan?: FuelPlan;
      altPlanLabel?: string;
      racePlanVariant?: 'main' | 'alt';
      profile: AthleteProfile;
      event: EventDetails;
    }) => {
      const loadedMain = data.fuelPlan || data.plan;
      const loadedAlt = data.altFuelPlan ?? null;
      const variant: 'main' | 'alt' =
        data.racePlanVariant === 'alt' && loadedAlt ? 'alt' : 'main';
      setMainPlan(loadedMain ?? null);
      setAltPlan(loadedAlt);
      setAltPlanLabel(data.altPlanLabel ?? null);
      setRacePlanVariant(variant);
      setProfile(data.profile);
      setEvent(data.event);
    };

    void (async () => {
      try {
        const planParam = searchParams.get('plan');

        if (planParam) {
          const data = JSON.parse(decodeURIComponent(planParam));
          applyBundle(data);
          return;
        }

        const cloud = await fetch('/api/user/plans/active', { credentials: 'include' });
        if (cloud.ok) {
          const j = (await cloud.json()) as { snapshot?: { payload?: unknown } | null };
          const payload = j.snapshot?.payload;
          if (payload && typeof payload === 'object' && payload !== null) {
            applyBundle(payload as Parameters<typeof applyBundle>[0]);
            return;
          }
        }

        const saved = localStorage.getItem('fuelos_active_plan');
        if (saved) {
          applyBundle(JSON.parse(saved) as Parameters<typeof applyBundle>[0]);
        }
      } catch (e) {
        console.error('Plan load error:', e);
      } finally {
        setPlanLoadResolved(true);
      }
    })();
  }, [searchParams]);

  const persistRacePlanVariant = useCallback((variant: 'main' | 'alt') => {
    try {
      const raw = localStorage.getItem('fuelos_active_plan');
      if (!raw) return;
      const data = JSON.parse(raw) as Record<string, unknown>;
      data.racePlanVariant = variant;
      const next = JSON.stringify(data);
      localStorage.setItem('fuelos_active_plan', next);
      void fetch('/api/user/plans/active', {
        method: 'PATCH',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ payload: JSON.parse(next) as object }),
      }).catch(() => {
        /* non connecté ou pas de plan actif en base */
      });
    } catch {
      /* ignore */
    }
  }, []);

  const handleRacePlanVariantChange = useCallback(
    (variant: 'main' | 'alt') => {
      if (raceState.status !== 'idle') return;
      if (variant === 'alt' && !altPlan) return;
      setRacePlanVariant(variant);
      persistRacePlanVariant(variant);
    },
    [raceState.status, altPlan, persistRacePlanVariant]
  );

  const appendDebrief = useCallback(
    (finishedState: RaceState) => {
      try {
        const debrief = {
          plan,
          profile,
          event,
          raceState: finishedState,
          finishedAt: new Date().toISOString(),
        };
        const existing = JSON.parse(localStorage.getItem('fuelos_debriefs') || '[]');
        existing.unshift(debrief);
        localStorage.setItem('fuelos_debriefs', JSON.stringify(existing.slice(0, 10)));
        void fetch('/api/user/debriefs', {
          method: 'POST',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            payload: debrief,
            finishedAt: debrief.finishedAt,
          }),
        }).catch(() => {
          /* sync cloud optionnelle */
        });
      } catch (e) {
        console.error('Debrief save error:', e);
      }
    },
    [plan, profile, event]
  );

  useEffect(() => {
    if (raceState.status !== 'running') {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      return;
    }

    const targetMs =
      event != null ? event.targetTime * 60 * 60 * 1000 : Number.POSITIVE_INFINITY;
    const speed = raceState.simulationSpeed;
    const intervalMs = speed === 1 ? 1000 : Math.max(1, 1000 / speed);

    const tick = () => {
      setRaceState((prev) => {
        if (prev.status !== 'running') return prev;
        let nextElapsed: number;
        if (prev.simulationSpeed === 1) {
          nextElapsed = prev.startTime != null ? Date.now() - prev.startTime : prev.elapsedMs;
        } else {
          nextElapsed = prev.elapsedMs + 1000;
        }
        if (nextElapsed >= targetMs) {
          const finishedState: RaceState = {
            ...prev,
            status: 'finished',
            startTime: null,
            elapsedMs: targetMs,
          };
          appendDebrief(finishedState);
          return finishedState;
        }
        return { ...prev, elapsedMs: nextElapsed };
      });
    };

    intervalRef.current = setInterval(tick, intervalMs);
    tick();

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [raceState.status, raceState.simulationSpeed, event, appendDebrief]);

  useEffect(() => {
    if (!plan || raceState.status !== 'running') return;

    const elapsedMin = raceState.elapsedMs / 60000;

    for (let i = 0; i < plan.timeline.length; i++) {
      const item = plan.timeline[i];
      const dueMin = item.timeMin + timingOffsetMin;
      const isConsumed = raceState.consumedItems.includes(i);
      const isSkipped = raceState.skippedItems.includes(i);

      if (isConsumed || isSkipped) continue;

      const alertKey = i * 1000 + 1;
      if (elapsedMin >= dueMin - 1 && elapsedMin < dueMin && !alertShownRef.current.has(alertKey)) {
        alertShownRef.current.add(alertKey);
        playSoundCue('soon');
        if (notifEnabled) {
          sendNotification('⏰ FuelOS', `Dans 1 min : ${item.product} · ${item.cho}g CHO`, `alert-soon-${i}`);
        }
      }

      if (elapsedMin >= dueMin && !alertShownRef.current.has(i)) {
        alertShownRef.current.add(i);
        setAlertItem(item);
        setShowAlert(true);
        setRaceState((prev) => ({ ...prev, currentItemIndex: i }));
        playSoundCue('due');

        if (notifEnabled) {
          sendNotification(
            '⚡ FuelOS · Ravitaillement',
            `${item.product} · ${item.cho}g CHO${item.water ? ` · ${item.water}ml` : ''}`,
            `alert-due-${i}`
          );
        }

        setTimeout(() => setShowAlert(false), 30000);
      }
    }
  }, [
    raceState.elapsedMs,
    raceState.status,
    raceState.consumedItems,
    raceState.skippedItems,
    plan,
    notifEnabled,
    timingOffsetMin,
    playSoundCue,
  ]);

  const handleStart = useCallback(async () => {
    ensureAudioContext();
    const granted = await requestNotificationPermission();
    setNotifEnabled(granted);
    setRaceState((prev) => ({
      ...prev,
      status: 'running',
      startTime: prev.simulationSpeed === 1 ? Date.now() - prev.elapsedMs : null,
    }));
  }, [ensureAudioContext]);

  const handlePause = useCallback(() => {
    setRaceState((prev) => {
      if (prev.simulationSpeed > 1) {
        return { ...prev, status: 'paused', startTime: null };
      }
      const elapsedMs = prev.startTime != null ? Date.now() - prev.startTime : prev.elapsedMs;
      return { ...prev, status: 'paused', startTime: null, elapsedMs };
    });
  }, []);

  const handleResume = useCallback(() => {
    setRaceState((prev) => ({
      ...prev,
      status: 'running',
      startTime: prev.simulationSpeed === 1 ? Date.now() - prev.elapsedMs : null,
    }));
  }, []);

  const handleFinish = useCallback(() => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    setRaceState((prev) => {
      const next = { ...prev, status: 'finished' as const, startTime: null };
      appendDebrief(next);
      return next;
    });
  }, [appendDebrief]);

  const handleReset = useCallback(() => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    alertShownRef.current = new Set();
    setRaceState({ ...INITIAL_RACE_STATE });
    setCompletedAtMinByItem({});
    setChoDeficit(0);
    setTimingOffsetMin(0);
    setShowAlert(false);
    setAlertItem(null);
  }, []);

  const handleConsumed = useCallback(
    (itemIndex: number) => {
      if (!plan) return;
      const item = plan.timeline[itemIndex];

      setRaceState((prev) => ({
        ...prev,
        consumedItems: [...prev.consumedItems, itemIndex],
        choConsumed: prev.choConsumed + (item.cho || 0),
        waterConsumed: prev.waterConsumed + (item.water || 0),
        sodiumConsumed: prev.sodiumConsumed + (item.sodium || 0),
      }));
      setCompletedAtMinByItem((prev) => ({ ...prev, [itemIndex]: raceState.elapsedMs / 60000 }));

      setShowAlert(false);
      setChoDeficit((prev) => Math.max(0, prev - (item.cho || 0)));
      playSoundCue('confirm');
    },
    [plan, raceState.elapsedMs, playSoundCue]
  );

  const handleSkipped = useCallback(
    (itemIndex: number) => {
      if (!plan) return;
      const item = plan.timeline[itemIndex];

      setRaceState((prev) => ({
        ...prev,
        skippedItems: [...prev.skippedItems, itemIndex],
      }));
      setCompletedAtMinByItem((prev) => ({ ...prev, [itemIndex]: raceState.elapsedMs / 60000 }));

      setChoDeficit((prev) => prev + (item.cho || 0));
      setShowAlert(false);
    },
    [plan, raceState.elapsedMs]
  );

  useEffect(() => {
    if (!plan) return;
    const completedDeltas = Object.keys(completedAtMinByItem)
      .map((indexText) => {
        const index = Number(indexText);
        const actualMin = completedAtMinByItem[index] ?? 0;
        const scheduledMin = plan.timeline[index]?.timeMin ?? actualMin;
        return { actualMin, deltaMin: actualMin - scheduledMin };
      })
      .sort((a, b) => a.actualMin - b.actualMin);

    if (completedDeltas.length === 0) {
      setTimingOffsetMin(0);
      return;
    }

    const recent = completedDeltas.slice(-3);
    const average = recent.reduce((sum, value) => sum + value.deltaMin, 0) / recent.length;
    setTimingOffsetMin(clamp(average, -12, 12));
  }, [completedAtMinByItem, plan]);

  useEffect(() => {
    if (!('serviceWorker' in navigator) || !navigator.serviceWorker.controller) return;

    const handleMessage = (event: MessageEvent) => {
      if (event.data.type === 'NOTIFICATION_ACTION') {
        const { action, tag } = event.data;
        const match = tag.match(/(\d+)$/);

        if (match) {
          const itemIndex = parseInt(match[1], 10);

          if (action === 'consumed') {
            handleConsumed(itemIndex);
          } else if (action === 'skip') {
            handleSkipped(itemIndex);
          }
        }
      }
    };

    navigator.serviceWorker.addEventListener('message', handleMessage);
    return () => {
      navigator.serviceWorker.removeEventListener('message', handleMessage);
    };
  }, [handleConsumed, handleSkipped]);

  const handleSimulationSpeedChange = useCallback((speed: SimulationSpeed) => {
    setRaceState((prev) => {
      if (speed === prev.simulationSpeed) return prev;
      if (prev.status === 'running') {
        if (speed === 1 && prev.simulationSpeed > 1) {
          return {
            ...prev,
            simulationSpeed: speed,
            startTime: Date.now() - prev.elapsedMs,
          };
        }
        if (speed > 1 && prev.simulationSpeed === 1) {
          return { ...prev, simulationSpeed: speed, startTime: null };
        }
      }
      return { ...prev, simulationSpeed: speed };
    });
  }, []);

  const prepProgress = useMemo(() => {
    const completed = [
      onboarding.profileDone,
      onboarding.eventStepDone,
      onboarding.hasPlanInStorage,
    ].filter(Boolean).length;
    return { completed, pct: (completed / 3) * 100 };
  }, [onboarding.profileDone, onboarding.eventStepDone, onboarding.hasPlanInStorage]);

  const nextPrepAction = useMemo(() => {
    if (!onboarding.profileDone) {
      return { href: '/plan?step=profile', label: 'Compléter le profil' };
    }
    if (!onboarding.eventStepDone) {
      return { href: '/plan?step=event', label: 'Configurer la course' };
    }
    if (!onboarding.hasPlanInStorage) {
      return { href: '/plan?step=event#fuelos-plan-calculate', label: 'Calculer mon plan' };
    }
    return null;
  }, [onboarding.profileDone, onboarding.eventStepDone, onboarding.hasPlanInStorage]);

  if (!planLoadResolved) {
    return (
      <div className="fuel-page">
        <Header sticky />
        <main className="fuel-main" style={{ ...S.main, paddingTop: 52 }}>
          <SectionBreadcrumb />
          <div style={{ maxWidth: 520, margin: '0 auto', textAlign: 'center', paddingTop: 56 }}>
            <div style={{ fontSize: 36, marginBottom: 12 }}>⚡</div>
            <p style={{ ...S.muted, fontSize: 14, margin: 0 }}>Chargement du plan…</p>
          </div>
        </main>
      </div>
    );
  }

  if (!plan) {
    const prepSteps = [
      {
        n: 1,
        title: 'Profil athlète',
        desc: 'Poids, transpiration, tolérance digestive…',
        done: onboarding.profileDone,
        href: '/plan?step=profile',
        cta: 'Ouvrir',
      },
      {
        n: 2,
        title: 'Ta course',
        desc: 'Sport, distance, dénivelé, météo, départ…',
        done: onboarding.eventStepDone,
        href: '/plan?step=event',
        cta: 'Ouvrir',
      },
      {
        n: 3,
        title: 'Plan nutritionnel',
        desc: 'Calcule la timeline sur l’étape Course (bouton en bas de page).',
        done: onboarding.hasPlanInStorage,
        href: '/plan?step=event#fuelos-plan-calculate',
        cta: 'Calculer',
      },
    ] as const;

    return (
      <div className="fuel-page">
        <Header sticky />

        <main className="fuel-main" style={{ ...S.main, paddingTop: 52 }}>
          <SectionBreadcrumb />
          <div style={{ maxWidth: 520, margin: '0 auto' }}>
            <div style={{ textAlign: 'center', marginBottom: 24 }}>
              <div style={{ fontSize: 40, marginBottom: 8 }}>⚡</div>
              <h1 className="font-display" style={{ fontSize: 28, fontWeight: 900, marginBottom: 8 }}>
                Mode course
              </h1>
              <p style={{ ...S.muted, fontSize: 14, margin: 0, lineHeight: 1.5 }}>
                Aucun plan chargé. Trois étapes dans le planificateur, puis tu reviens ici pour lancer le
                chronomètre et les alertes.
              </p>
            </div>

            <div style={{ ...S.card, position: 'relative', padding: '22px 20px 22px 28px' }}>
              <div style={S.stepperRail} aria-hidden />
              <div style={{ marginBottom: 22 }}>
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'baseline',
                    marginBottom: 8,
                    gap: 12,
                  }}
                >
                  <span style={{ fontWeight: 900, fontSize: 13, letterSpacing: '0.02em' }}>
                    Préparation mode course
                  </span>
                  <span style={{ ...S.muted, fontSize: 12, fontWeight: 800 }}>
                    {prepProgress.completed}/3
                  </span>
                </div>
                <div
                  style={S.prepProgressTrack}
                  role="progressbar"
                  aria-valuenow={prepProgress.completed}
                  aria-valuemin={0}
                  aria-valuemax={3}
                  aria-label={`Avancement de la préparation : ${prepProgress.completed} sur 3 étapes`}
                >
                  <div
                    style={{
                      height: '100%',
                      width: `${prepProgress.pct}%`,
                      background: 'var(--color-accent)',
                      borderRadius: 99,
                      transition: 'width 0.25s ease',
                    }}
                  />
                </div>
                <p style={{ ...S.muted, fontSize: 12, margin: '10px 0 0', lineHeight: 1.45 }}>
                  {nextPrepAction
                    ? `Prochaine étape : ${nextPrepAction.label.toLowerCase()}.`
                    : 'Tout est prêt — lance le mode course ci-dessous.'}
                </p>
              </div>

              {prepSteps.map((step) => (
                <div
                  key={step.n}
                  style={{
                    display: 'flex',
                    gap: 16,
                    alignItems: 'flex-start',
                    marginBottom: step.n === 3 ? 0 : 20,
                  }}
                >
                  <div
                    style={{
                      width: 32,
                      height: 32,
                      borderRadius: '50%',
                      flexShrink: 0,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontWeight: 900,
                      fontSize: 13,
                      background: step.done ? 'var(--color-accent)' : 'var(--color-bg-card)',
                      color: step.done ? '#000' : 'var(--color-text-muted)',
                      border: step.done ? 'none' : '2px solid var(--color-border)',
                      position: 'relative',
                      zIndex: 1,
                    }}
                  >
                    {step.done ? '✓' : step.n}
                  </div>
                  <div style={{ flex: 1, minWidth: 0, paddingTop: 2 }}>
                    <div style={{ fontWeight: 800, fontSize: 15, marginBottom: 4 }}>{step.title}</div>
                    <p style={{ ...S.muted, fontSize: 12, margin: '0 0 12px', lineHeight: 1.45 }}>
                      {step.desc}
                    </p>
                    <Link
                      href={step.href}
                      style={{
                        ...S.btnOutline,
                        display: 'inline-block',
                        width: 'auto',
                        padding: '8px 16px',
                        fontSize: 13,
                        textDecoration: 'none',
                      }}
                    >
                      {step.cta} →
                    </Link>
                  </div>
                </div>
              ))}

              <div
                style={{
                  marginTop: 22,
                  paddingTop: 22,
                  paddingBottom: 4,
                  borderTop: '1px solid color-mix(in srgb, var(--color-accent) 22%, var(--color-border))',
                  background:
                    'linear-gradient(180deg, color-mix(in srgb, var(--color-accent) 8%, transparent) 0%, transparent 72px)',
                  borderRadius: '0 0 var(--radius-lg) var(--radius-lg)',
                  marginLeft: -4,
                  marginRight: -4,
                  paddingLeft: 4,
                  paddingRight: 4,
                }}
              >
                {onboarding.hasPlanInStorage ? (
                  <button
                    type="button"
                    onClick={() => {
                      window.location.assign('/race');
                    }}
                    style={{
                      ...S.btnPrimary,
                      boxShadow: '0 8px 28px color-mix(in srgb, var(--color-accent) 35%, transparent)',
                    }}
                  >
                    Démarrer le mode course
                  </button>
                ) : nextPrepAction ? (
                  <Link
                    href={nextPrepAction.href}
                    style={{
                      ...S.btnPrimary,
                      display: 'block',
                      textAlign: 'center',
                      textDecoration: 'none',
                      boxShadow: '0 8px 28px color-mix(in srgb, var(--color-accent) 35%, transparent)',
                    }}
                  >
                    {nextPrepAction.label} →
                  </Link>
                ) : null}
                <p style={{ ...S.muted, fontSize: 11, margin: '14px 0 0', lineHeight: 1.5, textAlign: 'center' }}>
                  Quand tu reviens sur cette page après une étape, l’avancement se met à jour tout seul
                  (retour au navigateur ou changement d’onglet).
                </p>
              </div>
            </div>
          </div>
        </main>
      </div>
    );
  }

  const elapsedMin = raceState.elapsedMs / 60000;
  const totalItems = plan.timeline.length;
  const consumedCount = raceState.consumedItems.length;
  const skippedCount = raceState.skippedItems.length;
  const compliance = totalItems > 0 ? Math.round((consumedCount / totalItems) * 100) : 0;

  const nextItemIndex = plan.timeline.findIndex(
    (_, i) => !raceState.consumedItems.includes(i) && !raceState.skippedItems.includes(i)
  );
  const nextItem = nextItemIndex >= 0 ? plan.timeline[nextItemIndex] : null;
  const nextItemMinFromNow = nextItem ? Math.max(0, nextItem.timeMin + timingOffsetMin - elapsedMin) : null;

  const remainingTimeH = plan && event ? Math.max(0.1, event.targetTime - elapsedMin / 60) : 1;
  const adjustedChoPerH =
    choDeficit > 0
      ? Math.round((plan.choPerHour * remainingTimeH + choDeficit) / remainingTimeH)
      : plan.choPerHour;
  const paceStatus =
    timingOffsetMin > 0.5 ? `Retard ${timingOffsetMin.toFixed(1)} min` : timingOffsetMin < -0.5 ? `Avance ${Math.abs(timingOffsetMin).toFixed(1)} min` : 'Dans le timing';

  const timelineByHour = plan.timeline.reduce<
    Array<{ hour: number; items: Array<{ item: TimelineItem; index: number }> }>
  >((groups, item, index) => {
    const hour = Math.floor(item.timeMin / 60);
    const existingGroup = groups[groups.length - 1];
    if (!existingGroup || existingGroup.hour !== hour) {
      groups.push({ hour, items: [{ item, index }] });
    } else {
      existingGroup.items.push({ item, index });
    }
    return groups;
  }, []);

  const progressPercent = Math.min(100, (elapsedMin / ((event?.targetTime || 1) * 60)) * 100);

  return (
    <div className="fuel-page">
      <Header sticky />

      <main className="fuel-main" style={S.main}>
        <SectionBreadcrumb />
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap', marginBottom: 16 }}>
          <div>
            <div className="font-display" style={{ fontSize: 22, fontWeight: 900, marginBottom: 2 }}>
              Mode course
            </div>
            <div style={{ ...S.muted, fontSize: 13 }}>
              {raceState.simulationSpeed > 1
                ? `Simulation ×${raceState.simulationSpeed} — temps accéléré pour tester (le plan nutritionnel est inchangé)`
                : event
                  ? `${event.sport} · ${event.distance} km · objectif ${event.targetTime} h`
                  : 'Exécution du plan'}
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center', justifyContent: 'flex-end' }}>
            {notifEnabled && <span style={{ ...S.badge, borderColor: 'rgba(34,197,94,0.5)', color: 'var(--color-accent)' }}>🔔 notifications</span>}
            {raceState.status === 'running' && (
              <span style={{ ...S.badge, borderColor: 'rgba(239,68,68,0.5)', color: 'color-mix(in srgb, var(--color-danger) 85%, var(--color-text))' }}>
                LIVE
              </span>
            )}
          </div>
        </div>

        {/* KPIs */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: 12, marginBottom: 16 }}>
          <div style={S.card}>
            <div style={{ ...S.muted, fontSize: 12, fontWeight: 700, marginBottom: 6 }}>Statut</div>
            <div style={{ fontWeight: 900 }}>{raceState.status.toUpperCase()}</div>
          </div>
          <div style={S.card}>
            <div style={{ ...S.muted, fontSize: 12, fontWeight: 700, marginBottom: 6 }}>Cible</div>
            <div style={{ fontWeight: 900 }}>{event ? `${event.targetTime}h` : '--'}</div>
          </div>
          <div style={S.card}>
            <div style={{ ...S.muted, fontSize: 12, fontWeight: 700, marginBottom: 6 }}>Restant</div>
            <div style={{ fontWeight: 900 }}>{Math.max(0, totalItems - consumedCount - skippedCount)}</div>
          </div>
        </div>

        {/* Timer */}
        <section style={{ ...S.card, padding: 22, marginBottom: 16 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, flexWrap: 'wrap', alignItems: 'baseline', marginBottom: 12 }}>
            <div style={{ ...S.muted, fontSize: 12, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
              Timer
            </div>
            <div style={{ ...S.muted, fontSize: 12 }}>
              {event ? `${event.sport} · ${event.distance} km` : null}
            </div>
          </div>

          <div style={{ textAlign: 'center', marginBottom: 14 }}>
            <div style={S.monoTime}>{formatDuration(raceState.elapsedMs)}</div>
          </div>

          <div
            aria-label="Progression"
            style={{
              height: 10,
              borderRadius: 99,
              overflow: 'hidden',
              background: 'color-mix(in srgb, var(--color-bg) 72%, transparent)',
              border: '1px solid var(--color-border)',
              marginBottom: 14,
            }}
          >
            <div
              style={{
                height: '100%',
                width: `${progressPercent}%`,
                background: 'linear-gradient(90deg, var(--color-accent) 0%, color-mix(in srgb, var(--color-accent) 70%, #60a5fa) 100%)',
                transition: 'width 1s ease',
              }}
            />
          </div>

          {raceState.status === 'idle' && altPlan && (
            <div style={{ marginBottom: 14 }}>
              <div style={{ ...S.muted, fontSize: 11, fontWeight: 700, marginBottom: 8, letterSpacing: '0.06em' }}>
                Plan à exécuter
              </div>
              <div
                role="group"
                aria-label="Choisir le plan au démarrage"
                style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}
              >
                <button
                  type="button"
                  onClick={() => handleRacePlanVariantChange('main')}
                  style={
                    racePlanVariant === 'main'
                      ? { ...S.btnPrimary, padding: '10px 12px', fontSize: 13 }
                      : { ...S.btnSecondary, padding: '10px 12px', fontSize: 13 }
                  }
                >
                  Plan principal
                </button>
                <button
                  type="button"
                  onClick={() => handleRacePlanVariantChange('alt')}
                  style={
                    racePlanVariant === 'alt'
                      ? { ...S.btnPrimary, padding: '10px 12px', fontSize: 13 }
                      : { ...S.btnSecondary, padding: '10px 12px', fontSize: 13 }
                  }
                >
                  {altPlanLabel ?? 'Variante météo'}
                </button>
              </div>
            </div>
          )}

          {raceState.status === 'idle' && (
            <button type="button" onClick={handleStart} style={S.btnPrimary}>
              Démarrer
            </button>
          )}

          {(raceState.status === 'running' || raceState.status === 'paused') && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                {raceState.status === 'running' ? (
                  <button type="button" onClick={handlePause} style={S.btnSecondary}>
                    Pause
                  </button>
                ) : (
                  <button type="button" onClick={handleResume} style={S.btnPrimary}>
                    Reprendre
                  </button>
                )}
                <button type="button" onClick={() => setShowFinishConfirm(true)} style={S.btnDanger}>
                  Terminer
                </button>
              </div>
              <button type="button" onClick={() => setShowResetConfirm(true)} style={S.btnSecondary}>
                Réinitialiser
              </button>
            </div>
          )}

          {raceState.status === 'finished' && (
            <div style={{ marginTop: 8, display: 'flex', flexDirection: 'column', gap: 10, alignItems: 'stretch' }}>
              <div style={{ textAlign: 'center', fontWeight: 900, color: 'var(--color-accent)' }}>Course terminée</div>
              <button type="button" onClick={() => setShowResetConfirm(true)} style={S.btnSecondary}>
                Réinitialiser
              </button>
            </div>
          )}
        </section>

        {raceState.status !== 'finished' && (
          <section
            aria-labelledby="fuel-race-simulation-title"
            style={{
              ...S.card,
              padding: 20,
              marginBottom: 16,
              border:
                raceState.simulationSpeed > 1
                  ? '2px solid color-mix(in srgb, #a855f7 50%, var(--color-border))'
                  : '1px solid color-mix(in srgb, var(--color-border) 80%, transparent)',
              background:
                raceState.simulationSpeed > 1
                  ? 'color-mix(in srgb, rgba(124, 58, 237, 0.1), var(--color-bg-card))'
                  : 'color-mix(in srgb, var(--color-bg) 35%, var(--color-bg-card))',
              boxShadow:
                raceState.simulationSpeed > 1 ? '0 8px 32px color-mix(in srgb, #a855f7 12%, transparent)' : 'var(--shadow-xs)',
            }}
          >
            <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'baseline', justifyContent: 'space-between', gap: 10, marginBottom: 10 }}>
              <h2
                id="fuel-race-simulation-title"
                className="font-display"
                style={{ fontSize: 16, fontWeight: 900, margin: 0, letterSpacing: '-0.02em' }}
              >
                Simulation du temps
              </h2>
              {raceState.simulationSpeed > 1 ? (
                <span
                  style={{
                    ...S.badge,
                    borderColor: 'color-mix(in srgb, #a855f7 45%, var(--color-border))',
                    color: 'color-mix(in srgb, #a855f7 90%, var(--color-text))',
                    fontSize: 11,
                  }}
                >
                  Actif ×{raceState.simulationSpeed}
                </span>
              ) : (
                <span style={{ ...S.muted, fontSize: 11, fontWeight: 700 }}>Hors ligne — chrono réel ci-dessus</span>
              )}
            </div>
            <p style={{ ...S.muted, fontSize: 13, lineHeight: 1.55, margin: '0 0 16px' }}>
              Indépendant du <strong style={{ color: 'var(--color-text)' }}>mode course réel</strong> : tu accélères
              seulement le défilement du chronomètre pour répéter un plan sans attendre des heures. Les rappels et la
              timeline suivent ce temps « fictif » ; tes données de course ne sont pas celles d&apos;une sortie réelle.
            </p>
            <div
              role="group"
              aria-label="Vitesse de simulation du chronomètre"
              style={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0, 1fr))', gap: 8 }}
            >
              {SIMULATION_SPEEDS.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => handleSimulationSpeedChange(s)}
                  style={s === raceState.simulationSpeed ? S.simSpeedBtnActive : S.simSpeedBtn}
                >
                  {s === 1 ? 'Temps réel' : `×${s}`}
                </button>
              ))}
            </div>
          </section>
        )}

        <section style={S.raceBottomDock} aria-label="Suivi et timeline">
          {/* Alert Card */}
          {showAlert && alertItem && raceState.status === 'running' && (
            <div
              className="rounded-2xl p-5"
              style={{
                border: '1px solid color-mix(in srgb, var(--color-warning) 55%, var(--color-border))',
                background:
                  'linear-gradient(160deg, color-mix(in srgb, var(--color-warning) 16%, var(--color-bg-card)) 0%, color-mix(in srgb, var(--color-warning) 8%, var(--color-bg-card)) 100%)',
                boxShadow: '0 12px 36px color-mix(in srgb, var(--color-warning) 12%, transparent)',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, flexWrap: 'wrap', marginBottom: 10 }}>
                <div style={{ fontWeight: 900 }}>Ravitaillement</div>
                <span style={{ ...S.badge, borderColor: 'color-mix(in srgb, var(--color-warning) 65%, var(--color-border))' }}>
                  maintenant
                </span>
              </div>
              <div style={{ fontSize: 16, fontWeight: 800, marginBottom: 6 }}>{alertItem.product}</div>
              <div style={{ ...S.muted, fontSize: 13, marginBottom: 14 }}>
                ⚡ {alertItem.cho}g CHO
                {alertItem.water ? ` · 💧 ${alertItem.water}ml` : ''}
                {alertItem.sodium ? ` · 🧂 ${alertItem.sodium}mg` : ''}
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => handleConsumed(raceState.currentItemIndex)}
                  className="flex-1 rounded-xl py-4 text-lg font-bold text-slate-950 transition-transform active:scale-95"
                  style={{
                    background: 'var(--color-accent)',
                    border: '1px solid color-mix(in srgb, var(--color-accent) 60%, var(--color-border))',
                  }}
                >
                  ✓ Pris
                </button>
                <button
                  onClick={() => handleSkipped(raceState.currentItemIndex)}
                  className="flex-1 rounded-xl py-4 text-lg font-bold text-white transition-transform active:scale-95"
                  style={{
                    background: 'transparent',
                    color: 'var(--color-text)',
                    border: '1px solid var(--color-border)',
                  }}
                >
                  Passé
                </button>
              </div>
            </div>
          )}

          {/* Next Item */}
          {nextItem && !showAlert && raceState.status !== 'finished' && (
            <div
              className="backdrop-blur-xl"
              style={S.raceNextCard}
            >
              <div className="mb-2 flex items-center justify-between">
                <span className="text-xs font-semibold" style={{ ...S.muted, letterSpacing: '0.18em' }}>
                  PROCHAIN
                </span>
                <span
                  className="text-sm font-bold"
                  style={{
                    color:
                      nextItemMinFromNow !== null && nextItemMinFromNow < 5
                        ? 'var(--color-warning)'
                        : 'var(--color-text-muted)',
                  }}
                >
                  {nextItemMinFromNow !== null ? `dans ${Math.round(nextItemMinFromNow)}min` : ''}
                </span>
              </div>

              <div className="text-lg font-bold" style={{ color: 'var(--color-text)' }}>
                {nextItem.product}
              </div>
              <div className="mt-1 flex flex-wrap gap-3 text-sm" style={{ color: 'var(--color-text-muted)' }}>
                <span>⚡ {nextItem.cho}g CHO</span>
                {nextItem.water && <span>💧 {nextItem.water}ml</span>}
                {nextItem.sodium && <span>🧂 {nextItem.sodium}mg Na+</span>}
              </div>
            </div>
          )}

          {/* Stats Grid */}
          <div>
            <div
              style={{
                fontSize: 11,
                fontWeight: 800,
                letterSpacing: '0.12em',
                textTransform: 'uppercase',
                color: 'var(--color-text-muted)',
                marginBottom: 10,
              }}
            >
              Aujourd&apos;hui sur la course
            </div>
            <div className="grid grid-cols-3 gap-3">
            <div className="text-center" style={S.raceStatCell}>
              <div className="text-xl font-bold" style={{ color: 'var(--color-accent)' }}>
                {raceState.choConsumed}g
              </div>
              <div className="mt-1 text-xs" style={{ ...S.muted, fontWeight: 600 }}>
                CHO pris
              </div>
            </div>

            <div className="text-center" style={S.raceStatCell}>
              <div className="text-xl font-bold" style={{ color: 'var(--color-text)' }}>{raceState.waterConsumed}ml</div>
              <div className="mt-1 text-xs" style={{ ...S.muted, fontWeight: 600 }}>
                Eau
              </div>
            </div>

            <div className="text-center" style={S.raceStatCell}>
              <div
                className="text-xl font-bold"
                style={{
                  color: compliance >= 80 ? 'var(--color-accent)' : compliance >= 50 ? 'var(--color-warning)' : 'var(--color-danger)',
                }}
              >
                {compliance}%
              </div>
              <div className="mt-1 text-xs" style={{ ...S.muted, fontWeight: 600 }}>
                Compliance
              </div>
            </div>
            </div>
          </div>

          {/* Dynamic recalculation */}
          {choDeficit > 0 && (
            <div
              className="rounded-xl p-4"
              style={{
                border: '1px solid color-mix(in srgb, var(--color-warning) 45%, var(--color-border))',
                background:
                  'linear-gradient(135deg, color-mix(in srgb, var(--color-warning) 14%, var(--color-bg-card)) 0%, color-mix(in srgb, var(--color-warning) 6%, var(--color-bg-card)) 100%)',
                boxShadow: 'var(--shadow-xs)',
              }}
            >
              <div className="mb-1 text-sm font-bold">🔄 Recalcul dynamique</div>
              <div className="text-sm" style={S.muted}>
                {choDeficit}g CHO manquants redistribués · Objectif ajusté :
                <span style={{ fontWeight: 900, color: 'var(--color-warning)' }}> {adjustedChoPerH}g/h</span>
              </div>
            </div>
          )}

          <div style={S.raceInfoCard}>
            <div className="mb-1 text-sm font-bold">⏱ Adaptation temps réel</div>
            <div className="text-sm" style={S.muted}>
              {paceStatus} · Les rappels futurs sont automatiquement décalés de {Math.abs(timingOffsetMin).toFixed(1)} min.
            </div>
          </div>

          {/* Timeline — prises groupées par heure, cartes lisibles */}
          <div className="overflow-hidden backdrop-blur-xl" style={S.raceTimelineShell}>
            <div style={S.raceTimelineHeader}>
              <div>
                <span className="font-bold" style={{ color: 'var(--color-text)', fontSize: 15, letterSpacing: '-0.02em' }}>
                  Prises prévues
                </span>
                <div style={{ ...S.muted, fontSize: 11, fontWeight: 600, marginTop: 4 }}>
                  Ordre du plan · glisse pour parcourir
                </div>
              </div>
              <span
                style={{
                  fontSize: 12,
                  fontWeight: 700,
                  padding: '6px 12px',
                  borderRadius: 999,
                  background: 'color-mix(in srgb, var(--color-accent) 12%, var(--color-bg))',
                  color: 'var(--color-text)',
                  border: '1px solid color-mix(in srgb, var(--color-accent) 35%, var(--color-border))',
                  flexShrink: 0,
                }}
              >
                {consumedCount} ✓ · {skippedCount} passés · {totalItems - consumedCount - skippedCount} restants
              </span>
            </div>

            <div
              style={{
                padding: '14px 18px 0',
                borderBottom: '1px solid color-mix(in srgb, var(--color-border) 65%, transparent)',
              }}
            >
              <p
                style={{
                  margin: 0,
                  fontSize: 13,
                  lineHeight: 1.6,
                  color: 'var(--color-text-muted)',
                }}
              >
                <strong style={{ color: 'var(--color-text)' }}>Pourquoi cette timeline ?</strong> Les travaux en
                nutrition d&apos;endurance et les{' '}
                <abbr
                  title="American College of Sports Medicine (recommandations en médecine du sport)"
                  style={{ textDecoration: 'underline dotted', cursor: 'help' }}
                >
                  ACSM
                </abbr>
                , synthèses du{' '}
                <abbr
                  title="International Society of Sports Nutrition (société scientifique de nutrition du sport)"
                  style={{ textDecoration: 'underline dotted', cursor: 'help' }}
                >
                  ISSN
                </abbr>
                , et les guides des diététicien·nes du sport s&apos;accordent sur l&apos;essentiel :{' '}
                <strong style={{ color: 'var(--color-text)' }}>
                  étaler les glucides sur l&apos;effort
                </strong>{' '}
                (souvent de l&apos;ordre de 60–90&nbsp;g/h selon la tolérance),{' '}
                <strong style={{ color: 'var(--color-text)' }}>maintenir hydratation et sodium</strong> selon la
                chaleur et la transpiration, et{' '}
                <strong style={{ color: 'var(--color-text)' }}>fractionner les prises</strong> pour limiter les
                inconforts digestifs. Ta timeline matérialise ce rythme pour ta course ; la pastille verte pulse sur la{' '}
                <strong style={{ color: 'var(--color-text)' }}>prochaine prise attendue</strong> pendant que le
                chronomètre tourne.
              </p>
            </div>

            <div style={S.raceTimelineBody}>
              <div className="max-h-[min(420px,55vh)] overflow-y-auto pr-1" style={{ scrollbarGutter: 'stable' }}>
                {timelineByHour.map((group) => (
                  <div key={group.hour} style={{ marginBottom: 22 }}>
                    <div style={S.raceTimelineHourLabel}>
                      <span
                        aria-hidden
                        style={{
                          width: 10,
                          height: 10,
                          borderRadius: '50%',
                          flexShrink: 0,
                          background: 'var(--color-accent)',
                          boxShadow: '0 0 0 3px color-mix(in srgb, var(--color-accent) 28%, transparent)',
                        }}
                      />
                      <span
                        style={{
                          fontSize: 11,
                          fontWeight: 800,
                          letterSpacing: '0.14em',
                          textTransform: 'uppercase',
                          color: 'var(--color-text-muted)',
                        }}
                      >
                        Heure {group.hour}
                      </span>
                      <span style={{ fontSize: 12, color: 'var(--color-text-muted)', fontWeight: 600 }}>
                        min {group.hour * 60}–{group.hour * 60 + 59}
                      </span>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: 10, paddingLeft: 2 }}>
                      {group.items.map(({ item, index }) => {
                        const isConsumed = raceState.consumedItems.includes(index);
                        const isSkipped = raceState.skippedItems.includes(index);
                        const isCurrent = index === raceState.currentItemIndex && showAlert;
                        const isPast = item.timeMin <= elapsedMin && !isConsumed && !isSkipped;
                        const isFocusRow =
                          (raceState.status === 'running' || raceState.status === 'paused') &&
                          index === nextItemIndex &&
                          !isConsumed &&
                          !isSkipped;

                        return (
                          <div
                            key={index}
                            className="fuel-race-timeline-card"
                            aria-current={isFocusRow ? 'step' : undefined}
                            style={{
                              padding: '12px 14px',
                              borderRadius: 16,
                              border: isCurrent
                                ? '2px solid color-mix(in srgb, var(--color-warning) 65%, var(--color-border))'
                                : '1px solid color-mix(in srgb, var(--color-border) 75%, transparent)',
                              background: isCurrent
                                ? 'color-mix(in srgb, var(--color-warning) 12%, var(--color-bg-card))'
                                : 'var(--color-bg-card)',
                              boxShadow: '0 4px 14px color-mix(in srgb, #000 6%, transparent)',
                              opacity: isConsumed ? 0.58 : isSkipped ? 0.45 : 1,
                              textDecoration: isSkipped ? 'line-through' : 'none',
                            }}
                          >
                            {isFocusRow ? (
                              <div
                                className={
                                  isPast && !isConsumed
                                    ? 'fuel-race-timeline-time-pulse-wrap fuel-race-timeline-time-pulse-wrap--danger'
                                    : 'fuel-race-timeline-time-pulse-wrap'
                                }
                              >
                                <div
                                  style={{
                                    flexShrink: 0,
                                    padding: '7px 11px',
                                    borderRadius: 12,
                                    fontFamily: S.monoTime.fontFamily,
                                    fontSize: 13,
                                    fontWeight: 800,
                                    fontVariantNumeric: 'tabular-nums',
                                    letterSpacing: '-0.02em',
                                    background:
                                      isPast && !isConsumed
                                        ? 'color-mix(in srgb, var(--color-danger) 18%, var(--color-bg-card))'
                                        : 'color-mix(in srgb, var(--color-accent) 11%, var(--color-bg))',
                                    color:
                                      isPast && !isConsumed ? 'var(--color-danger)' : 'var(--color-text)',
                                    border:
                                      isPast && !isConsumed
                                        ? '1px solid color-mix(in srgb, var(--color-danger) 35%, var(--color-border))'
                                        : '1px solid color-mix(in srgb, var(--color-accent) 25%, var(--color-border))',
                                  }}
                                  aria-label={`Prochaine prise attendue, ${Math.floor(item.timeMin)} minutes`}
                                >
                                  {Math.floor(item.timeMin)} min
                                </div>
                              </div>
                            ) : (
                              <div
                                style={{
                                  flexShrink: 0,
                                  padding: '7px 11px',
                                  borderRadius: 12,
                                  fontFamily: S.monoTime.fontFamily,
                                  fontSize: 13,
                                  fontWeight: 800,
                                  fontVariantNumeric: 'tabular-nums',
                                  letterSpacing: '-0.02em',
                                  background:
                                    isPast && !isConsumed
                                      ? 'color-mix(in srgb, var(--color-danger) 18%, var(--color-bg-card))'
                                      : 'color-mix(in srgb, var(--color-accent) 11%, var(--color-bg))',
                                  color:
                                    isPast && !isConsumed ? 'var(--color-danger)' : 'var(--color-text)',
                                  border:
                                    isPast && !isConsumed
                                      ? '1px solid color-mix(in srgb, var(--color-danger) 35%, var(--color-border))'
                                      : '1px solid color-mix(in srgb, var(--color-accent) 25%, var(--color-border))',
                                }}
                              >
                                {Math.floor(item.timeMin)} min
                              </div>
                            )}

                            <div style={{ flex: 1, minWidth: 0 }}>
                              <div
                                style={{
                                  fontWeight: 700,
                                  fontSize: 14,
                                  lineHeight: 1.35,
                                  color: 'var(--color-text)',
                                  marginBottom: 8,
                                }}
                              >
                                {item.product}
                              </div>
                              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                                <span
                                  style={{
                                    fontSize: 11,
                                    fontWeight: 700,
                                    padding: '4px 9px',
                                    borderRadius: 999,
                                    background: 'color-mix(in srgb, var(--color-accent) 10%, var(--color-bg))',
                                    color: 'var(--color-accent)',
                                    border: '1px solid color-mix(in srgb, var(--color-accent) 28%, transparent)',
                                  }}
                                >
                                  {item.cho} g CHO
                                </span>
                                {item.water ? (
                                  <span
                                    style={{
                                      fontSize: 11,
                                      fontWeight: 600,
                                      padding: '4px 9px',
                                      borderRadius: 999,
                                      background: 'var(--color-bg)',
                                      color: 'var(--color-text-muted)',
                                      border: '1px solid var(--color-border)',
                                    }}
                                  >
                                    {item.water} ml
                                  </span>
                                ) : null}
                                {item.sodium ? (
                                  <span
                                    style={{
                                      fontSize: 11,
                                      fontWeight: 600,
                                      padding: '4px 9px',
                                      borderRadius: 999,
                                      background: 'var(--color-bg)',
                                      color: 'var(--color-text-muted)',
                                      border: '1px solid var(--color-border)',
                                    }}
                                  >
                                    {item.sodium} mg Na
                                  </span>
                                ) : null}
                              </div>
                            </div>

                            <div
                              style={{
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'flex-end',
                                gap: 8,
                                flexShrink: 0,
                              }}
                            >
                              <div
                                className={
                                  isFocusRow && !isConsumed && !isSkipped && !isCurrent
                                    ? 'fuel-race-timeline-status-pulse'
                                    : undefined
                                }
                                title={
                                  isConsumed
                                    ? 'Pris'
                                    : isSkipped
                                      ? 'Passé'
                                      : isCurrent
                                        ? 'En cours'
                                        : isFocusRow
                                          ? 'Prochaine prise'
                                          : 'À venir'
                                }
                                style={{
                                  width: 30,
                                  height: 30,
                                  borderRadius: '50%',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  fontSize: 13,
                                  fontWeight: 900,
                                  background: isConsumed
                                    ? 'var(--color-accent)'
                                    : isSkipped
                                      ? 'color-mix(in srgb, var(--color-danger) 20%, var(--color-bg-card))'
                                      : isCurrent
                                        ? 'var(--color-warning)'
                                        : isFocusRow
                                          ? 'var(--color-accent)'
                                          : 'color-mix(in srgb, var(--color-text-muted) 14%, var(--color-bg))',
                                  color:
                                    isConsumed || isCurrent || isFocusRow ? '#000' : 'var(--color-text-muted)',
                                  border: '1px solid color-mix(in srgb, var(--color-border) 80%, transparent)',
                                }}
                              >
                                {isConsumed
                                  ? '✓'
                                  : isSkipped
                                    ? '×'
                                    : isCurrent
                                      ? '!'
                                      : isFocusRow
                                        ? '→'
                                        : '·'}
                              </div>

                              {isPast && raceState.status === 'running' && (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                                  <button
                                    type="button"
                                    onClick={() => handleConsumed(index)}
                                    style={{
                                      padding: '6px 12px',
                                      borderRadius: 10,
                                      fontSize: 12,
                                      fontWeight: 700,
                                      background: 'color-mix(in srgb, var(--color-accent) 14%, var(--color-bg-card))',
                                      color: 'var(--color-accent)',
                                      border: '1px solid color-mix(in srgb, var(--color-accent) 45%, var(--color-border))',
                                      cursor: 'pointer',
                                    }}
                                  >
                                    Pris
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleSkipped(index)}
                                    style={{
                                      padding: '6px 12px',
                                      borderRadius: 10,
                                      fontSize: 12,
                                      fontWeight: 600,
                                      background: 'transparent',
                                      color: 'var(--color-text-muted)',
                                      border: '1px solid var(--color-border)',
                                      cursor: 'pointer',
                                    }}
                                  >
                                    Passé
                                  </button>
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>
      </main>

      <DestructiveConfirmOverlay
        open={showFinishConfirm}
        title="Terminer la course ?"
        confirmLabel="Confirmer la fin"
        onCancel={() => setShowFinishConfirm(false)}
        onConfirm={() => {
          setShowFinishConfirm(false);
          handleFinish();
        }}
      >
        <div style={{ display: 'grid', gap: 14 }}>
          <div>
            <div style={{ ...S.muted, fontSize: 12, fontWeight: 700, marginBottom: 4 }}>Temps écoulé</div>
            <div
              style={{
                fontFamily: S.monoTime.fontFamily,
                fontWeight: 800,
                fontSize: 28,
                letterSpacing: '-0.03em',
              }}
            >
              {formatDuration(raceState.elapsedMs)}
            </div>
          </div>
          <div>
            <div style={{ ...S.muted, fontSize: 12, fontWeight: 700, marginBottom: 4 }}>Compliance actuelle</div>
            <div
              style={{
                fontWeight: 900,
                fontSize: 22,
                color:
                  compliance >= 80
                    ? 'var(--color-accent)'
                    : compliance >= 50
                      ? 'var(--color-warning)'
                      : 'var(--color-danger)',
              }}
            >
              {compliance}%
            </div>
          </div>
        </div>
      </DestructiveConfirmOverlay>

      <DestructiveConfirmOverlay
        open={showResetConfirm}
        title="Réinitialiser la course ?"
        confirmLabel="Confirmer la réinitialisation"
        onCancel={() => setShowResetConfirm(false)}
        onConfirm={() => {
          setShowResetConfirm(false);
          handleReset();
        }}
      >
        <div style={{ display: 'grid', gap: 14 }}>
          <div>
            <div style={{ ...S.muted, fontSize: 12, fontWeight: 700, marginBottom: 4 }}>Temps écoulé</div>
            <div
              style={{
                fontFamily: S.monoTime.fontFamily,
                fontWeight: 800,
                fontSize: 28,
                letterSpacing: '-0.03em',
              }}
            >
              {formatDuration(raceState.elapsedMs)}
            </div>
          </div>
          <div>
            <div style={{ ...S.muted, fontSize: 12, fontWeight: 700, marginBottom: 4 }}>Compliance actuelle</div>
            <div
              style={{
                fontWeight: 900,
                fontSize: 22,
                color:
                  compliance >= 80
                    ? 'var(--color-accent)'
                    : compliance >= 50
                      ? 'var(--color-warning)'
                      : 'var(--color-danger)',
              }}
            >
              {compliance}%
            </div>
          </div>
        </div>
      </DestructiveConfirmOverlay>
    </div>
  );
}

export default function RacePage() {
  usePageTitle('Mode course');
  return (
    <Suspense
      fallback={
        <div
          className="min-h-screen flex items-center justify-center"
          style={{
            background: 'var(--color-bg)',
            color: 'var(--color-text)',
          }}
        >
          <div className="text-2xl" style={{ color: "var(--color-text)" }}>
            ⚡ Chargement...
          </div>
        </div>
      }
    >
      <RaceContent />
    </Suspense>
  );
}