import type { MapEventOf } from "mapbox-gl";
import { useCallback, useEffect, useReducer, useRef, useState } from "react";
import type { MapRef } from "react-map-gl/mapbox";

import type { MapObscuredInsets } from "../viewport";
import {
  createInitialMapAnchorState,
  isUserMapGestureEvent,
  readMapAnchorPosition,
  reduceMapAnchor,
} from "./anchor";
import type { MapPaddingOptions } from "./compute-map-padding";
import { releaseMapInstanceCameraState } from "./map-instance-camera-state";
import type { MapPosition } from "./map-position";
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
  onMapInstanceReleased?: () => void;
};

export function useMapAnchor({
  mapRef,
  enabled = true,
  liveSheetObscuredBottomPx,
  fixedChromeInsets,
  mapPaddingDebug = false,
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

  const refreshMapPaddingFromCanvasRef = useRef<() => boolean>(() => false);

  const refreshMapPaddingFromCanvas = useCallback(() => {
    if (!mapRef || !enabled || !mapPaddingFromCanvasEnabled) {
      return false;
    }

    const result = syncMapPaddingFromCanvas({
      map: mapRef.getMap(),
      fixedChromeInsets,
      debug: mapPaddingDebug,
    });

    if (result.changed && result.padding) {
      setMapPadding(result.padding);
    }

    if (result.mapPaddingSynced && !mapPaddingReadyRef.current) {
      mapPaddingReadyRef.current = true;
      setMapPaddingReady(true);
    }

    return result.changed;
  }, [
    mapRef,
    enabled,
    mapPaddingFromCanvasEnabled,
    fixedChromeInsets,
    mapPaddingDebug,
  ]);

  refreshMapPaddingFromCanvasRef.current = refreshMapPaddingFromCanvas;

  const setAnchor = useCallback((position: MapPosition) => {
    dispatch({ type: "setAnchor", position });
  }, []);

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
      }
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
  };
}
