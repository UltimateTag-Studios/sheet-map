import type { SheetSnap } from "@siegetag/sheet";

import {
  type MapObscuredInsets,
  type MapVisibleViewport,
  type PixelPoint,
  resolveMapVisibleViewport,
  type SheetSnapHeightsPx,
} from "../viewport";

export type ComputeCameraViewportOptions = {
  /** When true, derive from snap heights only. When false, prefer live sheet DOM. */
  useSnapGeometryOnly?: boolean;
};

/** Sheet-aware camera offset for a target snap. */
export function computeCameraViewport(
  canvas: HTMLCanvasElement,
  sheetSnap: SheetSnap,
  snapHeights: SheetSnapHeightsPx,
  fixedChromeInsets: MapObscuredInsets = {
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  options: ComputeCameraViewportOptions = {},
): MapVisibleViewport {
  return resolveMapVisibleViewport(
    canvas,
    sheetSnap,
    snapHeights,
    fixedChromeInsets,
    { useSnapGeometryOnly: options.useSnapGeometryOnly ?? false },
  );
}

export function computeCameraOffset(
  canvas: HTMLCanvasElement,
  sheetSnap: SheetSnap,
  snapHeights: SheetSnapHeightsPx,
  fixedChromeInsets?: Partial<MapObscuredInsets>,
): PixelPoint | null {
  const viewport = computeCameraViewport(canvas, sheetSnap, snapHeights, {
    top: fixedChromeInsets?.top ?? 0,
    left: fixedChromeInsets?.left ?? 0,
    right: fixedChromeInsets?.right ?? 0,
    bottom: fixedChromeInsets?.bottom ?? 0,
  });

  if (!viewport.hasVisibleArea) {
    return null;
  }

  return viewport.centerOffset;
}
