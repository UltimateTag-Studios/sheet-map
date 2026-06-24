import type { SheetLayoutFrameChange, SheetSnap } from "@siegetag/sheet";

import type { MapItemLocation } from "../../items/types";
import {
  type ItemSelectPhase,
  isSheetMotionIdle,
  isSheetReadyAtHalf,
  type MapShellEnvironment,
  type MapShellMachineState,
} from "./state";

type SheetPhase = SheetLayoutFrameChange["phase"];

/**
 * Map shell machine events — three sources only:
 *
 * 1. **Intent** — user / app actions (`selectItem`, `clearSelection`, `dismissSheet`)
 * 2. **Sheet** — `@siegetag/sheet` reports snap + gesture phase
 * 3. **Environment** — camera session + sheet motion phase from live subsystems
 *
 * Side effects (`flyToItem`) are outputs, not events. The camera and sheet
 * subsystems report back through `environmentSynced` and `sheetReported`.
 */
export type MapShellMachineEvent =
  | { type: "selectItem"; id: string; location: MapItemLocation | null }
  | { type: "clearSelection" }
  | { type: "dismissSheet" }
  | { type: "sheetReported"; snap: SheetSnap; phase: SheetPhase }
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

function applyEnvironment(
  state: MapShellMachineState,
  environment: MapShellEnvironment,
): MapShellMachineState {
  const previousEnvironment = state.environment;
  if (environmentsEqual(previousEnvironment, environment)) {
    return state;
  }

  const withEnvironment: MapShellMachineState = { ...state, environment };

  if (
    isFlyingToItem(withEnvironment) &&
    previousEnvironment.cameraSession === "flying" &&
    environment.cameraSession === "idle"
  ) {
    return completeFlyingToItem(withEnvironment);
  }

  return withEnvironment;
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
      if (event.phase === "idle" && event.snap === "collapsed") {
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
