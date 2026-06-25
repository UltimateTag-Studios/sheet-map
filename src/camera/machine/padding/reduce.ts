import { tryIssueBootFly } from "../boot/try-issue-boot-fly";
import { withNotifyShell } from "../helpers/notify-shell";
import { isSheetMotionIdle, type MapCameraState } from "../state";
import type { MapCameraMachineEvent, MapCameraMachineResult } from "../types";
import {
  realignPaddingWhileSheetMoving,
  shouldDeferPaddingApply,
} from "./pending-apply";

function withPaddingAppliedNotify(
  result: MapCameraMachineResult,
): MapCameraMachineResult {
  const appliedAtRest = result.effects.some(
    (effect) => effect.type === "applyPadding",
  );
  if (!appliedAtRest || !isSheetMotionIdle(result.state.sheetPhase)) {
    return result;
  }

  return withNotifyShell(result, { kind: "paddingApplied" });
}

function notifyPaddingStableAtRest(
  state: MapCameraState,
  result: MapCameraMachineResult,
  changed: boolean,
): MapCameraMachineResult {
  if (
    changed ||
    state.padding.phase !== "ready" ||
    !isSheetMotionIdle(state.sheetPhase) ||
    state.session !== "idle"
  ) {
    return result;
  }

  return withNotifyShell(result, { kind: "paddingApplied" });
}

export function reducePaddingMeasured(
  state: MapCameraState,
  event: Extract<MapCameraMachineEvent, { type: "paddingMeasured" }>,
): MapCameraMachineResult {
  const wasReady = state.padding.phase === "ready";
  let nextState: MapCameraState = {
    ...state,
    padding: {
      phase: "ready",
      options: event.options,
      suppressNextMoveEnd: event.changed
        ? true
        : state.padding.suppressNextMoveEnd,
      pendingApply: state.padding.pendingApply,
    },
  };

  const effects: MapCameraMachineResult["effects"] = [];

  if (event.changed) {
    if (shouldDeferPaddingApply(state)) {
      nextState = {
        ...nextState,
        padding: {
          ...nextState.padding,
          pendingApply: event.options,
        },
      };
    } else {
      nextState = {
        ...nextState,
        padding: {
          ...nextState.padding,
          pendingApply: null,
        },
      };
      effects.push({
        type: "applyPadding",
        options: event.options,
        realign: realignPaddingWhileSheetMoving(state),
      });
    }
  }

  const bootResult = tryIssueBootFly(nextState);
  if (bootResult) {
    let result: MapCameraMachineResult = {
      state: bootResult.state,
      effects: [...effects, ...bootResult.effects],
    };
    if (!wasReady) {
      result = withNotifyShell(result, {
        kind: "paddingReadyChanged",
        ready: true,
      });
    }
    result = withPaddingAppliedNotify(result);
    return result;
  }

  let result: MapCameraMachineResult = { state: nextState, effects };
  if (!wasReady) {
    result = withNotifyShell(result, {
      kind: "paddingReadyChanged",
      ready: true,
    });
  }
  result = withPaddingAppliedNotify(result);
  result = notifyPaddingStableAtRest(state, result, event.changed);
  return result;
}
