import type { MapPosition } from "../shared/map-position";
import type { MapAnchorState, NavigationIntent } from "./state";

export type MapAnchorEvent =
  | { type: "setAnchor"; position: MapPosition }
  | { type: "userGestureStarted" }
  | { type: "userGestureSettled"; position: MapPosition }
  | { type: "navigationStarted"; intent: NavigationIntent }
  | { type: "navigationSettled" };

export function reduceMapAnchor(
  state: MapAnchorState,
  event: MapAnchorEvent,
): MapAnchorState {
  switch (event.type) {
    case "setAnchor":
      return {
        ...state,
        anchor: event.position,
      };
    case "userGestureStarted":
      return {
        ...state,
        session: "userGesture",
        navigationIntent: null,
      };
    case "userGestureSettled":
      return {
        anchor: event.position,
        session: "idle",
        navigationIntent: null,
      };
    case "navigationStarted":
      return {
        ...state,
        session: "navigating",
        navigationIntent: event.intent,
      };
    case "navigationSettled":
      return {
        ...state,
        session: "idle",
        navigationIntent: null,
      };
  }
}
