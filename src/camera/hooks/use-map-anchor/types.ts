import type { MapRef } from "react-map-gl/mapbox";

import type { MapObscuredInsets, SheetMotionPhase } from "../../../viewport";
import type { MapAnchorFollowConfig } from "../../anchor";
import type { MapPosition } from "../../shared/map-position";

export type { MapAnchorFollowConfig } from "../../anchor";

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
  /** Active follow config for gesture settle + padding realign. */
  follow?: MapAnchorFollowConfig | null;
  /** Called when pan exceeds follow threshold or settle releases follow. */
  onReleaseFollow?: () => void;
  /** Phase 5D padding matrix: idle + following → jump to user when sheet moves. */
  followUser?: boolean;
  followTarget?: MapPosition | null;
  onMapInstanceReleased?: () => void;
};

export type RefreshMapPaddingFromCanvasOptions = {
  realign?: boolean;
};
