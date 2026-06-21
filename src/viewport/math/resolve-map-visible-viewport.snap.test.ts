import { describe, expect, it, vi } from "vitest";

import {
  mockCanvas,
  noExtraInsets,
  snapHeights700,
  snapHeights800,
  stubViewport,
} from "../testing/fixtures";
import { resolveMapVisibleViewport } from "./resolve-map-visible-viewport";

describe("resolveMapVisibleViewport snap geometry", () => {
  it("uses a larger center offset at half than collapsed", () => {
    stubViewport();

    const collapsed = resolveMapVisibleViewport(
      mockCanvas(),
      "collapsed",
      snapHeights700,
      noExtraInsets,
      { useSnapGeometryOnly: true },
    );
    const half = resolveMapVisibleViewport(
      mockCanvas(),
      "half",
      snapHeights700,
      noExtraInsets,
      { useSnapGeometryOnly: true },
    );

    expect(half.centerOffset.y).toBeLessThan(collapsed.centerOffset.y);
  });

  it("offsets flyTo center toward the visible-map center above a bottom sheet", () => {
    stubViewport();

    expect(
      resolveMapVisibleViewport(mockCanvas(), "collapsed", snapHeights700),
    ).toEqual({
      clientRect: { x: 0, y: 0, width: 400, height: 648 },
      centerOffset: { x: 0, y: -76 },
      hasVisibleArea: true,
    });
  });

  it("skips camera focus when the sheet covers the map", () => {
    stubViewport();

    expect(
      resolveMapVisibleViewport(mockCanvas(), "full", snapHeights800),
    ).toEqual({
      clientRect: { x: 0, y: 0, width: 400, height: 0 },
      centerOffset: { x: 0, y: -400 },
      hasVisibleArea: false,
    });
  });

  it("falls back to window size when visualViewport height is zero", () => {
    vi.stubGlobal("visualViewport", {
      offsetTop: 0,
      offsetLeft: 0,
      height: 0,
      width: 0,
    });
    Object.defineProperty(window, "innerWidth", {
      value: 400,
      configurable: true,
    });
    Object.defineProperty(window, "innerHeight", {
      value: 800,
      configurable: true,
    });

    expect(
      resolveMapVisibleViewport(mockCanvas(), "collapsed", snapHeights700),
    ).toEqual({
      clientRect: { x: 0, y: 0, width: 400, height: 648 },
      centerOffset: { x: 0, y: -76 },
      hasVisibleArea: true,
    });
  });
});
