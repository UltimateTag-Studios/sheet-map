import type { SheetSnap } from "@siegetag/sheet";

import type { MapShellSelectionState } from "./state";

export type MapShellSelectionEvent =
  | { type: "sheetSnapChange"; snap: SheetSnap }
  | { type: "sheetSnapSettled"; snap: SheetSnap }
  | { type: "selectItem"; id: string }
  | { type: "clearSelection" }
  | { type: "closeSheet" };

function isSheetOpen(snap: SheetSnap): boolean {
  return snap !== "collapsed";
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
      const wasOpen = isSheetOpen(state.sheetSnap);
      const isOpen = isSheetOpen(event.snap);

      return {
        ...state,
        sheetSnap: event.snap,
        selectedItemId: wasOpen && !isOpen ? null : state.selectedItemId,
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
      if (!isSheetOpen(state.sheetSnap)) {
        return state;
      }

      return {
        ...state,
        sheetSnap: "collapsed",
        selectedItemId: null,
      };
    }

    default: {
      return state;
    }
  }
}
