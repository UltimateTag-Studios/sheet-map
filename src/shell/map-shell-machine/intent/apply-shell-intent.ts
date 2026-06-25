import type { MapShellMachineState, ShellIntent } from "../state";

function sheetTargetFromIntent(
  state: MapShellMachineState,
  intent: Extract<ShellIntent, { phase: "awaitGates" }>,
): MapShellMachineState["sheetTarget"] {
  if (intent.openHalfAfterFly) {
    return "collapsed";
  }

  if (intent.requiredSnap === "half" && state.sheetSnap !== "half") {
    return "half";
  }

  if (intent.requiredSnap === "half") {
    return "half";
  }

  if (state.sheetSnap === "half") {
    return "half";
  }

  return state.sheetTarget;
}

export function applyShellIntent(
  state: MapShellMachineState,
  intent: ShellIntent,
): MapShellMachineState {
  const next: MapShellMachineState = {
    ...state,
    intent,
    selectedItemId: intent.itemId,
  };

  if (intent.phase === "awaitGates") {
    next.sheetTarget = sheetTargetFromIntent(state, intent);
  }

  return next;
}
