'use client';

import {
  useState,
  useEffect,
  useRef,
  useCallback,
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

const ONBOARDING_PROFILE_KEY = 'fuelos_onboarding_profile_done';
const ONBOARDING_EVENT_KEY = 'fuelos_onboarding_event_done';
const ONBOARDING_EVENT_STEP_KEY = 'fuelos_onboarding_event_step_done';

const S = {
  page: {
    minHeight: '100vh',
    background: 'var(--color-bg)',
    color: 'var(--color-text)',
    fontFamily: 'system-ui, sans-serif',
  } as CSSProperties,
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
  main: { maxWidth: 960, margin: '0 auto', padding: '28px 24px 48px' } as CSSProperties,
  card: {
    background: 'var(--color-bg-card)',
    border: '1px solid var(--color-border)',
    borderRadius: 12,
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
};

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

  const [plan, setPlan] = useState<FuelPlan | null>(null);
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
    try {
      const planParam = searchParams.get('plan');

      if (planParam) {
        const data = JSON.parse(decodeURIComponent(planParam));
        setPlan(data.plan);
        setProfile(data.profile);
        setEvent(data.event);
        return;
      }

      const saved = localStorage.getItem('fuelos_active_plan');
      if (saved) {
        const data = JSON.parse(saved);
        setPlan(data.fuelPlan || data.plan);
        setProfile(data.profile);
        setEvent(data.event);
      }
    } catch (e) {
      console.error('Plan load error:', e);
    }
  }, [searchParams]);

  useEffect(() => {
    if (raceState.status === 'running') {
      intervalRef.current = setInterval(() => {
        setRaceState((prev) => ({
          ...prev,
          elapsedMs: prev.startTime != null ? Date.now() - prev.startTime : prev.elapsedMs,
        }));
      }, 1000);
    } else if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [raceState.status]);

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
      startTime: Date.now() - prev.elapsedMs,
    }));
  }, [ensureAudioContext]);

  const handlePause = useCallback(() => {
    setRaceState((prev) => {
      const elapsedMs = prev.startTime != null ? Date.now() - prev.startTime : prev.elapsedMs;
      return { ...prev, status: 'paused', startTime: null, elapsedMs };
    });
  }, []);

  const handleResume = useCallback(() => {
    setRaceState((prev) => ({
      ...prev,
      status: 'running',
      startTime: Date.now() - prev.elapsedMs,
    }));
  }, []);

  const handleFinish = useCallback(() => {
    setRaceState((prev) => ({ ...prev, status: 'finished', startTime: null }));
    if (intervalRef.current) clearInterval(intervalRef.current);

    try {
      const debrief = {
        plan,
        profile,
        event,
        raceState,
        finishedAt: new Date().toISOString(),
      };
      const existing = JSON.parse(localStorage.getItem('fuelos_debriefs') || '[]');
      existing.unshift(debrief);
      localStorage.setItem('fuelos_debriefs', JSON.stringify(existing.slice(0, 10)));
    } catch (e) {
      console.error('Debrief save error:', e);
    }
  }, [plan, profile, event, raceState]);

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

  if (!plan) {
    return (
      <div style={S.page}>
        <Header sticky />

        <main style={{ ...S.main, paddingTop: 52 }}>
          <div style={{ maxWidth: 520, margin: '0 auto' }}>
            <div style={{ textAlign: 'center', marginBottom: 28 }}>
              <div style={{ fontSize: 40, marginBottom: 8 }}>⚡</div>
              <h1 style={{ fontSize: 28, fontWeight: 900, marginBottom: 8 }}>Race Mode</h1>
              <p style={{ ...S.muted, fontSize: 14, margin: 0 }}>
                Aucun plan actif. Suis les étapes ci-dessous pour lancer le mode course.
              </p>
            </div>

            <div style={{ ...S.card, position: 'relative', padding: '24px 20px 24px 28px' }}>
              <div style={S.stepperRail} aria-hidden />
              {(
                [
                  {
                    n: 1,
                    title: 'Crée ton profil athlète',
                    desc: 'Poids, transpiration, tolérance GI…',
                    done: onboarding.profileDone,
                    href: '/plan?step=profile',
                    cta: 'Ouvrir',
                  },
                  {
                    n: 2,
                    title: 'Configure ta course',
                    desc: 'Sport, distance, dénivelé, météo…',
                    done: onboarding.eventStepDone,
                    href: '/plan?step=event',
                    cta: 'Ouvrir',
                  },
                ] as const
              ).map((step) => (
                <div
                  key={step.n}
                  style={{
                    display: 'flex',
                    gap: 16,
                    alignItems: 'flex-start',
                    marginBottom: step.n === 2 ? 22 : 20,
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

              <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start' }}>
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
                    background:
                      onboarding.profileDone && onboarding.eventStepDone
                        ? 'var(--color-accent)'
                        : 'var(--color-bg-card)',
                    color:
                      onboarding.profileDone && onboarding.eventStepDone
                        ? '#000'
                        : 'var(--color-text-muted)',
                    border:
                      onboarding.profileDone && onboarding.eventStepDone
                        ? 'none'
                        : '2px solid var(--color-border)',
                    position: 'relative',
                    zIndex: 1,
                  }}
                >
                  {onboarding.profileDone && onboarding.eventStepDone ? '✓' : '3'}
                </div>
                <div style={{ flex: 1, minWidth: 0, paddingTop: 2 }}>
                  <div style={{ fontWeight: 800, fontSize: 15, marginBottom: 4 }}>Lance le Race Mode</div>
                  <p style={{ ...S.muted, fontSize: 12, margin: '0 0 12px', lineHeight: 1.45 }}>
                    Timer, alertes et suivi du plan le jour J.
                  </p>
                  {onboarding.profileDone && onboarding.eventStepDone ? (
                    <Link
                      href={onboarding.hasPlanInStorage ? '/race' : '/plan?step=event'}
                      onClick={(e) => {
                        if (onboarding.hasPlanInStorage) {
                          e.preventDefault();
                          window.location.assign('/race');
                        }
                      }}
                      style={{
                        ...S.btnPrimary,
                        display: 'inline-block',
                        width: 'auto',
                        padding: '10px 18px',
                        fontSize: 14,
                        textDecoration: 'none',
                      }}
                    >
                      Lance le Race Mode →
                    </Link>
                  ) : (
                    <div
                      role="status"
                      style={{
                        ...S.btnPrimary,
                        display: 'inline-block',
                        width: 'auto',
                        padding: '10px 18px',
                        fontSize: 14,
                        opacity: 0.42,
                        cursor: 'not-allowed',
                        pointerEvents: 'none',
                      }}
                    >
                      Lance le Race Mode
                    </div>
                  )}
                </div>
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
    <div style={S.page}>
      <Header sticky />

      <main style={S.main}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap', marginBottom: 16 }}>
          <div>
            <div style={{ fontSize: 22, fontWeight: 900, marginBottom: 2 }}>Race Mode</div>
            <div style={{ ...S.muted, fontSize: 13 }}>
              {event ? `${event.sport} · ${event.distance} km · objectif ${event.targetTime} h` : 'Exécution du plan'}
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

          {raceState.status === 'idle' && (
            <button onClick={handleStart} style={S.btnPrimary}>
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

          {/* Alert Card */}
          {showAlert && alertItem && raceState.status === 'running' && (
            <div
              className="rounded-2xl p-5"
              style={{
                border: '1px solid color-mix(in srgb, var(--color-warning) 55%, var(--color-border))',
                background: 'color-mix(in srgb, var(--color-warning) 12%, var(--color-bg-card))',
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
              className="rounded-2xl p-4 backdrop-blur-xl"
              style={{
                border: '1px solid var(--color-border)',
                background: 'var(--color-bg-card)',
              }}
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
          <div className="grid grid-cols-3 gap-3">
            <div
              className="rounded-xl p-3 text-center"
              style={{
                border: '1px solid var(--color-border)',
                background: 'var(--color-bg-card)',
              }}
            >
              <div className="text-xl font-bold" style={{ color: 'var(--color-accent)' }}>
                {raceState.choConsumed}g
              </div>
              <div className="mt-1 text-xs" style={S.muted}>
                CHO pris
              </div>
            </div>

            <div
              className="rounded-xl p-3 text-center"
              style={{
                border: '1px solid var(--color-border)',
                background: 'var(--color-bg-card)',
              }}
            >
              <div className="text-xl font-bold">{raceState.waterConsumed}ml</div>
              <div className="mt-1 text-xs" style={S.muted}>
                Eau
              </div>
            </div>

            <div
              className="rounded-xl p-3 text-center"
              style={{
                border: '1px solid var(--color-border)',
                background: 'var(--color-bg-card)',
              }}
            >
              <div
                className="text-xl font-bold"
                style={{
                  color: compliance >= 80 ? 'var(--color-accent)' : compliance >= 50 ? 'var(--color-warning)' : 'var(--color-danger)',
                }}
              >
                {compliance}%
              </div>
              <div className="mt-1 text-xs" style={S.muted}>
                Compliance
              </div>
            </div>
          </div>

          {/* Dynamic recalculation */}
          {choDeficit > 0 && (
            <div
              className="rounded-xl p-4"
              style={{
                border: '1px solid color-mix(in srgb, var(--color-warning) 55%, var(--color-border))',
                background: 'color-mix(in srgb, var(--color-warning) 10%, var(--color-bg-card))',
              }}
            >
              <div className="mb-1 text-sm font-bold">🔄 Recalcul dynamique</div>
              <div className="text-sm" style={S.muted}>
                {choDeficit}g CHO manquants redistribués · Objectif ajusté :
                <span style={{ fontWeight: 900, color: 'var(--color-warning)' }}> {adjustedChoPerH}g/h</span>
              </div>
            </div>
          )}

          <div
            className="rounded-xl p-4"
            style={{
              border: '1px solid var(--color-border)',
              background: 'var(--color-bg-card)',
            }}
          >
            <div className="mb-1 text-sm font-bold">⏱ Adaptation temps réel</div>
            <div className="text-sm" style={S.muted}>
              {paceStatus} · Les rappels futurs sont automatiquement decalés de {Math.abs(timingOffsetMin).toFixed(1)} min.
            </div>
          </div>

          {/* Timeline */}
          <div
            className="overflow-hidden rounded-2xl backdrop-blur-xl"
            style={{
              border: '1px solid var(--color-border)',
              background: 'var(--color-bg-card)',
            }}
          >
            <div
              className="flex items-center justify-between px-4 py-3"
              style={{
                borderBottom: '1px solid var(--color-border)',
              }}
            >
              <span className="font-bold" style={{ color: 'var(--color-text)' }}>
                📋 Timeline
              </span>
              <span className="text-sm" style={S.muted}>
                {consumedCount} pris · {skippedCount} passés · {totalItems - consumedCount - skippedCount} restants
              </span>
            </div>

            <div className="max-h-64 overflow-y-auto">
              {timelineByHour.map((group) => (
                <div key={group.hour}>
                  <div
                    className="sticky top-0 z-10 px-4 py-2 backdrop-blur"
                    style={{
                      borderTop: '1px solid var(--color-border)',
                      borderBottom: '1px solid var(--color-border)',
                      background: 'color-mix(in srgb, var(--color-bg-card) 86%, var(--color-bg))',
                    }}
                  >
                    <span className="text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--color-text-muted)' }}>
                      Heure {group.hour} ({group.hour * 60}-{group.hour * 60 + 59} min)
                    </span>
                  </div>

                  {group.items.map(({ item, index }) => {
                    const isConsumed = raceState.consumedItems.includes(index);
                    const isSkipped = raceState.skippedItems.includes(index);
                    const isCurrent = index === raceState.currentItemIndex && showAlert;
                    const isPast = item.timeMin <= elapsedMin && !isConsumed && !isSkipped;

                    return (
                      <div
                        key={index}
                        className="flex items-center gap-3 px-4 py-3 last:border-0"
                        style={{
                          borderBottom: '1px solid var(--color-border)',
                          opacity: isConsumed ? 0.45 : isSkipped ? 0.35 : 1,
                          textDecoration: isSkipped ? 'line-through' : 'none',
                          background: isCurrent ? 'color-mix(in srgb, var(--color-warning) 10%, var(--color-bg-card))' : 'transparent',
                        }}
                      >
                        <div
                          className="w-10 flex-shrink-0 text-sm font-mono"
                          style={{
                            color: isPast && !isConsumed ? 'var(--color-danger)' : 'var(--color-text-muted)',
                          }}
                        >
                          {Math.floor(item.timeMin)}min
                        </div>

                        <div
                          className="flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full text-xs"
                          style={{
                            background: isConsumed
                              ? 'var(--color-accent)'
                              : isSkipped
                              ? 'color-mix(in srgb, var(--color-danger) 22%, transparent)'
                              : isCurrent
                              ? 'var(--color-warning)'
                              : 'color-mix(in srgb, var(--color-bg) 65%, transparent)',
                            color: isConsumed || isCurrent ? '#000' : 'var(--color-text)',
                            border: '1px solid var(--color-border)',
                          }}
                        >
                          {isConsumed ? '✓' : isSkipped ? '×' : isCurrent ? '!' : ''}
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="truncate text-sm font-medium" style={{ color: 'var(--color-text)' }}>
                            {item.product}
                          </div>
                          <div className="flex gap-2 text-xs" style={S.muted}>
                            <span>⚡{item.cho}g</span>
                            {item.water && <span>💧{item.water}ml</span>}
                            {item.sodium && <span>🧂{item.sodium}mg</span>}
                          </div>
                        </div>

                        {isPast && raceState.status === 'running' && (
                          <div className="flex gap-1 flex-shrink-0">
                            <button
                              onClick={() => handleConsumed(index)}
                              className="rounded-lg px-2 py-1 text-xs active:scale-95"
                              style={{
                                background: 'rgba(34,197,94,0.10)',
                                color: 'var(--color-accent)',
                                border: '1px solid color-mix(in srgb, var(--color-accent) 55%, var(--color-border))',
                              }}
                            >
                              Pris
                            </button>
                            <button
                              onClick={() => handleSkipped(index)}
                              className="rounded-lg px-2 py-1 text-xs active:scale-95"
                              style={{
                                background: 'transparent',
                                color: 'var(--color-text-muted)',
                                border: '1px solid var(--color-border)',
                              }}
                            >
                              Pass
                            </button>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
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
  usePageTitle('Race Mode');
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