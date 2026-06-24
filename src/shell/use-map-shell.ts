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
  MapShellMachineEvent,
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

  const physicalSnapRef = useRef<SheetSnap>("collapsed");
  const syncedMotionPhaseRef = useRef<SheetMotionPhase>("idle");
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

  const buildEnvironment = useCallback(
    (
      sheetMotionPhase: SheetMotionPhase,
      physicalSnap: SheetSnap,
    ): MapShellEnvironment => {
      const tracking = userTrackingRef.current;
      if (!tracking) {
        return {
          cameraSession: "idle",
          sheetMotionPhase,
          physicalSnap,
          mapPaddingReady: false,
          hasUserLocation: false,
        };
      }
      return {
        cameraSession: tracking.session,
        sheetMotionPhase,
        physicalSnap,
        mapPaddingReady: tracking.mapPaddingReady,
        hasUserLocation: tracking.hasUserLocation,
      };
    },
    [],
  );

  const syncEnvironment = useCallback(
    (sheetMotionPhase: SheetMotionPhase, physicalSnap: SheetSnap) => {
      dispatchRef.current({
        type: "environmentSynced",
        environment: buildEnvironment(sheetMotionPhase, physicalSnap),
      });
    },
    [buildEnvironment],
  );

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
  dispatchRef.current = dispatch;

  const readEnvironment = useCallback((): MapShellEnvironment => {
    return buildEnvironment(sheetPhase, physicalSnapRef.current);
  }, [
    buildEnvironment,
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
      physicalSnapRef.current = snap;
      sheetPhaseRef.current = "idle";
      syncedMotionPhaseRef.current = "idle";

      dispatch({
        type: "sheetReported",
        snap,
        phase: "idle",
        settled: true,
      });
    },
    [dispatch],
  );

  const handleSheetLayoutFrameChange = useCallback(
    (frame: SheetLayoutFrameChange) => {
      onSheetLayoutFrameChange(frame);

      physicalSnapRef.current = frame.restingSnap;

      if (frame.phase !== syncedMotionPhaseRef.current) {
        syncedMotionPhaseRef.current = frame.phase;
        sheetPhaseRef.current = frame.phase;

        userTrackingRef.current?.dispatch({
          type: "sheetPhaseChanged",
          phase: frame.phase,
        });
      }

      syncEnvironment(frame.phase, frame.restingSnap);
    },
    [onSheetLayoutFrameChange, syncEnvironment],
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
