import type { MapRef } from "react-map-gl/mapbox";

import type { MapPosition } from "../shared/map-position";

export type ApplyMapAnchorCameraOptions = {
  duration?: number;
};

function buildMapboxCameraOptions(
  map: ReturnType<MapRef["getMap"]>,
  position: MapPosition,
) {
  return {
    center: [position.lng, position.lat] as [number, number],
    padding: map.getPadding(),
    ...(position.zoom !== undefined ? { zoom: position.zoom } : {}),
  };
}

/** Fly the map to a stored anchor using current padding (not offset). */
export function flyToMapAnchor(
  mapRef: MapRef,
  position: MapPosition,
  options: ApplyMapAnchorCameraOptions = {},
): void {
  const map = mapRef.getMap();

  map.flyTo({
    ...buildMapboxCameraOptions(map, position),
    duration: options.duration ?? 600,
  });
}

/** Instantly land on a stored anchor using current padding (not offset). */
export function jumpToMapAnchor(mapRef: MapRef, position: MapPosition): void {
  const map = mapRef.getMap();

  map.jumpTo(buildMapboxCameraOptions(map, position));
}

/** Fly when duration > 0; jump when duration is 0 or omitted. */
export function applyMapAnchorCamera(
  mapRef: MapRef,
  position: MapPosition,
  options: ApplyMapAnchorCameraOptions = {},
): void {
  const duration = options.duration ?? 0;

  if (duration > 0) {
    flyToMapAnchor(mapRef, position, { duration });
    return;
  }

  jumpToMapAnchor(mapRef, position);
}
