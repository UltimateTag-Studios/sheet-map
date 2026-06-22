import type { Map as MapboxMap } from "mapbox-gl";

import { clearMapPaddingSyncState } from "../padding/sync";

const bootIssuedByMap = new WeakMap<MapboxMap, boolean>();

type FollowMapLatch = {
  autoStarted: boolean;
  released: boolean;
};

const followLatchByMap = new WeakMap<MapboxMap, FollowMapLatch>();

function followLatch(map: MapboxMap): FollowMapLatch {
  let latch = followLatchByMap.get(map);
  if (!latch) {
    latch = { autoStarted: false, released: false };
    followLatchByMap.set(map, latch);
  }
  return latch;
}

/** Drop per-map camera latches when the map instance is released (unmount / swap). */
export function releaseMapInstanceCameraState(map: MapboxMap): void {
  clearMapPaddingSyncState(map);
  bootIssuedByMap.delete(map);
  followLatchByMap.delete(map);
}

export function hasBootIssuedForMapInstance(map: MapboxMap): boolean {
  return bootIssuedByMap.get(map) === true;
}

export function markBootIssuedForMapInstance(map: MapboxMap): void {
  bootIssuedByMap.set(map, true);
}

/** User or app released follow on this map (demo fly, pan threshold, etc.). */
export function hasFollowReleasedForMapInstance(map: MapboxMap): boolean {
  return followLatch(map).released;
}

export function markFollowReleasedForMapInstance(map: MapboxMap): void {
  followLatch(map).released = true;
}

export function clearFollowReleasedForMapInstance(map: MapboxMap): void {
  followLatch(map).released = false;
}

/** Auto-follow was enabled for this map (survives Strict Mode remount; cleared on release). */
export function hasFollowAutoStartedForMapInstance(map: MapboxMap): boolean {
  return followLatch(map).autoStarted;
}

export function markFollowAutoStartedForMapInstance(map: MapboxMap): void {
  followLatch(map).autoStarted = true;
}
