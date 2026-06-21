import { describe, expect, it } from "vitest";

import { obscuredInsetsFromScreenGeometry } from "../math";
import {
  alignedGeometry,
  snapHeights700,
  snapHeights750,
} from "../testing/fixtures";

describe("obscuredInsetsFromScreenGeometry", () => {
  it("matches collapsed sheet height when canvas aligns with viewport bottom", () => {
    expect(
      obscuredInsetsFromScreenGeometry(
        "collapsed",
        snapHeights700,
        alignedGeometry,
      ).bottom,
    ).toBe(152);
  });

  it("keeps bottom inset equal to snap height when canvas ends above the viewport bottom", () => {
    expect(
      obscuredInsetsFromScreenGeometry("collapsed", snapHeights700, {
        ...alignedGeometry,
        canvasBottom: 766,
      }).bottom,
    ).toBe(152);
  });

  it("does not inflate bottom inset when canvas extends below the viewport bottom", () => {
    expect(
      obscuredInsetsFromScreenGeometry("collapsed", snapHeights700, {
        ...alignedGeometry,
        canvasBottom: 850,
      }).bottom,
    ).toBe(152);
  });

  it("matches half sheet height from host geometry when canvas is inset from viewport top", () => {
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
      obscuredInsetsFromScreenGeometry("half", snapHeights750, geometry).bottom,
    ).toBe(800 - (50 + halfHeightPx));
  });
});
