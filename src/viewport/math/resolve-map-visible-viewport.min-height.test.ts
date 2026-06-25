import { describe, expect, it } from "vitest";

import { readSyncViewport } from "../sync/read-sync-viewport";
import { mockCanvas, stubViewport } from "../testing/fixtures";
import { mountSheetHostFixture } from "../testing/mount-sheet-host-fixture";
import { resolveMapVisibleViewport } from "./resolve-map-visible-viewport";

const overlayMinVisibleHeightPx = 48;

describe("resolveMapVisibleViewport overlay min height", () => {
  it("hides overlay chrome when visible height is below the minimum", () => {
    stubViewport();

    const canvasHeight = 800;
    const visibleHeight = overlayMinVisibleHeightPx - 1;
    const sheetTop = visibleHeight;
    const { canvas, remove } = mountSheetHostFixture(
      mockCanvas,
      {
        rect: { top: 0, bottom: canvasHeight, height: canvasHeight },
      },
      {
        top: sheetTop,
        bottom: canvasHeight,
        height: canvasHeight - sheetTop,
        y: sheetTop,
      },
    );

    const options = { overlayMinVisibleHeightPx };
    const viewport = resolveMapVisibleViewport(canvas, options);
    expect(viewport?.clientRect.height).toBe(visibleHeight);
    expect(viewport?.hasMinimumArea).toBe(false);
    expect(readSyncViewport(canvas, options).clientRect).toBeNull();

    remove();
  });

  it("shows overlay chrome when visible height meets the minimum", () => {
    stubViewport();

    const canvasHeight = 800;
    const visibleHeight = overlayMinVisibleHeightPx;
    const sheetTop = visibleHeight;
    const { canvas, remove } = mountSheetHostFixture(
      mockCanvas,
      {
        rect: { top: 0, bottom: canvasHeight, height: canvasHeight },
      },
      {
        top: sheetTop,
        bottom: canvasHeight,
        height: canvasHeight - sheetTop,
        y: sheetTop,
      },
    );

    const options = { overlayMinVisibleHeightPx };
    const viewport = resolveMapVisibleViewport(canvas, options);
    expect(viewport?.clientRect.height).toBe(visibleHeight);
    expect(viewport?.hasMinimumArea).toBe(true);
    expect(readSyncViewport(canvas, options).clientRect?.height).toBe(
      visibleHeight,
    );

    remove();
  });
});
