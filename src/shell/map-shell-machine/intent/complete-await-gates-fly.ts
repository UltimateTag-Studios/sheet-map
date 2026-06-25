import type { MapShellMachineState } from "../state";

/** Clears awaitGates intent after the last correlated navigate settles. */
export function completeAwaitGatesFlyIntent(
  state: MapShellMachineState,
): MapShellMachineState {
  const outstanding = Math.max(0, state.outstandingShellNavigates - 1);
  const nextState: MapShellMachineState = {
    ...state,
    outstandingShellNavigates: outstanding,
  };

  const intent = nextState.intent;
  if (intent?.phase !== "awaitGates") {
    return nextState;
  }

  if (outstanding === 0) {
    return { ...nextState, intent: null };
  }

  return nextState;
}
