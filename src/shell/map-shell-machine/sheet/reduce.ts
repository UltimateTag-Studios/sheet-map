import type { SheetLayoutFrameChange, SheetSnap } from "@siegetag/sheet";

import {
  cancelIntentOnGestureClose,
  shouldPreserveIntentOnCollapsedSettle,
} from "../helpers/cancel-intent-on-gesture-close";
import {
  commitSheetArrival,
  pendingArrivalFromLayoutFrame,
} from "../helpers/commit-sheet-arrival";
import {
  routeEntryInterruptedOnCollapse,
  sheetClosedState,
} from "../helpers/selection-state";
import { syncGestureSheetTarget } from "../helpers/sync-gesture-sheet-target";
import {
  dismissRouteEntry,
  resetRouteEntryToWaiting,
} from "../route-enter-fly";
import { type MapShellMachineState, mapShellPhaseFromSheet } from "../state";
import type { MapShellMachineEffect, MapShellMachineResult } from "../types";
import {
  commitSheetArrivalFromSettle,
  tryEmitFlyWhileResting,
} from "./try-emit-fly-after-arrival";

type SheetPhase = SheetLayoutFrameChange["phase"];

export function reduceSheetLayoutFrameChanged(
  state: MapShellMachineState,
  phase: SheetPhase,
  restingSnap: SheetSnap,
): MapShellMachineResult {
  const sheetPhase = mapShellPhaseFromSheet(phase);
  const previousPhase = state.sheetPhase;
  let nextState = syncGestureSheetTarget(
    { ...state, sheetPhase },
    sheetPhase,
    restingSnap,
  );

  const pendingArrival = pendingArrivalFromLayoutFrame(
    nextState,
    restingSnap,
    sheetPhase,
  );
  if (pendingArrival !== null) {
    nextState = commitSheetArrival(nextState, pendingArrival);
  }

  const effects: MapShellMachineEffect[] = [];
  if (previousPhase !== sheetPhase) {
    effects.push({ type: "syncCameraSheetPhase", phase });
  }

  if (sheetPhase === "resting") {
    return tryEmitFlyWhileResting(nextState, effects);
  }

  return { state: nextState, effects };
}

export function reduceSheetSnapChangeStarted(
  state: MapShellMachineState,
  snap: SheetSnap,
): MapShellMachineResult {
  const withTarget: MapShellMachineState = { ...state, sheetTarget: snap };
  return {
    state: cancelIntentOnGestureClose(withTarget, snap),
    effects: [],
  };
}

export function reduceSheetSettled(
  state: MapShellMachineState,
  snap: SheetSnap,
): MapShellMachineResult {
  if (snap === "collapsed") {
    const withSnap = commitSheetArrival(state, snap);

    if (routeEntryInterruptedOnCollapse(withSnap)) {
      return {
        state: resetRouteEntryToWaiting(sheetClosedState(withSnap)),
        effects: [],
      };
    }

    if (shouldPreserveIntentOnCollapsedSettle(withSnap.intent)) {
      return tryEmitFlyWhileResting({ ...withSnap, sheetPhase: "resting" }, [
        { type: "syncCameraSheetPhase", phase: "idle" },
      ]);
    }

    const closed = cancelIntentOnGestureClose(
      sheetClosedState(withSnap),
      "collapsed",
    );
    const next = closed.routeVisit ? dismissRouteEntry(closed) : closed;
    return { state: next, effects: [] };
  }

  return {
    state: commitSheetArrivalFromSettle(state, snap),
    effects: [],
  };
}
