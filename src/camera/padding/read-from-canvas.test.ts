import { describe, expect, it } from "vitest";

import { mockCanvas, stubViewport } from "../../viewport/testing/fixtures";
import { mountSheetHostFixture } from "../../viewport/testing/mount-sheet-host-fixture";
import { readMapPaddingFromCanvas } from "./read-from-canvas";

describe("readMapPaddingFromCanvas", () => {
  it("returns null when the sheet slide is not in the DOM", () => {
    stubViewport();
    const canvas = mockCanvas();

    expect(
      readMapPaddingFromCanvas({
        canvas,
      }),
    ).toBeNull();
  });

  it("reads padding from live sheet geometry", () => {
    stubViewport();

    const obscuredBottomPx = 152;
    const { canvas, remove } = mountSheetHostFixture(
      mockCanvas,
      {},
      {
        top: 800 - obscuredBottomPx,
        bottom: 800,
        height: obscuredBottomPx,
        y: 800 - obscuredBottomPx,
      },
    );

    expect(
      readMapPaddingFromCanvas({
        canvas,
      }),
    ).toEqual({
      top: 0,
      left: 0,
      right: 0,
      bottom: 152,
    });

    remove();
  });
});
