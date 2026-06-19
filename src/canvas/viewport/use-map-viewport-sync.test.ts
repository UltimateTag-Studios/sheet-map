import { describe, expect, it } from "vitest";

import type { MapViewportSyncState } from "./use-map-viewport-sync";

function areMapViewportsEqual(
  a: MapViewportSyncState,
  b: MapViewportSyncState,
): boolean {
  if (a.hasVisibleArea !== b.hasVisibleArea) {
    return false;
  }

  if (a.centerOffset.x !== b.centerOffset.x) {
    return false;
  }
  if (a.centerOffset.y !== b.centerOffset.y) {
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

describe("areMapViewportsEqual", () => {
  const viewport: MapViewportSyncState = {
    clientRect: { x: 0, y: 0, width: 400, height: 600 },
    centerOffset: { x: 0, y: -76 },
    hasVisibleArea: true,
  };

  it("treats identical viewports as equal", () => {
    expect(areMapViewportsEqual(viewport, { ...viewport })).toBe(true);
  });

  it("detects center offset changes", () => {
    expect(
      areMapViewportsEqual(viewport, {
        ...viewport,
        centerOffset: { x: 0, y: -80 },
      }),
    ).toBe(false);
  });

  it("detects visible area changes", () => {
    expect(
      areMapViewportsEqual(viewport, {
        ...viewport,
        hasVisibleArea: false,
        clientRect: null,
      }),
    ).toBe(false);
  });
});
