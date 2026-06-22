import type { MapObscuredInsets } from "../../viewport";
import { mergeObscuredInsets } from "../../viewport/math/merge-obscured-insets";

export type MapPaddingOptions = {
  top: number;
  left: number;
  right: number;
  bottom: number;
};

export type ComputeMapPaddingInput = {
  sheetObscuredBottomPx: number;
  fixedChromeInsets?: Partial<MapObscuredInsets>;
};

/** Mapbox padding from live sheet obscured height + fixed chrome insets. */
export function computeMapPadding({
  sheetObscuredBottomPx,
  fixedChromeInsets = {},
}: ComputeMapPaddingInput): MapPaddingOptions {
  const chrome = mergeObscuredInsets(fixedChromeInsets);

  return {
    top: Math.round(chrome.top),
    left: Math.round(chrome.left),
    right: Math.round(chrome.right),
    bottom: Math.round(Math.max(0, sheetObscuredBottomPx) + chrome.bottom),
  };
}

export function areMapPaddingOptionsEqual(
  left: MapPaddingOptions,
  right: MapPaddingOptions,
): boolean {
  return (
    left.top === right.top &&
    left.left === right.left &&
    left.right === right.right &&
    left.bottom === right.bottom
  );
}
