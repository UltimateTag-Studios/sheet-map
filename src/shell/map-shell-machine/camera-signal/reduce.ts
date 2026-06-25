import type { CameraShellSignal } from "../../../camera/shared/camera-shell-signal";
import {
  completeAwaitGatesFlyIntent,
  completeSelectOpenHalf,
  emitCameraFlyWithSync,
} from "../intent";
import { completeSelectOpenHalfOnNavigateSettled } from "../intent/complete-select-open-half";
import { completeRouteUserEnterFly } from "../route-enter-fly";
import type { MapShellCameraSnapshot, MapShellMachineState } from "../state";
import type { MapShellMachineResult } from "../types";
import { shouldRetryIntentFly } from "./should-retry-intent-fly";

function patchCameraSnapshot(
  snapshot: MapShellCameraSnapshot,
  signal: CameraShellSignal,
): MapShellCameraSnapshot {
  switch (signal.kind) {
    case "sessionChanged":
      return { ...snapshot, cameraSession: signal.session };
    case "paddingReadyChanged":
      return { ...snapshot, mapPaddingReady: signal.ready };
    case "paddingApplied":
      return snapshot;
    case "hasUserLocationChanged":
      return { ...snapshot, hasUserLocation: signal.hasUserLocation };
    case "anchorZoomChanged":
      return { ...snapshot, anchorZoom: signal.anchorZoom };
    case "navigateSettled":
      return snapshot;
  }
}

export function reduceCameraSignal(
  state: MapShellMachineState,
  signal: CameraShellSignal,
): MapShellMachineResult {
  const previousSnapshot = state.cameraSnapshot;
  const nextSnapshot = patchCameraSnapshot(previousSnapshot, signal);

  let nextState: MapShellMachineState = {
    ...state,
    cameraSnapshot: nextSnapshot,
  };

  if (signal.kind === "sessionChanged") {
    nextState = completeSelectOpenHalf(
      nextState,
      signal.previousSession,
      signal.session,
    );
    nextState = completeRouteUserEnterFly(
      nextState,
      previousSnapshot,
      nextSnapshot,
    );
  }

  if (signal.kind === "navigateSettled") {
    nextState = completeSelectOpenHalfOnNavigateSettled(nextState);
    nextState = completeAwaitGatesFlyIntent(nextState);
  }

  if (!shouldRetryIntentFly(signal, nextState)) {
    return { state: nextState, effects: [] };
  }

  return emitCameraFlyWithSync(nextState);
}
