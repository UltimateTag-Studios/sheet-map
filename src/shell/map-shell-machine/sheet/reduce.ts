import type { SheetLayoutFrameChange, SheetSnap } from "@siegetag/sheet";

import {
  routeEntryInterruptedOnCollapse,
  sheetClosedState,
} from "../helpers/selection-state";
import { emitCameraFlyIfReady } from "../intent";
import {
  dismissRouteEntry,
  resetRouteEntryToWaiting,
} from "../route-enter-fly";
import { type MapShellMachineState, mapShellPhaseFromSheet } from "../state";
import type { MapShellMachineEffect, MapShellMachineResult } from "../types";

type SheetPhase = SheetLayoutFrameChange["phase"];

export function reduceSheetLayoutFrameChanged(
  state: MapShellMachineState,
  phase: SheetPhase,
): MapShellMachineResult {
  const sheetPhase = mapShellPhaseFromSheet(phase);
  const previousPhase = state.sheetPhase;
  const nextState: MapShellMachineState = {
    ...state,
    sheetPhase,
  };

  const effects: MapShellMachineEffect[] = [];
  if (previousPhase !== sheetPhase) {
    effects.push({ type: "syncCameraSheetPhase", phase });
  }

  if (sheetPhase === "resting") {
    const emitted = emitCameraFlyIfReady(nextState);
    return {
      state: emitted.state,
      effects: [...effects, ...emitted.effects],
    };
  }

  return { state: nextState, effects };
}

export function reduceSheetSettled(
  state: MapShellMachineState,
  snap: SheetSnap,
): MapShellMachineResult {
  const withLayout: MapShellMachineState = {
    ...state,
    sheetSnap: snap,
    sheetTarget: null,
    sheetPhase: "resting",
  };

  if (snap === "collapsed") {
    if (routeEntryInterruptedOnCollapse(withLayout)) {
      return {
        state: resetRouteEntryToWaiting(sheetClosedState(withLayout)),
        effects: [],
      };
    }

    const flyReady = emitCameraFlyIfReady(withLayout);
    if (flyReady.effects.length > 0) {
      return flyReady;
    }

    const closed = sheetClosedState(withLayout);
    const next = closed.routeVisit ? dismissRouteEntry(closed) : closed;
    return { state: next, effects: [] };
  }

  return emitCameraFlyIfReady(withLayout);
}
