import { commitSheetArrival } from "../helpers/commit-sheet-arrival";
import type { MapShellMachineState } from "../state";

/** Sheet `onSnapSettled` — commit arrival only; fly waits for layout-frame idle. */
export function commitSheetArrivalFromSettle(
  state: MapShellMachineState,
  snap: MapShellMachineState["sheetSnap"],
): MapShellMachineState {
  return commitSheetArrival(state, snap);
}
