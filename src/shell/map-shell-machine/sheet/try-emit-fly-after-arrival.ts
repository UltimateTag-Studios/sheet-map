import { commitSheetArrival } from "../helpers/commit-sheet-arrival";
import { emitCameraFlyIfReady } from "../intent/emit-camera-fly-if-ready";
import type { MapShellMachineState } from "../state";
import type { MapShellMachineEffect, MapShellMachineResult } from "../types";

/** Sheet `onSnapSettled` — commit arrival only; fly waits for layout-frame idle. */
export function commitSheetArrivalFromSettle(
  state: MapShellMachineState,
  snap: MapShellMachineState["sheetSnap"],
): MapShellMachineState {
  return commitSheetArrival(state, snap);
}

export function tryEmitFlyWhileResting(
  state: MapShellMachineState,
  priorEffects: MapShellMachineEffect[],
): MapShellMachineResult {
  if (state.sheetPhase !== "resting") {
    return { state, effects: priorEffects };
  }

  const emitted = emitCameraFlyIfReady(state);
  if (emitted.effects.length === 0) {
    return { state, effects: priorEffects };
  }

  const hasIdleSync = priorEffects.some(
    (effect) =>
      effect.type === "syncCameraSheetPhase" && effect.phase === "idle",
  );
  const syncEffects: MapShellMachineEffect[] = hasIdleSync
    ? []
    : [{ type: "syncCameraSheetPhase", phase: "idle" }];

  return {
    state: emitted.state,
    effects: [...priorEffects, ...syncEffects, ...emitted.effects],
  };
}
