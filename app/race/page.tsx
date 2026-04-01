'use client';
import { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Suspense } from 'react';
import type { FuelPlan, AthleteProfile, EventDetails, TimelineItem } from '../lib/types';

// ============ RACE MODE — DIFFERENCIATEUR #1 ============

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

// Send notification via Service Worker
function sendNotification(title: string, body: string, tag: string) {
  if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
    navigator.serviceWorker.controller.postMessage({ type: 'SHOW_NOTIFICATION', title, body, tag });
  } else if ('Notification' in window && Notification.permission === 'granted') {
    new Notification(title, { body, tag, icon: '/favicon.ico' });
  }
}

// Request notification permission
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
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const alertShownRef = useRef<Set<number>>(new Set());
  // Recalcul dynamique : CHO deficit a redistribuer
  const [choDeficit, setChoDeficit] = useState(0);
  const [notifEnabled, setNotifEnabled] = useState(false);
  
  // Load plan from URL params or localStorage
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
        setPlan(data.fuelPlan);
        setProfile(data.profile);
        setEvent(data.event);
      }
    } catch (e) {
      console.error('Plan load error:', e);
    }
  }, [searchParams]);
  
  // Timer tick
  useEffect(() => {
    if (raceState.status === 'running') {
      intervalRef.current = setInterval(() => {
        setRaceState(prev => {
          const now = Date.now();
          const elapsed = prev.elapsedMs + (now - (prev.startTime ?? now));
          return { ...prev, elapsedMs: elapsed, startTime: now };
        });
      }, 1000);
    } else {
      if (intervalRef.current) clearInterval(intervalRef.current);
    }
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [raceState.status]);
  
  // Check for upcoming items and send notifications
  useEffect(() => {
    if (!plan || raceState.status !== 'running') return;
    const elapsedMin = raceState.elapsedMs / 60000;
    
    for (let i = 0; i < plan.timeline.length; i++) {
      const item = plan.timeline[i];
      const dueMin = item.timeMin;
      const isConsumed = raceState.consumedItems.includes(i);
      const isSkipped = raceState.skippedItems.includes(i);
      if (isConsumed || isSkipped) continue;
      
      // Alert 1 minute before due time
      const alertKey = i * 1000 + 1;
      if (elapsedMin >= dueMin - 1 && elapsedMin < dueMin && !alertShownRef.current.has(alertKey)) {
        alertShownRef.current.add(alertKey);
        if (notifEnabled) {
          sendNotification('⏰ FuelOS', `Dans 1 min : ${item.product} — ${item.cho}g CHO`, `alert-soon-${i}`);
        }
      }
      
      // Alert at exact due time
      if (elapsedMin >= dueMin && !alertShownRef.current.has(i)) {
        alertShownRef.current.add(i);
        setAlertItem(item);
        setShowAlert(true);
        setRaceState(prev => ({ ...prev, currentItemIndex: i }));
        if (notifEnabled) {
          sendNotification('⚡ FuelOS — Ravitaillement !', `${item.product} — ${item.cho}g CHO${item.water ? ` · ${item.water}ml` : ''}`, `alert-due-${i}`);
        }
        // Auto-hide alert after 30s
        setTimeout(() => setShowAlert(false), 30000);
      }
    }
  }, [raceState.elapsedMs, raceState.status, plan, notifEnabled]);

  const handleStart = useCallback(async () => {
    // Request notification permission on start
    const granted = await requestNotificationPermission();
    setNotifEnabled(granted);
    setRaceState(prev => ({ ...prev, status: 'running', startTime: Date.now() }));
  }, []);
  
  const handlePause = useCallback(() => {
    setRaceState(prev => ({ ...prev, status: 'paused', startTime: null }));
  }, []);
  
  const handleResume = useCallback(() => {
    setRaceState(prev => ({ ...prev, status: 'running', startTime: Date.now() }));
  }, []);
  
  const handleFinish = useCallback(() => {
    setRaceState(prev => ({ ...prev, status: 'finished', startTime: null }));
    if (intervalRef.current) clearInterval(intervalRef.current);
    // Save debrief to localStorage
    try {
      const debrief = {
        plan, profile, event,
        raceState,
        finishedAt: new Date().toISOString(),
      };
      const existing = JSON.parse(localStorage.getItem('fuelos_debriefs') || '[]');
      existing.unshift(debrief);
      localStorage.setItem('fuelos_debriefs', JSON.stringify(existing.slice(0, 10)));
    } catch (e) {}
  }, [plan, profile, event, raceState]);
  
  // Mark item as consumed
  const handleConsumed = useCallback((itemIndex: number) => {
    if (!plan) return;
    const item = plan.timeline[itemIndex];
    setRaceState(prev => ({
      ...prev,
      consumedItems: [...prev.consumedItems, itemIndex],
      choConsumed: prev.choConsumed + (item.cho || 0),
      waterConsumed: prev.waterConsumed + (item.water || 0),
      sodiumConsumed: prev.sodiumConsumed + (item.sodium || 0),
    }));
    setShowAlert(false);
    // Clear any existing deficit for this item
    setChoDeficit(prev => Math.max(0, prev - (item.cho || 0)));
  }, [plan]);
  
  // Skip item — add to deficit for recalcul dynamique
  const handleSkipped = useCallback((itemIndex: number) => {
    if (!plan) return;
    const item = plan.timeline[itemIndex];
    setRaceState(prev => ({
      ...prev,
      skippedItems: [...prev.skippedItems, itemIndex],
    }));
    // Add skipped CHO to deficit
    setChoDeficit(prev => prev + (item.cho || 0));
    setShowAlert(false);
  }, [plan]);

  // Écouter les actions depuis les notifications (boutons Pris/Passer)
  useEffect(() => {
    if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
      const handleMessage = (event: MessageEvent) => {
        if (event.data.type === 'NOTIFICATION_ACTION') {
          const { action, tag } = event.data;
          
          console.log('📨 Action notification reçue:', action, tag);
          
          // Extraire l'index de l'item depuis le tag
          // Ex: "alert-due-5" → 5 ou "alert-soon-3" → 3
          const match = tag.match(/(\d+)$/);
          if (match) {
            const itemIndex = parseInt(match[1]);
            
            if (action === 'consumed') {
              handleConsumed(itemIndex);
              console.log('✅ Item marqué comme consommé:', itemIndex);
            } else if (action === 'skip') {
              handleSkipped(itemIndex);
              console.log('⏭️ Item passé:', itemIndex);
            }
          }
        }
      };

      navigator.serviceWorker.addEventListener('message', handleMessage);

      return () => {
        navigator.serviceWorker.removeEventListener('message', handleMessage);
      };
    }
  }, [handleConsumed, handleSkipped]);
  
  if (!plan) {
    return (
      <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center p-6">
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
  
  // Find next pending item
  const nextItemIndex = plan.timeline.findIndex(
    (_, i) => !raceState.consumedItems.includes(i) && !raceState.skippedItems.includes(i)
  );
  const nextItem = nextItemIndex >= 0 ? plan.timeline[nextItemIndex] : null;
  const nextItemMinFromNow = nextItem ? Math.max(0, nextItem.timeMin - elapsedMin) : null;
  
  // Recalcul dynamique : calculate adjusted CHO/h needed for rest of race
  const remainingTimeH = plan && event ? Math.max(0.1, event.targetTime - elapsedMin / 60) : 1;
  const adjustedChoPerH = choDeficit > 0
    ? Math.round((plan.choPerHour * remainingTimeH + choDeficit) / remainingTimeH)
    : plan.choPerHour;
  const timelineByHour = plan.timeline.reduce<Array<{ hour: number; items: Array<{ item: TimelineItem; index: number }> }>>(
    (groups, item, index) => {
      const hour = Math.floor(item.timeMin / 60);
      const existingGroup = groups[groups.length - 1];
      if (!existingGroup || existingGroup.hour !== hour) {
        groups.push({ hour, items: [{ item, index }] });
      } else {
        existingGroup.items.push({ item, index });
      }
      return groups;
    },
    []
  );
  
  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <div className="pointer-events-none fixed inset-0 -z-10">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(16,185,129,0.15),_transparent_45%),radial-gradient(circle_at_80%_20%,_rgba(59,130,246,0.14),_transparent_35%)]" />
        <div className="absolute inset-0 bg-[linear-gradient(to_bottom,_rgba(15,23,42,0.25),_rgba(2,6,23,0.92))]" />
      </div>
      {/* Header */}
      <div className="sticky top-0 z-30 border-b border-white/10 bg-slate-950/75 backdrop-blur">
        <div className="mx-auto flex w-full max-w-3xl items-center justify-between px-4 py-4">
        <div className="flex items-center gap-2">
          <span className="text-lg font-extrabold tracking-tight text-emerald-300">⚡ FuelOS Race Mode</span>
          {notifEnabled && <span className="rounded-full border border-emerald-400/30 bg-emerald-400/15 px-2.5 py-1 text-xs font-semibold text-emerald-300">🔔 ON</span>}
        </div>
        <Link href="/" className="rounded-lg border border-white/10 px-3 py-1.5 text-sm text-slate-300 transition-colors hover:border-white/25 hover:text-white">← Accueil</Link>
        </div>
      </div>
      
      <div className="mx-auto max-w-3xl space-y-5 p-4 md:p-6">
        {/* Timer Card */}
        <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-6 text-center shadow-2xl shadow-emerald-900/20 backdrop-blur-xl">
          <div className="mb-2 text-xs uppercase tracking-[0.2em] text-slate-400">
            {event ? `${event.sport.toUpperCase()} · ${event.distance}KM · ${event.targetTime}H` : 'RACE'}
          </div>
          <div className="mb-4 text-6xl font-mono font-black tracking-tight text-white drop-shadow-[0_0_14px_rgba(16,185,129,0.35)]">
            {formatDuration(raceState.elapsedMs)}
          </div>
          
          {/* Progress bar */}
          <div className="mb-5 h-2.5 w-full overflow-hidden rounded-full bg-slate-800/70">
            <div
              className="h-2.5 rounded-full bg-gradient-to-r from-emerald-400 via-cyan-400 to-blue-500 transition-all duration-1000"
              style={{ width: `${Math.min(100, (elapsedMin / ((event?.targetTime || 1) * 60)) * 100)}%` }}
            />
          </div>
          
          {/* Controls */}
          {raceState.status === 'idle' && (
            <button
              onClick={handleStart}
              className="w-full rounded-2xl bg-gradient-to-r from-emerald-400 to-cyan-400 px-6 py-4 text-xl font-black text-slate-950 shadow-lg shadow-emerald-500/25 transition-all active:scale-95"
            >
              🏁 DÉMARRER
            </button>
          )}
          {raceState.status === 'running' && (
            <div className="flex gap-3">
              <button onClick={handlePause} className="flex-1 rounded-xl bg-amber-400 py-4 text-lg font-bold text-slate-950 transition-transform active:scale-95">⏸ Pause</button>
              <button onClick={handleFinish} className="flex-1 rounded-xl bg-rose-600 py-4 text-lg font-bold text-white transition-transform active:scale-95">🏆 Finir</button>
            </div>
          )}
          {raceState.status === 'paused' && (
            <div className="flex gap-3">
              <button onClick={handleResume} className="flex-1 rounded-xl bg-emerald-400 py-4 text-lg font-bold text-slate-950 transition-transform active:scale-95">▶ Reprendre</button>
              <button onClick={handleFinish} className="flex-1 rounded-xl bg-rose-600 py-4 text-lg font-bold text-white transition-transform active:scale-95">🏆 Finir</button>
            </div>
          )}
          {raceState.status === 'finished' && (
            <div className="text-xl font-bold text-emerald-300">🏆 Course terminée !</div>
          )}
        </div>
        
        {/* Alert Card — shown when item is due */}
        {showAlert && alertItem && raceState.status === 'running' && (
          <div className="animate-pulse rounded-2xl border border-amber-300/50 bg-amber-400/15 p-5 shadow-lg shadow-amber-500/10">
            <div className="mb-1 text-sm font-bold uppercase text-amber-300">⚡ Ravitaillement maintenant</div>
            <div className="mb-1 text-xl font-bold text-white">{alertItem.product}</div>
            <div className="mb-4 text-sm text-amber-50/85">
              {alertItem.cho}g CHO{alertItem.water ? ` · ${alertItem.water}ml` : ''}{alertItem.sodium ? ` · ${alertItem.sodium}mg Na+` : ''}
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => handleConsumed(raceState.currentItemIndex)}
                className="flex-1 rounded-xl bg-emerald-400 py-4 text-lg font-bold text-slate-950 transition-transform active:scale-95"
              >
                ✓ Pris
              </button>
              <button
                onClick={() => handleSkipped(raceState.currentItemIndex)}
                className="flex-1 rounded-xl border border-white/20 bg-slate-800/90 py-4 text-lg font-bold text-white transition-transform active:scale-95"
              >
                Passé
              </button>
            </div>
          </div>
        )}
        
        {/* Next Item */}
        {nextItem && !showAlert && raceState.status !== 'finished' && (
          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 backdrop-blur-xl">
            <div className="mb-2 flex items-center justify-between">
              <span className="text-xs font-semibold tracking-[0.18em] text-slate-400">PROCHAIN</span>
              <span className={`text-sm font-bold ${nextItemMinFromNow !== null && nextItemMinFromNow < 5 ? 'text-amber-300' : 'text-slate-400'}`}>
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
          <div className="rounded-xl border border-white/10 bg-white/[0.03] p-3 text-center">
            <div className="text-xl font-bold text-emerald-300">{raceState.choConsumed}g</div>
            <div className="mt-1 text-xs text-slate-400">CHO pris</div>
          </div>
          <div className="rounded-xl border border-white/10 bg-white/[0.03] p-3 text-center">
            <div className="text-xl font-bold text-sky-300">{raceState.waterConsumed}ml</div>
            <div className="mt-1 text-xs text-slate-400">Eau</div>
          </div>
          <div className="rounded-xl border border-white/10 bg-white/[0.03] p-3 text-center">
            <div className={`text-xl font-bold ${compliance >= 80 ? 'text-emerald-300' : compliance >= 50 ? 'text-amber-300' : 'text-rose-300'}`}>
              {compliance}%
            </div>
            <div className="mt-1 text-xs text-slate-400">Compliance</div>
          </div>
        </div>
        
        {/* Recalcul dynamique — show if there's a deficit */}
        {choDeficit > 0 && (
          <div className="rounded-xl border border-orange-400/45 bg-orange-400/10 p-4">
            <div className="mb-1 text-sm font-bold text-orange-300">🔄 Recalcul dynamique</div>
            <div className="text-sm text-orange-100/90">
              {choDeficit}g CHO manquants redistribués · Objectif ajusté : <span className="font-bold text-orange-300">{adjustedChoPerH}g/h</span>
            </div>
          </div>
        )}
        
        {/* Timeline */}
        <div className="overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03] backdrop-blur-xl">
          <div className="flex items-center justify-between border-b border-white/10 px-4 py-3">
            <span className="font-bold text-slate-100">📋 Timeline</span>
            <span className="text-sm text-slate-400">{consumedCount} pris · {skippedCount} passés · {totalItems - consumedCount - skippedCount} restants</span>
          </div>
          <div className="max-h-64 overflow-y-auto">
            {timelineByHour.map(group => (
              <div key={group.hour}>
                <div className="sticky top-0 z-10 border-y border-white/10 bg-slate-900/90 px-4 py-2 backdrop-blur">
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
                      className={`flex items-center gap-3 border-b border-white/10 px-4 py-3 last:border-0 ${
                        isCurrent ? 'bg-amber-300/10' : isConsumed ? 'opacity-45' : isSkipped ? 'opacity-35 line-through' : ''
                      }`}
                    >
                      <div className={`w-10 flex-shrink-0 text-sm font-mono ${isPast && !isConsumed ? 'text-rose-300' : 'text-slate-400'}`}>
                        {Math.floor(item.timeMin)}min
                      </div>
                      <div className={`flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full text-xs ${
                        isConsumed ? 'bg-emerald-400 text-slate-950' : isSkipped ? 'bg-rose-500/40 text-rose-200' : isCurrent ? 'bg-amber-400 text-slate-950' : 'bg-slate-700'
                      }`}>
                        {isConsumed ? '✓' : isSkipped ? '×' : isCurrent ? '!' : ''}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="truncate text-sm font-medium text-slate-100">{item.product}</div>
                        <div className="flex gap-2 text-xs text-slate-400">
                          <span>⚡{item.cho}g</span>
                          {item.water && <span>💧{item.water}ml</span>}
                        </div>
                      </div>
                      {/* Quick action buttons when item is past due */}
                      {isPast && raceState.status === 'running' && (
                        <div className="flex gap-1 flex-shrink-0">
                          <button onClick={() => handleConsumed(index)} className="rounded-lg bg-emerald-400/15 px-2 py-1 text-xs text-emerald-300 active:scale-95">Pris</button>
                          <button onClick={() => handleSkipped(index)} className="rounded-lg bg-slate-700 px-2 py-1 text-xs text-slate-300 active:scale-95">Pass</button>
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
  );
}

export default function RacePage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-black text-white flex items-center justify-center"><div className="text-2xl">⚡ Chargement...</div></div>}>
      <RaceContent />
    </Suspense>
  );
}