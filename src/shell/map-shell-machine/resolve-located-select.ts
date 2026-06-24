import type { MapItemLocation } from "../../items/types";
import type { MapShellMachineResult } from "./machine";
import type { MapShellMachineState } from "./state";
import { isSheetMotionIdle, isSheetReadyAtHalf } from "./state";

const idleItemSelect = () => ({ status: "idle" as const });

type LocatedSelectOptions = { zoom?: number; enterFly?: boolean };

function buildFlyEffect(
  location: MapItemLocation,
  options?: LocatedSelectOptions,
) {
  if (options?.enterFly) {
    return options.zoom !== undefined
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
        } as const);
  }

  return { type: "flyToItem" as const, location } as const;
}

function queuePendingLocatedSelectAtHalf(
  state: MapShellMachineState,
  id: string,
  location: MapItemLocation,
  options?: LocatedSelectOptions,
): MapShellMachineResult {
  return {
    state: {
      ...state,
      selectedItemId: id,
      sheetSnap: "half",
      itemSelect: {
        status: "pendingFly",
        location,
        ...(options?.enterFly
          ? { enterFly: true as const, zoom: options.zoom }
          : {}),
      },
    },
    effects: [],
  };
}

/** Runs a queued selection fly once the sheet is at half and motion is idle. */
export function resolvePendingLocatedSelect(
  state: MapShellMachineState,
): MapShellMachineResult | null {
  if (state.itemSelect.status !== "pendingFly") {
    return null;
  }

  if (!isSheetReadyAtHalf(state) || !state.environment.mapPaddingReady) {
    return null;
  }

  const selectedItemId = state.selectedItemId;
  if (selectedItemId === null) {
    return {
      state: { ...state, itemSelect: idleItemSelect() },
      effects: [],
    };
  }

  const { location, enterFly, zoom } = state.itemSelect;
  return resolveLocatedSelect(state, selectedItemId, location, {
    enterFly,
    zoom,
  });
}

export function resolveLocatedSelect(
  state: MapShellMachineState,
  id: string,
  location: MapItemLocation,
  options?: LocatedSelectOptions,
): MapShellMachineResult {
  const flyEffect = buildFlyEffect(location, options);

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

  if (state.reportedSheetSnap === "full") {
    return queuePendingLocatedSelectAtHalf(state, id, location, options);
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
  options?: LocatedSelectOptions,
): MapShellMachineResult {
  if (!isSheetMotionIdle(state) || state.reportedSheetSnap === "full") {
    return queuePendingLocatedSelectAtHalf(state, id, location, options);
  }

  return resolveLocatedSelect(state, id, location, options);
}
