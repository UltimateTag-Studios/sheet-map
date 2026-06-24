import type { RefObject } from "react";

import type { MapCameraState } from "../machine/state";
import type { MapCameraMachineEffect } from "../machine/types";
import { moveCameraProgrammatic } from "../movement";
import { setMapPaddingIfChanged } from "../padding/sync";
import { canNavigateMap } from "../shared/can-navigate-map";
import type { UseMapCameraOptions } from "./types";

export type MapCameraEffectRunnerDeps = {
  mapRef: UseMapCameraOptions["mapRef"];
  machineStateRef: RefObject<RefObject<MapCameraState> | null>;
  mapPaddingDebug: boolean;
  onReleaseTrackingRef: RefObject<(() => void) | undefined>;
};

export function runMapCameraMachineEffect(
  effect: MapCameraMachineEffect,
  deps: MapCameraEffectRunnerDeps,
): void {
  const stateRef = deps.machineStateRef.current;
  if (!deps.mapRef || !stateRef) {
    return;
  }

  const state = stateRef.current;

  switch (effect.type) {
    case "moveCamera": {
      if (!canNavigateMap(deps.mapRef)) {
        return;
      }

      moveCameraProgrammatic({
        mapRef: deps.mapRef,
        position: effect.position,
        duration: effect.duration,
        currentAnchor: state.anchor,
      });
      break;
    }

    case "applyPadding": {
      const map = deps.mapRef.getMap();
      setMapPaddingIfChanged(map, effect.options);

      if (effect.realign && state.anchor && state.session !== "userGesture") {
        moveCameraProgrammatic({
          mapRef: deps.mapRef,
          position: state.anchor,
          duration: 0,
          stopUserMotion: false,
          currentAnchor: state.anchor,
        });
      }

      if (deps.mapPaddingDebug) {
        console.info("[map-padding] applyPadding", effect);
      }
      break;
    }

    case "releaseTracking": {
      deps.onReleaseTrackingRef.current?.();
      break;
    }
  }
}
