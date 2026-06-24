import { completeSelectOpenHalf, emitCameraFlyIfReady } from "../intent";
import { completeRouteUserEnterFly } from "../route-enter-fly";
import type { MapShellCameraSnapshot, MapShellMachineState } from "../state";
import { cameraSnapshotsEqual } from "../state";
import type { MapShellMachineResult } from "../types";

export function applyCameraSnapshot(
  state: MapShellMachineState,
  snapshot: MapShellCameraSnapshot,
): MapShellMachineResult {
  const previousSnapshot = state.cameraSnapshot;
  let nextState: MapShellMachineState = { ...state, cameraSnapshot: snapshot };

  nextState = completeSelectOpenHalf(
    nextState,
    previousSnapshot.cameraSession,
    snapshot.cameraSession,
  );

  const emitted = emitCameraFlyIfReady(nextState);
  nextState = emitted.state;

  if (
    cameraSnapshotsEqual(previousSnapshot, snapshot) &&
    emitted.effects.length === 0
  ) {
    return { state: nextState, effects: [] };
  }

  const afterUserFly = completeRouteUserEnterFly(
    nextState,
    previousSnapshot,
    snapshot,
  );

  return {
    state: afterUserFly,
    effects: emitted.effects,
  };
}
