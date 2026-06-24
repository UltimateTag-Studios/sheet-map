import type { SheetSnap } from "@siegetag/sheet";
import {
  useCallback,
  useEffect,
  useReducer,
  useRef,
  useSyncExternalStore,
} from "react";

import { type NavigateToMapAnchorOptions, useMapUserTracking } from "../camera";
import type { MapPosition } from "../camera/shared/map-position";
import type { MapItemLocation } from "../items/types";
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
import {
  createInitialMapShellSelectionState,
  isFlyingToItem,
  reduceMapShellSelection,
} from "./map-shell-machine";

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

  const [selection, dispatch] = useReducer(
    reduceMapShellSelection,
    undefined,
    createInitialMapShellSelectionState,
  );

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

  const flyToSelectedItem = useCallback(
    (location: MapItemLocation) => {
      userTracking.navigateTo(
        { lat: location.lat, lng: location.lng },
        {
          duration: resolvedConfig.smoothFlyDurationMs,
          keepTracking: false,
        },
      );
    },
    [userTracking, resolvedConfig.smoothFlyDurationMs],
  );

  const flyToSelectedItemRef = useRef(flyToSelectedItem);
  flyToSelectedItemRef.current = flyToSelectedItem;

  const itemSelectFlyStartedRef = useRef(false);

  const clearSelection = useCallback(() => {
    dispatch({ type: "clearSelection" });
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
      const sheetWasOpenAtHalf = selection.sheetSnap === "half";
      const flyImmediately =
        location !== null && sheetWasOpenAtHalf && sheetPhase === "idle";
      const deferSheetOpen =
        location !== null && !sheetWasOpenAtHalf && sheetPhase === "idle";

      dispatch({
        type: "selectItem",
        id,
        location,
        flyImmediately,
        deferSheetOpen,
      });

      if (flyImmediately && location) {
        flyToSelectedItem(location);
      }
    },
    [flyToSelectedItem, selection.sheetSnap, sheetPhase],
  );

  useEffect(() => {
    if (!isFlyingToItem(selection.itemSelectCamera)) {
      itemSelectFlyStartedRef.current = false;
      return;
    }

    itemSelectFlyStartedRef.current = false;
    flyToSelectedItemRef.current(selection.itemSelectCamera.location);
  }, [selection.itemSelectCamera]);

  useEffect(() => {
    if (!isFlyingToItem(selection.itemSelectCamera)) {
      return;
    }

    if (userTracking.session === "flying") {
      itemSelectFlyStartedRef.current = true;
      return;
    }

    if (userTracking.session === "idle" && itemSelectFlyStartedRef.current) {
      dispatch({ type: "flyCompletedOpenSheet" });
    }
  }, [userTracking.session, selection.itemSelectCamera]);

  const closeSheet = useCallback(() => {
    dispatch({ type: "closeSheet" });
  }, []);

  const handleSheetSnapChange = useCallback((snap: SheetSnap) => {
    dispatch({ type: "sheetSnapChange", snap });
  }, []);

  const handleSheetSnapSettled = useCallback((snap: SheetSnap) => {
    if (snap === "collapsed") {
      dispatch({ type: "closeSheet" });
      return;
    }
    dispatch({ type: "sheetSnapSettled", snap });
  }, []);

  return {
    sheetSnap: selection.sheetSnap,
    handleSheetSnapChange,
    handleSheetSnapSettled,
    onSheetLayoutFrameChange,
    mapRef,
    publishMapInstance,
    userLocation,
    viewport,
    selectedItemId: selection.selectedItemId,
    selectItem,
    clearSelection,
    closeSheet,
    navigateTo,
    recenterOnUser,
    tracking: userTracking.tracking,
    mapPaddingReady: userTracking.mapPaddingReady,
    userTracking,
    mapToken: accessToken,
    config: resolvedConfig,
  };
}
