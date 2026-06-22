import { useCallback, useEffect, useRef, useState } from "react";
import type { MapRef } from "react-map-gl/mapbox";

import type { MapObscuredInsets } from "../viewport";
import type { MapPaddingOptions } from "./compute-map-padding";
import { releaseMapInstanceCameraState } from "./map-instance-camera-state";
import { readMapPaddingFromCanvas } from "./read-map-padding-from-canvas";
import {
  hasSyncedMapPadding,
  readSyncedMapPadding,
  syncMapPadding,
} from "./sync-map-padding";
import { whenMapStyleReady } from "./when-map-style-ready";

export type UseMapPaddingSyncOptions = {
  mapRef: MapRef | null;
  /**
   * Re-sync trigger from `useLiveSheetObscuredBottomPx` — not used as padding input.
   * Padding is always read from live DOM at apply time.
   */
  liveSheetObscuredBottomPx?: number;
  fixedChromeInsets?: Partial<MapObscuredInsets>;
  enabled?: boolean;
  debug?: boolean;
  onMapInstanceReleased?: () => void;
};

export type UseMapPaddingSyncResult = {
  padding: MapPaddingOptions | null;
  /** True after the first setPadding from a measurable live sheet slide. */
  paddingReady: boolean;
};

/**
 * Sync Mapbox padding from live sheet DOM only.
 * Does not call jumpTo/flyTo/stop. Mapbox setPadding may still end pan momentum when
 * the sheet moves during coast — accepted; see docs/camera-fsm-plan.md §3.1.
 */
export function useMapPaddingSync({
  mapRef,
  liveSheetObscuredBottomPx,
  fixedChromeInsets,
  enabled = true,
  debug = false,
  onMapInstanceReleased,
}: UseMapPaddingSyncOptions): UseMapPaddingSyncResult {
  const [padding, setPadding] = useState<MapPaddingOptions | null>(null);
  const [paddingReady, setPaddingReady] = useState(false);
  const paddingReadyRef = useRef(false);
  const onMapInstanceReleasedRef = useRef(onMapInstanceReleased);
  onMapInstanceReleasedRef.current = onMapInstanceReleased;

  const syncPaddingRef = useRef<() => boolean>(() => false);

  const syncPadding = useCallback(() => {
    if (!mapRef || !enabled) {
      return false;
    }

    const map = mapRef.getMap();
    if (!map.isStyleLoaded()) {
      return false;
    }

    const nextPadding = readMapPaddingFromCanvas({
      canvas: map.getCanvas(),
      fixedChromeInsets,
    });
    if (!nextPadding) {
      return false;
    }

    const changed = syncMapPadding(map, nextPadding);

    if (debug && changed) {
      console.info("[map-padding-sync] setPadding", nextPadding);
    }

    if (changed) {
      setPadding(readSyncedMapPadding(map) ?? nextPadding);
    }

    if (hasSyncedMapPadding(map) && !paddingReadyRef.current) {
      paddingReadyRef.current = true;
      setPaddingReady(true);
    }

    return changed;
  }, [mapRef, enabled, fixedChromeInsets, debug]);

  syncPaddingRef.current = syncPadding;

  useEffect(() => {
    if (!mapRef || !enabled) {
      paddingReadyRef.current = false;
      setPadding(null);
      setPaddingReady(false);
      return;
    }

    const map = mapRef.getMap();
    paddingReadyRef.current = false;
    setPaddingReady(false);

    const cancelWhenStyleReady = whenMapStyleReady(map, () => {
      syncPaddingRef.current();
    });

    return () => {
      cancelWhenStyleReady();
    };
  }, [mapRef, enabled]);

  useEffect(() => {
    if (!mapRef || !enabled) {
      return;
    }

    syncPadding();
  }, [syncPadding, mapRef, enabled]);

  useEffect(() => {
    if (!mapRef || !enabled || liveSheetObscuredBottomPx === undefined) {
      return;
    }

    syncPaddingRef.current();
  }, [mapRef, enabled, liveSheetObscuredBottomPx]);

  useEffect(() => {
    if (!mapRef || !enabled) {
      return;
    }

    const map = mapRef.getMap();

    return () => {
      releaseMapInstanceCameraState(map);
      onMapInstanceReleasedRef.current?.();
    };
  }, [mapRef, enabled]);

  return { padding, paddingReady };
}
