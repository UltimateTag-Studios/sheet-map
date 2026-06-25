import type { SheetSnap } from "@siegetag/sheet";

import type { MapShellMachineState, ShellIntent } from "../state";
import { sheetClosedState } from "./selection-state";

export function isSelectDuringDismissIntent(intent: ShellIntent): boolean {
  return (
    intent.phase === "awaitGates" &&
    intent.sheetTarget === "collapsed" &&
    intent.openHalfAfterFly === true
  );
}

/** User drag-close cancels pending fly unless it is select-during-dismiss (I5). */
export function cancelIntentOnGestureClose(
  state: MapShellMachineState,
  gestureDestination: SheetSnap,
): MapShellMachineState {
  if (gestureDestination !== "collapsed") {
    return state;
  }

  const intent = state.intent;
  if (!intent) {
    return state;
  }

  if (intent.phase === "awaitCameraIdleForHalf") {
    return sheetClosedState({ ...state, sheetTarget: "collapsed" });
  }

  if (intent.phase === "awaitGates" && !isSelectDuringDismissIntent(intent)) {
    return sheetClosedState({ ...state, sheetTarget: "collapsed" });
  }

  return state;
}

export function shouldPreserveIntentOnCollapsedSettle(
  intent: ShellIntent | null,
): intent is Extract<ShellIntent, { phase: "awaitGates" }> {
  return intent?.phase === "awaitGates" && intent.sheetTarget === "collapsed";
}
