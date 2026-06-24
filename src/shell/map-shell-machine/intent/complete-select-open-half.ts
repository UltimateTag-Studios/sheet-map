import type { MapShellMachineState } from "../state";

export function completeSelectOpenHalf(
  state: MapShellMachineState,
  previousCameraSession: MapShellMachineState["cameraSnapshot"]["cameraSession"],
  nextCameraSession: MapShellMachineState["cameraSnapshot"]["cameraSession"],
): MapShellMachineState {
  const intent = state.intent;
  if (
    intent?.phase !== "awaitCameraIdleForHalf" ||
    previousCameraSession !== "flying" ||
    nextCameraSession !== "idle"
  ) {
    return state;
  }

  return {
    ...state,
    commandedSnap: "half",
    intent: null,
  };
}
