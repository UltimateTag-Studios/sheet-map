import type { MapPosition } from "../shared/map-position";
import type { MapAnchorSession } from "./state";

export type MoveEndResolution =
  | { kind: "noop"; reason: "still_moving" | "padding_only" }
  | { kind: "userGestureSettled"; position: MapPosition }
  | { kind: "trySettleFlying" };

/** Optional bag for tracking release / snap-back (threshold configured by app, not hardcoded here). */
export type MoveEndTrackingContext = {
  tracking: boolean;
  /** Screen pixels — app default often 40; not used until gesture settle. */
  followReleaseThresholdPx?: number;
};

export function resolveMoveEnd(input: {
  paddingMoveEnd: boolean;
  isMoving: boolean;
  session: MapAnchorSession;
  readPosition: () => MapPosition;
  trackingContext?: MoveEndTrackingContext;
}): MoveEndResolution {
  void input.trackingContext;

  if (input.paddingMoveEnd) {
    if (!input.isMoving && input.session === "userGesture") {
      return {
        kind: "userGestureSettled",
        position: input.readPosition(),
      };
    }
    if (!input.isMoving && input.session === "flying") {
      return { kind: "trySettleFlying" };
    }
    return { kind: "noop", reason: "padding_only" };
  }

  if (input.isMoving) {
    return { kind: "noop", reason: "still_moving" };
  }

  if (input.session === "userGesture") {
    return {
      kind: "userGestureSettled",
      position: input.readPosition(),
    };
  }

  if (input.session === "flying") {
    return { kind: "trySettleFlying" };
  }

  return { kind: "noop", reason: "padding_only" };
}
