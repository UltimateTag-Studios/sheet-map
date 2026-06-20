import { describe, expect, it } from "vitest";

import { buildMapSheetLayoutVars, buildMapSheetStyle } from "./index";

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
