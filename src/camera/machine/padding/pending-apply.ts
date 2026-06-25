import { isSheetMotionIdle, type MapCameraState } from "../state";
import type { MapCameraMachineResult } from "../types";

/** Defer only when fly is in progress and the sheet has arrived — Mapbox aborts flyTo on setPadding. */
export function shouldDeferPaddingApply(state: MapCameraState): boolean {
  return state.session === "flying" && isSheetMotionIdle(state.sheetPhase);
}

/** Realign anchor while the sheet is still moving; not during camera-idle padding tweaks. */
export function realignPaddingWhileSheetMoving(state: MapCameraState): boolean {
  return (
    !isSheetMotionIdle(state.sheetPhase) && state.session !== "userGesture"
  );
}

export function appendFlushPendingPadding(
  result: MapCameraMachineResult,
): MapCameraMachineResult {
  const pending = result.state.padding.pendingApply;
  if (!pending) {
    return result;
  }

  return {
    state: {
      ...result.state,
      padding: {
        ...result.state.padding,
        pendingApply: null,
      },
    },
    effects: [
      ...result.effects,
      {
        type: "applyPadding",
        options: pending,
        // After fly settles, re-center the nav target under the new padding.
        realign: result.state.session !== "userGesture",
      },
    ],
  };
}
