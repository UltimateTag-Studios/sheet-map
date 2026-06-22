import { describe, expect, it } from "vitest";

import { userLocationCenterDistancePx } from "./user-location-follow-distance";

describe("userLocationCenterDistancePx", () => {
  it("returns zero when the user location projects to the padded center", () => {
    const distance = userLocationCenterDistancePx(
      () => ({ x: 220, y: 320 }),
      { width: 400, height: 800 },
      { x: 20, y: -80 },
      { lng: 1, lat: 2 },
    );

    expect(distance).toBe(0);
  });

  it("returns euclidean distance in screen pixels", () => {
    const distance = userLocationCenterDistancePx(
      () => ({ x: 270, y: 320 }),
      { width: 400, height: 800 },
      { x: 20, y: -80 },
      { lng: 1, lat: 2 },
    );

    expect(distance).toBe(50);
  });
});
