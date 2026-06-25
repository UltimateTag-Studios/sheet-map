import { type RefObject, useCallback, useLayoutEffect, useRef } from "react";

import {
  useMapboxListeners,
  useMapInstanceLifecycle,
  usePaddingDomSync,
} from "../adapters";
import {
  type MapCameraMachineDispatch,
  type MapCameraMachineEffect,
  useMapCameraMachine,
} from "../machine";
import type { MapCameraState } from "../machine/state";
import type { MapPosition } from "../shared/map-position";
import { runMapCameraMachineEffect } from "./run-map-camera-effect";
import type { NavigateToMapCameraOptions, UseMapCameraOptions } from "./types";

export type {
  MapCameraBootRequest,
  NavigateToMapCameraOptions,
  UseMapCameraOptions,
} from "./types";

export function useMapCamera({
  mapRef,
  enabled = true,
  liveSheetObscuredBottomPx,
  fixedChromeInsets,
  mapPaddingDebug = false,
  bootRequest = null,
  bootDurationMs,
  smoothFlyDurationMs = 600,
  onReleaseTracking,
  onMapInstanceReleased,
  onNotifyShell,
}: UseMapCameraOptions) {
  const mapPaddingFromCanvasEnabled = liveSheetObscuredBottomPx !== undefined;
  const bootFlyDurationMs = bootDurationMs ?? smoothFlyDurationMs;

  const onReleaseTrackingRef = useRef(onReleaseTracking);
  onReleaseTrackingRef.current = onReleaseTracking;

  const onNotifyShellRef = useRef(onNotifyShell);
  onNotifyShellRef.current = onNotifyShell;

  const machineStateRef = useRef<RefObject<MapCameraState> | null>(null);

  const runEffect = useCallback(
    (effect: MapCameraMachineEffect) => {
      runMapCameraMachineEffect(effect, {
        mapRef,
        machineStateRef: machineStateRef,
        mapPaddingDebug,
        onReleaseTrackingRef,
        onNotifyShellRef,
      });
    },
    [mapRef, mapPaddingDebug],
  );

  const { state, stateRef, dispatch } = useMapCameraMachine(runEffect, {
    enabled,
    flyDurationMs: smoothFlyDurationMs,
    bootFlyDurationMs,
    paddingFromCanvasEnabled: mapPaddingFromCanvasEnabled,
  });

  machineStateRef.current = stateRef;

  const mapPaddingReady =
    !mapPaddingFromCanvasEnabled || state.padding.phase === "ready";

  useLayoutEffect(() => {
    if (!bootRequest || !enabled || !mapRef) {
      return;
    }

    if (stateRef.current.boot !== "none") {
      return;
    }

    dispatch({
      type: "bootTargetReady",
      position: bootRequest.position,
      follow: bootRequest.follow,
      positionKey: bootRequest.positionKey,
    });
  }, [bootRequest, enabled, mapRef, dispatch, stateRef]);

  useMapboxListeners({
    mapRef,
    enabled,
    dispatch,
    stateRef,
  });

  usePaddingDomSync({
    mapRef,
    enabled,
    mapPaddingFromCanvasEnabled,
    liveSheetObscuredBottomPx,
    fixedChromeInsets,
    mapPaddingDebug,
    dispatch,
    stateRef,
  });

  useMapInstanceLifecycle({
    mapRef,
    enabled,
    dispatch,
    onMapInstanceReleased,
  });

  const navigateTo = useCallback(
    (
      position: MapPosition,
      options: NavigateToMapCameraOptions = {},
    ): boolean => {
      if (!mapRef) {
        return false;
      }

      const requestedDuration = options.duration ?? 0;
      const mode = requestedDuration > 0 ? "fly" : "jump";

      if (mapPaddingDebug) {
        console.info(`[map-navigate] ${mode}`, {
          duration: requestedDuration,
          sheetPhase: stateRef.current.sheetPhase,
        });
      }

      dispatch({
        type: "navigateRequested",
        position,
        mode,
        preserveTracking: options.preserveTracking === true,
        durationMs: requestedDuration > 0 ? requestedDuration : undefined,
      });

      return true;
    },
    [mapRef, mapPaddingDebug, dispatch, stateRef],
  );

  const readCameraSession = useCallback(
    () => stateRef.current.session,
    [stateRef],
  );

  return {
    anchor: state.anchor,
    session: state.session,
    boot: state.boot,
    tracking: state.tracking === "on",
    readCameraSession,
    mapPadding: state.padding.options,
    mapPaddingReady,
    navigateTo,
    dispatch,
  };
}

export type MapCameraDispatch = MapCameraMachineDispatch;
