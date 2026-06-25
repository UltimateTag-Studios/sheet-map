import type { MapShellMachineState } from "../state";
import type { MapShellMachineEffect, MapShellMachineResult } from "../types";
import { emitCameraFlyIfReady } from "./emit-camera-fly-if-ready";

function syncIdleWhenResting(
  state: MapShellMachineState,
): MapShellMachineEffect[] {
  if (state.sheetPhase !== "resting") {
    return [];
  }

  return [{ type: "syncCameraSheetPhase", phase: "idle" }];
}

/** Truth-table fly row: sync camera sheet idle when resting, then try fly. */
export function emitCameraFlyWithSync(
  state: MapShellMachineState,
): MapShellMachineResult {
  const emitted = emitCameraFlyIfReady(state);

  if (emitted.effects.length === 0) {
    return emitted;
  }

  return {
    state: emitted.state,
    effects: [...syncIdleWhenResting(state), ...emitted.effects],
  };
}
