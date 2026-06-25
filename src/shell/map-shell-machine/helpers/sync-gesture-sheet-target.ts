import type { SheetSnap } from "@siegetag/sheet";

import type { MapShellMachineState, MapShellSheetPhase } from "../state";
import { cancelIntentOnGestureClose } from "./cancel-intent-on-gesture-close";

/** Mirror user gesture destination into sheetTarget without mutating sheetSnap. */
export function syncGestureSheetTarget(
  state: MapShellMachineState,
  sheetPhase: MapShellSheetPhase,
  restingSnap: SheetSnap,
): MapShellMachineState {
  if (sheetPhase === "resting") {
    return state;
  }

  if (restingSnap === state.sheetSnap) {
    return state;
  }

  const withTarget: MapShellMachineState = {
    ...state,
    sheetTarget: restingSnap,
  };

  return cancelIntentOnGestureClose(withTarget, restingSnap);
}
