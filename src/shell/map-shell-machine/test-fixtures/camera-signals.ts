import type { MapAnchorSession } from "../../../camera";
import type { MapShellMachineEvent } from "../types";

export function cameraSessionChanged(
  session: MapAnchorSession,
  previousSession: MapAnchorSession,
): MapShellMachineEvent {
  return {
    type: "cameraSignal",
    signal: { kind: "sessionChanged", session, previousSession },
  };
}

export function cameraNavigateSettled(): MapShellMachineEvent {
  return {
    type: "cameraSignal",
    signal: { kind: "navigateSettled" },
  };
}

export function cameraPaddingReadyChanged(
  ready: boolean,
): MapShellMachineEvent {
  return {
    type: "cameraSignal",
    signal: { kind: "paddingReadyChanged", ready },
  };
}

export function cameraPaddingApplied(): MapShellMachineEvent {
  return {
    type: "cameraSignal",
    signal: { kind: "paddingApplied" },
  };
}

export function cameraHasUserLocationChanged(
  hasUserLocation: boolean,
): MapShellMachineEvent {
  return {
    type: "cameraSignal",
    signal: { kind: "hasUserLocationChanged", hasUserLocation },
  };
}
