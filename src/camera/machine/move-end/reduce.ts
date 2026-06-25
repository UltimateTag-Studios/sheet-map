import { resolveMoveEnd } from "../../lib/resolve-move-end";
import {
  withNavigateSettledNotify,
  withSessionNotifyIfChanged,
} from "../helpers/notify-shell";
import { canSettleFlying, settleFlyingSession } from "../helpers/session";
import { appendFlushPendingPadding } from "../padding/pending-apply";
import type { MapCameraState } from "../state";
import type { MapCameraMachineEvent, MapCameraMachineResult } from "../types";

export function reduceMapMoveEnd(
  state: MapCameraState,
  event: Extract<MapCameraMachineEvent, { type: "mapMoveEnd" }>,
): MapCameraMachineResult {
  const previousSession = state.session;
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

    const result: MapCameraMachineResult = {
      state: {
        ...nextState,
        anchor: resolution.position,
        session: "idle",
      },
      effects: [],
    };
    return withSessionNotifyIfChanged(result, previousSession);
  }

  if (canSettleFlying(nextState, event)) {
    let result: MapCameraMachineResult = appendFlushPendingPadding({
      state: settleFlyingSession(nextState),
      effects: [],
    });
    result = withSessionNotifyIfChanged(result, previousSession);
    return withNavigateSettledNotify(result);
  }

  return { state: nextState, effects: [] };
}

export function reduceMapIdle(
  state: MapCameraState,
  event: Extract<MapCameraMachineEvent, { type: "mapIdle" }>,
): MapCameraMachineResult {
  const previousSession = state.session;

  if (!canSettleFlying(state, event)) {
    return { state, effects: [] };
  }

  let result: MapCameraMachineResult = appendFlushPendingPadding({
    state: settleFlyingSession(state),
    effects: [],
  });
  result = withSessionNotifyIfChanged(result, previousSession);
  return withNavigateSettledNotify(result);
}
