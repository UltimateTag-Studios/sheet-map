import { describe, expect, it } from "vitest";

import { markerImageId } from "./marker-image";

describe("markerImageId", () => {
  it("builds a stable id for single-color markers", () => {
    expect(markerImageId("#FF00AA")).toBe("map-marker-ff00aa");
  });

  it("builds a stable id for dual-color markers", () => {
    expect(markerImageId("#FF00AA", "#0011BB")).toBe(
      "map-marker-ff00aa-0011bb",
    );
  });

  it("suffixes focused variants", () => {
    expect(markerImageId("#FF00AA", undefined, { focused: true })).toBe(
      "map-marker-ff00aa-focused",
    );
  });
});
