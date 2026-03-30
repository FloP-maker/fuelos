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
  
  return (
    <div className="min-h-screen bg-black text-white">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-800">
        <div className="flex items-center gap-2">
          <span className="text-yellow-400 font-bold text-lg">⚡ FuelOS Race Mode</span>
          {notifEnabled && <span className="text-xs text-green-400 bg-green-400/10 px-2 py-1 rounded">🔔 ON</span>}
        </div>
        <Link href="/" className="text-gray-400 text-sm">← Accueil</Link>
      </div>
      
      <div className="max-w-lg mx-auto p-4 space-y-4">
        {/* Timer Card */}
        <div className="bg-gray-900 rounded-2xl p-6 text-center">
          <div className="text-xs text-gray-500 uppercase tracking-wider mb-2">
            {event ? `${event.sport.toUpperCase()} · ${event.distance}KM · ${event.targetTime}H` : 'RACE'}
          </div>
          <div className="text-6xl font-mono font-bold tracking-tight mb-4">
            {formatDuration(raceState.elapsedMs)}
          </div>
          
          {/* Progress bar */}
          <div className="w-full bg-gray-800 rounded-full h-2 mb-4">
            <div
              className="bg-green-500 h-2 rounded-full transition-all duration-1000"
              style={{ width: `${Math.min(100, (elapsedMin / ((event?.targetTime || 1) * 60)) * 100)}%` }}
            />
          </div>
          
          {/* Controls */}
          {raceState.status === 'idle' && (
            <button
              onClick={handleStart}
              className="w-full bg-green-500 text-black font-bold py-4 px-6 rounded-xl text-xl active:scale-95 transition-transform"
            >
              🏁 DÉMARRER
            </button>
          )}
          {raceState.status === 'running' && (
            <div className="flex gap-3">
              <button onClick={handlePause} className="flex-1 bg-yellow-500 text-black font-bold py-4 rounded-xl text-lg active:scale-95 transition-transform">⏸ Pause</button>
              <button onClick={handleFinish} className="flex-1 bg-red-600 text-white font-bold py-4 rounded-xl text-lg active:scale-95 transition-transform">🏆 Finir</button>
            </div>
          )}
          {raceState.status === 'paused' && (
            <div className="flex gap-3">
              <button onClick={handleResume} className="flex-1 bg-green-500 text-black font-bold py-4 rounded-xl text-lg active:scale-95 transition-transform">▶ Reprendre</button>
              <button onClick={handleFinish} className="flex-1 bg-red-600 text-white font-bold py-4 rounded-xl text-lg active:scale-95 transition-transform">🏆 Finir</button>
            </div>
          )}
          {raceState.status === 'finished' && (
            <div className="text-green-400 font-bold text-xl">🏆 Course terminée !</div>
          )}
        </div>
        
        {/* Alert Card — shown when item is due */}
        {showAlert && alertItem && raceState.status === 'running' && (
          <div className="bg-yellow-500/20 border-2 border-yellow-500 rounded-2xl p-5 animate-pulse">
            <div className="text-yellow-400 font-bold text-sm uppercase mb-1">⚡ Ravitaillement maintenant</div>
            <div className="text-white font-bold text-xl mb-1">{alertItem.product}</div>
            <div className="text-gray-300 text-sm mb-4">
              {alertItem.cho}g CHO{alertItem.water ? ` · ${alertItem.water}ml` : ''}{alertItem.sodium ? ` · ${alertItem.sodium}mg Na+` : ''}
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => handleConsumed(raceState.currentItemIndex)}
                className="flex-1 bg-green-500 text-black font-bold py-4 rounded-xl text-lg active:scale-95 transition-transform"
              >
                ✓ Pris
              </button>
              <button
                onClick={() => handleSkipped(raceState.currentItemIndex)}
                className="flex-1 bg-gray-700 text-white font-bold py-4 rounded-xl text-lg active:scale-95 transition-transform"
              >
                Passé
              </button>
            </div>
          </div>
        )}
        
        {/* Next Item */}
        {nextItem && !showAlert && raceState.status !== 'finished' && (
          <div className="bg-gray-900 rounded-2xl p-4">
            <div className="flex justify-between items-center mb-2">
              <span className="text-gray-400 text-sm">PROCHAIN</span>
              <span className={`text-sm font-bold ${nextItemMinFromNow !== null && nextItemMinFromNow < 5 ? 'text-yellow-400' : 'text-gray-400'}`}>
                {nextItemMinFromNow !== null ? `dans ${Math.round(nextItemMinFromNow)}min` : ''}
              </span>
            </div>
            <div className="font-bold text-lg">{nextItem.product}</div>
            <div className="text-gray-400 text-sm mt-1 flex gap-3 flex-wrap">
              <span>⚡ {nextItem.cho}g CHO</span>
              {nextItem.water && <span>💧 {nextItem.water}ml</span>}
              {nextItem.sodium && <span>🧂 {nextItem.sodium}mg Na+</span>}
            </div>
          </div>
        )}
        
        {/* Stats Grid */}
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-gray-900 rounded-xl p-3 text-center">
            <div className="text-green-400 font-bold text-xl">{raceState.choConsumed}g</div>
            <div className="text-gray-500 text-xs mt-1">CHO pris</div>
          </div>
          <div className="bg-gray-900 rounded-xl p-3 text-center">
            <div className="text-blue-400 font-bold text-xl">{raceState.waterConsumed}ml</div>
            <div className="text-gray-500 text-xs mt-1">Eau</div>
          </div>
          <div className="bg-gray-900 rounded-xl p-3 text-center">
            <div className={`font-bold text-xl ${compliance >= 80 ? 'text-green-400' : compliance >= 50 ? 'text-yellow-400' : 'text-red-400'}`}>
              {compliance}%
            </div>
            <div className="text-gray-500 text-xs mt-1">Compliance</div>
          </div>
        </div>
        
        {/* Recalcul dynamique — show if there's a deficit */}
        {choDeficit > 0 && (
          <div className="bg-orange-500/10 border border-orange-500/40 rounded-xl p-4">
            <div className="text-orange-400 font-bold text-sm mb-1">🔄 Recalcul dynamique</div>
            <div className="text-gray-300 text-sm">
              {choDeficit}g CHO manquants redistribués · Objectif ajusté : <span className="text-orange-400 font-bold">{adjustedChoPerH}g/h</span>
            </div>
          </div>
        )}
        
        {/* Timeline */}
        <div className="bg-gray-900 rounded-2xl overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-800 flex justify-between items-center">
            <span className="font-bold">📋 Timeline</span>
            <span className="text-gray-500 text-sm">{consumedCount} pris · {skippedCount} passés · {totalItems - consumedCount - skippedCount} restants</span>
          </div>
          <div className="max-h-64 overflow-y-auto">
            {plan.timeline.map((item, i) => {
              const isConsumed = raceState.consumedItems.includes(i);
              const isSkipped = raceState.skippedItems.includes(i);
              const isCurrent = i === raceState.currentItemIndex && showAlert;
              const isPast = item.timeMin <= elapsedMin && !isConsumed && !isSkipped;
              return (
                <div
                  key={i}
                  className={`flex items-center gap-3 px-4 py-3 border-b border-gray-800 last:border-0 ${
                    isCurrent ? 'bg-yellow-500/10' : isConsumed ? 'opacity-40' : isSkipped ? 'opacity-30 line-through' : ''
                  }`}
                >
                  <div className={`text-sm font-mono w-10 flex-shrink-0 ${isPast && !isConsumed ? 'text-red-400' : 'text-gray-400'}`}>
                    {Math.floor(item.timeMin)}min
                  </div>
                  <div className={`w-5 h-5 rounded-full flex-shrink-0 flex items-center justify-center text-xs ${
                    isConsumed ? 'bg-green-500 text-black' : isSkipped ? 'bg-red-500/40 text-red-300' : isCurrent ? 'bg-yellow-500 text-black' : 'bg-gray-700'
                  }`}>
                    {isConsumed ? '✓' : isSkipped ? '×' : isCurrent ? '!' : ''}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-sm truncate">{item.product}</div>
                    <div className="text-gray-500 text-xs flex gap-2">
                      <span>⚡{item.cho}g</span>
                      {item.water && <span>💧{item.water}ml</span>}
                    </div>
                  </div>
                  {/* Quick action buttons when item is past due */}
                  {isPast && raceState.status === 'running' && (
                    <div className="flex gap-1 flex-shrink-0">
                      <button onClick={() => handleConsumed(i)} className="bg-green-500/20 text-green-400 text-xs px-2 py-1 rounded-lg active:scale-95">Pris</button>
                      <button onClick={() => handleSkipped(i)} className="bg-gray-700 text-gray-300 text-xs px-2 py-1 rounded-lg active:scale-95">Pass</button>
                    </div>
                  )}
                </div>
              );
            })}
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