import type { MapRef } from "react-map-gl/mapbox";

import type { MapPosition } from "../../shared/map-position";
import type { MapObscuredInsets, SheetMotionPhase } from "../../viewport";

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
  /**
   * 5D: screen pixels before follow releases on user pan (app default often 40).
   * Not used until gesture-settle lands in 5D.
   */
  followReleaseThresholdPx?: number;
  onMapInstanceReleased?: () => void;
};

export type RefreshMapPaddingFromCanvasOptions = {
  realign?: boolean;
};
