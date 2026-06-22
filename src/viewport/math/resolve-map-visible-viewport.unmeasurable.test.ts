import { describe, expect, it } from "vitest";

import { mockCanvas, stubViewport } from "../testing/fixtures";
import { resolveMapVisibleViewport } from "./resolve-map-visible-viewport";

describe("resolveMapVisibleViewport unmeasurable", () => {
  it("returns null when the canvas has zero size", () => {
    stubViewport();
    const canvas = mockCanvas({ clientWidth: 0, clientHeight: 0 });

    expect(resolveMapVisibleViewport(canvas)).toBeNull();
  });

  it("returns null when no sheet slide is in the DOM", () => {
    stubViewport();
    const canvas = mockCanvas();

    expect(resolveMapVisibleViewport(canvas)).toBeNull();
  });
});
