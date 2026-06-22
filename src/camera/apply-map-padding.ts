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
}: ApplyMapPaddingInput): void {
  if (!paddingChanged || !realign) {
    return;
  }

  if (state.session === "navigating" && state.navigationIntent !== null) {
    const target = mergeMapAnchorPosition(
      state.anchor,
      state.navigationIntent.target,
    );
    applyMapAnchorCamera(mapRef, target, { duration: 0 });
  }
}
