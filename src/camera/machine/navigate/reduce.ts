import { mergeMapAnchorPosition } from "../../shared/map-position";
import {
  buildNavigateEffects,
  resolveNavigateMode,
} from "../helpers/navigate-mode";
import { withTrackingOff } from "../helpers/session";
import type { MapCameraState } from "../state";
import type {
  MapCameraMachineEffect,
  MapCameraMachineEvent,
  MapCameraMachineResult,
} from "../types";

export function reduceMapCameraNavigate(
  state: MapCameraState,
  event: Extract<MapCameraMachineEvent, { type: "navigateRequested" }>,
): MapCameraMachineResult {
  const mode = resolveNavigateMode(state, event.mode);
  const durationMs = event.durationMs ?? state.flyDurationMs;
  const anchor = mergeMapAnchorPosition(state.anchor, event.position);

  let nextState: MapCameraState = {
    ...state,
    anchor,
    followThresholdExceeded: false,
  };
  const effects: MapCameraMachineEffect[] = [];

  if (!event.preserveTracking) {
    nextState = withTrackingOff(nextState);
    effects.push({ type: "releaseTracking" });
  }

  if (mode === "fly") {
    nextState = { ...nextState, session: "flying" };
  } else if (nextState.session === "flying") {
    nextState = { ...nextState, session: "idle" };
  }

  effects.push(
    ...buildNavigateEffects(nextState, event.position, mode, durationMs),
  );

  return { state: nextState, effects };
}
