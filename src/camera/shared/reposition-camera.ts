import type { MapRef } from "react-map-gl/mapbox";

import { jumpToMapAnchor } from "../anchor";
import { type MapPosition, mergeMapAnchorPosition } from "./map-position";

/** Instant camera move without entering the navigating session (e.g. GPS ticks). */
export function repositionCamera(
  mapRef: MapRef,
  position: MapPosition,
  currentAnchor: MapPosition | null,
  setAnchor: (position: MapPosition) => void,
): boolean {
  const map = mapRef.getMap();
  if (!map.isStyleLoaded()) {
    return false;
  }

  const anchorPosition = mergeMapAnchorPosition(currentAnchor, position);
  setAnchor(anchorPosition);
  jumpToMapAnchor(mapRef, position);
  return true;
}
