import type { NavigateToMapCameraOptions } from "../camera";
import type { MapPosition } from "../camera/shared/map-position";
import type { SheetMotionPhase } from "../viewport";
import type { MapShellMachineEffect } from "./map-shell-machine/types";

export type MapShellUserTrackingEffectTarget = {
  recenterOnUser: (options?: { zoom?: number }) => void;
  navigateTo: (
    position: MapPosition,
    options?: NavigateToMapCameraOptions,
  ) => boolean;
  dispatch: (event: {
    type: "sheetPhaseChanged";
    phase: SheetMotionPhase;
  }) => void;
  navigateRequested: (event: {
    type: "navigateRequested";
    position: MapPosition;
    mode: "fly" | "jump";
    preserveTracking: boolean;
    durationMs?: number;
  }) => void;
};

export type MapShellEffectRunnerDeps = {
  userTracking: MapShellUserTrackingEffectTarget | undefined;
  smoothFlyDurationMs: number;
  debug?: boolean;
};

export function runMapShellMachineEffect(
  effect: MapShellMachineEffect,
  deps: MapShellEffectRunnerDeps,
): void {
  const { userTracking } = deps;

  if (!userTracking) {
    if (deps.debug) {
      console.warn(
        "[map-shell] effect dropped — userTracking unavailable",
        effect,
      );
    }
    return;
  }

  switch (effect.type) {
    case "flyToItem": {
      userTracking.navigateRequested({
        type: "navigateRequested",
        position: {
          lat: effect.location.lat,
          lng: effect.location.lng,
          ...(effect.zoom !== undefined ? { zoom: effect.zoom } : {}),
        },
        mode: effect.mode,
        preserveTracking: false,
        durationMs:
          effect.mode === "fly" ? deps.smoothFlyDurationMs : undefined,
      });
      break;
    }
    case "flyToUser":
      userTracking.recenterOnUser(
        effect.zoom !== undefined ? { zoom: effect.zoom } : undefined,
      );
      break;
    case "flyToPosition":
      userTracking.navigateTo(effect.position, {
        duration: effect.duration,
        preserveTracking: effect.preserveTracking,
      });
      break;
    case "syncCameraSheetPhase":
      userTracking.dispatch({
        type: "sheetPhaseChanged",
        phase: effect.phase,
      });
      break;
  }
}
