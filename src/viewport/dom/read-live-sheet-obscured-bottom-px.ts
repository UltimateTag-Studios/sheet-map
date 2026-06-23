import { SHEET_CLASS } from "./host-classes";
import { readSheetHost } from "./read-sheet-host";

/** Distance from the map canvas bottom to the live sheet top (pixels). */
export function readLiveSheetObscuredBottomPx(
  canvas: HTMLCanvasElement,
): number | null {
  const sheet = readSheetHost(canvas)?.querySelector(`.${SHEET_CLASS}`);
  if (!sheet) {
    return null;
  }

  const canvasRect = canvas.getBoundingClientRect();
  const sheetTop = sheet.getBoundingClientRect().top;
  return Math.round(Math.max(0, canvasRect.bottom - sheetTop));
}
