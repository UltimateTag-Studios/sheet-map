import { describe, expect, it, vi } from "vitest";

import { pressSelectableMapFeature } from "./press-selectable-map-feature";

describe("pressSelectableMapFeature", () => {
  it("focuses a point with location when the feature is selectable", () => {
    const focusPoint = vi.fn();

    pressSelectableMapFeature(
      "abc",
      [{ id: "abc", location: { lng: 1, lat: 2 } }],
      focusPoint,
    );

    expect(focusPoint).toHaveBeenCalledWith("abc", true);
  });

  it("focuses without location when the point has no coordinates", () => {
    const focusPoint = vi.fn();

    pressSelectableMapFeature("abc", [{ id: "abc" }], focusPoint);

    expect(focusPoint).toHaveBeenCalledWith("abc", false);
  });
});
