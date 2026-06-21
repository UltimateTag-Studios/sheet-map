import type { PixelPoint, PixelRect, PixelSize } from "../viewport";

type LngLat = { lng: number; lat: number };

type Unproject = (point: [number, number]) => LngLat;

export type ReadVisibleMapCenterOptions = {
  canvasOrigin?: PixelPoint;
};

/** Geographic point at the center of the sheet-aware visible map area. */
export function readVisibleMapCenterLngLat(
  canvasSize: PixelSize,
  centerOffset: PixelPoint,
  clientRect: PixelRect | null,
  unproject: Unproject,
  options: ReadVisibleMapCenterOptions = {},
): LngLat {
  if (clientRect) {
    const originX = options.canvasOrigin?.x ?? 0;
    const originY = options.canvasOrigin?.y ?? 0;
    const x = clientRect.x + clientRect.width / 2 - originX;
    const y = clientRect.y + clientRect.height / 2 - originY;
    return unproject([x, y]);
  }

  const x = canvasSize.width / 2 + centerOffset.x;
  const y = canvasSize.height / 2 + centerOffset.y;
  return unproject([x, y]);
}
