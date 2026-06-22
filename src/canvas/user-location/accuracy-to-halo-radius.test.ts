import { describe, expect, it } from "vitest";

import {
  accuracyMetersToHaloRadiusPx,
  MAP_USER_LOCATION_MIN_HALO_RADIUS_PX,
  mapMetersPerPixel,
} from "./accuracy-to-halo-radius";

describe("mapMetersPerPixel", () => {
  it("returns smaller meters per pixel at higher zoom", () => {
    const lowZoom = mapMetersPerPixel(37, 10);
    const highZoom = mapMetersPerPixel(37, 16);
    expect(highZoom).toBeLessThan(lowZoom);
  });
});

describe("accuracyMetersToHaloRadiusPx", () => {
  it("uses GPS accuracy at the current zoom", () => {
    const latitude = 37;
    const zoom = 14;
    const accuracyMeters = 100;
    const radiusPx = accuracyMetersToHaloRadiusPx(
      accuracyMeters,
      latitude,
      zoom,
    );

    expect(radiusPx).toBeCloseTo(
      accuracyMeters / mapMetersPerPixel(latitude, zoom),
      5,
    );
  });

  it("falls back to the minimum halo when accuracy is unknown", () => {
    expect(accuracyMetersToHaloRadiusPx(undefined, 37, 14)).toBe(
      MAP_USER_LOCATION_MIN_HALO_RADIUS_PX,
    );
  });
});
