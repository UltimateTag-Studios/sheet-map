import type { Map as MapboxMap } from "mapbox-gl";

import type { MapPosition } from "../map-position";

const CENTER_EPSILON = 1e-5;
const ZOOM_EPSILON = 0.01;

/** Whether the live map camera matches a target anchor within tolerance. */
export function isAtMapAnchorPosition(
  map: MapboxMap,
  target: MapPosition,
): boolean {
  const center = map.getCenter();
  const zoom = map.getZoom();

  return (
    Math.abs(center.lat - target.lat) <= CENTER_EPSILON &&
    Math.abs(center.lng - target.lng) <= CENTER_EPSILON &&
    Math.abs(zoom - target.zoom) <= ZOOM_EPSILON
  );
}
