import type { MapRef } from "react-map-gl/mapbox";

import type { MapObscuredInsets, SheetMotionPhase } from "../../viewport";
import type { MapPosition } from "../map-position";

export type NavigateToMapAnchorOptions = {
  /** ms. 0 or omitted = jump; >0 = fly when sheet is idle. Jump when sheet is dragging or settling. */
  duration?: number;
};

export type UseMapAnchorOptions = {
  mapRef: MapRef | null;
  enabled?: boolean;
  /**
   * Re-sync trigger from `useLiveSheetObscuredBottomPx` — not used as padding input.
   * Mapbox padding is always read from live DOM at apply time.
   */
  liveSheetObscuredBottomPx?: number;
  fixedChromeInsets?: Partial<MapObscuredInsets>;
  mapPaddingDebug?: boolean;
  /** Sheet gesture phase from `useLiveSheetObscuredBottomPx` (or sheet `onLayoutFrameChange`). */
  sheetPhase?: SheetMotionPhase;
  /** Fly here once when padding and style are ready. */
  bootTarget?: MapPosition | null;
  /** Boot fly duration; falls back to `smoothFlyDurationMs`. */
  bootDurationMs?: number;
  onBootIssued?: () => void;
  smoothFlyDurationMs?: number;
  onMapInstanceReleased?: () => void;
};

export type RefreshMapPaddingFromCanvasOptions = {
  realign?: boolean;
};
