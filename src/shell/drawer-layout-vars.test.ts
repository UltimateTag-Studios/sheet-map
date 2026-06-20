import { describe, expect, it } from "vitest";

import {
  buildSheetMapDrawerLayoutVars,
  buildSheetMapDrawerStyle,
  DEFAULT_PEEK_BALANCE_ADJUST_PX,
  reservesFloatingTabBar,
} from "./drawer-layout-vars";

describe("buildSheetMapDrawerLayoutVars", () => {
  it("applies package defaults when layout is omitted", () => {
    expect(buildSheetMapDrawerLayoutVars()).toEqual({
      "--sheet-map-handle-margin-top": "0.75rem",
      "--sheet-map-handle-bar-height": "0.25rem",
      "--sheet-map-handle-margin-bottom": "0.75rem",
      "--sheet-map-peek-balance-adjust": "-7px",
    });
    expect(DEFAULT_PEEK_BALANCE_ADJUST_PX).toBe(-7);
  });

  it("overrides layout tokens from props", () => {
    expect(
      buildSheetMapDrawerLayoutVars({
        drawerHandleMarginTop: 12,
        drawerHandleBarHeight: "0.5rem",
        drawerHandleMarginBottom: "1rem",
        peekBalanceAdjustPx: -4,
        reserveFloatingTabBar: true,
      }),
    ).toEqual({
      "--sheet-map-handle-margin-top": "12px",
      "--sheet-map-handle-bar-height": "0.5rem",
      "--sheet-map-handle-margin-bottom": "1rem",
      "--sheet-map-peek-balance-adjust": "-4px",
    });
  });
});

describe("reservesFloatingTabBar", () => {
  it("returns false by default", () => {
    expect(reservesFloatingTabBar()).toBe(false);
    expect(reservesFloatingTabBar({ reserveFloatingTabBar: false })).toBe(
      false,
    );
  });

  it("returns true when reserveFloatingTabBar is enabled", () => {
    expect(reservesFloatingTabBar({ reserveFloatingTabBar: true })).toBe(true);
  });
});

describe("buildSheetMapDrawerStyle", () => {
  it("merges visual styles after layout vars", () => {
    expect(
      buildSheetMapDrawerStyle(
        { peekBalanceAdjustPx: -5 },
        { drawer: { backgroundColor: "white" } },
      ),
    ).toEqual({
      drawer: {
        "--sheet-map-handle-margin-top": "0.75rem",
        "--sheet-map-handle-bar-height": "0.25rem",
        "--sheet-map-handle-margin-bottom": "0.75rem",
        "--sheet-map-peek-balance-adjust": "-5px",
        backgroundColor: "white",
      },
      drawerHandle: {},
    });
  });
});
