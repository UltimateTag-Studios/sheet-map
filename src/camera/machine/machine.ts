import type { SheetMotionPhase } from "../../viewport";
import type { GestureSettleOutcome } from "../lib/evaluate-gesture-settle";
import { resolveMoveEnd } from "../lib/resolve-move-end";
import type { MapPaddingOptions } from "../padding/compute";
import {
  type MapPosition,
  mergeMapAnchorPosition,
} from "../shared/map-position";
import {
  createInitialMapCameraMachineState,
  isSheetMotionIdle,
  type MapCameraState,
} from "./state";

export type MapCameraMachineEvent =
  | { type: "mapStyleReady"; position: MapPosition }
  | {
      type: "mapMoveEnd";
      paddingMoveEnd: boolean;
      isMoving: boolean;
      position: MapPosition;
      atAnchor: boolean;
    }
  | { type: "mapIdle"; isMoving: boolean; atAnchor: boolean }
  | { type: "mapGestureBegan" }
  | { type: "mapFollowThresholdExceeded" }
  | { type: "gestureSettleResolved"; outcome: GestureSettleOutcome }
  | {
      type: "navigateRequested";
      position: MapPosition;
      mode: "fly" | "jump";
      preserveTracking: boolean;
      durationMs?: number;
    }
  | { type: "startTracking"; follow: MapCameraState["follow"] }
  | { type: "stopTracking" }
  | {
      type: "recenterRequested";
      position: MapPosition;
      follow: MapCameraState["follow"];
    }
  | { type: "gpsFix"; position: MapPosition; positionKey: string }
  | {
      type: "bootTargetReady";
      position: MapPosition;
      follow: MapCameraState["follow"];
      positionKey: string;
    }
  | { type: "sheetPhaseChanged"; phase: SheetMotionPhase }
  | {
      type: "paddingMeasured";
      options: MapPaddingOptions;
      changed: boolean;
    }
  | { type: "paddingSuppressDrained" }
  | { type: "mapInstanceReleased" };

export type MapCameraMachineEffect =
  | { type: "moveCamera"; position: MapPosition; duration: number }
  | { type: "applyPadding"; options: MapPaddingOptions; realign: boolean }
  | { type: "releaseTracking" };

export type MapCameraMachineResult = {
  state: MapCameraState;
  effects: MapCameraMachineEffect[];
};

function withTrackingOff(state: MapCameraState): MapCameraState {
  return {
    ...state,
    tracking: "off",
    follow: null,
    followThresholdExceeded: false,
  };
}

function canSettleFlying(
  state: MapCameraState,
  input: { isMoving: boolean; atAnchor: boolean },
): boolean {
  return (
    state.session === "flying" &&
    isSheetMotionIdle(state.sheetPhase) &&
    !input.isMoving &&
    input.atAnchor &&
    state.anchor !== null
  );
}

function settleFlyingSession(state: MapCameraState): MapCameraState {
  if (state.session !== "flying") {
    return state;
  }

  return {
    ...state,
    session: "idle",
  };
}

function resolveNavigateMode(
  state: MapCameraState,
  requested: "fly" | "jump",
): "fly" | "jump" {
  if (!isSheetMotionIdle(state.sheetPhase)) {
    return "jump";
  }

  return requested;
}

function buildNavigateEffects(
  state: MapCameraState,
  position: MapPosition,
  mode: "fly" | "jump",
  durationMs: number,
): MapCameraMachineEffect[] {
  const effects: MapCameraMachineEffect[] = [];

  if (state.padding.options) {
    effects.push({
      type: "applyPadding",
      options: state.padding.options,
      realign: false,
    });
  }

  effects.push({
    type: "moveCamera",
    position,
    duration: mode === "fly" ? durationMs : 0,
  });

  return effects;
}

function tryIssueBootFly(state: MapCameraState): MapCameraMachineResult | null {
  if (
    !state.enabled ||
    state.boot !== "pending" ||
    state.bootTarget === null ||
    state.padding.phase !== "ready"
  ) {
    return null;
  }

  const navigate = reduceMapCameraNavigate(state, {
    type: "navigateRequested",
    position: state.bootTarget,
    mode: "fly",
    preserveTracking: true,
    durationMs: state.bootFlyDurationMs,
  });

  return {
    state: {
      ...navigate.state,
      boot: "done",
      tracking: "on",
      follow: state.bootFollow,
      lastAppliedGpsKey: state.bootPositionKey,
      bootFollow: null,
      bootPositionKey: null,
    },
    effects: navigate.effects,
  };
}

function reduceMapCameraNavigate(
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

function reduceGestureSettleResolved(
  state: MapCameraState,
  outcome: GestureSettleOutcome,
): MapCameraMachineResult {
  if (outcome.kind === "releaseTracking") {
    return {
      state: {
        ...withTrackingOff(state),
        anchor: outcome.position,
        session: "idle",
        followThresholdExceeded: true,
      },
      effects: [{ type: "releaseTracking" }],
    };
  }

  if (outcome.kind === "commitAnchor") {
    return {
      state: {
        ...state,
        anchor: outcome.position,
        session: "idle",
      },
      effects: [],
    };
  }

  const anchor = mergeMapAnchorPosition(state.anchor, outcome.target);

  return {
    state: {
      ...state,
      anchor,
      session: "flying",
    },
    effects: buildNavigateEffects(
      state,
      outcome.target,
      "fly",
      state.flyDurationMs,
    ),
  };
}

function reduceMapMoveEnd(
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

function reduceMapIdle(
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

function reducePaddingMeasured(
  state: MapCameraState,
  event: Extract<MapCameraMachineEvent, { type: "paddingMeasured" }>,
): MapCameraMachineResult {
  const nextState: MapCameraState = {
    ...state,
    padding: {
      phase: "ready",
      options: event.options,
      suppressNextMoveEnd: event.changed
        ? true
        : state.padding.suppressNextMoveEnd,
    },
  };

  const effects: MapCameraMachineEffect[] = [];

  if (event.changed) {
    effects.push({
      type: "applyPadding",
      options: event.options,
      realign:
        !isSheetMotionIdle(state.sheetPhase) && state.session !== "userGesture",
    });
  }

  const bootResult = tryIssueBootFly(nextState);
  if (bootResult) {
    return {
      state: bootResult.state,
      effects: [...effects, ...bootResult.effects],
    };
  }

  return { state: nextState, effects };
}

/** Unified map camera session, tracking, boot, and padding orchestration. */
export function reduceMapCameraMachine(
  state: MapCameraState,
  event: MapCameraMachineEvent,
): MapCameraMachineResult {
  switch (event.type) {
    case "mapStyleReady": {
      if (state.anchor !== null) {
        return { state, effects: [] };
      }

      return {
        state: { ...state, anchor: event.position },
        effects: [],
      };
    }

    case "mapGestureBegan": {
      return {
        state: {
          ...state,
          session: "userGesture",
          followThresholdExceeded: false,
        },
        effects: [],
      };
    }

    case "mapFollowThresholdExceeded": {
      if (state.followThresholdExceeded) {
        return { state, effects: [] };
      }

      return {
        state: {
          ...withTrackingOff(state),
          followThresholdExceeded: true,
        },
        effects: [{ type: "releaseTracking" }],
      };
    }

    case "gestureSettleResolved": {
      return reduceGestureSettleResolved(state, event.outcome);
    }

    case "mapMoveEnd": {
      return reduceMapMoveEnd(state, event);
    }

    case "mapIdle": {
      return reduceMapIdle(state, event);
    }

    case "navigateRequested": {
      return reduceMapCameraNavigate(state, event);
    }

    case "startTracking": {
      return {
        state: {
          ...state,
          tracking: "on",
          follow: event.follow,
          followThresholdExceeded: false,
        },
        effects: [],
      };
    }

    case "stopTracking": {
      return {
        state: withTrackingOff(state),
        effects: [{ type: "releaseTracking" }],
      };
    }

    case "recenterRequested": {
      const withTracking = reduceMapCameraMachine(state, {
        type: "startTracking",
        follow: event.follow,
      });

      return reduceMapCameraNavigate(withTracking.state, {
        type: "navigateRequested",
        position: event.position,
        mode: "fly",
        preserveTracking: true,
      });
    }

    case "gpsFix": {
      if (
        state.tracking !== "on" ||
        state.session !== "idle" ||
        state.lastAppliedGpsKey === event.positionKey
      ) {
        return { state, effects: [] };
      }

      const navigate = reduceMapCameraNavigate(state, {
        type: "navigateRequested",
        position: event.position,
        mode: "jump",
        preserveTracking: true,
      });

      return {
        state: {
          ...navigate.state,
          lastAppliedGpsKey: event.positionKey,
        },
        effects: navigate.effects,
      };
    }

    case "bootTargetReady": {
      if (state.boot === "done") {
        return { state, effects: [] };
      }

      const nextState: MapCameraState = {
        ...state,
        boot: "pending",
        bootTarget: event.position,
        bootFollow: event.follow,
        bootPositionKey: event.positionKey,
      };

      const bootResult = tryIssueBootFly(nextState);
      if (bootResult) {
        return bootResult;
      }

      return { state: nextState, effects: [] };
    }

    case "sheetPhaseChanged": {
      return {
        state: { ...state, sheetPhase: event.phase },
        effects: [],
      };
    }

    case "paddingMeasured": {
      return reducePaddingMeasured(state, event);
    }

    case "paddingSuppressDrained": {
      if (!state.padding.suppressNextMoveEnd) {
        return { state, effects: [] };
      }

      return {
        state: {
          ...state,
          padding: {
            ...state.padding,
            suppressNextMoveEnd: false,
          },
        },
        effects: [],
      };
    }

    case "mapInstanceReleased": {
      const reset = createInitialMapCameraMachineState({
        enabled: state.enabled,
        sheetPhase: state.sheetPhase,
        flyDurationMs: state.flyDurationMs,
        bootFlyDurationMs: state.bootFlyDurationMs,
        paddingFromCanvasEnabled: state.paddingFromCanvasEnabled,
      });

      return {
        state: {
          ...reset,
          mapGeneration: state.mapGeneration + 1,
        },
        effects: [],
      };
    }

    default: {
      return { state, effects: [] };
    }
  }
}
