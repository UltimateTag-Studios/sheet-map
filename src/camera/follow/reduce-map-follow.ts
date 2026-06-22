import type { MapFollowState } from "./state";

export type MapFollowEvent =
  | { type: "startTracking" }
  | { type: "stopTracking" }
  | { type: "bootIssued" };

export function reduceMapFollow(
  state: MapFollowState,
  event: MapFollowEvent,
): MapFollowState {
  switch (event.type) {
    case "startTracking":
      return {
        ...state,
        tracking: true,
      };
    case "stopTracking":
      return {
        ...state,
        tracking: false,
      };
    case "bootIssued":
      return {
        ...state,
        tracking: true,
      };
  }
}
