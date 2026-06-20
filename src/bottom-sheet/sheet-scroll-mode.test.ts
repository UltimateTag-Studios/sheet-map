import { describe, expect, it } from "vitest";

import type { BottomSheetSnap } from "./bottom-sheet";
import {
  isSheetScrollEnabled,
  SHEET_DRAG_ROOT_CLASS,
  SHEET_SCROLL_ROOT_CLASS,
} from "./sheet-scroll-mode";

describe("isSheetScrollEnabled", () => {
  const snaps: BottomSheetSnap[] = ["collapsed", "half", "full"];

  it("is false for collapsed and half", () => {
    expect(isSheetScrollEnabled("collapsed", false)).toBe(false);
    expect(isSheetScrollEnabled("half", false)).toBe(false);
  });

  it("is true only at full when not drag-revealing collapsed overlay", () => {
    expect(isSheetScrollEnabled("full", false)).toBe(true);
  });

  it("is false at full while collapsed drag overlay is shown", () => {
    expect(isSheetScrollEnabled("full", true)).toBe(false);
  });

  it("is false for collapsed/half even when drag-revealing", () => {
    for (const snap of snaps) {
      if (snap === "full") {
        continue;
      }
      expect(isSheetScrollEnabled(snap, true)).toBe(false);
    }
  });
});

describe("sheet scroll surface classes", () => {
  it("exports distinct drag vs scroll root classes", () => {
    expect(SHEET_SCROLL_ROOT_CLASS).toContain("overflow-y-auto");
    expect(SHEET_SCROLL_ROOT_CLASS).toContain("overscroll-y-none");
    expect(SHEET_DRAG_ROOT_CLASS).toContain("overflow-hidden");
  });
});
