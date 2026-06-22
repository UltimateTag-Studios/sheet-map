import type { MapRef } from "react-map-gl/mapbox";

import type { MapAnchorState } from "../anchor";
import { moveCameraProgrammatic } from "../movement";
import type { MapPosition } from "../shared/map-position";

export type ApplyMapPaddingInput = {
  mapRef: MapRef;
  state: MapAnchorState;
  paddingChanged: boolean;
  /** When false, only sync padding — no camera realign. Used before programmatic navigateTo. */
  realign?: boolean;
  /** True while sheet phase is dragging or settling. */
  sheetMotionActive?: boolean;
  /** Keeps stored anchor in sync when padding triggers an instant realign. */
  onRealignAnchor?: (position: MapPosition) => void;
  debug?: boolean;
};

/**
 * Optional camera realign after Mapbox padding changed.
 * Keeps `anchor` centered while the sheet moves.
 */
export function applyMapPadding({
  mapRef,
  state,
  paddingChanged,
  realign = true,
  sheetMotionActive = false,
  onRealignAnchor,
  debug = false,
}: ApplyMapPaddingInput): void {
  if (!paddingChanged || !realign || !sheetMotionActive) {
    return;
  }

  if (state.session === "userGesture") {
    return;
  }

  if (state.anchor === null) {
    return;
  }

  if (debug) {
    console.info("[map-padding] realign to anchor", { anchor: state.anchor });
  }

  moveCameraProgrammatic({
    mapRef,
    position: state.anchor,
    duration: 0,
    stopUserMotion: false,
    currentAnchor: state.anchor,
    updateAnchor: onRealignAnchor,
  });
}
