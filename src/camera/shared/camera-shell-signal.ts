import type { MapAnchorSession } from "../lib/state";

export type CameraShellSignal =
  | {
      kind: "sessionChanged";
      session: MapAnchorSession;
      previousSession: MapAnchorSession;
    }
  | { kind: "paddingReadyChanged"; ready: boolean }
  | { kind: "paddingApplied" }
  | { kind: "hasUserLocationChanged"; hasUserLocation: boolean }
  | { kind: "anchorZoomChanged"; anchorZoom: number | null }
  | { kind: "navigateSettled" };
