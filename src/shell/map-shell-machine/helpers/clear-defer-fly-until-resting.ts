import type { MapShellMachineState } from "../state";

/** I12 defer complete — cleared on layout idle or I13 dragging entry. */
export function clearDeferFlyUntilResting(
  state: MapShellMachineState,
): MapShellMachineState {
  const intent = state.intent;
  if (intent?.phase !== "awaitGates" || !intent.deferFlyUntilResting) {
    return state;
  }

  return {
    ...state,
    intent: { ...intent, deferFlyUntilResting: false },
  };
}
