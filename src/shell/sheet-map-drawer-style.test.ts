import { describe, expect, it } from "vitest";

import {
  buildSheetMapDrawerLayoutVars,
  buildSheetMapDrawerStyle,
  DEFAULT_PEEK_BALANCE_ADJUST_PX,
  hasTabBarClearance,
} from "./sheet-map-drawer-style";

describe("buildSheetMapDrawerLayoutVars", () => {
  it("applies package defaults when layout is omitted", () => {
    expect(buildSheetMapDrawerLayoutVars()).toEqual({
      "--sheet-map-handle-margin-top": "0.75rem",
      "--sheet-map-handle-bar-height": "0.25rem",
      "--sheet-map-handle-margin-bottom": "0.75rem",
      "--sheet-map-peek-balance-adjust": "-7px",
      "--sheet-map-tab-bar-clearance": "0px",
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
        tabBarClearance: "calc(16px + 3rem)",
      }),
    ).toEqual({
      "--sheet-map-handle-margin-top": "12px",
      "--sheet-map-handle-bar-height": "0.5rem",
      "--sheet-map-handle-margin-bottom": "1rem",
      "--sheet-map-peek-balance-adjust": "-4px",
      "--sheet-map-tab-bar-clearance": "calc(16px + 3rem)",
    });
  });
});

describe("hasTabBarClearance", () => {
  it("returns false for default and zero clearance", () => {
    expect(hasTabBarClearance()).toBe(false);
    expect(hasTabBarClearance({ tabBarClearance: 0 })).toBe(false);
    expect(hasTabBarClearance({ tabBarClearance: "0px" })).toBe(false);
  });

  it("returns true when clearance is set", () => {
    expect(hasTabBarClearance({ tabBarClearance: 48 })).toBe(true);
    expect(hasTabBarClearance({ tabBarClearance: "calc(16px + 3rem)" })).toBe(
      true,
    );
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
        "--sheet-map-tab-bar-clearance": "0px",
        backgroundColor: "white",
      },
      drawerHandle: {},
    });
  });
});
