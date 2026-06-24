import { resolveMoveEnd } from "../../lib/resolve-move-end";
import { canSettleFlying, settleFlyingSession } from "../helpers/session";
import type { MapCameraState } from "../state";
import type { MapCameraMachineEvent, MapCameraMachineResult } from "../types";

export function reduceMapMoveEnd(
  state: MapCameraState,
  event: Extract<MapCameraMachineEvent, { type: "mapMoveEnd" }>,
): MapCameraMachineResult {
  let nextState = state;

  if (event.paddingMoveEnd && state.padding.suppressNextMoveEnd) {
    nextState = {
      ...nextState,
      padding: {
        ...nextState.padding,
        suppressNextMoveEnd: false,
      },
    };
  }

  const resolution = resolveMoveEnd({
    paddingMoveEnd: event.paddingMoveEnd,
    isMoving: event.isMoving,
    session: nextState.session,
    readPosition: () => event.position,
  });

  if (resolution.kind === "noop") {
    return { state: nextState, effects: [] };
  }

  if (resolution.kind === "userGestureSettled") {
    if (nextState.tracking === "on" && nextState.follow) {
      return {
        state: nextState,
        effects: [],
      };
    }

    return {
      state: {
        ...nextState,
        anchor: resolution.position,
        session: "idle",
      },
      effects: [],
    };
  }

  if (canSettleFlying(nextState, event)) {
    return {
      state: settleFlyingSession(nextState),
      effects: [],
    };
  }

  return { state: nextState, effects: [] };
}

export function reduceMapIdle(
  state: MapCameraState,
  event: Extract<MapCameraMachineEvent, { type: "mapIdle" }>,
): MapCameraMachineResult {
  if (!canSettleFlying(state, event)) {
    return { state, effects: [] };
  }

  return {
    state: settleFlyingSession(state),
    effects: [],
  };
}
