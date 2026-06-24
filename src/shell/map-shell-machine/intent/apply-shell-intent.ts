import type { MapShellMachineState, ShellIntent } from "../state";

export function applyShellIntent(
  state: MapShellMachineState,
  intent: ShellIntent,
): MapShellMachineState {
  const next: MapShellMachineState = {
    ...state,
    intent,
    selectedItemId: intent.itemId,
  };

  if (intent.phase === "awaitGates" && intent.sheetTarget !== null) {
    next.commandedSnap = intent.sheetTarget;
  }

  return next;
}
