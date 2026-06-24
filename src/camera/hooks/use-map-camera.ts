import {
  type RefObject,
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
} from "react";

import {
  useMapboxListeners,
  useMapInstanceLifecycle,
  usePaddingDomSync,
} from "../adapters";
import { isAtMapAnchorPosition } from "../lib";
import {
  type MapCameraMachineDispatch,
  type MapCameraMachineEffect,
  useMapCameraMachine,
} from "../machine";
import type { MapCameraState } from "../machine/state";
import { moveCameraProgrammatic } from "../movement";
import { canNavigateMap } from "../shared/can-navigate-map";
import type { MapPosition } from "../shared/map-position";
import type {
  MapCameraBootRequest,
  NavigateToMapAnchorOptions,
  UseMapCameraOptions,
} from "./types";

export type {
  MapCameraBootRequest,
  NavigateToMapAnchorOptions,
  UseMapCameraOptions,
} from "./types";

function areBootFlyGatesReady(input: {
  enabled: boolean;
  mapRef: UseMapCameraOptions["mapRef"];
  bootRequest: MapCameraBootRequest | null | undefined;
  mapPaddingReady: boolean;
}): boolean {
  return Boolean(
    input.enabled && input.mapRef && input.bootRequest && input.mapPaddingReady,
  );
}

export function useMapCamera({
  mapRef,
  enabled = true,
  liveSheetObscuredBottomPx,
  fixedChromeInsets,
  mapPaddingDebug = false,
  sheetPhase = "idle",
  bootRequest = null,
  bootDurationMs,
  smoothFlyDurationMs = 600,
  onReleaseTracking,
  onMapInstanceReleased,
}: UseMapCameraOptions) {
  const mapPaddingFromCanvasEnabled = liveSheetObscuredBottomPx !== undefined;
  const bootFlyDurationMs = bootDurationMs ?? smoothFlyDurationMs;

  const onReleaseTrackingRef = useRef(onReleaseTracking);
  onReleaseTrackingRef.current = onReleaseTracking;

  const machineStateRef = useRef<RefObject<MapCameraState> | null>(null);

  const runEffect = useCallback(
    (effect: MapCameraMachineEffect) => {
      const stateRef = machineStateRef.current;
      if (!mapRef || !stateRef) {
        return;
      }

      switch (effect.type) {
        case "moveCamera": {
          if (!canNavigateMap(mapRef)) {
            return;
          }

          moveCameraProgrammatic({
            mapRef,
            position: effect.position,
            duration: effect.duration,
            currentAnchor: stateRef.current.anchor,
          });
          break;
        }

        case "applyPadding": {
          const map = mapRef.getMap();
          map.setPadding(effect.options);

          if (
            effect.realign &&
            stateRef.current.anchor &&
            stateRef.current.session !== "userGesture"
          ) {
            moveCameraProgrammatic({
              mapRef,
              position: stateRef.current.anchor,
              duration: 0,
              stopUserMotion: false,
              currentAnchor: stateRef.current.anchor,
            });
          }

          if (mapPaddingDebug) {
            console.info("[map-padding] applyPadding", effect);
          }
          break;
        }

        case "releaseTracking": {
          onReleaseTrackingRef.current?.();
          break;
        }
      }
    },
    [mapRef, mapPaddingDebug],
  );

  const { state, stateRef, dispatch } = useMapCameraMachine(runEffect, {
    enabled,
    sheetPhase,
    flyDurationMs: smoothFlyDurationMs,
    bootFlyDurationMs,
    paddingFromCanvasEnabled: mapPaddingFromCanvasEnabled,
  });

  machineStateRef.current = stateRef;

  const mapPaddingReady =
    !mapPaddingFromCanvasEnabled || state.padding.phase === "ready";

  const attemptBoot = useCallback(() => {
    if (!bootRequest) {
      return;
    }

    if (
      !areBootFlyGatesReady({
        enabled,
        mapRef,
        bootRequest,
        mapPaddingReady:
          !mapPaddingFromCanvasEnabled ||
          stateRef.current.padding.phase === "ready",
      })
    ) {
      return;
    }

    if (stateRef.current.boot === "done") {
      return;
    }

    if (mapPaddingDebug) {
      console.info("[boot-fly] attempt", { target: bootRequest.position });
    }

    dispatch({
      type: "bootTargetReady",
      position: bootRequest.position,
      follow: bootRequest.follow,
      positionKey: bootRequest.positionKey,
    });
  }, [
    bootRequest,
    enabled,
    mapRef,
    mapPaddingFromCanvasEnabled,
    mapPaddingDebug,
    dispatch,
    stateRef,
  ]);

  const attemptBootRef = useRef(attemptBoot);
  attemptBootRef.current = attemptBoot;

  useLayoutEffect(() => {
    attemptBoot();
  }, [attemptBoot]);

  const prevSheetPhaseRef = useRef(sheetPhase);

  useEffect(() => {
    const previous = prevSheetPhaseRef.current;
    if (previous === sheetPhase) {
      return;
    }

    dispatch({ type: "sheetPhaseChanged", phase: sheetPhase });

    if (sheetPhase === "idle" && previous !== "idle" && mapRef) {
      const map = mapRef.getMap();
      const anchor = stateRef.current.anchor;
      dispatch({
        type: "mapIdle",
        isMoving: map.isMoving(),
        atAnchor: anchor !== null && isAtMapAnchorPosition(map, anchor),
      });
    }

    prevSheetPhaseRef.current = sheetPhase;
  }, [sheetPhase, mapRef, dispatch, stateRef]);

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
    onPaddingReady: () => attemptBootRef.current(),
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
      options: NavigateToMapAnchorOptions = {},
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
        preserveTracking: options.keepTracking === true,
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
