import { describe, expect, it } from "vitest";

import {
  mockCanvas,
  noExtraInsets,
  snapHeights700,
  stubViewport,
} from "../testing/fixtures";
import { resolveMapVisibleViewport } from "./resolve-map-visible-viewport";

describe("resolveMapVisibleViewport fixed chrome", () => {
  it("applies fixed chrome insets to the visible rect", () => {
    stubViewport();

    const canvas = mockCanvas();

    const withoutTabBar = resolveMapVisibleViewport(
      canvas,
      "collapsed",
      snapHeights700,
    );
    const withTabBar = resolveMapVisibleViewport(
      canvas,
      "collapsed",
      snapHeights700,
      {
        top: 0,
        left: 0,
        right: 0,
        bottom: 56,
      },
    );

    expect(withTabBar.clientRect.height).toBe(
      withoutTabBar.clientRect.height - 56,
    );
    expect(withTabBar.centerOffset.y).toBeLessThan(
      withoutTabBar.centerOffset.y,
    );
  });

  it("combines tab-bar canvas inset with fixed chrome reserve", () => {
    stubViewport(400, 800);

    const canvas = mockCanvas({
      rect: { top: 0, bottom: 766, height: 766 },
    });

    const viewportOnly = resolveMapVisibleViewport(
      canvas,
      "collapsed",
      snapHeights700,
      noExtraInsets,
      { useSnapGeometryOnly: true },
    );
    const withChrome = resolveMapVisibleViewport(
      canvas,
      "collapsed",
      snapHeights700,
      { top: 0, left: 0, right: 0, bottom: 56 },
      { useSnapGeometryOnly: true },
    );

    expect(viewportOnly.clientRect.height).toBe(614);
    expect(withChrome.clientRect.height).toBe(558);
  });
});
