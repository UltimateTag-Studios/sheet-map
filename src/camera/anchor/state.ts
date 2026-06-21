import type { MapPosition } from "../map-position";

export type MapAnchorSession = "idle" | "userGesture" | "programmatic";

export type MapAnchorState = {
  anchor: MapPosition | null;
  session: MapAnchorSession;
};

export function createInitialMapAnchorState(): MapAnchorState {
  return {
    anchor: null,
    session: "idle",
  };
}
