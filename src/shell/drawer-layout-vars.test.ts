import { describe, expect, it } from "vitest";

import {
  buildSheetMapDrawerLayoutVars,
  buildSheetMapDrawerStyle,
  reservesFloatingTabBar,
} from "./drawer-layout-vars";

describe("buildSheetMapDrawerLayoutVars", () => {
  it("applies package defaults when layout is omitted", () => {
    expect(buildSheetMapDrawerLayoutVars()).toEqual({
      "--sheet-handle-margin-top": "0.75rem",
      "--sheet-handle-bar-height": "0.25rem",
      "--sheet-handle-margin-bottom": "0.75rem",
    });
  });

  it("overrides layout tokens from props", () => {
    expect(
      buildSheetMapDrawerLayoutVars({
        drawerHandleMarginTop: 12,
        drawerHandleBarHeight: "0.5rem",
        drawerHandleMarginBottom: "1rem",
      }),
    ).toEqual({
      "--sheet-handle-margin-top": "12px",
      "--sheet-handle-bar-height": "0.5rem",
      "--sheet-handle-margin-bottom": "1rem",
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
        { drawerHandleMarginTop: 10 },
        { drawer: { backgroundColor: "white" } },
      ),
    ).toEqual({
      drawer: {
        "--sheet-handle-margin-top": "10px",
        "--sheet-handle-bar-height": "0.25rem",
        "--sheet-handle-margin-bottom": "0.75rem",
        backgroundColor: "white",
      },
      drawerHandle: {},
    });
  });
});
