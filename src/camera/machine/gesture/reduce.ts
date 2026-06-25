import type { GestureSettleOutcome } from "../../lib/evaluate-gesture-settle";
import { mergeMapAnchorPosition } from "../../shared/map-position";
import { buildNavigateEffects } from "../helpers/navigate-mode";
import {
  anchorZoomFromPosition,
  withAnchorZoomNotifyIfChanged,
  withSessionNotifyIfChanged,
} from "../helpers/notify-shell";
import { withTrackingOff } from "../helpers/session";
import type { MapCameraState } from "../state";
import type { MapCameraMachineResult } from "../types";

export function reduceGestureSettleResolved(
  state: MapCameraState,
  outcome: GestureSettleOutcome,
): MapCameraMachineResult {
  const previousSession = state.session;
  const previousAnchorZoom = anchorZoomFromPosition(state.anchor);

  if (outcome.kind === "releaseTracking") {
    let result: MapCameraMachineResult = {
      state: {
        ...withTrackingOff(state),
        anchor: outcome.position,
        session: "idle",
        followThresholdExceeded: true,
      },
      effects: [{ type: "releaseTracking" }],
    };
    result = withSessionNotifyIfChanged(result, previousSession);
    return withAnchorZoomNotifyIfChanged(result, previousAnchorZoom);
  }

  if (outcome.kind === "commitAnchor") {
    let result: MapCameraMachineResult = {
      state: {
        ...state,
        anchor: outcome.position,
        session: "idle",
      },
      effects: [],
    };
    result = withSessionNotifyIfChanged(result, previousSession);
    return withAnchorZoomNotifyIfChanged(result, previousAnchorZoom);
  }

  const anchor = mergeMapAnchorPosition(state.anchor, outcome.target);

  let result: MapCameraMachineResult = {
    state: {
      ...state,
      anchor,
      session: "flying",
    },
    effects: buildNavigateEffects(
      state,
      outcome.target,
      "fly",
      state.flyDurationMs,
    ),
  };
  result = withSessionNotifyIfChanged(result, previousSession);
  return withAnchorZoomNotifyIfChanged(result, previousAnchorZoom);
}
