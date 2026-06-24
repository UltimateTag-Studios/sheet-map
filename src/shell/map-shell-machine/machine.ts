import type { SheetLayoutFrameChange, SheetSnap } from "@siegetag/sheet";

import type { MapItemLocation } from "../../items/types";
import {
  resolveLocatedSelectOrPending,
  resolvePendingLocatedSelect,
} from "./resolve-located-select";
import type { RouteEnterFly } from "./route-enter-fly";
import {
  advanceRouteEntry,
  completeRouteUserEnterFly,
  dismissRouteEntry,
  resetRouteEntryToWaiting,
  routeEnterFliesEqual,
  tryApplyRouteEntry,
} from "./route-enter-fly";
import type {
  ItemSelectPhase,
  MapShellEnvironment,
  MapShellMachineState,
} from "./state";

type SheetPhase = SheetLayoutFrameChange["phase"];

/**
 * Map shell machine events — four sources:
 *
 * 1. **Intent** — user / app actions (`selectItem`, `clearSelection`, `dismissSheet`)
 * 2. **Sheet** — `@siegetag/sheet` reports snap + gesture phase
 * 3. **Environment** — camera session, sheet motion, boot, padding from live subsystems
 * 4. **Route** — active route declares enter fly (`routeEnterFlyChanged`)
 *
 * Side effects are outputs, not events. Subsystems report back through
 * `environmentSynced` and `sheetReported`.
 */
export type MapShellMachineEvent =
  | { type: "selectItem"; id: string; location: MapItemLocation | null }
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

const idleItemSelect = (): ItemSelectPhase => ({ status: "idle" });

function sheetClosedState(state: MapShellMachineState): MapShellMachineState {
  return {
    ...state,
    sheetSnap: "collapsed",
    selectedItemId: null,
    itemSelect: idleItemSelect(),
  };
}

function completeFlyingToItem(
  state: MapShellMachineState,
): MapShellMachineState {
  return {
    ...state,
    sheetSnap: "half",
    itemSelect: idleItemSelect(),
  };
}

function isFlyingToItem(
  state: MapShellMachineState,
): state is MapShellMachineState & {
  itemSelect: {
    status: "flyingToItem";
    location: MapItemLocation;
  };
} {
  return state.itemSelect.status === "flyingToItem";
}

function isPendingFly(
  state: MapShellMachineState,
): state is MapShellMachineState & {
  itemSelect: {
    status: "pendingFly";
    location: MapItemLocation;
  };
} {
  return state.itemSelect.status === "pendingFly";
}

function environmentsEqual(
  a: MapShellEnvironment,
  b: MapShellEnvironment,
): boolean {
  return (
    a.cameraSession === b.cameraSession &&
    a.sheetMotionPhase === b.sheetMotionPhase &&
    a.mapPaddingReady === b.mapPaddingReady &&
    a.hasUserLocation === b.hasUserLocation
  );
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
  const withEnvironment: MapShellMachineState = { ...state, environment };

  if (
    isFlyingToItem(withEnvironment) &&
    previousEnvironment.cameraSession === "flying" &&
    environment.cameraSession === "idle"
  ) {
    return {
      state: completeFlyingToItem(withEnvironment),
      effects: [],
    };
  }

  if (isPendingFly(withEnvironment)) {
    const completed = resolvePendingLocatedSelect(withEnvironment);
    if (completed) {
      return completed;
    }
  }

  if (environmentsEqual(previousEnvironment, environment)) {
    return { state, effects: [] };
  }

  const afterUserFly = completeRouteUserEnterFly(
    withEnvironment,
    previousEnvironment,
    environment,
  );

  return { state: afterUserFly, effects: [] };
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
        itemSelect: idleItemSelect(),
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
    itemSelect: sameRoute ? state.itemSelect : idleItemSelect(),
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
    };

    if (snap === "half" && isPendingFly(nextState)) {
      const completed = resolvePendingLocatedSelect(nextState);
      if (completed) {
        return completed;
      }
    }

    return { state: nextState, effects: [] };
  }

  return { state: withReported, effects: [] };
}

/** Unified map-shell selection, sheet snap, route entry, and item-select sequencing. */
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
            itemSelect: idleItemSelect(),
          },
          effects: [],
        };
      }

      return resolveLocatedSelectOrPending(state, event.id, event.location);
    }

    case "clearSelection": {
      if (state.selectedItemId === null && state.itemSelect.status === "idle") {
        if (event.dismissRouteEntry !== false && state.routeVisit) {
          return {
            state: dismissRouteEntry(state),
            effects: [],
          };
        }
        return { state, effects: [] };
      }

      const cleared: MapShellMachineState = {
        ...state,
        selectedItemId: null,
        itemSelect: idleItemSelect(),
        routeVisit:
          event.dismissRouteEntry === false || !state.routeVisit
            ? state.routeVisit
            : dismissRouteEntry(state).routeVisit,
      };

      return { state: cleared, effects: [] };
    }

    case "dismissSheet": {
      if (
        state.sheetSnap === "collapsed" &&
        state.selectedItemId === null &&
        state.itemSelect.status === "idle"
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
