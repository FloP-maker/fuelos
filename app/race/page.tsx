'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Suspense } from 'react';
import type { FuelPlan, AthleteProfile, EventDetails, TimelineItem } from '../lib/types';
import usePageTitle from '../lib/hooks/usePageTitle';

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

function formatDuration(ms: number): string {
  const totalSec = Math.floor(ms / 1000);
  const h = Math.floor(totalSec / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  const s = totalSec % 60;
  if (h > 0) return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  return `${m}:${s.toString().padStart(2, '0')}`;
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

  const [raceState, setRaceState] = useState<RaceState>({
    status: 'idle',
    startTime: null,
    elapsedMs: 0,
    currentItemIndex: 0,
    consumedItems: [],
    skippedItems: [],
    choConsumed: 0,
    waterConsumed: 0,
    sodiumConsumed: 0,
  });

  const [plan, setPlan] = useState<FuelPlan | null>(null);
  const [profile, setProfile] = useState<AthleteProfile | null>(null);
  const [event, setEvent] = useState<EventDetails | null>(null);
  const [alertItem, setAlertItem] = useState<TimelineItem | null>(null);
  const [showAlert, setShowAlert] = useState(false);
  const [choDeficit, setChoDeficit] = useState(0);
  const [notifEnabled, setNotifEnabled] = useState(false);

  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const alertShownRef = useRef<Set<number>>(new Set());

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
        setRaceState((prev) => {
          const now = Date.now();
          const elapsed = prev.elapsedMs + (now - (prev.startTime ?? now));
          return { ...prev, elapsedMs: elapsed, startTime: now };
        });
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
      const dueMin = item.timeMin;
      const isConsumed = raceState.consumedItems.includes(i);
      const isSkipped = raceState.skippedItems.includes(i);

      if (isConsumed || isSkipped) continue;

      const alertKey = i * 1000 + 1;
      if (elapsedMin >= dueMin - 1 && elapsedMin < dueMin && !alertShownRef.current.has(alertKey)) {
        alertShownRef.current.add(alertKey);
        if (notifEnabled) {
          sendNotification('⏰ FuelOS', `Dans 1 min : ${item.product} · ${item.cho}g CHO`, `alert-soon-${i}`);
        }
      }

      if (elapsedMin >= dueMin && !alertShownRef.current.has(i)) {
        alertShownRef.current.add(i);
        setAlertItem(item);
        setShowAlert(true);
        setRaceState((prev) => ({ ...prev, currentItemIndex: i }));

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
  }, [raceState.elapsedMs, raceState.status, plan, notifEnabled]);

  const handleStart = useCallback(async () => {
    const granted = await requestNotificationPermission();
    setNotifEnabled(granted);
    setRaceState((prev) => ({
      ...prev,
      status: 'running',
      startTime: Date.now(),
    }));
  }, []);

  const handlePause = useCallback(() => {
    setRaceState((prev) => ({ ...prev, status: 'paused', startTime: null }));
  }, []);

  const handleResume = useCallback(() => {
    setRaceState((prev) => ({ ...prev, status: 'running', startTime: Date.now() }));
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

      setShowAlert(false);
      setChoDeficit((prev) => Math.max(0, prev - (item.cho || 0)));
    },
    [plan]
  );

  const handleSkipped = useCallback(
    (itemIndex: number) => {
      if (!plan) return;
      const item = plan.timeline[itemIndex];

      setRaceState((prev) => ({
        ...prev,
        skippedItems: [...prev.skippedItems, itemIndex],
      }));

      setChoDeficit((prev) => prev + (item.cho || 0));
      setShowAlert(false);
    },
    [plan]
  );

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
      <div
        className="min-h-screen text-white flex flex-col items-center justify-center p-6"
        style={{
          background:
            'radial-gradient(circle at top, rgba(239,68,68,0.18), transparent 35%), linear-gradient(180deg, #020617 0%, #000000 100%)',
        }}
      >
        <div className="text-6xl mb-6">⚡</div>
        <h1 className="text-2xl font-bold mb-3">Race Mode</h1>
        <p className="text-gray-400 text-center mb-8">Aucun plan actif. Crée ton plan d&apos;abord.</p>
        <Link href="/plan" className="bg-green-500 text-black font-bold py-4 px-8 rounded-xl text-lg">
          Créer mon plan →
        </Link>
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
  const nextItemMinFromNow = nextItem ? Math.max(0, nextItem.timeMin - elapsedMin) : null;

  const remainingTimeH = plan && event ? Math.max(0.1, event.targetTime - elapsedMin / 60) : 1;
  const adjustedChoPerH =
    choDeficit > 0
      ? Math.round((plan.choPerHour * remainingTimeH + choDeficit) / remainingTimeH)
      : plan.choPerHour;

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
    <div
      className="relative min-h-screen text-white"
      style={{
        backgroundColor: '#020617',
      }}
    >
      {/* Background layers, fixed and visible */}
      <div
        aria-hidden="true"
        style={{
          position: 'fixed',
          inset: 0,
          pointerEvents: 'none',
          zIndex: 0,
          background:
            'radial-gradient(circle at top, rgba(239,68,68,0.20), transparent 38%), radial-gradient(circle at 82% 18%, rgba(249,115,22,0.14), transparent 30%), linear-gradient(180deg, rgba(15,23,42,0.35) 0%, rgba(2,6,23,0.96) 100%)',
        }}
      />
      <div
        aria-hidden="true"
        style={{
          position: 'fixed',
          inset: 0,
          pointerEvents: 'none',
          zIndex: 0,
          opacity: 0.07,
          backgroundImage:
            'linear-gradient(rgba(255,255,255,0.18) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.18) 1px, transparent 1px)',
          backgroundSize: '30px 30px',
        }}
      />

      <div className="relative z-10">
        {/* Header */}
        <div
          className="sticky top-0 border-b backdrop-blur"
          style={{
            zIndex: 30,
            borderColor: 'rgba(255,255,255,0.10)',
            background: 'rgba(2,6,23,0.72)',
          }}
        >
          <div className="mx-auto flex w-full max-w-3xl items-center justify-between px-4 py-4">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-lg font-black uppercase text-white" style={{ letterSpacing: '0.08em' }}>
                ⚡ FuelOS Race Mode
              </span>

              {notifEnabled && (
                <span
                  className="rounded-full px-2.5 py-1 text-xs font-semibold"
                  style={{
                    border: '1px solid rgba(52,211,153,0.35)',
                    background: 'rgba(52,211,153,0.14)',
                    color: '#86efac',
                  }}
                >
                  🔔 ON
                </span>
              )}

              {raceState.status === 'running' && (
                <span
                  className="rounded-full px-2.5 py-1 text-xs font-bold"
                  style={{
                    border: '1px solid rgba(248,113,113,0.4)',
                    background: 'rgba(239,68,68,0.16)',
                    color: '#fca5a5',
                    boxShadow: '0 0 14px rgba(239,68,68,0.18)',
                  }}
                >
                  LIVE
                </span>
              )}
            </div>

            <Link
              href="/"
              className="rounded-lg px-3 py-1.5 text-sm transition-colors"
              style={{
                border: '1px solid rgba(255,255,255,0.10)',
                color: '#cbd5e1',
                background: 'rgba(255,255,255,0.03)',
              }}
            >
              ← Accueil
            </Link>
          </div>
        </div>

        <div className="mx-auto max-w-3xl space-y-5 p-4 md:p-6">
          {/* Top cockpit KPIs */}
          <div className="grid grid-cols-3 gap-2">
            <div
              className="rounded-lg px-3 py-2 text-center"
              style={{
                border: '1px solid rgba(248,113,113,0.30)',
                background: 'rgba(239,68,68,0.10)',
                boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.04)',
              }}
            >
              <div className="text-[10px] font-semibold uppercase text-red-200/80" style={{ letterSpacing: '0.14em' }}>
                Status
              </div>
              <div className="text-sm font-bold text-red-200">{raceState.status.toUpperCase()}</div>
            </div>

            <div
              className="rounded-lg px-3 py-2 text-center"
              style={{
                border: '1px solid rgba(34,211,238,0.30)',
                background: 'rgba(6,182,212,0.10)',
                boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.04)',
              }}
            >
              <div className="text-[10px] font-semibold uppercase text-cyan-200/80" style={{ letterSpacing: '0.14em' }}>
                Cible
              </div>
              <div className="text-sm font-bold text-cyan-200">{event ? `${event.targetTime}h` : '--'}</div>
            </div>

            <div
              className="rounded-lg px-3 py-2 text-center"
              style={{
                border: '1px solid rgba(251,191,36,0.30)',
                background: 'rgba(245,158,11,0.10)',
                boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.04)',
              }}
            >
              <div className="text-[10px] font-semibold uppercase text-amber-200/80" style={{ letterSpacing: '0.14em' }}>
                Reste
              </div>
              <div className="text-sm font-bold text-amber-200">
                {Math.max(0, totalItems - consumedCount - skippedCount)}
              </div>
            </div>
          </div>

          {/* Timer Card */}
          <div
            className="rounded-3xl p-6 text-center backdrop-blur-xl"
            style={{
              border: '1px solid rgba(255,255,255,0.10)',
              background: 'rgba(255,255,255,0.03)',
              boxShadow: '0 20px 50px rgba(127,29,29,0.20)',
            }}
          >
            <div className="mb-2 text-xs uppercase text-slate-400" style={{ letterSpacing: '0.2em' }}>
              {event ? `${event.sport.toUpperCase()} · ${event.distance}KM · ${event.targetTime}H` : 'RACE'}
            </div>

            <div
              className="mb-4 text-6xl font-mono font-black tracking-tight text-white"
              style={{
                textShadow: '0 0 18px rgba(239,68,68,0.45)',
              }}
            >
              {formatDuration(raceState.elapsedMs)}
            </div>

            <div
              className="mb-5 h-2.5 w-full overflow-hidden rounded-full"
              style={{
                background: 'rgba(30,41,59,0.85)',
                border: '1px solid rgba(255,255,255,0.05)',
              }}
            >
              <div
                className="h-2.5 rounded-full transition-all duration-1000"
                style={{
                  width: `${progressPercent}%`,
                  background: 'linear-gradient(90deg, #ef4444 0%, #f97316 55%, #fbbf24 100%)',
                  boxShadow: '0 0 14px rgba(249,115,22,0.30)',
                }}
              />
            </div>

            {raceState.status === 'idle' && (
              <button
                onClick={handleStart}
                className="w-full rounded-2xl px-6 py-4 text-xl font-black text-slate-950 transition-all active:scale-95"
                style={{
                  background: 'linear-gradient(90deg, #ef4444 0%, #f97316 55%, #fbbf24 100%)',
                  boxShadow: '0 12px 28px rgba(239,68,68,0.28)',
                }}
              >
                🏁 DÉMARRER
              </button>
            )}

            {raceState.status === 'running' && (
              <div className="flex gap-3">
                <button
                  onClick={handlePause}
                  className="flex-1 rounded-xl py-4 text-lg font-bold text-slate-950 transition-transform active:scale-95"
                  style={{
                    background: '#fbbf24',
                    border: '1px solid rgba(253,224,71,0.35)',
                    boxShadow: '0 8px 22px rgba(245,158,11,0.18)',
                  }}
                >
                  ⏸ Pause
                </button>
                <button
                  onClick={handleFinish}
                  className="flex-1 rounded-xl py-4 text-lg font-bold text-white transition-transform active:scale-95"
                  style={{
                    background: '#e11d48',
                    border: '1px solid rgba(251,113,133,0.24)',
                    boxShadow: '0 8px 22px rgba(225,29,72,0.22)',
                  }}
                >
                  🏆 Finir
                </button>
              </div>
            )}

            {raceState.status === 'paused' && (
              <div className="flex gap-3">
                <button
                  onClick={handleResume}
                  className="flex-1 rounded-xl py-4 text-lg font-bold text-slate-950 transition-transform active:scale-95"
                  style={{
                    background: '#34d399',
                    border: '1px solid rgba(110,231,183,0.35)',
                    boxShadow: '0 8px 22px rgba(16,185,129,0.22)',
                  }}
                >
                  ▶ Reprendre
                </button>
                <button
                  onClick={handleFinish}
                  className="flex-1 rounded-xl py-4 text-lg font-bold text-white transition-transform active:scale-95"
                  style={{
                    background: '#e11d48',
                    border: '1px solid rgba(251,113,133,0.24)',
                    boxShadow: '0 8px 22px rgba(225,29,72,0.22)',
                  }}
                >
                  🏆 Finir
                </button>
              </div>
            )}

            {raceState.status === 'finished' && (
              <div className="text-xl font-bold text-emerald-300">🏆 Course terminée !</div>
            )}
          </div>

          {/* Alert Card */}
          {showAlert && alertItem && raceState.status === 'running' && (
            <div
              className="rounded-2xl p-5"
              style={{
                border: '1px solid rgba(253,224,71,0.45)',
                background: 'rgba(251,191,36,0.12)',
                boxShadow: '0 12px 28px rgba(245,158,11,0.12)',
                animation: 'pulse 2s infinite',
              }}
            >
              <div className="mb-1 text-sm font-bold uppercase text-amber-300">⚡ Ravitaillement maintenant</div>
              <div className="mb-1 text-xl font-bold text-white">{alertItem.product}</div>
              <div className="mb-4 text-sm text-amber-50/85">
                {alertItem.cho}g CHO
                {alertItem.water ? ` · ${alertItem.water}ml` : ''}
                {alertItem.sodium ? ` · ${alertItem.sodium}mg Na+` : ''}
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => handleConsumed(raceState.currentItemIndex)}
                  className="flex-1 rounded-xl py-4 text-lg font-bold text-slate-950 transition-transform active:scale-95"
                  style={{
                    background: '#34d399',
                    boxShadow: '0 8px 22px rgba(16,185,129,0.18)',
                  }}
                >
                  ✓ Pris
                </button>
                <button
                  onClick={() => handleSkipped(raceState.currentItemIndex)}
                  className="flex-1 rounded-xl py-4 text-lg font-bold text-white transition-transform active:scale-95"
                  style={{
                    background: 'rgba(15,23,42,0.92)',
                    border: '1px solid rgba(255,255,255,0.14)',
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
                border: '1px solid rgba(255,255,255,0.10)',
                background: 'rgba(255,255,255,0.03)',
              }}
            >
              <div className="mb-2 flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-400" style={{ letterSpacing: '0.18em' }}>
                  PROCHAIN
                </span>
                <span
                  className="text-sm font-bold"
                  style={{
                    color:
                      nextItemMinFromNow !== null && nextItemMinFromNow < 5
                        ? '#fcd34d'
                        : '#94a3b8',
                  }}
                >
                  {nextItemMinFromNow !== null ? `dans ${Math.round(nextItemMinFromNow)}min` : ''}
                </span>
              </div>

              <div className="text-lg font-bold text-slate-100">{nextItem.product}</div>
              <div className="mt-1 flex flex-wrap gap-3 text-sm text-slate-300">
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
                border: '1px solid rgba(255,255,255,0.10)',
                background: 'rgba(255,255,255,0.03)',
              }}
            >
              <div className="text-xl font-bold text-emerald-300">{raceState.choConsumed}g</div>
              <div className="mt-1 text-xs text-slate-400">CHO pris</div>
            </div>

            <div
              className="rounded-xl p-3 text-center"
              style={{
                border: '1px solid rgba(255,255,255,0.10)',
                background: 'rgba(255,255,255,0.03)',
              }}
            >
              <div className="text-xl font-bold text-sky-300">{raceState.waterConsumed}ml</div>
              <div className="mt-1 text-xs text-slate-400">Eau</div>
            </div>

            <div
              className="rounded-xl p-3 text-center"
              style={{
                border: '1px solid rgba(255,255,255,0.10)',
                background: 'rgba(255,255,255,0.03)',
              }}
            >
              <div
                className="text-xl font-bold"
                style={{
                  color: compliance >= 80 ? '#86efac' : compliance >= 50 ? '#fcd34d' : '#fda4af',
                }}
              >
                {compliance}%
              </div>
              <div className="mt-1 text-xs text-slate-400">Compliance</div>
            </div>
          </div>

          {/* Dynamic recalculation */}
          {choDeficit > 0 && (
            <div
              className="rounded-xl p-4"
              style={{
                border: '1px solid rgba(251,146,60,0.45)',
                background: 'rgba(249,115,22,0.10)',
              }}
            >
              <div className="mb-1 text-sm font-bold text-orange-300">🔄 Recalcul dynamique</div>
              <div className="text-sm text-orange-100/90">
                {choDeficit}g CHO manquants redistribués · Objectif ajusté :
                <span className="font-bold text-orange-300"> {adjustedChoPerH}g/h</span>
              </div>
            </div>
          )}

          {/* Timeline */}
          <div
            className="overflow-hidden rounded-2xl backdrop-blur-xl"
            style={{
              border: '1px solid rgba(255,255,255,0.10)',
              background: 'rgba(255,255,255,0.03)',
            }}
          >
            <div
              className="flex items-center justify-between px-4 py-3"
              style={{
                borderBottom: '1px solid rgba(255,255,255,0.10)',
              }}
            >
              <span className="font-bold text-slate-100">📋 Timeline</span>
              <span className="text-sm text-slate-400">
                {consumedCount} pris · {skippedCount} passés · {totalItems - consumedCount - skippedCount} restants
              </span>
            </div>

            <div className="max-h-64 overflow-y-auto">
              {timelineByHour.map((group) => (
                <div key={group.hour}>
                  <div
                    className="sticky top-0 z-10 px-4 py-2 backdrop-blur"
                    style={{
                      borderTop: '1px solid rgba(255,255,255,0.10)',
                      borderBottom: '1px solid rgba(255,255,255,0.10)',
                      background: 'rgba(15,23,42,0.88)',
                    }}
                  >
                    <span className="text-xs font-semibold uppercase tracking-wide text-slate-300">
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
                          borderBottom: '1px solid rgba(255,255,255,0.10)',
                          opacity: isConsumed ? 0.45 : isSkipped ? 0.35 : 1,
                          textDecoration: isSkipped ? 'line-through' : 'none',
                          background: isCurrent ? 'rgba(251,191,36,0.10)' : 'transparent',
                        }}
                      >
                        <div
                          className="w-10 flex-shrink-0 text-sm font-mono"
                          style={{
                            color: isPast && !isConsumed ? '#fda4af' : '#94a3b8',
                          }}
                        >
                          {Math.floor(item.timeMin)}min
                        </div>

                        <div
                          className="flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full text-xs"
                          style={{
                            background: isConsumed
                              ? '#34d399'
                              : isSkipped
                              ? 'rgba(244,63,94,0.35)'
                              : isCurrent
                              ? '#fbbf24'
                              : '#334155',
                            color: isConsumed || isCurrent ? '#020617' : '#e2e8f0',
                          }}
                        >
                          {isConsumed ? '✓' : isSkipped ? '×' : isCurrent ? '!' : ''}
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="truncate text-sm font-medium text-slate-100">{item.product}</div>
                          <div className="flex gap-2 text-xs text-slate-400">
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
                                background: 'rgba(52,211,153,0.15)',
                                color: '#86efac',
                                border: '1px solid rgba(52,211,153,0.18)',
                              }}
                            >
                              Pris
                            </button>
                            <button
                              onClick={() => handleSkipped(index)}
                              className="rounded-lg px-2 py-1 text-xs active:scale-95"
                              style={{
                                background: '#334155',
                                color: '#cbd5e1',
                                border: '1px solid rgba(255,255,255,0.08)',
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
        </div>
      </div>
    </div>
  );
}

export default function RacePage() {
  usePageTitle('Race Mode');
  return (
    <Suspense
      fallback={
        <div
          className="min-h-screen text-white flex items-center justify-center"
          style={{
            background:
              'radial-gradient(circle at top, rgba(239,68,68,0.18), transparent 35%), linear-gradient(180deg, #020617 0%, #000000 100%)',
          }}
        >
          <div className="text-2xl">⚡ Chargement...</div>
        </div>
      }
    >
      <RaceContent />
    </Suspense>
  );
}