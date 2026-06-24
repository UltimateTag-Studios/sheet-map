import { isSheetMotionIdle, type MapCameraState } from "../state";

export function withTrackingOff(state: MapCameraState): MapCameraState {
  return {
    ...state,
    tracking: "off",
    follow: null,
    followThresholdExceeded: false,
  };
}

export function canSettleFlying(
  state: MapCameraState,
  input: { isMoving: boolean; atAnchor: boolean },
): boolean {
  return (
    state.session === "flying" &&
    isSheetMotionIdle(state.sheetPhase) &&
    !input.isMoving &&
    input.atAnchor &&
    state.anchor !== null
  );
}

export function settleFlyingSession(state: MapCameraState): MapCameraState {
  if (state.session !== "flying") {
    return state;
  }

  return {
    ...state,
    session: "idle",
  };
}
