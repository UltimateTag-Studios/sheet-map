import type { MapPosition } from "../shared/map-position";
import type { MapAnchorState } from "./state";

export type MapAnchorEvent =
  | { type: "setAnchor"; position: MapPosition }
  | { type: "userGestureStarted" }
  | { type: "userGestureSettled"; position: MapPosition }
  | { type: "flyStarted" }
  | { type: "flySettled" };

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
    case "flyStarted":
      return {
        ...state,
        session: "flying",
      };
    case "flySettled":
      return {
        ...state,
        session: "idle",
      };
  }
}
