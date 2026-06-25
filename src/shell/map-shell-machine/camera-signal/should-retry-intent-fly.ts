import type { CameraShellSignal } from "../../../camera/shared/camera-shell-signal";
import type { MapShellMachineState } from "../state";

export function shouldRetryIntentFly(
  signal: CameraShellSignal,
  state: MapShellMachineState,
): boolean {
  if (!state.intent || state.intent.phase !== "awaitGates") {
    return false;
  }

  switch (signal.kind) {
    case "paddingReadyChanged":
      return signal.ready;
    case "hasUserLocationChanged":
      return signal.hasUserLocation && state.intent.camera.kind === "flyToUser";
    case "sessionChanged":
      return (
        signal.previousSession === "userGesture" && signal.session === "idle"
      );
    case "navigateSettled":
    case "paddingApplied":
      return false;
    default:
      return false;
  }
}
