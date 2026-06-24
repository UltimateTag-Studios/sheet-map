import type { RefObject } from "react";

import type { NavigateToMapCameraOptions } from "../camera";
import type { MapPosition } from "../camera/shared/map-position";
import type { MapItemLocation } from "../items/types";
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
};

export type MapShellEffectRunnerDeps = {
  flyToItem: (
    location: MapItemLocation,
    options?: { enterFly?: boolean; zoom?: number },
  ) => void;
  userTrackingRef: RefObject<MapShellUserTrackingEffectTarget | undefined>;
};

export function runMapShellMachineEffect(
  effect: MapShellMachineEffect,
  deps: MapShellEffectRunnerDeps,
): void {
  const userTracking = deps.userTrackingRef.current;
  if (!userTracking && effect.type !== "flyToItem") {
    return;
  }

  switch (effect.type) {
    case "flyToItem":
      deps.flyToItem(effect.location, {
        enterFly: effect.enterFly,
        zoom: effect.zoom,
      });
      break;
    case "flyToUser":
      userTracking?.recenterOnUser(
        effect.zoom !== undefined ? { zoom: effect.zoom } : undefined,
      );
      break;
    case "flyToPosition":
      userTracking?.navigateTo(effect.position, {
        duration: effect.duration,
        preserveTracking: effect.preserveTracking,
      });
      break;
    case "syncCameraSheetPhase":
      userTracking?.dispatch({
        type: "sheetPhaseChanged",
        phase: effect.phase,
      });
      break;
  }
}
