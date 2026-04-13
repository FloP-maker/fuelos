"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useSession } from "next-auth/react";
import usePageTitle from "../lib/hooks/usePageTitle";
import { useProfile } from "@/hooks/useProfile";
import { Header } from "../components/Header";
import { AddRaceModal } from "../components/AddRaceModal";
import { RacesAuthGateModal } from "../components/races/RacesAuthGateModal";
import { RacePlanFollowupModal } from "../components/races/RacePlanFollowupModal";
import { RacesMonthCalendar } from "../components/races/RacesMonthCalendar";
import { RacesNextMilestone } from "../components/races/RacesNextMilestone";
import { RacesPageHero } from "../components/races/RacesPageHero";
import { RacesSidebar } from "../components/races/RacesSidebar";
import { RacesTodayCard } from "../components/races/RacesTodayCard";
import type { RacesCalendarViewFilter } from "../components/races/RacesCalendarToolbar";
import { groupRacesByDate, loadRaces, partitionRacesByUpcoming } from "@/lib/races";
import type { RaceEntry } from "@/lib/types/race";
import { addDaysIso, isoMondayOfContainingWeek } from "@/lib/raceNutritionBands";
import type { RacesCalendarListRange } from "../components/races/RacesCalendarToolbar";

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

function formatFrenchWeekCalendarTitle(weekMondayKey: string): string {
  const endKey = addDaysIso(weekMondayKey, 6);
  const a = /^(\d{4})-(\d{2})-(\d{2})$/.exec(weekMondayKey);
  const b = /^(\d{4})-(\d{2})-(\d{2})$/.exec(endKey);
  if (!a || !b) return weekMondayKey;
  const d0 = new Date(Number(a[1]), Number(a[2]) - 1, Number(a[3]));
  const d1 = new Date(Number(b[1]), Number(b[2]) - 1, Number(b[3]));
  const sameMonth = d0.getMonth() === d1.getMonth() && d0.getFullYear() === d1.getFullYear();
  const mo0 = new Intl.DateTimeFormat("fr-FR", { month: "short" }).format(d0);
  const mo1 = new Intl.DateTimeFormat("fr-FR", { month: "short" }).format(d1);
  const y0 = d0.getFullYear();
  const y1 = d1.getFullYear();
  if (sameMonth) {
    return `${d0.getDate()}–${d1.getDate()} ${mo0} ${y0}`;
  }
  return `${d0.getDate()} ${mo0} ${y0} – ${d1.getDate()} ${mo1} ${y1}`;
}

export default function RacesPage() {
  usePageTitle("Mes courses");
  const { status } = useSession();
  const { profile: fuelProfile } = useProfile();
  const [races, setRaces] = useState<RaceEntry[]>([]);
  const [addOpen, setAddOpen] = useState(false);
  const [authGateOpen, setAuthGateOpen] = useState(false);
  const [planNudgeOpen, setPlanNudgeOpen] = useState(false);
  const [lastSavedRace, setLastSavedRace] = useState<RaceEntry | null>(null);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [viewFilter, setViewFilter] = useState<RacesCalendarViewFilter>("upcoming");
  const [sportFilter, setSportFilter] = useState("all");
  const [listRange, setListRange] = useState<RacesCalendarListRange>(3);
  const [view, setView] = useState(() => {
    const t = new Date();
    return { year: t.getFullYear(), month: t.getMonth() };
  });
  const [weekStartKey, setWeekStartKey] = useState(() => isoMondayOfContainingWeek(new Date()));

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
    if (listRange === "week") {
      setWeekStartKey((k) => addDaysIso(k, -7));
      return;
    }
    setView((v) => {
      const m = v.month - 1;
      if (m < 0) return { year: v.year - 1, month: 11 };
      return { year: v.year, month: m };
    });
  }, [listRange]);

  const onNextMonth = useCallback(() => {
    if (listRange === "week") {
      setWeekStartKey((k) => addDaysIso(k, 7));
      return;
    }
    setView((v) => {
      const m = v.month + 1;
      if (m > 11) return { year: v.year + 1, month: 0 };
      return { year: v.year, month: m };
    });
  }, [listRange]);

  const onThisMonth = useCallback(() => {
    const t = new Date();
    if (listRange === "week") {
      setWeekStartKey(isoMondayOfContainingWeek(t));
      return;
    }
    setView({ year: t.getFullYear(), month: t.getMonth() });
  }, [listRange]);

  const calendarTitle = useMemo(() => {
    if (listRange === "week") return formatFrenchWeekCalendarTitle(weekStartKey);
    return new Intl.DateTimeFormat("fr-FR", { month: "long", year: "numeric" }).format(
      new Date(view.year, view.month, 1)
    );
  }, [listRange, weekStartKey, view.year, view.month]);

  const isCalendarAnchorCurrent = useMemo(() => {
    if (listRange === "week") {
      return todayStr >= weekStartKey && todayStr <= addDaysIso(weekStartKey, 6);
    }
    const t = new Date();
    return t.getFullYear() === view.year && t.getMonth() === view.month;
  }, [listRange, weekStartKey, view.year, view.month, todayStr]);

  const onListRangeChange = useCallback((n: RacesCalendarListRange) => {
    setListRange(n);
    if (n === "week") {
      setWeekStartKey(isoMondayOfContainingWeek(new Date(view.year, view.month, 1)));
    }
  }, [view.year, view.month]);

  const nextMilestoneRace = useMemo(() => upcomingAll[0] ?? null, [upcomingAll]);

  const openAddRaceModal = useCallback(() => {
    window.setTimeout(() => setAddOpen(true), 0);
  }, []);

  const onRequestAddRace = useCallback(() => {
    if (status === "unauthenticated") {
      window.setTimeout(() => setAuthGateOpen(true), 0);
      return;
    }
    openAddRaceModal();
  }, [status, openAddRaceModal]);

  const onRaceSaved = useCallback(
    (race: RaceEntry) => {
      refresh();
      setLastSavedRace(race);
      setPlanNudgeOpen(true);
    },
    [refresh]
  );

  const onFocusDate = useCallback((iso: string) => {
    const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso);
    if (!m) return;
    const y = Number(m[1]);
    const mo = Number(m[2]) - 1;
    const d = Number(m[3]);
    if (Number.isFinite(y) && Number.isFinite(mo)) {
      setView({ year: y, month: mo });
      setWeekStartKey(isoMondayOfContainingWeek(new Date(y, mo, d)));
      setSelectedDate(iso);
    }
  }, []);

  return (
    <>
      <Header />
      <main className="fuel-main races-page">
        <RacesPageHero onAddRace={onRequestAddRace} />
        <div className="races-layout">
          <div className="races-layout__main min-w-0">
            <RacesNextMilestone nextRace={nextMilestoneRace} />
            <RacesTodayCard nextRace={nextMilestoneRace} />
            <div className="fuel-races-main-panel">
              <RacesSidebar
                upcoming={sidebarUpcoming}
                past={sidebarPast}
                selectedDate={selectedDate}
                onFocusDate={onFocusDate}
                searchQuery={searchQuery}
                onSearchQuery={setSearchQuery}
                listRange={listRange}
              />
            </div>
          </div>

          <div className="races-layout__calendar min-w-0">
            <div className="races-layout__calendar-sticky races-scrollable-y">
              <div className="fuel-races-main-panel flex min-h-0 min-w-0 flex-col">
                <RacesMonthCalendar
                  viewYear={view.year}
                  viewMonth={view.month}
                  weekStartKey={weekStartKey}
                  calendarListRange={listRange}
                  onListRange={onListRangeChange}
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
                  calendarTitle={calendarTitle}
                  isAnchorCurrent={isCalendarAnchorCurrent}
                />
              </div>
            </div>
          </div>
        </div>
      </main>

      <RacesAuthGateModal
        open={authGateOpen}
        onClose={() => setAuthGateOpen(false)}
      />
      <AddRaceModal open={addOpen} onClose={() => setAddOpen(false)} onSaved={onRaceSaved} />
      <RacePlanFollowupModal
        open={planNudgeOpen}
        race={lastSavedRace}
        fuelProfile={fuelProfile}
        onClose={() => {
          setPlanNudgeOpen(false);
          setLastSavedRace(null);
        }}
      />
    </>
  );
}
