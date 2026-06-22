import { useCallback, useReducer, useRef } from "react";

import {
  createInitialMapAnchorState,
  type MapAnchorEvent,
  reduceMapAnchor,
} from "../../anchor";
import { repositionCamera as applyRepositionCamera } from "../../movement";
import type { MapPosition } from "../../shared/map-position";
import { useBootFlyCoordinator } from "./boot-coordinator";
import { useMapInstanceRelease } from "./instance-release";
import { useMapAnchorListeners } from "./listeners";
import { useMapAnchorNavigate } from "./navigate";
import { useMapPaddingSync } from "./padding-sync";
import type { MapAnchorSessionRefs } from "./session-refs";
import { useMapAnchorSheetSettle } from "./sheet-settle";
import type { UseMapAnchorOptions } from "./types";

export function useMapAnchor({
  mapRef,
  enabled = true,
  liveSheetObscuredBottomPx,
  fixedChromeInsets,
  mapPaddingDebug = false,
  sheetPhase = "idle",
  bootTarget = null,
  bootDurationMs,
  onBootIssued,
  smoothFlyDurationMs = 600,
  follow = null,
  onReleaseFollow,
  followUser = false,
  followTarget = null,
  onMapInstanceReleased,
}: UseMapAnchorOptions) {
  const mapPaddingFromCanvasEnabled = liveSheetObscuredBottomPx !== undefined;

  const [state, dispatch] = useReducer(
    reduceMapAnchor,
    undefined,
    createInitialMapAnchorState,
  );

  const stateRef = useRef(state);
  stateRef.current = state;

  const dispatchAnchor = useCallback((event: MapAnchorEvent) => {
    stateRef.current = reduceMapAnchor(stateRef.current, event);
    dispatch(event);
  }, []);

  const sheetPhaseRef = useRef(sheetPhase);
  sheetPhaseRef.current = sheetPhase;

  const sheetMotionActiveRef = useRef(sheetPhase !== "idle");
  sheetMotionActiveRef.current = sheetPhase !== "idle";

  const followThresholdExceededRef = useRef(false);

  const session: MapAnchorSessionRefs = {
    stateRef,
    dispatch: dispatchAnchor,
    sheetPhaseRef,
    sheetMotionActiveRef,
  };

  const onPaddingReadyRef = useRef<(() => void) | undefined>(undefined);

  const padding = useMapPaddingSync({
    mapRef,
    enabled,
    mapPaddingFromCanvasEnabled,
    liveSheetObscuredBottomPx,
    fixedChromeInsets,
    mapPaddingDebug,
    session,
    followUser,
    followTarget,
    onPaddingReady: () => onPaddingReadyRef.current?.(),
  });

  const { navigateTo, navigateToRef } = useMapAnchorNavigate({
    mapRef,
    mapPaddingDebug,
    session,
    refreshMapPaddingFromCanvasRef: padding.refreshMapPaddingFromCanvasRef,
    followThresholdExceededRef,
    onReleaseFollow,
  });

  const { attemptBoot } = useBootFlyCoordinator({
    mapRef,
    enabled,
    bootTarget,
    bootDurationMs,
    smoothFlyDurationMs,
    mapPaddingReadyRef: padding.mapPaddingReadyRef,
    navigateToRef,
    onBootIssued,
    mapPaddingDebug,
  });
  onPaddingReadyRef.current = attemptBoot;

  useMapAnchorSheetSettle({
    mapRef,
    enabled,
    sheetPhase,
    session,
  });

  useMapInstanceRelease({
    mapRef,
    enabled,
    onMapInstanceReleased,
  });

  useMapAnchorListeners({
    mapRef,
    enabled,
    session,
    follow,
    onReleaseFollow,
    smoothFlyDurationMs,
    navigateToRef,
    followThresholdExceededRef,
  });

  const setAnchor = useCallback(
    (position: MapPosition) => {
      dispatchAnchor({ type: "setAnchor", position });
    },
    [dispatchAnchor],
  );

  const repositionCamera = useCallback(
    (position: MapPosition): boolean => {
      if (!mapRef) {
        return false;
      }

      return applyRepositionCamera({
        mapRef,
        position,
        currentAnchor: stateRef.current.anchor,
        updateAnchor: (anchorPosition) => {
          dispatchAnchor({ type: "setAnchor", position: anchorPosition });
        },
      });
    },
    [mapRef, dispatchAnchor],
  );

  return {
    anchor: state.anchor,
    session: state.session,
    navigationIntent: state.navigationIntent,
    /** Last Mapbox padding applied from live sheet DOM. */
    mapPadding: padding.mapPadding,
    /** True after the first successful `setPadding` from live sheet DOM. */
    mapPaddingReady: padding.mapPaddingReady,
    setAnchor,
    navigateTo,
    repositionCamera,
  };
}
