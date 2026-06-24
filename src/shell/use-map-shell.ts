import type { SheetLayoutFrameChange, SheetSnap } from "@siegetag/sheet";
import { useCallback, useEffect, useRef, useSyncExternalStore } from "react";

import { type NavigateToMapCameraOptions, useMapUserTracking } from "../camera";
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
import type {
  MapShellCameraSnapshot,
  MapShellMachineEffect,
  MapShellMachineEvent,
} from "./map-shell-machine";
import { useMapShellMachine } from "./map-shell-machine";
import type { RouteEnterFly } from "./map-shell-machine/route-enter-fly";

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

  const dispatchRef = useRef<(event: MapShellMachineEvent) => void>(() => {});
  const userTrackingRef = useRef<
    ReturnType<typeof useMapUserTracking> | undefined
  >(undefined);

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
    mapPaddingDebug: debug,
  });

  userTrackingRef.current = userTracking;

  const buildCameraSnapshot = useCallback((): MapShellCameraSnapshot => {
    const tracking = userTrackingRef.current;
    if (!tracking) {
      return {
        cameraSession: "idle",
        mapPaddingReady: false,
        hasUserLocation: false,
        anchorZoom: null,
        defaultEnterFlyZoom: resolvedConfig.initialZoom,
      };
    }
    return {
      cameraSession: tracking.session,
      mapPaddingReady: tracking.mapPaddingReady,
      hasUserLocation: tracking.hasUserLocation,
      anchorZoom: tracking.anchor?.zoom ?? null,
      defaultEnterFlyZoom: resolvedConfig.initialZoom,
    };
  }, [resolvedConfig.initialZoom]);

  const flyToItem = useCallback(
    (
      location: MapItemLocation,
      options?: { enterFly?: boolean; zoom?: number },
    ) => {
      userTracking.dispatch({
        type: "navigateRequested",
        position: {
          lat: location.lat,
          lng: location.lng,
          ...(options?.zoom !== undefined ? { zoom: options.zoom } : {}),
        },
        mode: "fly",
        preserveTracking: false,
        durationMs: resolvedConfig.smoothFlyDurationMs,
      });
    },
    [userTracking, resolvedConfig.smoothFlyDurationMs],
  );

  const handleMachineEffect = useCallback(
    (effect: MapShellMachineEffect) => {
      switch (effect.type) {
        case "flyToItem":
          flyToItem(effect.location, {
            enterFly: effect.enterFly,
            zoom: effect.zoom,
          });
          break;
        case "flyToUser":
          userTracking.recenterOnUser(
            effect.zoom !== undefined ? { zoom: effect.zoom } : undefined,
          );
          break;
        case "flyToPosition":
          userTracking.navigateTo(effect.position, {
            duration: effect.duration,
            preserveTracking: effect.preserveTracking,
          });
          break;
        case "syncCameraSheetPhase":
          userTracking.dispatch({
            type: "sheetPhaseChanged",
            phase: effect.phase,
          });
          break;
      }
    },
    [flyToItem, userTracking],
  );

  const { state: machine, dispatch } = useMapShellMachine(handleMachineEffect);
  dispatchRef.current = dispatch;

  useEffect(() => {
    dispatch({
      type: "cameraSnapshotSynced",
      snapshot: buildCameraSnapshot(),
    });
  }, [
    dispatch,
    buildCameraSnapshot,
    userTracking.session,
    userTracking.mapPaddingReady,
    userTracking.hasUserLocation,
    userTracking.anchor?.zoom,
  ]);

  const clearSelection = useCallback(() => {
    dispatch({ type: "clearSelection", dismissRouteEntry: true });
  }, [dispatch]);

  const navigateTo = useCallback(
    (position: MapPosition, options?: NavigateToMapCameraOptions) => {
      dispatch({ type: "navigateTo", position, options });
    },
    [dispatch],
  );

  const recenterUser = useCallback(() => {
    dispatch({ type: "recenterUser" });
  }, [dispatch]);

  const selectItem = useCallback(
    (id: string, location: MapItemLocation | null) => {
      dispatch({ type: "selectItem", id, location });
    },
    [dispatch],
  );

  const closeSheet = useCallback(() => {
    dispatch({ type: "dismissSheet" });
  }, [dispatch]);

  const reportRouteEnterFly = useCallback(
    (routeKey: string, entry: RouteEnterFly | null) => {
      dispatch({ type: "routeEnterFlyChanged", routeKey, entry });
    },
    [dispatch],
  );

  const handleSheetSnapSettled = useCallback(
    (snap: SheetSnap) => {
      dispatch({ type: "sheetSettled", snap });
    },
    [dispatch],
  );

  const handleSheetLayoutFrameChange = useCallback(
    (frame: SheetLayoutFrameChange) => {
      onSheetLayoutFrameChange(frame);
      dispatch({
        type: "sheetLayoutFrameChanged",
        phase: frame.phase,
        restingSnap: frame.restingSnap,
      });
    },
    [dispatch, onSheetLayoutFrameChange],
  );

  return {
    sheetSnap: machine.commandedSnap,
    handleSheetSnapSettled,
    handleSheetLayoutFrameChange,
    mapRef,
    publishMapInstance,
    userLocation,
    viewport,
    selectedItemId: machine.selectedItemId,
    selectItem,
    clearSelection,
    closeSheet,
    navigateTo,
    recenterUser,
    reportRouteEnterFly,
    tracking: userTracking.tracking,
    mapPaddingReady: userTracking.mapPaddingReady,
    userTracking,
    mapToken: accessToken,
    config: resolvedConfig,
  };
}
