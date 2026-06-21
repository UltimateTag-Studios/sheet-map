import type { MapCanvasScreenGeometry, PixelRect } from "../types";

/** Visible map bounds from a measured sheet obscured height. */
export function visibleClientRectFromLiveSheetObscured(
  geometry: MapCanvasScreenGeometry,
  sheetObscuredBottomPx: number,
): PixelRect {
  const viewportTop = geometry.viewportTop ?? 0;
  const viewportLeft = geometry.viewportLeft ?? 0;
  const obscuredLeft = Math.max(0, geometry.canvasLeft - viewportLeft);
  const obscuredRight = Math.max(
    0,
    viewportLeft + geometry.viewportWidth - geometry.canvasRight,
  );
  const x = viewportLeft + obscuredLeft;
  const y = viewportTop + Math.max(0, geometry.canvasTop - viewportTop);
  const sheetTopY = geometry.canvasBottom - sheetObscuredBottomPx;
  const width =
    geometry.canvasRight - geometry.canvasLeft - obscuredLeft - obscuredRight;

  return {
    x,
    y,
    width: Math.max(0, width),
    height: Math.max(0, sheetTopY - y),
  };
}
