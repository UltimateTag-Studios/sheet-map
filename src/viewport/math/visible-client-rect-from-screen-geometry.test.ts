import { describe, expect, it } from "vitest";

import {
  visibleClientRectFromScreenGeometry,
  visibleViewboxCenter,
} from "../math";
import {
  alignedGeometry,
  snapHeights700,
  snapHeights750,
  snapHeights800,
  tabBarGeometry,
} from "../testing/fixtures";

describe("visibleClientRectFromScreenGeometry", () => {
  it("derives visible client rect from screen geometry", () => {
    expect(
      visibleClientRectFromScreenGeometry(
        "collapsed",
        snapHeights700,
        alignedGeometry,
      ),
    ).toEqual({ x: 0, y: 0, width: 400, height: 648 });
  });

  it("derives tab-bar layout visible height when canvas ends above the viewport bottom", () => {
    expect(
      visibleClientRectFromScreenGeometry(
        "collapsed",
        snapHeights700,
        tabBarGeometry,
      ),
    ).toEqual({ x: 0, y: 0, width: 400, height: 614 });
  });

  it("reports no visible area when the sheet is full height", () => {
    expect(
      visibleClientRectFromScreenGeometry(
        "full",
        snapHeights800,
        alignedGeometry,
      ),
    ).toEqual({ x: 0, y: 0, width: 400, height: 0 });
  });

  it("centers visible viewbox below the obscured bottom edge", () => {
    const visible = visibleClientRectFromScreenGeometry(
      "collapsed",
      snapHeights700,
      alignedGeometry,
    );
    expect(visibleViewboxCenter(visible)).toEqual({ x: 200, y: 324 });
  });

  it("matches half sheet height when canvas is inset from viewport top", () => {
    const halfHeightPx = snapHeights750.half;
    const geometry = {
      canvasTop: 50,
      canvasBottom: 800,
      canvasLeft: 0,
      canvasRight: 400,
      viewportHeight: 800,
      viewportWidth: 400,
    };

    expect(
      visibleClientRectFromScreenGeometry("half", snapHeights750, geometry),
    ).toEqual({
      x: 0,
      y: 50,
      width: 400,
      height: halfHeightPx,
    });
  });
});
