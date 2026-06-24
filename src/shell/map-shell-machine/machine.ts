import type { SheetLayoutFrameChange, SheetSnap } from "@siegetag/sheet";

import type { MapItemLocation } from "../../items/types";
import {
  armIntent,
  planItemSelect,
  planRecenterUser,
  tryAdvanceIntent,
  tryOpenHalfAfterCameraIdle,
} from "./intent";
import type { RouteEnterFly } from "./route-enter-fly";
import {
  advanceRouteEntry,
  completeRouteUserEnterFly,
  dismissRouteEntry,
  resetRouteEntryToWaiting,
  routeEnterFliesEqual,
  tryApplyRouteEntry,
} from "./route-enter-fly";
import type { MapShellEnvironment, MapShellMachineState } from "./state";
import { environmentsEqual } from "./state";

type SheetPhase = SheetLayoutFrameChange["phase"];

/**
 * Map shell machine events — four sources:
 *
 * 1. **Intent** — user / app actions (`selectItem`, `recenterUser`, …)
 * 2. **Sheet** — `@siegetag/sheet` reports snap + gesture phase
 * 3. **Environment** — camera session, sheet motion, padding sync
 * 4. **Route** — active route declares enter fly (`routeEnterFlyChanged`)
 */
export type MapShellMachineEvent =
  | { type: "selectItem"; id: string; location: MapItemLocation | null }
  | { type: "recenterUser"; zoom?: number }
  | { type: "clearSelection"; dismissRouteEntry?: boolean }
  | { type: "dismissSheet" }
  | {
      type: "sheetReported";
      snap: SheetSnap;
      phase: SheetPhase;
      settled: boolean;
    }
  | { type: "environmentSynced"; environment: MapShellEnvironment }
  | {
      type: "routeEnterFlyChanged";
      routeKey: string;
      entry: RouteEnterFly | null;
    };

export type MapShellMachineEffect =
  | {
      type: "flyToItem";
      location: MapItemLocation;
      enterFly?: boolean;
      zoom?: number;
    }
  | { type: "flyToUser"; zoom?: number };

export type MapShellMachineResult = {
  state: MapShellMachineState;
  effects: MapShellMachineEffect[];
};

function sheetClosedState(state: MapShellMachineState): MapShellMachineState {
  return {
    ...state,
    sheetSnap: "collapsed",
    selectedItemId: null,
    intent: null,
  };
}

function mergeResults(
  first: MapShellMachineResult,
  second: MapShellMachineResult,
): MapShellMachineResult {
  return {
    state: second.state,
    effects: [...first.effects, ...second.effects],
  };
}

function applyEnvironment(
  state: MapShellMachineState,
  environment: MapShellEnvironment,
): MapShellMachineResult {
  const previousEnvironment = state.environment;
  let nextState: MapShellMachineState = { ...state, environment };

  nextState = tryOpenHalfAfterCameraIdle(
    nextState,
    previousEnvironment.cameraSession,
    environment.cameraSession,
  );

  const advanced = tryAdvanceIntent(nextState);
  nextState = advanced.state;

  if (
    environmentsEqual(previousEnvironment, environment) &&
    advanced.effects.length === 0
  ) {
    return { state: nextState, effects: [] };
  }

  const afterUserFly = completeRouteUserEnterFly(
    nextState,
    previousEnvironment,
    environment,
  );

  return {
    state: afterUserFly,
    effects: advanced.effects,
  };
}

function reduceRouteEnterFlyChanged(
  state: MapShellMachineState,
  routeKey: string,
  entry: RouteEnterFly | null,
): MapShellMachineResult {
  if (!routeKey) {
    return {
      state: {
        ...state,
        routeVisit: null,
        selectedItemId: null,
        intent: null,
      },
      effects: [],
    };
  }

  const sameRoute = state.routeVisit?.routeKey === routeKey;
  const sameEntry = routeEnterFliesEqual(state.routeVisit?.entry, entry);

  if (sameRoute && sameEntry) {
    return { state, effects: [] };
  }

  const nextState: MapShellMachineState = {
    ...state,
    selectedItemId: sameRoute ? state.selectedItemId : null,
    intent: sameRoute ? state.intent : null,
    routeVisit: {
      routeKey,
      entry,
      applyStatus: "waiting",
    },
  };

  if (!entry) {
    return { state: nextState, effects: [] };
  }

  return tryApplyRouteEntry(nextState);
}

function routeEntryInterruptedOnCollapse(state: MapShellMachineState): boolean {
  const visit = state.routeVisit;
  if (!visit?.entry || visit.entry.kind !== "item") {
    return false;
  }

  if (visit.applyStatus === "waiting") {
    return state.selectedItemId !== visit.entry.id;
  }

  return (
    visit.applyStatus === "dispatched" &&
    state.selectedItemId !== visit.entry.id
  );
}

function reduceSheetReported(
  state: MapShellMachineState,
  snap: SheetSnap,
  phase: SheetPhase,
  settled: boolean,
): MapShellMachineResult {
  const withReported: MapShellMachineState = settled
    ? { ...state, reportedSheetSnap: snap }
    : state;

  if (settled && phase === "idle" && snap === "collapsed") {
    if (routeEntryInterruptedOnCollapse(withReported)) {
      return {
        state: resetRouteEntryToWaiting(
          sheetClosedState({ ...withReported, sheetSnap: snap }),
        ),
        effects: [],
      };
    }

    const closed = sheetClosedState({ ...withReported, sheetSnap: snap });
    const next = closed.routeVisit ? dismissRouteEntry(closed) : closed;
    return { state: next, effects: [] };
  }

  if (settled && phase === "idle") {
    const nextState: MapShellMachineState = {
      ...withReported,
      sheetSnap: snap,
      environment: {
        ...withReported.environment,
        physicalSnap: snap,
        sheetMotionPhase: "idle",
      },
    };
    return tryAdvanceIntent(nextState);
  }

  return { state: withReported, effects: [] };
}

function clearSelectionState(
  state: MapShellMachineState,
  shouldDismissRouteEntry: boolean,
): MapShellMachineState {
  return {
    ...state,
    selectedItemId: null,
    intent: null,
    routeVisit:
      shouldDismissRouteEntry && state.routeVisit
        ? dismissRouteEntry(state).routeVisit
        : state.routeVisit,
  };
}

/** Unified map-shell intent FSM: selection, sheet snap, route entry, camera fly. */
export function reduceMapShellMachine(
  state: MapShellMachineState,
  event: MapShellMachineEvent,
): MapShellMachineResult {
  switch (event.type) {
    case "environmentSynced": {
      const envResult = applyEnvironment(state, event.environment);
      const advanced = advanceRouteEntry(envResult.state);
      return mergeResults(envResult, tryApplyRouteEntry(advanced));
    }

    case "routeEnterFlyChanged": {
      return reduceRouteEnterFlyChanged(state, event.routeKey, event.entry);
    }

    case "sheetReported": {
      return reduceSheetReported(state, event.snap, event.phase, event.settled);
    }

    case "selectItem": {
      if (!event.location) {
        return {
          state: {
            ...state,
            selectedItemId: event.id,
            sheetSnap: "half",
            intent: null,
          },
          effects: [],
        };
      }

      const armed = armIntent(
        state,
        planItemSelect(state, event.id, event.location),
      );
      return tryAdvanceIntent(armed);
    }

    case "recenterUser": {
      const cleared = clearSelectionState(state, true);
      const armed = armIntent(cleared, planRecenterUser(event.zoom));
      return tryAdvanceIntent(armed);
    }

    case "clearSelection": {
      if (state.selectedItemId === null && state.intent === null) {
        if (event.dismissRouteEntry !== false && state.routeVisit) {
          return {
            state: dismissRouteEntry(state),
            effects: [],
          };
        }
        return { state, effects: [] };
      }

      return {
        state: clearSelectionState(state, event.dismissRouteEntry !== false),
        effects: [],
      };
    }

    case "dismissSheet": {
      if (
        state.sheetSnap === "collapsed" &&
        state.selectedItemId === null &&
        state.intent === null
      ) {
        return { state, effects: [] };
      }

      return {
        state: sheetClosedState(state),
        effects: [],
      };
    }

    default: {
      return { state, effects: [] };
    }
  }
}
