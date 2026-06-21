import { describe, expect, it } from "vitest";

import type { MapViewportSyncState } from "../types";
import { areMapViewportsEqual } from "./are-map-viewports-equal";

describe("areMapViewportsEqual", () => {
  const viewport: MapViewportSyncState = {
    clientRect: { x: 0, y: 0, width: 400, height: 648 },
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

  it("detects client rect changes", () => {
    expect(
      areMapViewportsEqual(viewport, {
        ...viewport,
        clientRect: { x: 0, y: 0, width: 400, height: 600 },
      }),
    ).toBe(false);
  });
});
