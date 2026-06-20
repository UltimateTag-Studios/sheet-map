import {
  FALLBACK_COLLAPSED_HEIGHT_PX,
  FALLBACK_FULL_HEIGHT_PX,
  type SheetSnap,
} from "@siegetag/sheet";
import { useCallback, useState, useSyncExternalStore } from "react";

import type { MapCameraAnchor } from "../camera/map-camera-anchor";
import type { MapCameraIntent } from "../camera/map-camera-intent";
import { resetUserCameraMotionOnFulfilled } from "../camera/reset-user-camera-motion-on-fulfilled";
import { useMapUserLocationFollow } from "../camera/use-map-user-location-follow";
import type { MapViewportSyncState } from "../canvas/viewport/use-map-viewport-sync";
import { useMapViewportSync } from "../canvas/viewport/use-map-viewport-sync";
import {
  defaultMapShellConfig,
  type MapShellConfig,
  type MapUserLocationCoords,
} from "./config";
import type { MapInstanceStore } from "./map-instance-store";

export type UseMapShellOptions = {
  mapInstanceStore: MapInstanceStore;
  accessToken: string;
  userLocation?: MapUserLocationCoords;
  config?: MapShellConfig;
};

export function useMapShell({
  mapInstanceStore,
  accessToken,
  userLocation,
  config = {},
}: UseMapShellOptions) {
  const resolvedConfig = { ...defaultMapShellConfig, ...config };
  const debug = config.debug === true;

  const [sheetSnap, setSheetSnapState] = useState<SheetSnap>("collapsed");
  const [isDraggingSheet, setIsDraggingSheet] = useState(false);
  const [collapsedHeightPx, setCollapsedHeightPx] = useState(
    FALLBACK_COLLAPSED_HEIGHT_PX,
  );
  const [fullHeightPx, setFullHeightPx] = useState(FALLBACK_FULL_HEIGHT_PX);
  const [selectedPointId, setSelectedPointId] = useState<string | null>(null);
  const [cameraAnchor, setCameraAnchor] = useState<MapCameraAnchor>({
    kind: "user",
    motion: "smooth",
  });
  const [followUser, setFollowUser] = useState(true);
  const [cameraEpoch, setCameraEpoch] = useState(0);

  const mapRef = useSyncExternalStore(
    mapInstanceStore.subscribe,
    mapInstanceStore.getMapRef,
    () => null,
  );

  const viewportSettled = !isDraggingSheet;

  const bumpCamera = useCallback(() => {
    setCameraEpoch((value) => value + 1);
  }, []);

  const publishMapInstance = useCallback(
    (ref: Parameters<MapInstanceStore["setMapRef"]>[0]) => {
      mapInstanceStore.setMapRef(ref);
      if (ref && debug) {
        console.info("[map-shell] mapRef ready");
      }
    },
    [mapInstanceStore, debug],
  );

  const viewport: MapViewportSyncState = useMapViewportSync({
    mapRef,
    sheetSnap,
    collapsedHeightPx,
    fullHeightPx,
    halfSnapFraction: resolvedConfig.halfSnapFraction,
    settled: viewportSettled,
    fixedChromeInsets: config.fixedChromeInsets,
    debug,
  });

  const handleSnapHeightsChange = useCallback(
    (heights: { collapsedHeightPx: number; fullHeightPx: number }) => {
      setCollapsedHeightPx(heights.collapsedHeightPx);
      setFullHeightPx(heights.fullHeightPx);
    },
    [],
  );

  const handleSheetSnapChange = useCallback((snap: SheetSnap) => {
    setSheetSnapState(snap);
  }, []);

  const selectPoint = useCallback((id: string, hasLocation: boolean) => {
    setSelectedPointId(id);
    setCameraAnchor(hasLocation ? { kind: "point", id } : null);
    setFollowUser(false);
    setSheetSnapState("half");
  }, []);

  const setPointId = useCallback((id: string) => {
    setSelectedPointId(id);
  }, []);

  const recenterUserSmooth = useCallback(() => {
    setCameraAnchor({ kind: "user", motion: "smooth" });
    setFollowUser(true);
    bumpCamera();
  }, [bumpCamera]);

  const resetUserCameraMotion = useCallback(() => {
    setCameraAnchor((current) =>
      current?.kind === "user" && current.motion === "smooth"
        ? { kind: "user" }
        : current,
    );
  }, []);

  const stopFollowingUser = useCallback(() => {
    setFollowUser(false);
    setCameraAnchor(null);
  }, []);

  const clearPointSelection = useCallback(() => {
    setSelectedPointId(null);
    setCameraAnchor((current) => (current?.kind === "point" ? null : current));
  }, []);

  const dismissPointSelection = useCallback(() => {
    clearPointSelection();
    setSheetSnapState("collapsed");
  }, [clearPointSelection]);

  const startFollowingUser = useCallback(() => {
    dismissPointSelection();
    recenterUserSmooth();
  }, [dismissPointSelection, recenterUserSmooth]);

  const handleCameraFulfilled = useCallback(
    (fulfilledIntent: MapCameraIntent) => {
      resetUserCameraMotionOnFulfilled(fulfilledIntent, resetUserCameraMotion);
    },
    [resetUserCameraMotion],
  );

  useMapUserLocationFollow({
    mapRef,
    userLocation,
    cameraAnchor,
    followUser,
    viewport,
    recenterUserSmooth,
    stopFollowingUser,
    followThresholdPx: resolvedConfig.followThresholdPx,
  });

  return {
    sheetSnap,
    setSheetSnap: setSheetSnapState,
    handleSheetSnapChange,
    isDraggingSheet,
    setIsDraggingSheet,
    collapsedHeightPx,
    fullHeightPx,
    handleSnapHeightsChange,
    mapRef,
    publishMapInstance,
    userLocation,
    viewport,
    viewportSettled,
    selectedPointId,
    cameraAnchor,
    followUser,
    cameraEpoch,
    bumpCamera,
    handleCameraFulfilled,
    selectPoint,
    setPointId,
    startFollowingUser,
    stopFollowingUser,
    clearPointSelection,
    dismissPointSelection,
    resetUserCameraMotion,
    mapToken: accessToken,
    config: resolvedConfig,
  };
}
