import { readLiveSheetObscuredBottomPx } from "../dom";
import type {
  MapObscuredInsets,
  MapVisibleViewport,
  PixelRect,
} from "../types";
import { mergeObscuredInsets } from "./merge-obscured-insets";
import { readMapCanvasScreenGeometry } from "./read-map-canvas-screen-geometry";
import { visibleClientRectFromLiveSheetObscured } from "./visible-client-rect-from-live-sheet-obscured";

/**
 * Resolve visible map bounds from live `.sheet-slide` DOM geometry.
 * Returns `null` when the canvas has no size or the sheet slide is not measurable.
 */
export function resolveMapVisibleViewport(
  canvas: HTMLCanvasElement,
  extraObscuredInsets: Partial<MapObscuredInsets> = {},
): MapVisibleViewport | null {
  if (canvas.clientWidth === 0 || canvas.clientHeight === 0) {
    return null;
  }

  const sheetObscuredBottomPx = readLiveSheetObscuredBottomPx(canvas);
  if (sheetObscuredBottomPx === null) {
    return null;
  }

  const geometry = readMapCanvasScreenGeometry(canvas);
  const chrome = mergeObscuredInsets(extraObscuredInsets);
  const baseRect = visibleClientRectFromLiveSheetObscured(
    geometry,
    sheetObscuredBottomPx,
  );

  const clientRect: PixelRect = {
    x: baseRect.x + chrome.left,
    y: baseRect.y + chrome.top,
    width: Math.max(0, baseRect.width - chrome.left - chrome.right),
    height: Math.max(0, baseRect.height - chrome.top - chrome.bottom),
  };
  const hasVisibleArea = clientRect.height > 0 && clientRect.width > 0;

  const canvasRect = canvas.getBoundingClientRect();
  const targetX = clientRect.x + clientRect.width / 2 - canvasRect.left;
  const targetY = clientRect.y + clientRect.height / 2 - canvasRect.top;

  return {
    clientRect,
    centerOffset: {
      x: targetX - canvas.clientWidth / 2,
      y: targetY - canvas.clientHeight / 2,
    },
    hasVisibleArea,
  };
}
