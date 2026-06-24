import type { SheetSnap } from "@siegetag/sheet";
import { useCallback, useEffect, useRef, useSyncExternalStore } from "react";

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
import type { MapShellEnvironment } from "./map-shell-machine";
import { useMapShellMachine } from "./map-shell-machine";

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

  const sheetPhaseRef = useRef(sheetPhase);
  sheetPhaseRef.current = sheetPhase;

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

  const readEnvironment = useCallback((): MapShellEnvironment => {
    return {
      cameraSession: userTracking.session,
      sheetMotionPhase: sheetPhase,
    };
  }, [userTracking.session, sheetPhase]);

  const flyToItem = useCallback(
    (location: MapItemLocation) => {
      userTracking.dispatch({
        type: "navigateRequested",
        position: { lat: location.lat, lng: location.lng },
        mode: "fly",
        preserveTracking: false,
        durationMs: resolvedConfig.smoothFlyDurationMs,
      });
    },
    [userTracking.dispatch, resolvedConfig.smoothFlyDurationMs],
  );

  const { state: machine, dispatch } = useMapShellMachine(flyToItem);

  useEffect(() => {
    dispatch({
      type: "environmentSynced",
      environment: readEnvironment(),
    });
  }, [dispatch, readEnvironment]);

  const clearSelection = useCallback(() => {
    dispatch({ type: "clearSelection" });
  }, [dispatch]);

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
      dispatch({ type: "selectItem", id, location });
    },
    [dispatch],
  );

  const closeSheet = useCallback(() => {
    dispatch({ type: "dismissSheet" });
  }, [dispatch]);

  const handleSheetSnapChange = useCallback(
    (snap: SheetSnap) => {
      dispatch({
        type: "sheetReported",
        snap,
        phase: sheetPhaseRef.current,
      });
    },
    [dispatch],
  );

  const handleSheetSnapSettled = useCallback(
    (snap: SheetSnap) => {
      dispatch({ type: "sheetReported", snap, phase: "idle" });
    },
    [dispatch],
  );

  return {
    sheetSnap: machine.sheetSnap,
    handleSheetSnapChange,
    handleSheetSnapSettled,
    onSheetLayoutFrameChange,
    mapRef,
    publishMapInstance,
    userLocation,
    viewport,
    selectedItemId: machine.selectedItemId,
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
