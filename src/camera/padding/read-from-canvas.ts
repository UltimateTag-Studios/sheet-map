import type { MapObscuredInsets } from "../../viewport";
import { readLiveSheetObscuredBottomPx } from "../../viewport/dom";
import { computeMapPadding, type MapPaddingOptions } from "./compute";

export type ReadMapPaddingFromCanvasInput = {
  canvas: HTMLCanvasElement;
  fixedChromeInsets?: Partial<MapObscuredInsets>;
};

/**
 * Padding from live `.sheet` DOM at apply time.
 * Returns null when the sheet slide is not measurable — caller must not setPadding.
 */
export function readMapPaddingFromCanvas({
  canvas,
  fixedChromeInsets,
}: ReadMapPaddingFromCanvasInput): MapPaddingOptions | null {
  const sheetObscuredBottomPx = readLiveSheetObscuredBottomPx(canvas);
  if (sheetObscuredBottomPx === null) {
    return null;
  }

  return computeMapPadding({
    sheetObscuredBottomPx,
    fixedChromeInsets,
  });
}
