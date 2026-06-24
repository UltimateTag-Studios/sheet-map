import { tryIssueBootFly } from "./boot/try-issue-boot-fly";
import { reduceGestureSettleResolved } from "./gesture/reduce";
import { withTrackingOff } from "./helpers/session";
import { reduceMapIdle, reduceMapMoveEnd } from "./move-end/reduce";
import { reduceMapCameraNavigate } from "./navigate/reduce";
import { reducePaddingMeasured } from "./padding/reduce";
import {
  createInitialMapCameraMachineState,
  type MapCameraState,
} from "./state";
import type { MapCameraMachineEvent, MapCameraMachineResult } from "./types";

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
      const withTracking: MapCameraMachineResult = {
        state: {
          ...state,
          tracking: "on",
          follow: event.follow,
          followThresholdExceeded: false,
        },
        effects: [],
      };

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
