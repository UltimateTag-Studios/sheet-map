import type { MapRef } from "react-map-gl/mapbox";

import type { MapObscuredInsets, SheetMotionPhase } from "../../../viewport";
import type { MapAnchorFollowConfig } from "../../anchor";
import type { MapPosition } from "../../shared/map-position";

export type { MapAnchorFollowConfig } from "../../anchor";

export type NavigateToMapAnchorOptions = {
  /**
   * ms. 0 or omitted = jump; >0 = fly when sheet is idle.
   * Jump when sheet is dragging or settling.
   */
  duration?: number;
  /**
   * Keep user tracking enabled after this move. Boot, snap-back, and recenter pass `true`.
   * Default `false` releases tracking (e.g. fly to a map item or demo point).
   */
  keepTracking?: boolean;
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
  /** Active tracking config for gesture settle. */
  follow?: MapAnchorFollowConfig | null;
  /** Called when pan exceeds tracking threshold or settle releases tracking. */
  onReleaseTracking?: () => void;
  onMapInstanceReleased?: () => void;
};

export type RefreshMapPaddingFromCanvasOptions = {
  realign?: boolean;
};
