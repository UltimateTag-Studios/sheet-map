import type { PixelPoint, PixelRect } from "./pixel";

/** Unobscured map region above the sheet and fixed chrome. */
export type MapVisibleViewport = {
  /** Client-pixel rect for debug overlay and hit testing. */
  clientRect: PixelRect;
  /** Offset from canvas center to `clientRect` center — for Mapbox `offset`. */
  centerOffset: PixelPoint;
  hasMinimumArea: boolean;
};

export type MapViewportSyncState = Omit<MapVisibleViewport, "clientRect"> & {
  clientRect: PixelRect | null;
};
