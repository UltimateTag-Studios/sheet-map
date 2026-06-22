import type { MapRef } from "react-map-gl/mapbox";

/**
 * `MapCanvas` publishes `mapRef` only from `onLoad` (style ready).
 * Callers must not gate navigation on `map.isStyleLoaded()` — it flickers during tile loads.
 */
export function canNavigateMap(mapRef: MapRef | null): mapRef is MapRef {
  return mapRef !== null;
}
