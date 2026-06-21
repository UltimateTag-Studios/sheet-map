import type { SheetSnap } from "@siegetag/sheet";

import { readLiveSheetObscuredBottomPx } from "../dom";
import type {
  MapObscuredInsets,
  MapVisibleViewport,
  PixelRect,
  SheetSnapHeightsPx,
} from "../types";
import { mergeObscuredInsets } from "./merge-obscured-insets";
import { readMapCanvasScreenGeometry } from "./read-map-canvas-screen-geometry";
import { visibleClientRectFromLiveSheetObscured } from "./visible-client-rect-from-live-sheet-obscured";
import { visibleClientRectFromScreenGeometry } from "./visible-client-rect-from-screen-geometry";

export type ResolveMapVisibleViewportOptions = {
  /** When true, ignore live `.sheet-slide` and use snap heights only. */
  useSnapGeometryOnly?: boolean;
};

/** Resolve visible map bounds, center offset, and whether the region is usable. */
export function resolveMapVisibleViewport(
  canvas: HTMLCanvasElement,
  snap: SheetSnap,
  snapHeights: SheetSnapHeightsPx,
  extraObscuredInsets: Partial<MapObscuredInsets> = {},
  options: ResolveMapVisibleViewportOptions = {},
): MapVisibleViewport {
  const geometry = readMapCanvasScreenGeometry(canvas);
  const chrome = mergeObscuredInsets(extraObscuredInsets);
  const liveSheetObscuredBottomPx = options.useSnapGeometryOnly
    ? null
    : readLiveSheetObscuredBottomPx(canvas);
  const baseRect =
    liveSheetObscuredBottomPx !== null
      ? visibleClientRectFromLiveSheetObscured(
          geometry,
          liveSheetObscuredBottomPx,
        )
      : visibleClientRectFromScreenGeometry(snap, snapHeights, geometry);

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
