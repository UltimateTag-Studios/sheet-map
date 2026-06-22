import { useCallback, useReducer, useRef } from "react";

import { createInitialMapAnchorState, reduceMapAnchor } from "../anchor";
import type { MapPosition } from "../map-position";
import type { MapAnchorSessionRefs } from "./session-refs";
import type { UseMapAnchorOptions } from "./types";
import { useBootFlyCoordinator } from "./use-boot-fly-coordinator";
import { useMapAnchorListeners } from "./use-map-anchor-listeners";
import { useMapAnchorNavigate } from "./use-map-anchor-navigate";
import { useMapAnchorSheetSettle } from "./use-map-anchor-sheet-settle";
import { useMapInstanceRelease } from "./use-map-instance-release";
import { useMapPaddingSync } from "./use-map-padding-sync";

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

  const sheetPhaseRef = useRef(sheetPhase);
  sheetPhaseRef.current = sheetPhase;

  const sheetMotionActiveRef = useRef(sheetPhase !== "idle");
  sheetMotionActiveRef.current = sheetPhase !== "idle";

  const session: MapAnchorSessionRefs = {
    stateRef,
    dispatch,
    sheetPhaseRef,
    sheetMotionActiveRef,
  };

  const onBootAttemptRef = useRef<(() => void) | null>(null);

  const padding = useMapPaddingSync({
    mapRef,
    enabled,
    mapPaddingFromCanvasEnabled,
    liveSheetObscuredBottomPx,
    fixedChromeInsets,
    mapPaddingDebug,
    session,
    onBootAttemptRef,
  });

  const { navigateTo, navigateToRef } = useMapAnchorNavigate({
    mapRef,
    mapPaddingDebug,
    session,
    refreshMapPaddingFromCanvasRef: padding.refreshMapPaddingFromCanvasRef,
  });

  useBootFlyCoordinator({
    mapRef,
    enabled,
    bootTarget,
    bootDurationMs,
    smoothFlyDurationMs,
    mapPaddingReadyRef: padding.mapPaddingReadyRef,
    onBootAttemptRef,
    session,
    navigateToRef,
    onBootIssued,
    mapPaddingDebug,
  });

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
    onBootAttemptRef,
  });

  const setAnchor = useCallback((position: MapPosition) => {
    dispatch({ type: "setAnchor", position });
  }, []);

  return {
    anchor: state.anchor,
    session: state.session,
    navigationIntent: state.navigationIntent,
    /** Last Mapbox padding applied from live sheet DOM. */
    mapPadding: padding.mapPadding,
    /** True after the first successful `setPadding` from measurable live DOM. */
    mapPaddingReady: padding.mapPaddingReady,
    setAnchor,
    navigateTo,
  };
}
