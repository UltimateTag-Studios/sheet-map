import type { SheetSnap } from "@siegetag/sheet";
import { useCallback, useState, useSyncExternalStore } from "react";

import { type NavigateToMapAnchorOptions, useMapUserTracking } from "../camera";
import type { MapPosition } from "../camera/shared/map-position";
import {
  useLiveSheetObscuredBottomPx,
  useMapVisibleViewportSync,
} from "../viewport";
import {
  defaultMapShellConfig,
  type MapShellConfig,
  type MapUserLocationCoords,
} from "./config";
import type { MapInstanceStore } from "./map-instance-store";

export type MapItemLocation = {
  lat: number;
  lng: number;
};

export type UseMapShellOptions = {
  mapInstanceStore: MapInstanceStore;
  accessToken: string;
  userLocation?: MapUserLocationCoords | null;
  config?: MapShellConfig;
};

export function useMapShell({
  mapInstanceStore,
  accessToken,
  userLocation = null,
  config = {},
}: UseMapShellOptions) {
  const resolvedConfig = { ...defaultMapShellConfig, ...config };
  const debug = config.debug === true;

  const [sheetSnap, setSheetSnap] = useState<SheetSnap>("collapsed");
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);

  const mapRef = useSyncExternalStore(
    mapInstanceStore.subscribe,
    mapInstanceStore.getMapRef,
    () => null,
  );

  const publishMapInstance = useCallback(
    (ref: Parameters<MapInstanceStore["setMapRef"]>[0]) => {
      mapInstanceStore.setMapRef(ref);
      if (ref && debug) {
        console.info("[map-shell] mapRef ready");
      }
    },
    [mapInstanceStore, debug],
  );

  const { sheetObscuredBottomPx, sheetPhase, onSheetLayoutFrameChange } =
    useLiveSheetObscuredBottomPx(mapRef);

  const viewport = useMapVisibleViewportSync({
    mapRef,
    liveSheetObscuredBottomPx: sheetObscuredBottomPx,
    fixedChromeInsets: config.fixedChromeInsets,
    debug,
  });

  const userTracking = useMapUserTracking({
    mapRef,
    userLocation,
    liveSheetObscuredBottomPx: sheetObscuredBottomPx,
    sheetPhase,
    centerOffset: viewport.centerOffset,
    fixedChromeInsets: config.fixedChromeInsets,
    trackingReleaseThresholdPx: resolvedConfig.trackingReleaseThresholdPx,
    smoothFlyDurationMs: resolvedConfig.smoothFlyDurationMs,
    bootZoom: resolvedConfig.initialZoom,
    mapPaddingDebug: debug,
  });

  const clearSelection = useCallback(() => {
    setSelectedItemId(null);
  }, []);

  const navigateTo = useCallback(
    (position: MapPosition, options?: NavigateToMapAnchorOptions) => {
      if (!options?.keepTracking) {
        clearSelection();
      }
      userTracking.navigateTo(position, options);
    },
    [clearSelection, userTracking],
  );

  const recenterOnUser = useCallback(() => {
    clearSelection();
    userTracking.recenterOnUser();
  }, [clearSelection, userTracking]);

  const selectItem = useCallback(
    (id: string, location: MapItemLocation | null) => {
      setSelectedItemId(id);
      setSheetSnap("half");
      if (location) {
        userTracking.navigateTo(
          { lat: location.lat, lng: location.lng },
          {
            duration: resolvedConfig.smoothFlyDurationMs,
            keepTracking: false,
          },
        );
      }
    },
    [userTracking, resolvedConfig.smoothFlyDurationMs],
  );

  const handleSheetSnapChange = useCallback((snap: SheetSnap) => {
    setSheetSnap(snap);
  }, []);

  const handleSheetSnapSettled = useCallback(
    (snap: SheetSnap) => {
      if (snap === "collapsed") {
        clearSelection();
      }
    },
    [clearSelection],
  );

  return {
    sheetSnap,
    handleSheetSnapChange,
    handleSheetSnapSettled,
    onSheetLayoutFrameChange,
    mapRef,
    publishMapInstance,
    userLocation,
    viewport,
    selectedItemId,
    selectItem,
    clearSelection,
    navigateTo,
    recenterOnUser,
    tracking: userTracking.tracking,
    mapPaddingReady: userTracking.mapPaddingReady,
    userTracking,
    mapToken: accessToken,
    config: resolvedConfig,
  };
}
