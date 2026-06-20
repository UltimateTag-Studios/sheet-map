import { describe, expect, it } from "vitest";

import type { BottomSheetSnap } from "./bottom-sheet";
import {
  canBodyScroll,
  SHEET_BODY_DRAG_CLASS,
  SHEET_BODY_ROOT_BASE_CLASS,
  SHEET_BODY_SCROLLABLE_CLASS,
  SHEET_SCROLL_ROOT_CLASS,
  sheetBodyRootClass,
} from "./sheet-scroll-mode";

describe("canBodyScroll", () => {
  it("is false for collapsed and half when idle", () => {
    expect(
      canBodyScroll({
        sheetSnap: "collapsed",
        canBodyScrollLive: false,
        isDragging: false,
      }),
    ).toBe(false);
    expect(
      canBodyScroll({
        sheetSnap: "half",
        canBodyScrollLive: false,
        isDragging: false,
      }),
    ).toBe(false);
  });

  it("is true at full snap when idle", () => {
    expect(
      canBodyScroll({
        sheetSnap: "full",
        canBodyScrollLive: false,
        isDragging: false,
      }),
    ).toBe(true);
  });

  it("uses live height while dragging", () => {
    expect(
      canBodyScroll({
        sheetSnap: "half",
        canBodyScrollLive: false,
        isDragging: true,
      }),
    ).toBe(false);
    expect(
      canBodyScroll({
        sheetSnap: "half",
        canBodyScrollLive: true,
        isDragging: true,
      }),
    ).toBe(true);
  });

  it("ignores resting snap while dragging", () => {
    const snaps: BottomSheetSnap[] = ["collapsed", "half", "full"];
    for (const sheetSnap of snaps) {
      expect(
        canBodyScroll({
          sheetSnap,
          canBodyScrollLive: true,
          isDragging: true,
        }),
      ).toBe(true);
    }
  });
});

describe("sheet body root classes", () => {
  it("uses overflow auto only when body scroll is enabled", () => {
    expect(sheetBodyRootClass(true)).toContain(SHEET_BODY_SCROLLABLE_CLASS);
    expect(sheetBodyRootClass(false)).toContain(SHEET_BODY_DRAG_CLASS);
    expect(sheetBodyRootClass(false)).not.toContain("overflow-y-auto");
  });

  it("exports shared base classes", () => {
    expect(SHEET_SCROLL_ROOT_CLASS).toContain(SHEET_BODY_ROOT_BASE_CLASS);
    expect(SHEET_SCROLL_ROOT_CLASS).toContain("overflow-y-auto");
    expect(SHEET_SCROLL_ROOT_CLASS).toContain("overscroll-y-none");
  });
});
