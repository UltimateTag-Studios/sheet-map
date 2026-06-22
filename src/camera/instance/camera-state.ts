import type { Map as MapboxMap } from "mapbox-gl";

import { clearMapPaddingSyncState } from "../padding/sync";

const bootFlownByMap = new WeakMap<MapboxMap, boolean>();

/** Drop per-map camera latches when the map instance is released (unmount / swap). */
export function releaseMapInstanceCameraState(map: MapboxMap): void {
  clearMapPaddingSyncState(map);
  bootFlownByMap.delete(map);
}

export function hasBootFlownForMapInstance(map: MapboxMap): boolean {
  return bootFlownByMap.get(map) === true;
}

export function markBootFlownForMapInstance(map: MapboxMap): void {
  bootFlownByMap.set(map, true);
}
