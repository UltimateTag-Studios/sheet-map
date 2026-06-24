import type { MapItemLocation } from "../../items/types";
import type { MapShellMachineResult } from "./machine";
import type { MapShellMachineState } from "./state";
import { isSheetMotionIdle, isSheetReadyAtHalf } from "./state";

const idleItemSelect = () => ({ status: "idle" as const });

export function resolveLocatedSelect(
  state: MapShellMachineState,
  id: string,
  location: MapItemLocation,
  options?: { zoom?: number; enterFly?: boolean },
): MapShellMachineResult {
  const flyEffect = options?.enterFly
    ? options.zoom !== undefined
      ? ({
          type: "flyToItem" as const,
          location,
          enterFly: true as const,
          zoom: options.zoom,
        } as const)
      : ({
          type: "flyToItem" as const,
          location,
          enterFly: true as const,
        } as const)
    : ({ type: "flyToItem" as const, location } as const);

  if (isSheetReadyAtHalf(state)) {
    return {
      state: {
        ...state,
        selectedItemId: id,
        sheetSnap: "half",
        itemSelect: idleItemSelect(),
      },
      effects: [flyEffect],
    };
  }

  return {
    state: {
      ...state,
      selectedItemId: id,
      sheetSnap: "collapsed",
      itemSelect: {
        status: "flyingToItem",
        location,
      },
    },
    effects: [flyEffect],
  };
}

export function resolveLocatedSelectOrPending(
  state: MapShellMachineState,
  id: string,
  location: MapItemLocation,
): MapShellMachineResult {
  if (!isSheetMotionIdle(state)) {
    return {
      state: {
        ...state,
        selectedItemId: id,
        sheetSnap: "half",
        itemSelect: {
          status: "pendingFly",
          location,
        },
      },
      effects: [],
    };
  }

  return resolveLocatedSelect(state, id, location);
}
