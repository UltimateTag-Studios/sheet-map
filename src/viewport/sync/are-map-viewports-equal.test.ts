import { describe, expect, it } from "vitest";

import type { MapViewportSyncState } from "../types";
import { areMapViewportsEqual } from "./are-map-viewports-equal";

describe("areMapViewportsEqual", () => {
  const base: MapViewportSyncState = {
    clientRect: { x: 0, y: 0, width: 400, height: 600 },
    centerOffset: { x: 0, y: -100 },
    hasVisibleArea: true,
  };

  it("treats identical viewports as equal", () => {
    expect(areMapViewportsEqual(base, { ...base })).toBe(true);
  });

  it("detects null client rects", () => {
    const empty: MapViewportSyncState = {
      clientRect: null,
      centerOffset: { x: 0, y: 0 },
      hasVisibleArea: false,
    };
    expect(areMapViewportsEqual(empty, { ...empty })).toBe(true);
    expect(areMapViewportsEqual(base, empty)).toBe(false);
  });
});
