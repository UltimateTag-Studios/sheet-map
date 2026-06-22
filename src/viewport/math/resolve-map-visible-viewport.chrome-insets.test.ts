import { describe, expect, it } from "vitest";

import { mockCanvas, stubViewport } from "../testing/fixtures";
import { mountSheetHostFixture } from "../testing/mount-sheet-host-fixture";
import { resolveMapVisibleViewport } from "./resolve-map-visible-viewport";

describe("resolveMapVisibleViewport fixed chrome", () => {
  it("applies fixed chrome insets to the visible rect", () => {
    stubViewport();

    const collapsedHeight = 152;
    const { canvas, remove } = mountSheetHostFixture(
      mockCanvas,
      {},
      {
        top: 800 - collapsedHeight,
        bottom: 800,
        height: collapsedHeight,
        y: 800 - collapsedHeight,
      },
    );

    const withoutTabBar = resolveMapVisibleViewport(canvas);
    const withTabBar = resolveMapVisibleViewport(canvas, {
      top: 0,
      left: 0,
      right: 0,
      bottom: 56,
    });

    expect(withoutTabBar).toBeDefined();
    expect(withTabBar).toBeDefined();
    if (!withoutTabBar || !withTabBar) {
      return;
    }

    expect(withTabBar.clientRect.height).toBe(
      withoutTabBar.clientRect.height - 56,
    );
    expect(withTabBar.centerOffset.y).toBeLessThan(
      withoutTabBar.centerOffset.y,
    );

    remove();
  });

  it("combines a shorter canvas with fixed chrome reserve", () => {
    stubViewport(400, 800);

    const canvasBottom = 766;
    const collapsedHeight = 152;
    const { canvas, remove } = mountSheetHostFixture(
      mockCanvas,
      {
        rect: { top: 0, bottom: canvasBottom, height: canvasBottom },
      },
      {
        top: canvasBottom - collapsedHeight,
        bottom: canvasBottom,
        height: collapsedHeight,
        y: canvasBottom - collapsedHeight,
      },
    );

    const viewportOnly = resolveMapVisibleViewport(canvas);
    const withChrome = resolveMapVisibleViewport(canvas, {
      top: 0,
      left: 0,
      right: 0,
      bottom: 56,
    });

    expect(viewportOnly?.clientRect.height).toBe(614);
    expect(withChrome?.clientRect.height).toBe(558);

    remove();
  });
});
