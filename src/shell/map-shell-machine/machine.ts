import type { SheetLayoutFrameChange, SheetSnap } from "@siegetag/sheet";

import type { NavigateToMapCameraOptions } from "../../camera";
import type { MapPosition } from "../../camera/shared/map-position";
import type { MapItemLocation } from "../../items/types";
import type { SheetMotionPhase } from "../../viewport";
import {
  applyShellIntent,
  completeSelectOpenHalf,
  emitCameraFlyIfReady,
  planItemSelectIntent,
  planSelectItemWithoutLocationIntent,
  planUserRecenterIntent,
} from "./intent";
import type { RouteEnterFly } from "./route-enter-fly";
import {
  advanceRouteEntry,
  completeRouteUserEnterFly,
  dismissRouteEntry,
  markRouteEntryDispatched,
  resetRouteEntryToWaiting,
  routeEnterFliesEqual,
  tryApplyRouteEntry,
} from "./route-enter-fly";
import type { MapShellCameraSnapshot, MapShellMachineState } from "./state";
import { cameraSnapshotsEqual } from "./state";

type SheetPhase = SheetLayoutFrameChange["phase"];

/**
 * Map shell machine events — four sources:
 *
 * 1. **Intent** — user / app actions (`selectItem`, `recenterUser`, …)
 * 2. **Sheet** — `@siegetag/sheet` layout frames and settle
 * 3. **Camera** — session, padding, GPS, anchor zoom
 * 4. **Route** — active route declares enter fly (`routeEnterFlyChanged`)
 */
export type MapShellMachineEvent =
  | {
      type: "selectItem";
      id: string;
      location: MapItemLocation | null;
      enterFly?: boolean;
      zoom?: number;
      source?: "user" | "route";
    }
  | { type: "recenterUser"; zoom?: number; source?: "user" | "route" }
  | { type: "clearSelection"; dismissRouteEntry?: boolean }
  | { type: "dismissSheet" }
  | {
      type: "sheetLayoutFrameChanged";
      phase: SheetPhase;
      restingSnap: SheetSnap;
    }
  | { type: "sheetSettled"; snap: SheetSnap }
  | { type: "cameraSnapshotSynced"; snapshot: MapShellCameraSnapshot }
  | {
      type: "navigateTo";
      position: MapPosition;
      options?: NavigateToMapCameraOptions;
    }
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
  | { type: "flyToUser"; zoom?: number }
  | {
      type: "flyToPosition";
      position: MapPosition;
      duration?: number;
      preserveTracking?: boolean;
    }
  | { type: "syncCameraSheetPhase"; phase: SheetMotionPhase };

export type MapShellMachineResult = {
  state: MapShellMachineState;
  effects: MapShellMachineEffect[];
};

function sheetClosedState(state: MapShellMachineState): MapShellMachineState {
  return {
    ...state,
    commandedSnap: "collapsed",
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

function applyCameraSnapshot(
  state: MapShellMachineState,
  snapshot: MapShellCameraSnapshot,
): MapShellMachineResult {
  const previousSnapshot = state.cameraSnapshot;
  let nextState: MapShellMachineState = { ...state, cameraSnapshot: snapshot };

  nextState = completeSelectOpenHalf(
    nextState,
    previousSnapshot.cameraSession,
    snapshot.cameraSession,
  );

  const emitted = emitCameraFlyIfReady(nextState);
  nextState = emitted.state;

  if (
    cameraSnapshotsEqual(previousSnapshot, snapshot) &&
    emitted.effects.length === 0
  ) {
    return { state: nextState, effects: [] };
  }

  const afterUserFly = completeRouteUserEnterFly(
    nextState,
    previousSnapshot,
    snapshot,
  );

  return {
    state: afterUserFly,
    effects: emitted.effects,
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

function reduceSheetLayoutFrameChanged(
  state: MapShellMachineState,
  phase: SheetPhase,
  restingSnap: SheetSnap,
): MapShellMachineResult {
  const previousPhase = state.sheetMotionPhase;
  const nextState: MapShellMachineState = {
    ...state,
    layoutSnap: restingSnap,
    sheetMotionPhase: phase,
  };

  const effects: MapShellMachineEffect[] = [];
  if (previousPhase !== phase) {
    effects.push({ type: "syncCameraSheetPhase", phase });
  }

  if (phase === "idle") {
    const emitted = emitCameraFlyIfReady(nextState);
    return {
      state: emitted.state,
      effects: [...effects, ...emitted.effects],
    };
  }

  return { state: nextState, effects };
}

function reduceSheetSettled(
  state: MapShellMachineState,
  snap: SheetSnap,
): MapShellMachineResult {
  const withLayout: MapShellMachineState = {
    ...state,
    layoutSnap: snap,
    sheetMotionPhase: "idle",
  };

  if (snap === "collapsed") {
    if (routeEntryInterruptedOnCollapse(withLayout)) {
      return {
        state: resetRouteEntryToWaiting(
          sheetClosedState({ ...withLayout, commandedSnap: snap }),
        ),
        effects: [],
      };
    }

    const closed = sheetClosedState({ ...withLayout, commandedSnap: snap });
    const next = closed.routeVisit ? dismissRouteEntry(closed) : closed;
    return { state: next, effects: [] };
  }

  const nextState: MapShellMachineState = {
    ...withLayout,
    commandedSnap: snap,
  };
  return emitCameraFlyIfReady(nextState);
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

function reduceSelectItem(
  state: MapShellMachineState,
  event: Extract<MapShellMachineEvent, { type: "selectItem" }>,
): MapShellMachineResult {
  if (!event.location) {
    return {
      state: {
        ...state,
        ...planSelectItemWithoutLocationIntent(event.id),
      },
      effects: [],
    };
  }

  const applied = applyShellIntent(
    state,
    planItemSelectIntent(state, event.id, event.location, {
      enterFly: event.enterFly,
      zoom: event.zoom,
    }),
  );
  const result = emitCameraFlyIfReady(applied);

  if (event.source === "route" && result.effects.length > 0) {
    return {
      ...result,
      state: markRouteEntryDispatched(result.state),
    };
  }

  return result;
}

function reduceRecenterUser(
  state: MapShellMachineState,
  event: Extract<MapShellMachineEvent, { type: "recenterUser" }>,
): MapShellMachineResult {
  const cleared = clearSelectionState(state, true);
  const applied = applyShellIntent(cleared, planUserRecenterIntent(event.zoom));
  const result = emitCameraFlyIfReady(applied);

  if (event.source === "route" && result.effects.length > 0) {
    return {
      ...result,
      state: markRouteEntryDispatched(result.state),
    };
  }

  return result;
}

/** Unified map-shell intent FSM: selection, sheet snap, route entry, camera fly. */
export function reduceMapShellMachine(
  state: MapShellMachineState,
  event: MapShellMachineEvent,
): MapShellMachineResult {
  switch (event.type) {
    case "cameraSnapshotSynced": {
      const snapshotResult = applyCameraSnapshot(state, event.snapshot);
      const advanced = advanceRouteEntry(snapshotResult.state);
      return mergeResults(snapshotResult, tryApplyRouteEntry(advanced));
    }

    case "routeEnterFlyChanged": {
      return reduceRouteEnterFlyChanged(state, event.routeKey, event.entry);
    }

    case "sheetLayoutFrameChanged": {
      return reduceSheetLayoutFrameChanged(
        state,
        event.phase,
        event.restingSnap,
      );
    }

    case "sheetSettled": {
      return reduceSheetSettled(state, event.snap);
    }

    case "selectItem": {
      return reduceSelectItem(state, event);
    }

    case "recenterUser": {
      return reduceRecenterUser(state, event);
    }

    case "navigateTo": {
      const nextState = event.options?.preserveTracking
        ? state
        : clearSelectionState(state, true);

      return {
        state: nextState,
        effects: [
          {
            type: "flyToPosition",
            position: event.position,
            duration: event.options?.duration,
            preserveTracking: event.options?.preserveTracking,
          },
        ],
      };
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
        state.commandedSnap === "collapsed" &&
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
