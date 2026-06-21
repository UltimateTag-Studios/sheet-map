import type { MapRef } from "react-map-gl/mapbox";

import type { MapViewportSyncState } from "../viewport";
import type { MapPosition } from "./map-position";
import { readVisibleMapCenterLngLat } from "./read-visible-map-center-lng-lat";

/** Geographic center and zoom after a user pan/zoom gesture. */
export function sampleVisibleMapPosition(
  mapRef: MapRef,
  viewport: MapViewportSyncState,
): MapPosition {
  const map = mapRef.getMap();
  const canvas = map.getCanvas();
  const canvasRect = canvas.getBoundingClientRect();
  const center = readVisibleMapCenterLngLat(
    { width: canvas.clientWidth, height: canvas.clientHeight },
    viewport.centerOffset,
    viewport.clientRect,
    (point) => map.unproject(point),
    { canvasOrigin: { x: canvasRect.left, y: canvasRect.top } },
  );

  return {
    lat: center.lat,
    lng: center.lng,
    zoom: map.getZoom(),
  };
}
