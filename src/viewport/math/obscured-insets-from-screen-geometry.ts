import type { SheetSnap } from "@siegetag/sheet";

import type {
  MapCanvasScreenGeometry,
  MapObscuredInsets,
  SheetSnapHeightsPx,
} from "../types";

/** Snap-based bottom inset — sheet anchors to canvas bottom, not viewport bottom. */
export function obscuredInsetsFromScreenGeometry(
  snap: SheetSnap,
  snapHeights: SheetSnapHeightsPx,
  geometry: MapCanvasScreenGeometry,
): MapObscuredInsets {
  const viewportTop = geometry.viewportTop ?? 0;
  const viewportLeft = geometry.viewportLeft ?? 0;
  const sheetObscuredHeight = snapHeights[snap];
  const sheetTopY = geometry.canvasBottom - sheetObscuredHeight;

  return {
    top: Math.max(0, geometry.canvasTop - viewportTop),
    left: Math.max(0, geometry.canvasLeft - viewportLeft),
    right: Math.max(
      0,
      viewportLeft + geometry.viewportWidth - geometry.canvasRight,
    ),
    bottom: Math.max(0, geometry.canvasBottom - sheetTopY),
  };
}
