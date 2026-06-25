import { resolveMapVisibleViewport } from "../math";
import type { MapViewportSyncState, MapVisibleViewportOptions } from "../types";

const EMPTY_VIEWPORT: MapViewportSyncState = {
  clientRect: null,
  centerOffset: { x: 0, y: 0 },
  hasMinimumArea: false,
};

export function readSyncViewport(
  canvas: HTMLCanvasElement,
  options: MapVisibleViewportOptions = {},
): MapViewportSyncState {
  if (canvas.clientWidth === 0 || canvas.clientHeight === 0) {
    return EMPTY_VIEWPORT;
  }

  const viewport = resolveMapVisibleViewport(canvas, options);
  if (!viewport) {
    return EMPTY_VIEWPORT;
  }

  return {
    ...viewport,
    clientRect: viewport.hasMinimumArea ? viewport.clientRect : null,
  };
}
