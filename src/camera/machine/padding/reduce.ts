import { tryIssueBootFly } from "../boot/try-issue-boot-fly";
import { isSheetMotionIdle, type MapCameraState } from "../state";
import type { MapCameraMachineEvent, MapCameraMachineResult } from "../types";

export function reducePaddingMeasured(
  state: MapCameraState,
  event: Extract<MapCameraMachineEvent, { type: "paddingMeasured" }>,
): MapCameraMachineResult {
  const nextState: MapCameraState = {
    ...state,
    padding: {
      phase: "ready",
      options: event.options,
      suppressNextMoveEnd: event.changed
        ? true
        : state.padding.suppressNextMoveEnd,
    },
  };

  const effects: MapCameraMachineResult["effects"] = [];

  if (event.changed) {
    effects.push({
      type: "applyPadding",
      options: event.options,
      realign:
        !isSheetMotionIdle(state.sheetPhase) && state.session !== "userGesture",
    });
  }

  const bootResult = tryIssueBootFly(nextState);
  if (bootResult) {
    return {
      state: bootResult.state,
      effects: [...effects, ...bootResult.effects],
    };
  }

  return { state: nextState, effects };
}
