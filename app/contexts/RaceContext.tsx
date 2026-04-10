'use client';

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useReducer,
  type Dispatch,
  type ReactNode,
} from "react";
import type { EventDetails, FuelPlan } from "@/app/lib/types";
import {
  attachRecalculatedSession,
  buildPlannedIntakesFromPlan,
  deficitAlertTriggered,
  processIntakeAction,
  type ProcessIntakeActionInput,
} from "@/lib/nutrition/liveTracking";
import { appendOfflineAction } from "@/lib/offline/intakeOfflineQueue";
import type { IntakeAction, RaceSession } from "@/types/race-session";

type RaceState = {
  session: RaceSession | null;
};

type RaceAction =
  | {
      type: "INIT_SESSION";
      plan: FuelPlan;
      event: EventDetails;
      userId: string;
      raceEventId?: string;
    }
  | { type: "TICK"; currentMin: number; currentKm: number }
  | { type: "SET_STATUS"; status: RaceSession["status"] }
  | { type: "SET_ONLINE"; online: boolean }
  | { type: "INTAKE_ACTION"; payload: ProcessIntakeActionInput }
  | { type: "RESET" }
  | { type: "HYDRATE"; session: RaceSession };

function raceReducer(state: RaceState, action: RaceAction): RaceState {
  if (action.type === "RESET") {
    return { session: null };
  }
  if (action.type === "HYDRATE") {
    return { session: attachRecalculatedSession(action.session, true) };
  }
  if (action.type === "INIT_SESSION") {
    const intakes = buildPlannedIntakesFromPlan(
      action.plan,
      action.event,
      action.raceEventId ?? "",
      action.userId
    );
    const id =
      typeof crypto !== "undefined" && "randomUUID" in crypto
        ? crypto.randomUUID()
        : `rs_${Date.now()}`;
    const base: RaceSession = {
      id,
      raceEventId: action.raceEventId ?? "local",
      userId: action.userId,
      startedAt: new Date(),
      status: "active",
      currentKm: 0,
      currentMin: 0,
      intakes,
      liveStats: {
        choTotalG: 0,
        choPerHourCurrent: 0,
        sodiumTotalMg: 0,
        fluidTotalMl: 0,
        intakesTaken: 0,
        intakesSkipped: 0,
        intakesMissed: 0,
        deficitChoG: 0,
      },
      offlineBuffer: [],
      plannedChoPerHour: Math.max(0, action.plan.choPerHour),
      lastStatsComputeMs: 0,
      networkOnline: typeof navigator !== "undefined" ? navigator.onLine : true,
    };
    return { session: attachRecalculatedSession(base, true) };
  }

  const s = state.session;
  if (!s) return state;

  switch (action.type) {
    case "TICK": {
      const next = attachRecalculatedSession(
        {
          ...s,
          currentMin: Math.max(0, action.currentMin),
          currentKm: Math.max(0, action.currentKm),
        },
        false
      );
      return { session: next };
    }
    case "SET_STATUS":
      return { session: { ...s, status: action.status } };
    case "SET_ONLINE":
      return { session: { ...s, networkOnline: action.online } };
    case "INTAKE_ACTION": {
      const intakes = processIntakeAction(s.intakes, action.payload);
      const queueItem: IntakeAction = {
        intakeId: action.payload.intakeId,
        action: action.payload.action,
        actualIntake: action.payload.actualIntake ?? undefined,
        timestamp: new Date(),
        synced: false,
      };
      void appendOfflineAction(s.id, queueItem);
      const next = attachRecalculatedSession(
        {
          ...s,
          intakes,
          offlineBuffer: [...s.offlineBuffer, queueItem],
        },
        true
      );
      return { session: next };
    }
    default:
      return state;
  }
}

const Ctx = createContext<{
  session: RaceSession | null;
  dispatch: Dispatch<RaceAction>;
  deficitAlert: boolean;
} | null>(null);

export function RaceProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(raceReducer, { session: null });

  const deficitAlert = useMemo(() => {
    if (!state.session) return false;
    return deficitAlertTriggered(state.session.liveStats, state.session.plannedChoPerHour);
  }, [state.session]);

  const value = useMemo(
    () => ({
      session: state.session,
      dispatch,
      deficitAlert,
    }),
    [state.session, deficitAlert]
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useRaceLive() {
  const v = useContext(Ctx);
  if (!v) throw new Error("useRaceLive doit être utilisé sous RaceProvider");
  return v;
}

export function useRaceLiveOptional() {
  return useContext(Ctx);
}

/** Pour les écrans qui initialisent sans erreur si le provider manque. */
export function useRaceDispatchOptional(): Dispatch<RaceAction> | null {
  return useContext(Ctx)?.dispatch ?? null;
}

export type { RaceAction };
