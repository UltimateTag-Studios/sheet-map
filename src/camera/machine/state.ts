import type { SheetMotionPhase } from "../../viewport";
import type { PixelPoint } from "../../viewport/types/pixel";
import type { MapPaddingOptions } from "../padding/compute";
import type { MapPosition } from "../shared/map-position";

export type MapCameraSession = "idle" | "userGesture" | "flying";

export type MapCameraBootPhase = "none" | "pending" | "done";

export type MapCameraPaddingPhase = "pending" | "ready";

export type MapCameraTrackingPhase = "off" | "on";

export type MapCameraFollowConfig = {
  userLocation: { lat: number; lng: number };
  centerOffset: PixelPoint;
  thresholdPx: number;
};

export type MapCameraState = {
  /** Bumps on map instance release — replaces WeakMap latches. */
  mapGeneration: number;
  enabled: boolean;
  session: MapCameraSession;
  anchor: MapPosition | null;
  tracking: MapCameraTrackingPhase;
  follow: MapCameraFollowConfig | null;
  followThresholdExceeded: boolean;
  boot: MapCameraBootPhase;
  bootTarget: MapPosition | null;
  padding: {
    phase: MapCameraPaddingPhase;
    options: MapPaddingOptions | null;
    suppressNextMoveEnd: boolean;
  };
  sheetPhase: SheetMotionPhase;
  lastAppliedGpsKey: string | null;
  /** Default duration for programmatic fly moves. */
  flyDurationMs: number;
};

export type CreateMapCameraMachineStateInput = {
  enabled?: boolean;
  sheetPhase?: SheetMotionPhase;
  tracking?: boolean;
  follow?: MapCameraFollowConfig | null;
  flyDurationMs?: number;
};

export function createInitialMapCameraMachineState(
  input: CreateMapCameraMachineStateInput = {},
): MapCameraState {
  const tracking = input.tracking ?? false;

  return {
    mapGeneration: 0,
    enabled: input.enabled ?? true,
    session: "idle",
    anchor: null,
    tracking: tracking ? "on" : "off",
    follow: tracking ? (input.follow ?? null) : null,
    followThresholdExceeded: false,
    boot: "none",
    bootTarget: null,
    padding: {
      phase: "pending",
      options: null,
      suppressNextMoveEnd: false,
    },
    sheetPhase: input.sheetPhase ?? "idle",
    lastAppliedGpsKey: null,
    flyDurationMs: input.flyDurationMs ?? 600,
  };
}

export function isSheetMotionIdle(phase: SheetMotionPhase): boolean {
  return phase === "idle";
}
