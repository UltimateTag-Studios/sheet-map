import type { MapViewportSyncState } from "../types";

export function areMapViewportsEqual(
  a: MapViewportSyncState,
  b: MapViewportSyncState,
): boolean {
  if (
    a.hasMinimumArea !== b.hasMinimumArea ||
    a.centerOffset.x !== b.centerOffset.x ||
    a.centerOffset.y !== b.centerOffset.y
  ) {
    return false;
  }

  const rectA = a.clientRect;
  const rectB = b.clientRect;
  if (rectA === null && rectB === null) {
    return true;
  }
  if (rectA === null || rectB === null) {
    return false;
  }

  return (
    rectA.x === rectB.x &&
    rectA.y === rectB.y &&
    rectA.width === rectB.width &&
    rectA.height === rectB.height
  );
}
