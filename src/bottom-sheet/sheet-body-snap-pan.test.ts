import { describe, expect, it } from "vitest";

import {
  nearestSnapPoint,
  resolveSnapPointHeightPx,
  shouldBodyPanSheet,
  snapHeightFromPanDelta,
} from "./sheet-body-snap-pan";

describe("snapHeightFromPanDelta", () => {
  it("increases height when the finger moves up", () => {
    expect(
      snapHeightFromPanDelta({
        startHeightPx: 200,
        startClientY: 400,
        currentClientY: 360,
        minHeightPx: 150,
        maxHeightPx: 700,
      }),
    ).toBe(240);
  });

  it("decreases height when the finger moves down", () => {
    expect(
      snapHeightFromPanDelta({
        startHeightPx: 400,
        startClientY: 300,
        currentClientY: 340,
        minHeightPx: 150,
        maxHeightPx: 700,
      }),
    ).toBe(360);
  });

  it("clamps to collapsed and full bounds", () => {
    expect(
      snapHeightFromPanDelta({
        startHeightPx: 160,
        startClientY: 400,
        currentClientY: 200,
        minHeightPx: 150,
        maxHeightPx: 700,
      }),
    ).toBe(360);
    expect(
      snapHeightFromPanDelta({
        startHeightPx: 680,
        startClientY: 200,
        currentClientY: 500,
        minHeightPx: 150,
        maxHeightPx: 700,
      }),
    ).toBe(380);
  });
});

describe("shouldBodyPanSheet", () => {
  it("pans whenever body scroll is disabled", () => {
    expect(shouldBodyPanSheet({ canBodyScroll: false, scrollTopPx: 48 })).toBe(
      true,
    );
  });

  it("pans at full height only when scrolled to the top", () => {
    expect(shouldBodyPanSheet({ canBodyScroll: true, scrollTopPx: 0 })).toBe(
      true,
    );
    expect(shouldBodyPanSheet({ canBodyScroll: true, scrollTopPx: 12 })).toBe(
      false,
    );
  });
});

describe("resolveSnapPointHeightPx", () => {
  it("resolves px strings and fractions", () => {
    expect(resolveSnapPointHeightPx("180px", 800)).toBe(180);
    expect(resolveSnapPointHeightPx(0.5, 800)).toBe(400);
  });
});

describe("nearestSnapPoint", () => {
  it("picks the closest configured snap", () => {
    const snapPoints = ["150px", 0.5, "700px"] as const;
    expect(nearestSnapPoint(160, [...snapPoints], 700)).toBe("150px");
    expect(nearestSnapPoint(380, [...snapPoints], 700)).toBe(0.5);
    expect(nearestSnapPoint(690, [...snapPoints], 700)).toBe("700px");
  });
});
