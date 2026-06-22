import type { MapPosition } from "../shared/map-position";

export type MapAnchorSession = "idle" | "userGesture" | "navigating";

export type NavigationIntent = {
  target: MapPosition;
};

export type MapAnchorState = {
  anchor: MapPosition | null;
  session: MapAnchorSession;
  navigationIntent: NavigationIntent | null;
};

export function createInitialMapAnchorState(): MapAnchorState {
  return {
    anchor: null,
    session: "idle",
    navigationIntent: null,
  };
}

export function isNavigationSession(session: MapAnchorSession): boolean {
  return session === "navigating";
}
