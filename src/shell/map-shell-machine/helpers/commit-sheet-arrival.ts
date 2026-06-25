import type { SheetSnap } from "@siegetag/sheet";

import type { MapShellMachineState } from "../state";

/** Commit sheet arrival — `sheetSnap` only moves here or on equivalent idle-frame commit. */
export function commitSheetArrival(
  state: MapShellMachineState,
  snap: SheetSnap,
): MapShellMachineState {
  if (state.sheetSnap === snap && state.sheetTarget === null) {
    return state;
  }

  return {
    ...state,
    sheetSnap: snap,
    sheetTarget: null,
  };
}

export function pendingArrivalFromLayoutFrame(
  state: MapShellMachineState,
  restingSnap: SheetSnap,
  sheetPhase: MapShellMachineState["sheetPhase"],
): SheetSnap | null {
  if (sheetPhase !== "resting") {
    return null;
  }

  if (restingSnap === state.sheetSnap) {
    return null;
  }

  return restingSnap;
}
