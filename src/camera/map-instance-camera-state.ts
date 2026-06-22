import type { Map as MapboxMap } from "mapbox-gl";

import { clearMapPaddingSyncState } from "./sync-map-padding";

/** Drop per-map padding sync state when the map instance is released (unmount / swap). */
export function releaseMapInstanceCameraState(map: MapboxMap): void {
  clearMapPaddingSyncState(map);
}
