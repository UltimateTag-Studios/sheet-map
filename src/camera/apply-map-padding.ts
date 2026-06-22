import type { MapRef } from "react-map-gl/mapbox";

import { applyMapAnchorCamera } from "./anchor/apply-map-anchor-camera";
import type { MapAnchorState } from "./anchor/state";
import { type MapPosition, mergeMapAnchorPosition } from "./map-position";

export type ApplyMapPaddingInput = {
  mapRef: MapRef;
  state: MapAnchorState;
  paddingChanged: boolean;
  /** When false, only sync padding — no camera realign. Used before programmatic navigateTo. */
  realign?: boolean;
  /** True while sheet phase is dragging or settling. */
  sheetMotionActive?: boolean;
  /** Phase 5: jump to user when idle + following. */
  followUser?: boolean;
  followTarget?: MapPosition | null;
  debug?: boolean;
};

/**
 * Optional camera realign after Mapbox padding changed.
 * Matrix: [`camera-fsm-plan.md` §3](../../docs/camera-fsm-plan.md).
 */
export function applyMapPadding({
  mapRef,
  state,
  paddingChanged,
  realign = true,
  sheetMotionActive = false,
  followUser = false,
  followTarget = null,
  debug = false,
}: ApplyMapPaddingInput): void {
  if (!paddingChanged || !realign || !sheetMotionActive) {
    return;
  }

  if (state.session === "navigating" && state.navigationIntent !== null) {
    const target = mergeMapAnchorPosition(
      state.anchor,
      state.navigationIntent.target,
    );
    if (debug) {
      console.info("[map-padding] realign during navigation", { target });
    }
    applyMapAnchorCamera(mapRef, target, { duration: 0 });
    return;
  }

  // userGesture includes pan momentum — setPadding only, never jumpTo.
  if (state.session === "userGesture") {
    return;
  }

  if (state.session === "idle" && followUser && followTarget !== null) {
    if (debug) {
      console.info("[map-padding] realign to follow target", {
        target: followTarget,
      });
    }
    applyMapAnchorCamera(mapRef, followTarget, { duration: 0 });
  }

  // idle + follow off: none (Mapbox keeps center stable).
}
