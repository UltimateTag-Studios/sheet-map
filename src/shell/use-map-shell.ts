import type { SheetLayoutFrameChange, SheetSnap } from "@siegetag/sheet";
import { useCallback, useEffect, useRef, useSyncExternalStore } from "react";

import { type NavigateToMapCameraOptions, useMapUserTracking } from "../camera";
import type { MapPosition } from "../camera/shared/map-position";
import type { MapItemLocation } from "../items/types";
import type { SheetMotionPhase } from "../viewport";
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
  MapShellEnvironment,
  MapShellMachineEffect,
} from "./map-shell-machine";
import { useMapShellMachine } from "./map-shell-machine";
import type { RouteEnterFly } from "./map-shell-machine/route-enter-fly";
import { resolveEnterFlyZoom } from "./resolve-enter-fly-zoom";

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
    mapPaddingDebug: debug,
  });

  const flyToItem = useCallback(
    (
      location: MapItemLocation,
      options?: { enterFly?: boolean; zoom?: number },
    ) => {
      const resolvedZoom =
        options?.enterFly === true
          ? resolveEnterFlyZoom({
              explicitZoom: options.zoom,
              anchorZoom: userTracking.anchor?.zoom,
              defaultZoom: resolvedConfig.initialZoom,
            })
          : undefined;

      userTracking.dispatch({
        type: "navigateRequested",
        position: {
          lat: location.lat,
          lng: location.lng,
          ...(resolvedZoom !== undefined ? { zoom: resolvedZoom } : {}),
        },
        mode: "fly",
        preserveTracking: false,
        durationMs: resolvedConfig.smoothFlyDurationMs,
      });
    },
    [
      userTracking,
      resolvedConfig.initialZoom,
      resolvedConfig.smoothFlyDurationMs,
    ],
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
        case "flyToUser": {
          const zoom = resolveEnterFlyZoom({
            explicitZoom: effect.zoom,
            anchorZoom: userTracking.anchor?.zoom,
            defaultZoom: resolvedConfig.initialZoom,
          });
          userTracking.recenterOnUser(
            zoom !== undefined ? { zoom } : undefined,
          );
          break;
        }
      }
    },
    [flyToItem, userTracking, resolvedConfig.initialZoom],
  );

  const { state: machine, dispatch } = useMapShellMachine(handleMachineEffect);

  const userTrackingRef = useRef(userTracking);
  userTrackingRef.current = userTracking;

  const syncedMotionPhaseRef = useRef<SheetMotionPhase>("idle");

  const buildEnvironment = useCallback(
    (sheetMotionPhase: SheetMotionPhase): MapShellEnvironment => {
      const tracking = userTrackingRef.current;
      return {
        cameraSession: tracking.session,
        sheetMotionPhase,
        mapPaddingReady: tracking.mapPaddingReady,
        hasUserLocation: tracking.hasUserLocation,
      };
    },
    [],
  );

  const readEnvironment = useCallback((): MapShellEnvironment => {
    return {
      cameraSession: userTracking.session,
      sheetMotionPhase: sheetPhase,
      mapPaddingReady: userTracking.mapPaddingReady,
      hasUserLocation: userTracking.hasUserLocation,
    };
  }, [
    sheetPhase,
    userTracking.session,
    userTracking.mapPaddingReady,
    userTracking.hasUserLocation,
  ]);

  useEffect(() => {
    dispatch({
      type: "environmentSynced",
      environment: readEnvironment(),
    });
  }, [dispatch, readEnvironment]);

  const clearSelection = useCallback(() => {
    dispatch({ type: "clearSelection", dismissRouteEntry: true });
  }, [dispatch]);

  const navigateTo = useCallback(
    (position: MapPosition, options?: NavigateToMapCameraOptions) => {
      if (!options?.preserveTracking) {
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

  const reportRouteEnterFly = useCallback(
    (routeKey: string, entry: RouteEnterFly | null) => {
      dispatch({ type: "routeEnterFlyChanged", routeKey, entry });
    },
    [dispatch],
  );

  const handleSheetSnapChange = useCallback(
    (snap: SheetSnap) => {
      dispatch({
        type: "sheetReported",
        snap,
        phase: sheetPhaseRef.current,
        settled: false,
      });
    },
    [dispatch],
  );

  const handleSheetSnapSettled = useCallback(
    (snap: SheetSnap) => {
      dispatch({
        type: "sheetReported",
        snap,
        phase: "idle",
        settled: true,
      });
    },
    [dispatch],
  );

  /**
   * Sheet emits layout frame (authoritative phase) before `onSnapSettled`.
   * Sync camera + shell environment on phase transitions so pending flies run
   * with motion idle before the settled snap event completes selection.
   */
  const handleSheetLayoutFrameChange = useCallback(
    (frame: SheetLayoutFrameChange) => {
      onSheetLayoutFrameChange(frame);

      if (frame.phase === syncedMotionPhaseRef.current) {
        return;
      }

      syncedMotionPhaseRef.current = frame.phase;
      sheetPhaseRef.current = frame.phase;

      userTrackingRef.current.dispatch({
        type: "sheetPhaseChanged",
        phase: frame.phase,
      });

      dispatch({
        type: "environmentSynced",
        environment: buildEnvironment(frame.phase),
      });
    },
    [buildEnvironment, dispatch, onSheetLayoutFrameChange],
  );

  return {
    sheetSnap: machine.sheetSnap,
    handleSheetSnapChange,
    handleSheetSnapSettled,
    handleSheetLayoutFrameChange,
    mapRef,
    publishMapInstance,
    userLocation,
    viewport,
    selectedItemId: machine.selectedItemId,
    sheetMotionPhase: sheetPhase,
    selectItem,
    clearSelection,
    closeSheet,
    navigateTo,
    recenterOnUser,
    reportRouteEnterFly,
    tracking: userTracking.tracking,
    mapPaddingReady: userTracking.mapPaddingReady,
    userTracking,
    mapToken: accessToken,
    config: resolvedConfig,
  };
}
