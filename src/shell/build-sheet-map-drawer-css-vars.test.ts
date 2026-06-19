import { describe, expect, it } from "vitest";

import {
  buildSheetMapDrawerCssVars,
  DEFAULT_PEEK_BALANCE_ADJUST_PX,
} from "./build-sheet-map-drawer-css-vars";

describe("buildSheetMapDrawerCssVars", () => {
  it("defaults peek balance adjust to -7px", () => {
    expect(buildSheetMapDrawerCssVars({})).toEqual({
      "--sheet-map-peek-balance-adjust": "-7px",
    });
    expect(DEFAULT_PEEK_BALANCE_ADJUST_PX).toBe(-7);
  });

  it("allows overriding balance and padding", () => {
    expect(
      buildSheetMapDrawerCssVars({
        peekBalanceAdjustPx: -4,
        peekPaddingY: "1rem",
      }),
    ).toEqual({
      "--sheet-map-peek-balance-adjust": "-4px",
      "--sheet-map-peek-padding-y": "1rem",
    });
  });

  it("formats numeric peek padding as px", () => {
    expect(
      buildSheetMapDrawerCssVars({
        peekPaddingY: 12,
      }),
    ).toEqual({
      "--sheet-map-peek-balance-adjust": "-7px",
      "--sheet-map-peek-padding-y": "12px",
    });
  });
});
