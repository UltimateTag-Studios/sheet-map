import type { MapRef } from "react-map-gl/mapbox";

import type { MapObscuredInsets, SheetMotionPhase } from "../../viewport";
import type { MapAnchorFollowConfig } from "../anchor";
import type { MapPosition } from "../shared/map-position";

export type { MapAnchorFollowConfig } from "../anchor";

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

export type MapCameraBootRequest = {
  position: MapPosition;
  follow: MapAnchorFollowConfig;
  positionKey: string;
};

export type UseMapCameraOptions = {
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
  /** One-shot boot when padding and style are ready. */
  bootRequest?: MapCameraBootRequest | null;
  bootDurationMs?: number;
  smoothFlyDurationMs?: number;
  /** Optional test hook when tracking is released by the machine. */
  onReleaseTracking?: () => void;
  onMapInstanceReleased?: () => void;
};
