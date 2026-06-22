import { resolveMapVisibleViewport } from "../math";
import type { MapObscuredInsets, MapViewportSyncState } from "../types";

const EMPTY_VIEWPORT: MapViewportSyncState = {
  clientRect: null,
  centerOffset: { x: 0, y: 0 },
  hasVisibleArea: false,
};

export function readSyncViewport(
  canvas: HTMLCanvasElement,
  fixedChromeInsets?: Partial<MapObscuredInsets>,
): MapViewportSyncState {
  if (canvas.clientWidth === 0 || canvas.clientHeight === 0) {
    return EMPTY_VIEWPORT;
  }

  const viewport = resolveMapVisibleViewport(canvas, fixedChromeInsets);
  if (!viewport) {
    return EMPTY_VIEWPORT;
  }

  return {
    ...viewport,
    clientRect: viewport.hasVisibleArea ? viewport.clientRect : null,
  };
}
