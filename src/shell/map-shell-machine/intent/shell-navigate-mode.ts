import type { MapShellMachineState } from "../state";

/** Shell-requested navigate mode — camera may still force jump when sheet is moving. */
export function shellNavigateMode(state: MapShellMachineState): "fly" | "jump" {
  return state.sheetPhase === "resting" ? "fly" : "jump";
}
