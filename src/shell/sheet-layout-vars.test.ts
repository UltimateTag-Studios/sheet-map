import { describe, expect, it } from "vitest";

import {
  buildMapSheetLayoutVars,
  buildMapSheetStyle,
  hasBottomChromeReserve,
} from "./sheet-layout-vars";

describe("buildMapSheetLayoutVars", () => {
  it("applies package defaults when layout is omitted", () => {
    expect(buildMapSheetLayoutVars()).toEqual({
      "--sheet-handle-margin-top": "0.75rem",
      "--sheet-handle-bar-height": "0.25rem",
      "--sheet-handle-margin-bottom": "0.75rem",
    });
  });

  it("overrides layout tokens from props", () => {
    expect(
      buildMapSheetLayoutVars({
        sheetHandleMarginTop: 12,
        sheetHandleBarHeight: "0.5rem",
        sheetHandleMarginBottom: "1rem",
      }),
    ).toEqual({
      "--sheet-handle-margin-top": "12px",
      "--sheet-handle-bar-height": "0.5rem",
      "--sheet-handle-margin-bottom": "1rem",
    });
  });
});

describe("hasBottomChromeReserve", () => {
  it("returns false by default", () => {
    expect(hasBottomChromeReserve()).toBe(false);
    expect(hasBottomChromeReserve({ bottomChromeReserve: {} })).toBe(false);
  });

  it("returns true when bottom chrome padding is configured", () => {
    expect(
      hasBottomChromeReserve({
        bottomChromeReserve: {
          collapsedHeaderPaddingBottom: "4rem",
        },
      }),
    ).toBe(true);
    expect(
      hasBottomChromeReserve({
        bottomChromeReserve: {
          scrollBodyPaddingBottom: "5rem",
        },
      }),
    ).toBe(true);
  });
});

describe("buildMapSheetStyle", () => {
  it("merges visual styles after layout vars", () => {
    expect(
      buildMapSheetStyle(
        { sheetHandleMarginTop: 10 },
        { sheet: { backgroundColor: "white" } },
      ),
    ).toEqual({
      sheet: {
        "--sheet-handle-margin-top": "10px",
        "--sheet-handle-bar-height": "0.25rem",
        "--sheet-handle-margin-bottom": "0.75rem",
        backgroundColor: "white",
      },
      sheetHandle: {},
    });
  });
});
