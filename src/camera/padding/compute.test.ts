import { describe, expect, it } from "vitest";

import { noExtraInsets } from "../../viewport/testing/fixtures";
import { computeMapPadding } from "./compute";

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

  it("uses zero sheet obscured when sheet does not cover the map", () => {
    expect(
      computeMapPadding({
        sheetObscuredBottomPx: 0,
        fixedChromeInsets: noExtraInsets,
      }).bottom,
    ).toBe(0);
  });

  it("rounds obscured height to whole pixels before computing padding", () => {
    expect(
      computeMapPadding({
        sheetObscuredBottomPx: 152.76,
        fixedChromeInsets: { bottom: 56.4 },
      }).bottom,
    ).toBe(209);
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
