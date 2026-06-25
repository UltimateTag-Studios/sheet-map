import type { CameraShellSignal } from "../../shared/camera-shell-signal";
import type { MapCameraSession } from "../state";
import type { MapCameraMachineEffect, MapCameraMachineResult } from "../types";

export function appendNotifyShell(
  effects: MapCameraMachineEffect[],
  signal: CameraShellSignal,
): MapCameraMachineEffect[] {
  return [...effects, { type: "notifyShell", signal }];
}

export function withNotifyShell(
  result: MapCameraMachineResult,
  signal: CameraShellSignal,
): MapCameraMachineResult {
  return {
    state: result.state,
    effects: appendNotifyShell(result.effects, signal),
  };
}

export function withSessionNotifyIfChanged(
  result: MapCameraMachineResult,
  previousSession: MapCameraSession,
): MapCameraMachineResult {
  if (result.state.session === previousSession) {
    return result;
  }

  return withNotifyShell(result, {
    kind: "sessionChanged",
    session: result.state.session,
    previousSession,
  });
}

export function withNavigateSettledNotify(
  result: MapCameraMachineResult,
): MapCameraMachineResult {
  return withNotifyShell(result, { kind: "navigateSettled" });
}

export function anchorZoomFromPosition(
  anchor: { zoom?: number } | null,
): number | null {
  return anchor?.zoom ?? null;
}

export function withAnchorZoomNotifyIfChanged(
  result: MapCameraMachineResult,
  previousAnchorZoom: number | null,
): MapCameraMachineResult {
  const nextZoom = anchorZoomFromPosition(result.state.anchor);
  if (nextZoom === previousAnchorZoom) {
    return result;
  }

  return withNotifyShell(result, {
    kind: "anchorZoomChanged",
    anchorZoom: nextZoom,
  });
}
