import { describe, expect, it } from "vitest";

import { resolveMapVisibleViewport } from "../viewport/math/resolve-map-visible-viewport";
import {
  mockCanvas,
  noExtraInsets,
  snapHeights700,
  stubViewport,
} from "../viewport/testing/fixtures";
import { computeMapPadding } from "./compute-map-padding";

describe("computeMapPadding", () => {
  it("maps sheet obscured height plus fixed chrome to padding.bottom", () => {
    const padding = computeMapPadding({
      sheetObscuredBottomPx: 152,
      fixedChromeInsets: { bottom: 56 },
    });

    expect(padding).toEqual({
      top: 0,
      left: 0,
      right: 0,
      bottom: 208,
    });
  });

  it("aligns padding.bottom with viewport math for tab-bar chrome", () => {
    stubViewport(400, 800);

    const canvas = mockCanvas({
      rect: { top: 0, bottom: 766, height: 766 },
    });

    const sheetObscuredBottomPx = 152;
    const fixedChromeInsets = { top: 0, left: 0, right: 0, bottom: 56 };

    const padding = computeMapPadding({
      sheetObscuredBottomPx,
      fixedChromeInsets,
    });

    const viewport = resolveMapVisibleViewport(
      canvas,
      "collapsed",
      snapHeights700,
      fixedChromeInsets,
      { useSnapGeometryOnly: true },
    );

    const canvasHeight = canvas.clientHeight;
    expect(padding.bottom).toBe(canvasHeight - viewport.clientRect.height);
  });

  it("uses zero sheet obscured when sheet does not cover the map", () => {
    expect(
      computeMapPadding({
        sheetObscuredBottomPx: 0,
        fixedChromeInsets: noExtraInsets,
      }).bottom,
    ).toBe(0);
  });

  it("clamps negative sheet obscured to zero before adding chrome", () => {
    expect(
      computeMapPadding({
        sheetObscuredBottomPx: -12,
        fixedChromeInsets: { bottom: 8 },
      }).bottom,
    ).toBe(8);
  });
});
