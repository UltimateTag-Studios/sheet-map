import type { SheetLayoutFrameChange, SheetSnap } from "@siegetag/sheet";

import {
  cancelIntentOnGestureClose,
  shouldPreserveIntentOnCollapsedSettle,
} from "../helpers/cancel-intent-on-gesture-close";
import { clearDeferFlyUntilResting } from "../helpers/clear-defer-fly-until-resting";
import {
  commitSheetArrival,
  pendingArrivalFromLayoutFrame,
} from "../helpers/commit-sheet-arrival";
import { mergeResults } from "../helpers/merge-results";
import {
  routeEntryInterruptedOnCollapse,
  sheetClosedState,
} from "../helpers/selection-state";
import { syncGestureSheetTarget } from "../helpers/sync-gesture-sheet-target";
import { emitCameraFlyWithSync } from "../intent";
import {
  dismissRouteEntry,
  resetRouteEntryToWaiting,
  tryApplyRouteEntry,
} from "../route-enter-fly";
import { type MapShellMachineState, mapShellPhaseFromSheet } from "../state";
import type { MapShellMachineEffect, MapShellMachineResult } from "../types";
import { commitSheetArrivalFromSettle } from "./try-emit-fly-after-arrival";

type SheetPhase = SheetLayoutFrameChange["phase"];

function phaseSyncEffect(
  previousPhase: MapShellMachineState["sheetPhase"],
  sheetPhase: MapShellMachineState["sheetPhase"],
  phase: SheetPhase,
): MapShellMachineEffect[] {
  if (previousPhase === sheetPhase) {
    return [];
  }

  return [{ type: "syncCameraSheetPhase", phase }];
}

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

  if (sheetPhase === "dragging") {
    nextState = clearDeferFlyUntilResting(nextState);
    const flyResult = emitCameraFlyWithSync(nextState);
    if (flyResult.effects.length > 0) {
      return { state: flyResult.state, effects: flyResult.effects };
    }

    return {
      state: nextState,
      effects: phaseSyncEffect(previousPhase, sheetPhase, phase),
    };
  }

  if (sheetPhase === "resting") {
    nextState = clearDeferFlyUntilResting(nextState);
    const flyResult = emitCameraFlyWithSync(nextState);
    if (flyResult.effects.length > 0) {
      return mergeResults(flyResult, tryApplyRouteEntry(flyResult.state));
    }

    return mergeResults(
      {
        state: nextState,
        effects: phaseSyncEffect(previousPhase, sheetPhase, phase),
      },
      tryApplyRouteEntry(nextState),
    );
  }

  return {
    state: nextState,
    effects: phaseSyncEffect(previousPhase, sheetPhase, phase),
  };
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
      return { state: withSnap, effects: [] };
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
