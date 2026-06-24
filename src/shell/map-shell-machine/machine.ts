import type { SheetSnap } from "@siegetag/sheet";

import type { MapAnchorSession } from "../../camera/anchor/state";
import type { MapItemLocation } from "../../items/types";
import type { SheetMotionPhase } from "../../viewport";
import {
  type ItemSelectPhase,
  isSheetMotionIdle,
  isSheetReadyAtHalf,
  type MapShellMachineState,
} from "./state";

export type MapShellMachineEvent =
  | { type: "sheetSnapChange"; snap: SheetSnap }
  | { type: "sheetSnapSettled"; snap: SheetSnap }
  | { type: "selectItem"; id: string; location: MapItemLocation | null }
  | { type: "cameraSessionChanged"; session: MapAnchorSession }
  | { type: "sheetMotionPhaseChanged"; phase: SheetMotionPhase }
  | { type: "clearSelection" }
  | { type: "closeSheet" };

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

function advanceFlyThenOpenOnCameraSession(
  state: MapShellMachineState,
  session: MapAnchorSession,
): MapShellMachineState {
  if (state.itemSelect.status !== "flyThenOpen") {
    return state;
  }

  const itemSelect = state.itemSelect;

  if (session === "flying" && itemSelect.cameraStage === "pending") {
    return {
      ...state,
      cameraSession: session,
      itemSelect: { ...itemSelect, cameraStage: "inFlight" },
    };
  }

  if (session === "idle" && itemSelect.cameraStage === "inFlight") {
    return {
      ...state,
      cameraSession: session,
      sheetSnap: "half",
      itemSelect: idleItemSelect(),
    };
  }

  return { ...state, cameraSession: session };
}

/** Unified map-shell selection, sheet snap, and item-select sequencing. */
export function reduceMapShellMachine(
  state: MapShellMachineState,
  event: MapShellMachineEvent,
): MapShellMachineResult {
  switch (event.type) {
    case "sheetSnapChange": {
      if (event.snap === state.sheetSnap) {
        return { state, effects: [] };
      }

      return {
        state: { ...state, sheetSnap: event.snap },
        effects: [],
      };
    }

    case "sheetSnapSettled": {
      if (event.snap === state.sheetSnap) {
        return { state, effects: [] };
      }

      return {
        state: { ...state, sheetSnap: event.snap },
        effects: [],
      };
    }

    case "cameraSessionChanged": {
      if (event.session === state.cameraSession) {
        return { state, effects: [] };
      }

      return {
        state: advanceFlyThenOpenOnCameraSession(state, event.session),
        effects: [],
      };
    }

    case "sheetMotionPhaseChanged": {
      if (event.phase === state.sheetMotionPhase) {
        return { state, effects: [] };
      }

      return {
        state: { ...state, sheetMotionPhase: event.phase },
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
            status: "flyThenOpen",
            location: event.location,
            cameraStage: "pending",
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

    case "closeSheet": {
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
