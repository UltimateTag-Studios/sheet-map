import { SHEET_SLIDE_CLASS } from "./host-classes";
import { readSheetHost } from "./read-sheet-host";

/** Distance from the map canvas bottom to the live sheet top (pixels). */
export function readLiveSheetObscuredBottomPx(
  canvas: HTMLCanvasElement,
): number | null {
  const sheetSlide = readSheetHost(canvas)?.querySelector(
    `.${SHEET_SLIDE_CLASS}`,
  );
  if (!sheetSlide) {
    return null;
  }

  const canvasRect = canvas.getBoundingClientRect();
  const sheetTop = sheetSlide.getBoundingClientRect().top;
  return Math.round(Math.max(0, canvasRect.bottom - sheetTop));
}
