import type { MapPosition } from "../shared/map-position";

export type MapAnchorSession = "idle" | "userGesture" | "flying";

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

export function isFlyingSession(session: MapAnchorSession): boolean {
  return session === "flying";
}
