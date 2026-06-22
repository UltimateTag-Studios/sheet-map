import type { Map as MapboxMap } from "mapbox-gl";

import {
  areMapPaddingOptionsEqual,
  type MapPaddingOptions,
} from "./compute-map-padding";

type PaddingSyncState = {
  synced: MapPaddingOptions;
  pendingMoveEnd: boolean;
};

const paddingSyncByMap = new WeakMap<MapboxMap, PaddingSyncState>();

/** Apply padding when it changed — keyed by map instance (survives Strict Mode effect remounts). */
export function syncMapPadding(
  map: MapboxMap,
  nextPadding: MapPaddingOptions,
): boolean {
  const state = paddingSyncByMap.get(map);
  if (state && areMapPaddingOptionsEqual(state.synced, nextPadding)) {
    return false;
  }

  paddingSyncByMap.set(map, {
    synced: nextPadding,
    pendingMoveEnd: true,
  });
  map.setPadding(nextPadding);
  return true;
}

export function hasSyncedMapPadding(map: MapboxMap): boolean {
  return paddingSyncByMap.has(map);
}

export function readSyncedMapPadding(
  map: MapboxMap,
): MapPaddingOptions | undefined {
  return paddingSyncByMap.get(map)?.synced;
}

/** True when moveend was triggered by our setPadding — camera session must ignore it. */
export function consumePaddingSyncMoveEnd(map: MapboxMap): boolean {
  const state = paddingSyncByMap.get(map);
  if (!state?.pendingMoveEnd) {
    return false;
  }

  paddingSyncByMap.set(map, {
    synced: state.synced,
    pendingMoveEnd: false,
  });
  return true;
}

/** Drop a padding moveend flag left over before camera listeners were attached. */
export function drainPaddingSyncMoveEnd(map: MapboxMap): void {
  const state = paddingSyncByMap.get(map);
  if (!state) {
    return;
  }

  paddingSyncByMap.set(map, {
    synced: state.synced,
    pendingMoveEnd: false,
  });
}

export function clearMapPaddingSyncState(map: MapboxMap): void {
  paddingSyncByMap.delete(map);
}
