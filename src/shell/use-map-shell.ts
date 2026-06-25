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
import { sheetPropSnap, useMapShellMachine } from "./map-shell-machine";
import type { RouteEnterFly } from "./map-shell-machine/route-enter-fly";
import { runMapShellMachineEffect } from "./run-map-shell-effect";

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
    return {
      cameraSession: userTracking.session,
      mapPaddingReady: userTracking.mapPaddingReady,
      hasUserLocation: userTracking.hasUserLocation,
      anchorZoom: userTracking.anchor?.zoom ?? null,
      defaultEnterFlyZoom: resolvedConfig.initialZoom,
    };
  }, [
    userTracking.session,
    userTracking.mapPaddingReady,
    userTracking.hasUserLocation,
    userTracking.anchor?.zoom,
    resolvedConfig.initialZoom,
  ]);

  const flyToItem = useCallback(
    (
      location: MapItemLocation,
      options?: { enterFly?: boolean; zoom?: number },
    ) => {
      userTrackingRef.current?.dispatch({
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
    [resolvedConfig.smoothFlyDurationMs],
  );

  const handleMachineEffect = useCallback(
    (effect: MapShellMachineEffect) => {
      if (debug) {
        console.info("[map-shell] effect", effect);
      }
      runMapShellMachineEffect(effect, {
        flyToItem,
        userTrackingRef,
      });
    },
    [flyToItem, debug],
  );

  const { state: machine, dispatch: machineDispatch } =
    useMapShellMachine(handleMachineEffect);

  const dispatch = useCallback(
    (event: MapShellMachineEvent) => {
      if (debug) {
        console.info("[map-shell] dispatch", event);
      }
      machineDispatch(event);
    },
    [machineDispatch, debug],
  );
  dispatchRef.current = dispatch;

  useEffect(() => {
    dispatch({
      type: "cameraSnapshotSynced",
      snapshot: buildCameraSnapshot(),
    });
  }, [dispatch, buildCameraSnapshot]);

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
    (id: string, location: MapItemLocation) => {
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

  const handleSheetSnapChangeStarted = useCallback(
    (snap: SheetSnap) => {
      dispatch({ type: "sheetSnapChangeStarted", snap });
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
    sheetSnap: sheetPropSnap(machine),
    handleSheetSnapChangeStarted,
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
