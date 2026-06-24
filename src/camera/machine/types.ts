import type { SheetMotionPhase } from "../../viewport";
import type { GestureSettleOutcome } from "../lib/evaluate-gesture-settle";
import type { MapPaddingOptions } from "../padding/compute";
import type { MapPosition } from "../shared/map-position";
import type { MapCameraState } from "./state";

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
