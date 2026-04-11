"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import usePageTitle from "../lib/hooks/usePageTitle";
import { Header } from "../components/Header";
import { AddRaceModal } from "../components/AddRaceModal";
import { RacesMonthCalendar } from "../components/races/RacesMonthCalendar";
import { RacesPageHero } from "../components/races/RacesPageHero";
import { RacesSidebar } from "../components/races/RacesSidebar";
import type { RacesCalendarViewFilter } from "../components/races/RacesCalendarToolbar";
import { groupRacesByDate, loadRaces, partitionRacesByUpcoming } from "@/lib/races";
import type { RaceEntry } from "@/lib/types/race";

function todayIso(): string {
  const t = new Date();
  const y = t.getFullYear();
  const m = String(t.getMonth() + 1).padStart(2, "0");
  const d = String(t.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function norm(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

export default function RacesPage() {
  usePageTitle("Mes courses");
  const [races, setRaces] = useState<RaceEntry[]>([]);
  const [addOpen, setAddOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [viewFilter, setViewFilter] = useState<RacesCalendarViewFilter>("upcoming");
  const [sportFilter, setSportFilter] = useState("all");
  const [rangeMonths, setRangeMonths] = useState<1 | 3 | 6>(3);
  const [view, setView] = useState(() => {
    const t = new Date();
    return { year: t.getFullYear(), month: t.getMonth() };
  });

  const todayStr = useMemo(() => todayIso(), []);

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

  const { upcoming: upcomingAll, past: pastAll } = useMemo(
    () => partitionRacesByUpcoming(races),
    [races]
  );

  const sportsOptions = useMemo(() => {
    const set = new Set<string>();
    for (const r of races) {
      if (r.sport?.trim()) set.add(r.sport.trim());
    }
    return [...set].sort((a, b) => a.localeCompare(b, "fr"));
  }, [races]);

  const q = norm(searchQuery.trim());

  const matchesSearchSport = useCallback(
    (r: RaceEntry) => {
      if (sportFilter !== "all" && r.sport !== sportFilter) return false;
      if (!q) return true;
      return (
        norm(r.name).includes(q) ||
        norm(r.sport).includes(q) ||
        norm(r.location ?? "").includes(q)
      );
    },
    [sportFilter, q]
  );

  const sidebarUpcoming = useMemo(() => {
    return upcomingAll.filter(matchesSearchSport);
  }, [upcomingAll, matchesSearchSport]);

  const sidebarPast = useMemo(() => {
    return pastAll.filter(matchesSearchSport);
  }, [pastAll, matchesSearchSport]);

  const filteredForCalendar = useMemo(() => {
    return races.filter((r) => {
      if (!matchesSearchSport(r)) return false;
      if (viewFilter === "upcoming" && r.date < todayStr) return false;
      if (viewFilter === "past" && r.date >= todayStr) return false;
      return true;
    });
  }, [races, matchesSearchSport, viewFilter, todayStr]);

  /** Bandeaux nutrition : toutes les courses (sport + recherche), indépendamment du segmenté calendrier. */
  const bandSourceRaces = useMemo(() => races.filter(matchesSearchSport), [races, matchesSearchSport]);

  const racesByDate = useMemo(() => groupRacesByDate(filteredForCalendar), [filteredForCalendar]);

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

  const nextMilestoneRace = useMemo(() => upcomingAll[0] ?? null, [upcomingAll]);

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
      <main className="fuel-main races-page space-y-6 md:space-y-8">
        <RacesPageHero nextRace={nextMilestoneRace} onAddRace={() => setAddOpen(true)} />
        <div
          className="flex min-h-[min(82vh,860px)] flex-col overflow-hidden rounded-2xl border border-[#e5e7eb] bg-[var(--color-bg-card)] shadow-[var(--shadow-sm)] dark:border-[var(--color-border-subtle)] dark:shadow-[0_12px_40px_-18px_rgba(0,0,0,0.65)] lg:flex-row"
        >
          <aside className="w-full shrink-0 lg:w-[300px] lg:max-w-[320px]">
            <RacesSidebar
              upcoming={sidebarUpcoming}
              past={sidebarPast}
              selectedDate={selectedDate}
              onFocusDate={onFocusDate}
              searchQuery={searchQuery}
              onSearchQuery={setSearchQuery}
              listRangeMonths={rangeMonths}
            />
          </aside>

          <div className="flex min-h-0 min-w-0 flex-1 flex-col border-t border-[var(--color-border)] lg:border-l lg:border-t-0">
            <RacesMonthCalendar
              viewYear={view.year}
              viewMonth={view.month}
              onPrevMonth={onPrevMonth}
              onNextMonth={onNextMonth}
              onThisMonth={onThisMonth}
              racesByDate={racesByDate}
              bandSourceRaces={bandSourceRaces}
              selectedDate={selectedDate}
              onSelectDate={setSelectedDate}
              viewFilter={viewFilter}
              onViewFilter={setViewFilter}
              sportFilter={sportFilter}
              onSportFilter={setSportFilter}
              sportsOptions={sportsOptions}
              rangeMonths={rangeMonths}
              onRangeMonths={setRangeMonths}
            />
          </div>
        </div>
      </main>

      <AddRaceModal open={addOpen} onClose={() => setAddOpen(false)} onSaved={refresh} />
    </>
  );
}
