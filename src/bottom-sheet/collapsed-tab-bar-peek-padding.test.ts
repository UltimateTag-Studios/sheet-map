import { describe, expect, it } from "vitest";

import { showCollapsedTabBarPeekPadding } from "./collapsed-tab-bar-peek-padding";

describe("showCollapsedTabBarPeekPadding", () => {
  it("is false when floating tab bar reserve is disabled", () => {
    expect(
      showCollapsedTabBarPeekPadding({
        reserveFloatingTabBar: false,
        sheetSnap: "collapsed",
        isDragging: false,
        visibleHeightPx: 150,
        collapsedHeightPx: 150,
      }),
    ).toBe(false);
  });

  it("is true at collapsed snap when idle", () => {
    expect(
      showCollapsedTabBarPeekPadding({
        reserveFloatingTabBar: true,
        sheetSnap: "collapsed",
        isDragging: false,
        visibleHeightPx: 150,
        collapsedHeightPx: 150,
      }),
    ).toBe(true);
  });

  it("is false at half or full when idle", () => {
    expect(
      showCollapsedTabBarPeekPadding({
        reserveFloatingTabBar: true,
        sheetSnap: "half",
        isDragging: false,
        visibleHeightPx: 400,
        collapsedHeightPx: 150,
      }),
    ).toBe(false);
  });

  it("drops peek padding once the sheet grows past collapsed height while dragging", () => {
    expect(
      showCollapsedTabBarPeekPadding({
        reserveFloatingTabBar: true,
        sheetSnap: "collapsed",
        isDragging: true,
        visibleHeightPx: 220,
        collapsedHeightPx: 200,
      }),
    ).toBe(false);
  });

  it("keeps peek padding while still at collapsed height during drag", () => {
    expect(
      showCollapsedTabBarPeekPadding({
        reserveFloatingTabBar: true,
        sheetSnap: "half",
        isDragging: true,
        visibleHeightPx: 198,
        collapsedHeightPx: 200,
      }),
    ).toBe(true);
  });
});
