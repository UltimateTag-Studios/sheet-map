import type { MapAnchorSession } from "../../../camera";
import type { MapShellMachineState } from "../state";

export function completeSelectOpenHalf(
  state: MapShellMachineState,
  previousCameraSession: MapAnchorSession,
  nextCameraSession: MapAnchorSession,
): MapShellMachineState {
  const intent = state.intent;
  if (intent?.phase !== "awaitCameraIdleForHalf") {
    return state;
  }

  const flewThenIdle =
    previousCameraSession === "flying" && nextCameraSession === "idle";

  if (!flewThenIdle) {
    return state;
  }

  return {
    ...state,
    sheetTarget: "half",
    intent: null,
  };
}

export function completeSelectOpenHalfOnNavigateSettled(
  state: MapShellMachineState,
): MapShellMachineState {
  const intent = state.intent;
  if (intent?.phase !== "awaitCameraIdleForHalf") {
    return state;
  }

  return {
    ...state,
    sheetTarget: "half",
    intent: null,
  };
}
