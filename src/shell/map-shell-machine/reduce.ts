import type { SheetSnap } from "@siegetag/sheet";

import type { MapItemLocation } from "../../items/types";
import { idleItemSelectCamera } from "./item-select-camera";
import type { MapShellSelectionState } from "./state";

export type MapShellSelectionEvent =
  | { type: "sheetSnapChange"; snap: SheetSnap }
  | { type: "sheetSnapSettled"; snap: SheetSnap }
  | {
      type: "selectItem";
      id: string;
      location: MapItemLocation | null;
      /** Fly now with the sheet already open at half. */
      flyImmediately: boolean;
      /** Fly first while collapsed; open the sheet after the camera settles. */
      deferSheetOpen: boolean;
    }
  | { type: "flyCompletedOpenSheet" }
  | { type: "clearSelection" }
  | { type: "closeSheet" };

function sheetClosedState(
  state: MapShellSelectionState,
): MapShellSelectionState {
  return {
    ...state,
    sheetSnap: "collapsed",
    selectedItemId: null,
    itemSelectCamera: idleItemSelectCamera(),
  };
}

/** Pure sheet snap, selection, and item-select camera intent. */
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
      const itemSelectCamera =
        event.deferSheetOpen && event.location
          ? {
              status: "flyingToItem" as const,
              location: event.location,
            }
          : idleItemSelectCamera();

      return {
        ...state,
        selectedItemId: event.id,
        sheetSnap: event.deferSheetOpen ? "collapsed" : "half",
        itemSelectCamera,
      };
    }

    case "flyCompletedOpenSheet": {
      if (state.itemSelectCamera.status !== "flyingToItem") {
        return state;
      }

      return {
        ...state,
        sheetSnap: "half",
        itemSelectCamera: idleItemSelectCamera(),
      };
    }

    case "clearSelection": {
      if (
        state.selectedItemId === null &&
        state.itemSelectCamera.status === "idle"
      ) {
        return state;
      }

      return {
        ...state,
        selectedItemId: null,
        itemSelectCamera: idleItemSelectCamera(),
      };
    }

    case "closeSheet": {
      if (
        state.sheetSnap === "collapsed" &&
        state.selectedItemId === null &&
        state.itemSelectCamera.status === "idle"
      ) {
        return state;
      }

      return sheetClosedState(state);
    }

    default: {
      return state;
    }
  }
}
