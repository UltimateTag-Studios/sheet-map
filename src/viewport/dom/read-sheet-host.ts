import { SHEET_HOST_CLASS } from "./host-classes";

export function readSheetHost(canvas: HTMLCanvasElement): Element | null {
  return typeof canvas.closest === "function"
    ? canvas.closest(`.${SHEET_HOST_CLASS}`)
    : null;
}
