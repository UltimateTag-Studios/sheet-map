import type { MapRef } from "react-map-gl/mapbox";

import type { MapObscuredInsets } from "../../viewport";
import type { MapAnchorFollowConfig } from "../lib";
import type { CameraShellSignal } from "../shared/camera-shell-signal";
import type { MapPosition } from "../shared/map-position";

export type { MapAnchorFollowConfig } from "../lib";

export type NavigateToMapCameraOptions = {
  /**
   * ms. 0 or omitted = jump; >0 = fly when sheet is idle.
   * Sheet dragging/settling forces jump in the machine.
   */
  duration?: number;
  /**
   * Keep user tracking enabled after this move. Boot, snap-back, and recenter pass `true`.
   * Default `false` releases tracking (e.g. fly to a map item or demo point).
   */
  preserveTracking?: boolean;
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
  /** One-shot boot when padding and style are ready. */
  bootRequest?: MapCameraBootRequest | null;
  bootDurationMs?: number;
  smoothFlyDurationMs?: number;
  /** Optional test hook when tracking is released by the machine. */
  onReleaseTracking?: () => void;
  onMapInstanceReleased?: () => void;
  /** Synchronous camera → shell bridge (replaces snapshot polling). */
  onNotifyShell?: (signal: CameraShellSignal) => void;
};
