import { describe, expect, it } from "vitest";

import { readLiveSheetObscuredBottomPx } from "../dom";
import { mockCanvas, snapHeights750, stubViewport } from "../testing/fixtures";
import { mountSheetHostFixture } from "../testing/mount-sheet-host-fixture";
import { resolveMapVisibleViewport } from "./resolve-map-visible-viewport";

describe("resolveMapVisibleViewport live sheet DOM", () => {
  it("reads visible bounds from the live sheet slide position", () => {
    stubViewport();

    const { canvas, remove } = mountSheetHostFixture(
      mockCanvas,
      {
        rect: { top: 50, bottom: 800, height: 750, y: 50 },
        clientHeight: 800,
      },
      {
        top: 425,
        bottom: 800,
        height: 375,
        y: 425,
      },
    );

    expect(readLiveSheetObscuredBottomPx(canvas)).toBe(375);
    expect(resolveMapVisibleViewport(canvas)).toEqual({
      clientRect: { x: 0, y: 50, width: 400, height: 375 },
      centerOffset: { x: 0, y: -212.5 },
      hasVisibleArea: true,
    });

    remove();
  });

  it("matches geometry when the canvas ends above the viewport bottom", () => {
    stubViewport();

    const canvasBottom = 766;
    const collapsedHeight = snapHeights750.collapsed;
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

    expect(resolveMapVisibleViewport(canvas)).toEqual({
      clientRect: { x: 0, y: 0, width: 400, height: 614 },
      centerOffset: { x: 0, y: -76 },
      hasVisibleArea: true,
    });

    remove();
  });
});
