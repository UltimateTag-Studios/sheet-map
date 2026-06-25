import { resolveEnterFlyZoomFromState } from "../../resolve-enter-fly-zoom-from-state";
import type { MapShellMachineState } from "../state";
import type { MapShellMachineEffect, MapShellMachineResult } from "../types";
import { shellNavigateGate } from "./shell-navigate-gate";
import { shellNavigateMode } from "./shell-navigate-mode";

function cameraIntentToEffect(
  state: MapShellMachineState,
  camera: Extract<
    MapShellMachineState["intent"],
    { phase: "awaitGates" }
  >["camera"],
): MapShellMachineEffect {
  const mode = shellNavigateMode(state);

  if (camera.kind === "flyToUser") {
    const zoom = resolveEnterFlyZoomFromState(state, camera.zoom);
    return zoom !== undefined
      ? { type: "flyToUser", zoom, mode }
      : { type: "flyToUser", mode };
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
          mode,
        }
      : {
          type: "flyToItem",
          location: camera.location,
          enterFly: true,
          mode,
        };
  }

  return { type: "flyToItem", location: camera.location, mode };
}

export function emitCameraFlyIfReady(
  state: MapShellMachineState,
): MapShellMachineResult {
  const intent = state.intent;
  if (!intent || intent.phase !== "awaitGates") {
    return { state, effects: [] };
  }

  if (shellNavigateGate(state).kind !== "emit") {
    return { state, effects: [] };
  }

  const effect = cameraIntentToEffect(state, intent.camera);
  const openHalfAfterFly = intent.openHalfAfterFly === true;

  return {
    state: {
      ...state,
      outstandingShellNavigates: state.outstandingShellNavigates + 1,
      intent: openHalfAfterFly
        ? {
            phase: "awaitCameraIdleForHalf",
            itemId: intent.itemId ?? "",
          }
        : {
            ...intent,
            navigateEmitted: true,
          },
    },
    effects: [effect],
  };
}
