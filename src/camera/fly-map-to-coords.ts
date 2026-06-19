import type { MapRef } from "react-map-gl/mapbox";

import type { PixelPoint } from "../canvas/viewport/map-viewport";
import { isProgrammaticCameraMove } from "./map-programmatic-camera";

export type FlyMapToCoordsOptions = {
  coords: { lng: number; lat: number };
  centerOffset: PixelPoint;
  durationMs?: number;
  zoom?: number;
};

export function flyMapToCoords(
  mapRef: MapRef,
  options: FlyMapToCoordsOptions,
): void {
  const { coords, centerOffset, durationMs = 600, zoom } = options;

  isProgrammaticCameraMove.current = true;

  mapRef.getMap().flyTo({
    center: [coords.lng, coords.lat],
    ...(zoom !== undefined ? { zoom } : {}),
    duration: durationMs,
    offset: [centerOffset.x, centerOffset.y],
  });
}
