import type { MapShellMachineState } from "../state";

export function completeSelectOpenHalf(
  state: MapShellMachineState,
  previousCameraSession: MapShellMachineState["cameraSnapshot"]["cameraSession"],
  nextCameraSession: MapShellMachineState["cameraSnapshot"]["cameraSession"],
): MapShellMachineState {
  const intent = state.intent;
  if (
    intent?.phase !== "awaitCameraIdleForHalf" ||
    !state.halfOpenAfterFlyPending
  ) {
    return state;
  }

  const flewThenIdle =
    previousCameraSession === "flying" && nextCameraSession === "idle";
  const jumpFlyIdle =
    previousCameraSession === "idle" && nextCameraSession === "idle";

  if (!flewThenIdle && !jumpFlyIdle) {
    return state;
  }

  return {
    ...state,
    sheetTarget: "half",
    intent: null,
    halfOpenAfterFlyPending: false,
  };
}
