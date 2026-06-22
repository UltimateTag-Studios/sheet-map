import type { MapFollowState } from "./state";

export type MapFollowEvent =
  | { type: "startTracking" }
  | { type: "stopTracking" }
  | { type: "bootFlown" }
  | { type: "resetBoot" };

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
    case "bootFlown":
      return {
        ...state,
        hasBootFlown: true,
        tracking: true,
      };
    case "resetBoot":
      return {
        ...state,
        hasBootFlown: false,
      };
  }
}
