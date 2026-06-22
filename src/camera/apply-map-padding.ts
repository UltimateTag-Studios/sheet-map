import type { MapRef } from "react-map-gl/mapbox";

import { applyMapAnchorCamera } from "./anchor/apply-map-anchor-camera";
import type { MapAnchorState } from "./anchor/state";
import { mergeMapAnchorPosition } from "./map-position";

export type ApplyMapPaddingInput = {
  mapRef: MapRef;
  state: MapAnchorState;
  paddingChanged: boolean;
  /** When false, only sync padding — no camera realign. Used before programmatic navigateTo. */
  realign?: boolean;
  /** When false during navigating, skip jump — sheet geometry is stable (no drag/settle). */
  sheetMotionActive?: boolean;
  debug?: boolean;
};

/**
 * Optional camera realign after Mapbox padding changed.
 * Phase 4D: navigating session only. Full matrix lands in 4E.
 */
export function applyMapPadding({
  mapRef,
  state,
  paddingChanged,
  realign = true,
  sheetMotionActive = false,
  debug = false,
}: ApplyMapPaddingInput): void {
  if (!paddingChanged || !realign) {
    return;
  }

  if (state.session === "navigating" && state.navigationIntent !== null) {
    if (!sheetMotionActive) {
      return;
    }

    const target = mergeMapAnchorPosition(
      state.anchor,
      state.navigationIntent.target,
    );
    if (debug) {
      console.info("[map-padding] realign during navigation", { target });
    }
    applyMapAnchorCamera(mapRef, target, { duration: 0 });
  }
}
