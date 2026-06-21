import type { PixelPoint, PixelRect } from "../types";

export function visibleViewboxCenter(visible: PixelRect): PixelPoint {
  return {
    x: visible.x + visible.width / 2,
    y: visible.y + visible.height / 2,
  };
}
