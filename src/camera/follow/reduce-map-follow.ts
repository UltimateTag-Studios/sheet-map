import type { MapFollowState } from "./state";

export type MapFollowEvent =
  | { type: "startFollowUser" }
  | { type: "stopFollowUser" }
  | { type: "bootFlown" };

export function reduceMapFollow(
  state: MapFollowState,
  event: MapFollowEvent,
): MapFollowState {
  switch (event.type) {
    case "startFollowUser":
      return {
        ...state,
        followUser: true,
      };
    case "stopFollowUser":
      return {
        ...state,
        followUser: false,
      };
    case "bootFlown":
      return {
        ...state,
        hasBootFlown: true,
      };
  }
}
