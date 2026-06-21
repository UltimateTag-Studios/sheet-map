import type { MapRef } from "react-map-gl/mapbox";

import type { MapPosition } from "../map-position";

export type FlyToMapAnchorOptions = {
  duration?: number;
};

/** Fly the map to a stored anchor using current padding (not offset). */
export function flyToMapAnchor(
  mapRef: MapRef,
  position: MapPosition,
  options: FlyToMapAnchorOptions = {},
): void {
  const map = mapRef.getMap();

  map.flyTo({
    center: [position.lng, position.lat],
    zoom: position.zoom,
    padding: map.getPadding(),
    duration: options.duration ?? 1000,
  });
}

/** Instantly land on a stored anchor using current padding (not offset). */
export function jumpToMapAnchor(mapRef: MapRef, position: MapPosition): void {
  const map = mapRef.getMap();

  map.jumpTo({
    center: [position.lng, position.lat],
    zoom: position.zoom,
    padding: map.getPadding(),
  });
}
