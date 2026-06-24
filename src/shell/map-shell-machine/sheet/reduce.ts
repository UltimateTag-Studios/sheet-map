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
import type { MapShellMachineState } from "../state";
import type { MapShellMachineEffect, MapShellMachineResult } from "../types";

type SheetPhase = SheetLayoutFrameChange["phase"];

export function reduceSheetLayoutFrameChanged(
  state: MapShellMachineState,
  phase: SheetPhase,
  restingSnap: SheetSnap,
): MapShellMachineResult {
  const previousPhase = state.sheetMotionPhase;
  const nextState: MapShellMachineState = {
    ...state,
    layoutSnap: restingSnap,
    sheetMotionPhase: phase,
  };

  const effects: MapShellMachineEffect[] = [];
  if (previousPhase !== phase) {
    effects.push({ type: "syncCameraSheetPhase", phase });
  }

  if (phase === "idle") {
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
    layoutSnap: snap,
    sheetMotionPhase: "idle",
  };

  if (snap === "collapsed") {
    if (routeEntryInterruptedOnCollapse(withLayout)) {
      return {
        state: resetRouteEntryToWaiting(
          sheetClosedState({ ...withLayout, commandedSnap: snap }),
        ),
        effects: [],
      };
    }

    const closed = sheetClosedState({ ...withLayout, commandedSnap: snap });
    const next = closed.routeVisit ? dismissRouteEntry(closed) : closed;
    return { state: next, effects: [] };
  }

  const nextState: MapShellMachineState = {
    ...withLayout,
    commandedSnap: snap,
  };
  return emitCameraFlyIfReady(nextState);
}
