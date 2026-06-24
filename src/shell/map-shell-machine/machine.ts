import type { SheetSnap } from "@siegetag/sheet";

import type { MapItemLocation } from "../../items/types";
import {
  type ItemSelectPhase,
  isSheetMotionIdle,
  isSheetReadyAtHalf,
  type MapShellEnvironment,
  type MapShellMachineState,
} from "./state";

/**
 * Map shell machine events — three sources only:
 *
 * 1. **Intent** — user / app actions (`selectItem`, `clearSelection`, `dismissSheet`)
 * 2. **Sheet** — `@siegetag/sheet` reports snap while dragging or at rest
 * 3. **Environment** — camera session + sheet motion phase from live subsystems
 *
 * Side effects (`flyToItem`) are outputs, not events. After a fly effect runs,
 * the hook syncs `environment` so the reducer can finish fly-then-open.
 */
export type MapShellMachineEvent =
  | { type: "selectItem"; id: string; location: MapItemLocation | null }
  | { type: "clearSelection" }
  | { type: "dismissSheet" }
  | { type: "sheetReported"; snap: SheetSnap; resting: boolean }
  | { type: "environmentSynced"; environment: MapShellEnvironment };

export type MapShellMachineEffect = {
  type: "flyToItem";
  location: MapItemLocation;
};

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
    flyIssued: boolean;
  };
} {
  return state.itemSelect.status === "flyingToItem";
}

function environmentsEqual(
  a: MapShellEnvironment,
  b: MapShellEnvironment,
): boolean {
  return (
    a.cameraSession === b.cameraSession &&
    a.sheetMotionPhase === b.sheetMotionPhase
  );
}

function tryCompleteFlyingToItem(
  state: MapShellMachineState,
  previousEnvironment: MapShellEnvironment,
  nextEnvironment: MapShellEnvironment,
): MapShellMachineState {
  if (!isFlyingToItem(state) || !state.itemSelect.flyIssued) {
    return state;
  }

  const { cameraSession } = nextEnvironment;
  const prevCamera = previousEnvironment.cameraSession;

  if (cameraSession === "idle" && prevCamera === "flying") {
    return completeFlyingToItem(state);
  }

  if (cameraSession === "idle" && prevCamera === "idle") {
    return completeFlyingToItem(state);
  }

  return state;
}

function applyEnvironment(
  state: MapShellMachineState,
  environment: MapShellEnvironment,
): MapShellMachineState {
  const previousEnvironment = state.environment;
  const unchanged = environmentsEqual(previousEnvironment, environment);
  const withEnvironment = unchanged ? state : { ...state, environment };

  const awaitingFlyCompletion =
    isFlyingToItem(withEnvironment) && withEnvironment.itemSelect.flyIssued;

  if (unchanged && !awaitingFlyCompletion) {
    return state;
  }

  return tryCompleteFlyingToItem(
    withEnvironment,
    previousEnvironment,
    environment,
  );
}

/** Unified map-shell selection, sheet snap, and item-select sequencing. */
export function reduceMapShellMachine(
  state: MapShellMachineState,
  event: MapShellMachineEvent,
): MapShellMachineResult {
  switch (event.type) {
    case "environmentSynced": {
      return {
        state: applyEnvironment(state, event.environment),
        effects: [],
      };
    }

    case "sheetReported": {
      if (event.resting && event.snap === "collapsed") {
        return {
          state: sheetClosedState({ ...state, sheetSnap: event.snap }),
          effects: [],
        };
      }

      if (event.snap === state.sheetSnap) {
        return { state, effects: [] };
      }

      return {
        state: { ...state, sheetSnap: event.snap },
        effects: [],
      };
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

      if (isSheetReadyAtHalf(state)) {
        return {
          state: {
            ...state,
            selectedItemId: event.id,
            sheetSnap: "half",
            itemSelect: idleItemSelect(),
          },
          effects: [{ type: "flyToItem", location: event.location }],
        };
      }

      if (!isSheetMotionIdle(state)) {
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

      return {
        state: {
          ...state,
          selectedItemId: event.id,
          sheetSnap: "collapsed",
          itemSelect: {
            status: "flyingToItem",
            location: event.location,
            flyIssued: true,
          },
        },
        effects: [{ type: "flyToItem", location: event.location }],
      };
    }

    case "clearSelection": {
      if (state.selectedItemId === null && state.itemSelect.status === "idle") {
        return { state, effects: [] };
      }

      return {
        state: {
          ...state,
          selectedItemId: null,
          itemSelect: idleItemSelect(),
        },
        effects: [],
      };
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
