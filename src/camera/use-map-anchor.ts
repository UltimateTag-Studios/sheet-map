import type { MapEventOf } from "mapbox-gl";
import { useCallback, useEffect, useReducer, useRef, useState } from "react";
import type { MapRef } from "react-map-gl/mapbox";

import type { MapObscuredInsets, SheetMotionPhase } from "../viewport";
import {
  applyMapAnchorCamera,
  beginProgrammaticNavigation,
  createInitialMapAnchorState,
  isUserMapGestureEvent,
  type NavigationIntent,
  readMapAnchorPosition,
  reduceMapAnchor,
  trySettleNavigatingSession,
} from "./anchor";
import { applyMapPadding } from "./apply-map-padding";
import type { MapPaddingOptions } from "./compute-map-padding";
import { releaseMapInstanceCameraState } from "./map-instance-camera-state";
import { type MapPosition, mergeMapAnchorPosition } from "./map-position";
import {
  consumePaddingSyncMoveEnd,
  drainPaddingSyncMoveEnd,
} from "./sync-map-padding";
import { syncMapPaddingFromCanvas } from "./sync-map-padding-from-canvas";
import { whenMapStyleReady } from "./when-map-style-ready";

const mapListenerCleanupByMap = new WeakMap<
  ReturnType<MapRef["getMap"]>,
  () => void
>();

export type NavigateToMapAnchorOptions = {
  /** ms. 0 or omitted = jump; >0 = fly when sheet is idle. Jump when sheet is dragging or settling. */
  duration?: number;
};

export type UseMapAnchorOptions = {
  mapRef: MapRef | null;
  enabled?: boolean;
  /**
   * Re-sync trigger from `useLiveSheetObscuredBottomPx` — not used as padding input.
   * Mapbox padding is always read from live DOM at apply time.
   */
  liveSheetObscuredBottomPx?: number;
  fixedChromeInsets?: Partial<MapObscuredInsets>;
  mapPaddingDebug?: boolean;
  /** Sheet gesture phase from `useLiveSheetObscuredBottomPx` (or sheet `onLayoutFrameChange`). */
  sheetPhase?: SheetMotionPhase;
  onMapInstanceReleased?: () => void;
};

type RefreshMapPaddingFromCanvasOptions = {
  realign?: boolean;
};

export function useMapAnchor({
  mapRef,
  enabled = true,
  liveSheetObscuredBottomPx,
  fixedChromeInsets,
  mapPaddingDebug = false,
  sheetPhase = "idle",
  onMapInstanceReleased,
}: UseMapAnchorOptions) {
  const mapPaddingFromCanvasEnabled = liveSheetObscuredBottomPx !== undefined;

  const [state, dispatch] = useReducer(
    reduceMapAnchor,
    undefined,
    createInitialMapAnchorState,
  );
  const [mapPadding, setMapPadding] = useState<MapPaddingOptions | null>(null);
  const [mapPaddingReady, setMapPaddingReady] = useState(
    !mapPaddingFromCanvasEnabled,
  );
  const mapPaddingReadyRef = useRef(mapPaddingReady);

  const stateRef = useRef(state);
  stateRef.current = state;
  const onMapInstanceReleasedRef = useRef(onMapInstanceReleased);
  onMapInstanceReleasedRef.current = onMapInstanceReleased;
  const sheetPhaseRef = useRef(sheetPhase);
  sheetPhaseRef.current = sheetPhase;
  const sheetMotionActiveRef = useRef(sheetPhase !== "idle");
  sheetMotionActiveRef.current = sheetPhase !== "idle";
  const prevSheetMotionActiveRef = useRef(sheetPhase !== "idle");

  const sheetMotionActive = sheetPhase !== "idle";

  const refreshMapPaddingFromCanvasRef = useRef<
    (options?: RefreshMapPaddingFromCanvasOptions) => boolean
  >(() => false);
  const navigateToRef = useRef<
    (position: MapPosition, options?: NavigateToMapAnchorOptions) => boolean
  >(() => false);

  const refreshMapPaddingFromCanvas = useCallback(
    (options: RefreshMapPaddingFromCanvasOptions = {}) => {
      if (!mapRef || !enabled || !mapPaddingFromCanvasEnabled) {
        return false;
      }

      const sheetMotionActive = sheetPhaseRef.current !== "idle";

      const result = syncMapPaddingFromCanvas({
        map: mapRef.getMap(),
        fixedChromeInsets,
        debug: mapPaddingDebug,
      });

      if (result.changed && result.padding) {
        setMapPadding(result.padding);
        applyMapPadding({
          mapRef,
          state: stateRef.current,
          paddingChanged: true,
          realign: options.realign,
          sheetMotionActive,
          debug: mapPaddingDebug,
        });
      }

      if (result.mapPaddingSynced && !mapPaddingReadyRef.current) {
        mapPaddingReadyRef.current = true;
        setMapPaddingReady(true);
      }

      return result.changed;
    },
    [
      mapRef,
      enabled,
      mapPaddingFromCanvasEnabled,
      fixedChromeInsets,
      mapPaddingDebug,
    ],
  );

  refreshMapPaddingFromCanvasRef.current = refreshMapPaddingFromCanvas;

  const setAnchor = useCallback((position: MapPosition) => {
    dispatch({ type: "setAnchor", position });
  }, []);

  const navigateTo = useCallback(
    (
      position: MapPosition,
      options: NavigateToMapAnchorOptions = {},
    ): boolean => {
      if (!mapRef) {
        return false;
      }

      const map = mapRef.getMap();
      if (!map.isStyleLoaded()) {
        return false;
      }

      const requestedDuration = options.duration ?? 0;
      const sheetMoving = sheetPhaseRef.current !== "idle";
      const duration = sheetMoving ? 0 : requestedDuration;

      if (mapPaddingDebug) {
        const mode = duration > 0 ? "fly" : "jump";
        console.info(`[map-navigate] ${mode}`, {
          duration,
          requestedDuration,
          sheetPhase: sheetPhaseRef.current,
          ...(mode === "jump" && sheetMoving ? { reason: "sheet moving" } : {}),
        });
      }
      const anchorPosition = mergeMapAnchorPosition(
        stateRef.current.anchor,
        position,
      );
      const intent: NavigationIntent = { target: position };

      let nextState = reduceMapAnchor(stateRef.current, {
        type: "setAnchor",
        position: anchorPosition,
      });
      nextState = reduceMapAnchor(nextState, {
        type: "navigationStarted",
        intent,
      });
      stateRef.current = nextState;

      dispatch({ type: "setAnchor", position: anchorPosition });
      dispatch({ type: "navigationStarted", intent });

      beginProgrammaticNavigation(map, () => {
        refreshMapPaddingFromCanvasRef.current({ realign: false });
      });
      applyMapAnchorCamera(mapRef, position, { duration });
      return true;
    },
    [mapRef, mapPaddingDebug],
  );

  navigateToRef.current = navigateTo;

  useEffect(() => {
    if (!mapRef || !enabled || !mapPaddingFromCanvasEnabled) {
      mapPaddingReadyRef.current = !mapPaddingFromCanvasEnabled;
      setMapPadding(null);
      setMapPaddingReady(!mapPaddingFromCanvasEnabled);
      return;
    }

    const map = mapRef.getMap();
    mapPaddingReadyRef.current = false;
    setMapPaddingReady(false);

    const cancelWhenStyleReady = whenMapStyleReady(map, () => {
      refreshMapPaddingFromCanvasRef.current();
    });

    return () => {
      cancelWhenStyleReady();
    };
  }, [mapRef, enabled, mapPaddingFromCanvasEnabled]);

  useEffect(() => {
    if (!mapPaddingFromCanvasEnabled) {
      return;
    }

    refreshMapPaddingFromCanvas();
  }, [refreshMapPaddingFromCanvas, mapPaddingFromCanvasEnabled]);

  useEffect(() => {
    if (
      !mapPaddingFromCanvasEnabled ||
      liveSheetObscuredBottomPx === undefined
    ) {
      return;
    }

    refreshMapPaddingFromCanvasRef.current();
  }, [mapPaddingFromCanvasEnabled, liveSheetObscuredBottomPx]);

  useEffect(() => {
    const wasSheetMotionActive = prevSheetMotionActiveRef.current;
    prevSheetMotionActiveRef.current = sheetMotionActive;

    if (!mapRef || !enabled || sheetMotionActive || !wasSheetMotionActive) {
      return;
    }

    trySettleNavigatingSession(
      mapRef.getMap(),
      stateRef,
      sheetMotionActiveRef,
      dispatch,
    );
  }, [sheetMotionActive, mapRef, enabled]);

  useEffect(() => {
    if (!mapRef || !enabled) {
      return;
    }

    const map = mapRef.getMap();

    return () => {
      releaseMapInstanceCameraState(map);
      onMapInstanceReleasedRef.current?.();
    };
  }, [mapRef, enabled]);

  useEffect(() => {
    if (!mapRef || !enabled) {
      return;
    }

    const map = mapRef.getMap();
    mapListenerCleanupByMap.get(map)?.();

    const bootAnchor = () => {
      if (stateRef.current.anchor !== null) {
        return;
      }

      dispatch({
        type: "setAnchor",
        position: readMapAnchorPosition(map),
      });
    };

    const beginUserGesture = (
      event: MapEventOf<"dragstart"> | MapEventOf<"zoomstart">,
    ) => {
      if (!isUserMapGestureEvent(event)) {
        return;
      }

      dispatch({ type: "userGestureStarted" });
    };

    const handleMoveEnd = () => {
      if (consumePaddingSyncMoveEnd(map)) {
        return;
      }

      if (map.isMoving()) {
        return;
      }

      if (stateRef.current.session === "userGesture") {
        dispatch({
          type: "userGestureSettled",
          position: readMapAnchorPosition(map),
        });
        return;
      }

      trySettleNavigatingSession(map, stateRef, sheetMotionActiveRef, dispatch);
    };

    const attachListeners = () => {
      drainPaddingSyncMoveEnd(map);
      bootAnchor();
      map.on("dragstart", beginUserGesture);
      map.on("zoomstart", beginUserGesture);
      map.on("moveend", handleMoveEnd);
    };

    if (map.isStyleLoaded()) {
      attachListeners();
    } else {
      map.once("load", attachListeners);
    }

    const cleanup = () => {
      map.off("load", attachListeners);
      map.off("dragstart", beginUserGesture);
      map.off("zoomstart", beginUserGesture);
      map.off("moveend", handleMoveEnd);
    };

    mapListenerCleanupByMap.set(map, cleanup);

    return () => {
      mapListenerCleanupByMap.delete(map);
      cleanup();
    };
  }, [mapRef, enabled]);

  return {
    anchor: state.anchor,
    session: state.session,
    navigationIntent: state.navigationIntent,
    /** Last Mapbox padding applied from live sheet DOM. */
    mapPadding,
    /** True after the first successful `setPadding` from measurable live DOM. */
    mapPaddingReady,
    setAnchor,
    navigateTo,
  };
}
