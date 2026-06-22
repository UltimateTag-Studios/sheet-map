import type { MapPosition } from "../shared/map-position";
import type { MapAnchorSession } from "./state";

export type MoveEndResolution =
  | { kind: "noop"; reason: "still_moving" | "padding_only" }
  | { kind: "userGestureSettled"; position: MapPosition }
  | { kind: "trySettleNavigating" };

/** Optional bag for 5D follow release / snap-back (threshold configured by app, not hardcoded here). */
export type MoveEndFollowContext = {
  followUser: boolean;
  /** Screen pixels — app default often 40; not used until 5D gesture settle. */
  followReleaseThresholdPx?: number;
};

export function resolveMoveEnd(input: {
  paddingMoveEnd: boolean;
  isMoving: boolean;
  session: MapAnchorSession;
  readPosition: () => MapPosition;
  followContext?: MoveEndFollowContext;
}): MoveEndResolution {
  void input.followContext;

  if (input.paddingMoveEnd) {
    if (!input.isMoving && input.session === "userGesture") {
      return {
        kind: "userGestureSettled",
        position: input.readPosition(),
      };
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

  if (input.session === "navigating") {
    return { kind: "trySettleNavigating" };
  }

  return { kind: "noop", reason: "padding_only" };
}
