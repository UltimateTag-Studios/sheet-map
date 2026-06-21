import { describe, expect, it } from "vitest";

import { isAtMapAnchorPosition } from "./is-at-map-anchor-position";

describe("isAtMapAnchorPosition", () => {
  it("returns true when center and zoom match within tolerance", () => {
    const map = {
      getCenter: () => ({ lat: 1.000001, lng: 2.000001 }),
      getZoom: () => 14.999,
    };

    expect(
      isAtMapAnchorPosition(map as never, { lat: 1, lng: 2, zoom: 15 }),
    ).toBe(true);
  });

  it("returns false when center or zoom differs beyond tolerance", () => {
    const map = {
      getCenter: () => ({ lat: 1, lng: 2 }),
      getZoom: () => 12,
    };

    expect(
      isAtMapAnchorPosition(map as never, { lat: 1, lng: 2, zoom: 15 }),
    ).toBe(false);
  });
});
