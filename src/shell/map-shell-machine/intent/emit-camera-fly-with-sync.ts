import type { MapShellMachineState } from "../state";
import type { MapShellMachineEffect, MapShellMachineResult } from "../types";
import { emitCameraFlyIfReady } from "./emit-camera-fly-if-ready";

function syncCameraSheetPhaseBeforeNavigate(
  state: MapShellMachineState,
): MapShellMachineEffect[] {
  switch (state.sheetPhase) {
    case "dragging":
      return [{ type: "syncCameraSheetPhase", phase: "dragging" }];
    case "settling":
      return [{ type: "syncCameraSheetPhase", phase: "settling" }];
    case "resting":
      return [{ type: "syncCameraSheetPhase", phase: "idle" }];
    default:
      return [];
  }
}

/** Truth-table fly row: sync camera sheet phase, then try fly/jump. */
export function emitCameraFlyWithSync(
  state: MapShellMachineState,
): MapShellMachineResult {
  const emitted = emitCameraFlyIfReady(state);

  if (emitted.effects.length === 0) {
    return emitted;
  }

  return {
    state: emitted.state,
    effects: [...syncCameraSheetPhaseBeforeNavigate(state), ...emitted.effects],
  };
}
