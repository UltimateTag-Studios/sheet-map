import type { Map as MapboxMap } from "mapbox-gl";

import type { MapPosition } from "../map-position";

const CENTER_EPSILON = 1e-5;
const ZOOM_EPSILON = 0.01;

/** Whether the live map center (and zoom when set on target) matches the anchor. */
export function isAtMapAnchorPosition(
  map: MapboxMap,
  target: MapPosition,
): boolean {
  const center = map.getCenter();
  const centerMatches =
    Math.abs(center.lat - target.lat) <= CENTER_EPSILON &&
    Math.abs(center.lng - target.lng) <= CENTER_EPSILON;

  if (!centerMatches) {
    return false;
  }

  if (target.zoom === undefined) {
    return true;
  }

  return Math.abs(map.getZoom() - target.zoom) <= ZOOM_EPSILON;
}
