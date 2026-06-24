import { resolveEnterFlyZoomFromState } from "../../resolve-enter-fly-zoom-from-state";
import type { MapShellMachineState } from "../state";
import { intentReadyForCameraFly } from "../state";
import type { MapShellMachineEffect, MapShellMachineResult } from "../types";

function cameraIntentToEffect(
  state: MapShellMachineState,
  camera: Extract<
    MapShellMachineState["intent"],
    { phase: "awaitGates" }
  >["camera"],
): MapShellMachineEffect {
  if (camera.kind === "flyToUser") {
    const zoom = resolveEnterFlyZoomFromState(state, camera.zoom);
    return zoom !== undefined
      ? { type: "flyToUser", zoom }
      : { type: "flyToUser" };
  }

  const resolvedZoom =
    camera.enterFly === true
      ? resolveEnterFlyZoomFromState(state, camera.zoom)
      : undefined;

  if (camera.enterFly) {
    return resolvedZoom !== undefined
      ? {
          type: "flyToItem",
          location: camera.location,
          enterFly: true,
          zoom: resolvedZoom,
        }
      : {
          type: "flyToItem",
          location: camera.location,
          enterFly: true,
        };
  }

  return { type: "flyToItem", location: camera.location };
}

export function emitCameraFlyIfReady(
  state: MapShellMachineState,
): MapShellMachineResult {
  const intent = state.intent;
  if (!intent || intent.phase !== "awaitGates") {
    return { state, effects: [] };
  }

  if (!intentReadyForCameraFly(state)) {
    return { state, effects: [] };
  }

  const effect = cameraIntentToEffect(state, intent.camera);
  const openHalfAfterFly = intent.openHalfAfterFly === true;

  return {
    state: {
      ...state,
      intent: openHalfAfterFly
        ? {
            phase: "awaitCameraIdleForHalf",
            itemId: intent.itemId ?? "",
          }
        : null,
    },
    effects: [effect],
  };
}
