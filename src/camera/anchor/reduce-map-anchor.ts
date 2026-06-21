import type { MapPosition } from "../map-position";
import type { MapAnchorState } from "./state";

export type MapAnchorEvent =
  | { type: "setAnchor"; position: MapPosition }
  | { type: "userGestureStarted" }
  | { type: "userGestureSettled"; position: MapPosition }
  | { type: "navigationStarted" }
  | { type: "programmaticSettled" };

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
      };
    case "userGestureSettled":
      return {
        anchor: event.position,
        session: "idle",
      };
    case "navigationStarted":
      return {
        ...state,
        session: "programmatic",
      };
    case "programmaticSettled":
      return {
        ...state,
        session: "idle",
      };
  }
}
