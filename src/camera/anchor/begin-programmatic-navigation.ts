import type { Map as MapboxMap } from "mapbox-gl";

import { stopMapMotion } from "./stop-map-motion";

/** Stop inertial pan/zoom and sync Mapbox padding from live sheet DOM before fly/jump. */
export function beginProgrammaticNavigation(
  map: MapboxMap,
  syncMapPaddingBeforeNavigation?: () => void,
): void {
  stopMapMotion(map);
  syncMapPaddingBeforeNavigation?.();
}
