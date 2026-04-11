"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import usePageTitle from "../lib/hooks/usePageTitle";
import { Header } from "../components/Header";
import { AddRaceModal } from "../components/AddRaceModal";
import { RacesMonthCalendar } from "../components/races/RacesMonthCalendar";
import { RacesUpcomingTimeline } from "../components/races/RacesUpcomingTimeline";
import { groupRacesByDate, loadRaces, partitionRacesByUpcoming } from "@/lib/races";
import type { RaceEntry } from "@/lib/types/race";

export default function RacesPage() {
  usePageTitle("Mes courses");
  const [races, setRaces] = useState<RaceEntry[]>([]);
  const [addOpen, setAddOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [view, setView] = useState(() => {
    const t = new Date();
    return { year: t.getFullYear(), month: t.getMonth() };
  });

  const refresh = useCallback(() => {
    setRaces(loadRaces());
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key === "fuelos_races" || e.key === null) refresh();
    };
    const onVis = () => refresh();
    window.addEventListener("storage", onStorage);
    document.addEventListener("visibilitychange", onVis);
    return () => {
      window.removeEventListener("storage", onStorage);
      document.removeEventListener("visibilitychange", onVis);
    };
  }, [refresh]);

  const { upcoming, past } = useMemo(() => partitionRacesByUpcoming(races), [races]);
  const racesByDate = useMemo(() => groupRacesByDate(races), [races]);
  const empty = races.length === 0;

  const onPrevMonth = useCallback(() => {
    setView((v) => {
      const m = v.month - 1;
      if (m < 0) return { year: v.year - 1, month: 11 };
      return { year: v.year, month: m };
    });
  }, []);

  const onNextMonth = useCallback(() => {
    setView((v) => {
      const m = v.month + 1;
      if (m > 11) return { year: v.year + 1, month: 0 };
      return { year: v.year, month: m };
    });
  }, []);

  const onThisMonth = useCallback(() => {
    const t = new Date();
    setView({ year: t.getFullYear(), month: t.getMonth() });
  }, []);

  const onFocusDate = useCallback((iso: string) => {
    const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso);
    if (!m) return;
    const y = Number(m[1]);
    const mo = Number(m[2]) - 1;
    if (Number.isFinite(y) && Number.isFinite(mo)) {
      setView({ year: y, month: mo });
      setSelectedDate(iso);
    }
  }, []);

  return (
    <>
      <Header />
      <main className="fuel-main mx-auto flex w-full max-w-[1440px] flex-col px-4 py-6 md:px-6 md:py-8">
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h1 className="font-display text-2xl font-bold tracking-tight text-[var(--color-text)] md:text-3xl">
              Mes courses
            </h1>
            <p className="mt-2 text-sm text-[var(--color-text-muted)] md:text-base">
              Calendrier de saison et prochains événements.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setAddOpen(true)}
            className="shrink-0 self-start rounded-lg bg-[var(--color-accent)] px-4 py-2.5 text-sm font-bold text-black hover:opacity-95"
          >
            + Ajouter une course
          </button>
        </div>

        {empty ? (
          <div className="flex min-h-[min(70vh,640px)] flex-1 flex-col gap-6 lg:flex-row">
            <aside className="w-full shrink-0 lg:order-first lg:w-[300px] xl:w-[320px]">
              <RacesUpcomingTimeline upcoming={[]} selectedDate={null} onFocusDate={onFocusDate} />
            </aside>
            <div className="flex min-h-[min(50vh,520px)] min-w-0 flex-1 flex-col">
              <RacesMonthCalendar
                viewYear={view.year}
                viewMonth={view.month}
                onPrevMonth={onPrevMonth}
                onNextMonth={onNextMonth}
                onThisMonth={onThisMonth}
                racesByDate={racesByDate}
                selectedDate={selectedDate}
                onSelectDate={setSelectedDate}
              />
              <div className="fuel-card mt-4 border-dashed p-6 text-center">
                <p className="text-sm text-[var(--color-text-muted)]">
                  Aucune course enregistrée. Clique sur « Ajouter une course » pour créer ton premier événement.
                </p>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex min-h-[min(72vh,760px)] flex-1 flex-col gap-6 lg:flex-row lg:items-stretch lg:gap-8">
            <aside className="w-full shrink-0 lg:order-first lg:w-[300px] xl:w-[320px]">
              <RacesUpcomingTimeline
                upcoming={upcoming}
                selectedDate={selectedDate}
                onFocusDate={onFocusDate}
              />
              {past.length > 0 ? (
                <div className="fuel-card mt-4 hidden p-4 lg:block">
                  <h3 className="text-xs font-bold uppercase tracking-wide text-[var(--color-text-muted)]">
                    Passées
                  </h3>
                  <p className="mt-2 text-sm text-[var(--color-text-muted)]">
                    {past.length} course{past.length > 1 ? "s" : ""} — accès via le calendrier (mois
                    précédents) ou la fiche course.
                  </p>
                </div>
              ) : null}
            </aside>

            <div className="flex min-h-0 min-w-0 flex-1 flex-col">
              <RacesMonthCalendar
                viewYear={view.year}
                viewMonth={view.month}
                onPrevMonth={onPrevMonth}
                onNextMonth={onNextMonth}
                onThisMonth={onThisMonth}
                racesByDate={racesByDate}
                selectedDate={selectedDate}
                onSelectDate={setSelectedDate}
              />
              {past.length > 0 ? (
                <p className="mt-3 text-center text-xs text-[var(--color-text-muted)] lg:hidden">
                  {past.length} course{past.length > 1 ? "s" : ""} passée{past.length > 1 ? "s" : ""} — change de
                  mois sur le calendrier pour les retrouver.
                </p>
              ) : null}
            </div>
          </div>
        )}
      </main>

      <AddRaceModal open={addOpen} onClose={() => setAddOpen(false)} onSaved={refresh} />
    </>
  );
}
