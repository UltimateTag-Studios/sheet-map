import type { MapShellMachineEffect, MapShellMachineResult } from "../machine";
import type { MapShellMachineState } from "../state";
import { canEmitCameraFly } from "../state";
import { armIntent, planItemSelect, planRecenterUser } from "./plan";

function cameraIntentToEffect(
  camera: NonNullable<MapShellMachineState["intent"]>["camera"] & object,
): MapShellMachineEffect {
  if (camera.kind === "flyToUser") {
    return camera.zoom !== undefined
      ? { type: "flyToUser", zoom: camera.zoom }
      : { type: "flyToUser" };
  }

  if (camera.enterFly) {
    return camera.zoom !== undefined
      ? {
          type: "flyToItem",
          location: camera.location,
          enterFly: true,
          zoom: camera.zoom,
        }
      : {
          type: "flyToItem",
          location: camera.location,
          enterFly: true,
        };
  }

  return { type: "flyToItem", location: camera.location };
}

export function tryAdvanceIntent(
  state: MapShellMachineState,
): MapShellMachineResult {
  const intent = state.intent;
  if (!intent?.camera) {
    return { state, effects: [] };
  }

  if (!canEmitCameraFly(state)) {
    return { state, effects: [] };
  }

  const effect = cameraIntentToEffect(intent.camera);

  return {
    state: {
      ...state,
      intent: {
        ...intent,
        camera: null,
      },
    },
    effects: [effect],
  };
}

export function tryOpenHalfAfterCameraIdle(
  state: MapShellMachineState,
  previousCameraSession: MapShellMachineState["environment"]["cameraSession"],
  nextCameraSession: MapShellMachineState["environment"]["cameraSession"],
): MapShellMachineState {
  const intent = state.intent;
  if (
    !intent?.openHalfAfterCameraIdle ||
    intent.camera !== null ||
    previousCameraSession !== "flying" ||
    nextCameraSession !== "idle"
  ) {
    return state;
  }

  return {
    ...state,
    sheetSnap: "half",
    intent: null,
  };
}

export { armIntent, planItemSelect, planRecenterUser };
