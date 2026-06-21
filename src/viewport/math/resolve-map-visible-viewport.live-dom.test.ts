import { describe, expect, it } from "vitest";

import { readLiveSheetObscuredBottomPx } from "../dom";
import {
  mockCanvas,
  noExtraInsets,
  snapHeights700,
  snapHeights750,
  stubViewport,
} from "../testing/fixtures";
import { mountSheetHostFixture } from "../testing/mount-sheet-host-fixture";
import { resolveMapVisibleViewport } from "./resolve-map-visible-viewport";

describe("resolveMapVisibleViewport live sheet DOM", () => {
  it("prefers live sheet geometry over snap state when the sheet slide is in the DOM", () => {
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
    expect(
      resolveMapVisibleViewport(canvas, "collapsed", snapHeights750),
    ).toEqual({
      clientRect: { x: 0, y: 50, width: 400, height: 375 },
      centerOffset: { x: 0, y: -212.5 },
      hasVisibleArea: true,
    });

    remove();
  });

  it("matches live sheet geometry when the canvas ends above the viewport bottom", () => {
    stubViewport();

    const canvasBottom = 766;
    const collapsedHeight = snapHeights700.collapsed;
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

    const snap = resolveMapVisibleViewport(
      canvas,
      "collapsed",
      snapHeights700,
      noExtraInsets,
      { useSnapGeometryOnly: true },
    );
    const live = resolveMapVisibleViewport(
      canvas,
      "collapsed",
      snapHeights700,
      noExtraInsets,
    );

    expect(snap).toEqual(live);

    remove();
  });
});
