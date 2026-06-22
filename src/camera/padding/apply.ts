import type { MapRef } from "react-map-gl/mapbox";

import type { MapAnchorState } from "../anchor";
import { repositionCamera } from "../movement";
import {
  type MapPosition,
  mergeMapAnchorPosition,
} from "../shared/map-position";

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
  /** Keeps stored anchor in sync when padding triggers an instant realign. */
  onRealignAnchor?: (position: MapPosition) => void;
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
  onRealignAnchor,
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
    repositionCamera({
      mapRef,
      position: target,
      currentAnchor: state.anchor,
      updateAnchor: onRealignAnchor,
    });
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
    repositionCamera({
      mapRef,
      position: followTarget,
      currentAnchor: state.anchor,
      updateAnchor: onRealignAnchor,
    });
  }

  // idle + follow off: none (Mapbox keeps center stable).
}
