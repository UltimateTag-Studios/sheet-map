import type { SheetSnap } from "@siegetag/sheet";

import type { MapShellSelectionState } from "./state";

export type MapShellSelectionEvent =
  | { type: "sheetSnapChange"; snap: SheetSnap }
  | { type: "sheetSnapSettled"; snap: SheetSnap }
  | { type: "selectItem"; id: string }
  | { type: "clearSelection" }
  | { type: "closeSheet" };

function sheetClosedState(
  state: MapShellSelectionState,
): MapShellSelectionState {
  return {
    ...state,
    sheetSnap: "collapsed",
    selectedItemId: null,
  };
}

/** Pure sheet snap + item selection transitions (camera lives in useMapUserTracking). */
export function reduceMapShellSelection(
  state: MapShellSelectionState,
  event: MapShellSelectionEvent,
): MapShellSelectionState {
  switch (event.type) {
    case "sheetSnapChange": {
      if (event.snap === state.sheetSnap) {
        return state;
      }

      return {
        ...state,
        sheetSnap: event.snap,
      };
    }

    case "sheetSnapSettled": {
      if (event.snap === state.sheetSnap) {
        return state;
      }

      return {
        ...state,
        sheetSnap: event.snap,
      };
    }

    case "selectItem": {
      return {
        ...state,
        selectedItemId: event.id,
        sheetSnap: "half",
      };
    }

    case "clearSelection": {
      if (state.selectedItemId === null) {
        return state;
      }

      return {
        ...state,
        selectedItemId: null,
      };
    }

    case "closeSheet": {
      if (state.sheetSnap === "collapsed" && state.selectedItemId === null) {
        return state;
      }

      return sheetClosedState(state);
    }

    default: {
      return state;
    }
  }
}
