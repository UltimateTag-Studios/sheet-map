import type { MapObscuredInsets } from "../types";

export function mergeObscuredInsets(
  extra: Partial<MapObscuredInsets> = {},
): MapObscuredInsets {
  return {
    top: extra.top ?? 0,
    left: extra.left ?? 0,
    right: extra.right ?? 0,
    bottom: extra.bottom ?? 0,
  };
}
