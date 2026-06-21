import { describe, expect, it } from "vitest";

import {
  mockCanvas,
  snapHeights700,
  stubViewport,
} from "../viewport/testing/fixtures";
import {
  computeCameraOffset,
  computeCameraViewport,
} from "./compute-camera-viewport";

describe("computeCameraViewport", () => {
  it("matches collapsed snap offset when canvas aligns with the viewport", () => {
    stubViewport();

    const canvas = mockCanvas({
      rect: { width: 400, height: 800, bottom: 800, right: 400 },
    });

    expect(
      computeCameraViewport(canvas, "collapsed", snapHeights700, {
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
      }),
    ).toEqual({
      clientRect: { x: 0, y: 0, width: 400, height: 648 },
      centerOffset: { x: 0, y: -76 },
      hasVisibleArea: true,
    });
  });

  it("returns null offset when the visible area is empty", () => {
    stubViewport();

    const canvas = mockCanvas({
      rect: { width: 0, height: 0, bottom: 0, right: 0 },
      clientWidth: 0,
      clientHeight: 0,
    });

    expect(computeCameraOffset(canvas, "collapsed", snapHeights700)).toBeNull();
  });
});
