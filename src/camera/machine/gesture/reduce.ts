import type { GestureSettleOutcome } from "../../lib/evaluate-gesture-settle";
import { mergeMapAnchorPosition } from "../../shared/map-position";
import { buildNavigateEffects } from "../helpers/navigate-mode";
import { withTrackingOff } from "../helpers/session";
import type { MapCameraState } from "../state";
import type { MapCameraMachineResult } from "../types";

export function reduceGestureSettleResolved(
  state: MapCameraState,
  outcome: GestureSettleOutcome,
): MapCameraMachineResult {
  if (outcome.kind === "releaseTracking") {
    return {
      state: {
        ...withTrackingOff(state),
        anchor: outcome.position,
        session: "idle",
        followThresholdExceeded: true,
      },
      effects: [{ type: "releaseTracking" }],
    };
  }

  if (outcome.kind === "commitAnchor") {
    return {
      state: {
        ...state,
        anchor: outcome.position,
        session: "idle",
      },
      effects: [],
    };
  }

  const anchor = mergeMapAnchorPosition(state.anchor, outcome.target);

  return {
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
}
