import { describe, expect, it } from "vitest";

import {
  USER_LOCATION_FOLLOW_THRESHOLD_PX,
  userLocationCenterDistancePx,
} from "./map-user-location-follow";

describe("USER_LOCATION_FOLLOW_THRESHOLD_PX", () => {
  it("uses a 40px snap-back radius", () => {
    expect(USER_LOCATION_FOLLOW_THRESHOLD_PX).toBe(40);
  });
});

describe("userLocationCenterDistancePx", () => {
  it("returns zero when marker is at the visible-area center", () => {
    const distance = userLocationCenterDistancePx(
      () => ({ x: 220, y: 320 }),
      { width: 400, height: 800 },
      { x: 20, y: -80 },
      { lng: 1, lat: 2 },
    );

    expect(distance).toBe(0);
  });

  it("returns distance when marker is offset from center", () => {
    const distance = userLocationCenterDistancePx(
      () => ({ x: 250, y: 320 }),
      { width: 400, height: 800 },
      { x: 20, y: -80 },
      { lng: 1, lat: 2 },
    );

    expect(distance).toBe(30);
  });
});
