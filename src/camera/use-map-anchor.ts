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
import { readMapPaddingFromCanvas } from "./read-map-padding-from-canvas";
import {
  consumePaddingSyncMoveEnd,
  drainPaddingSyncMoveEnd,
  hasSyncedMapPadding,
  readSyncedMapPadding,
  syncMapPadding,
} from "./sync-map-padding";
import { whenMapStyleReady } from "./when-map-style-ready";

const mapListenerCleanupByMap = new WeakMap<
  ReturnType<MapRef["getMap"]>,
  () => void
>();

export type UseMapAnchorOptions = {
  mapRef: MapRef | null;
  enabled?: boolean;
  /** When set, sync padding from live DOM (value is a re-sync trigger only). */
  sheetObscuredBottomPx?: number;
  fixedChromeInsets?: Partial<MapObscuredInsets>;
  paddingDebug?: boolean;
  onMapInstanceReleased?: () => void;
};

export function useMapAnchor({
  mapRef,
  enabled = true,
  sheetObscuredBottomPx,
  fixedChromeInsets,
  paddingDebug = false,
  onMapInstanceReleased,
}: UseMapAnchorOptions) {
  const paddingEnabled = sheetObscuredBottomPx !== undefined;

  const [state, dispatch] = useReducer(
    reduceMapAnchor,
    undefined,
    createInitialMapAnchorState,
  );
  const [padding, setPadding] = useState<MapPaddingOptions | null>(null);
  const [paddingReady, setPaddingReady] = useState(!paddingEnabled);
  const paddingReadyRef = useRef(paddingReady);

  const stateRef = useRef(state);
  stateRef.current = state;
  const onMapInstanceReleasedRef = useRef(onMapInstanceReleased);
  onMapInstanceReleasedRef.current = onMapInstanceReleased;

  const syncSheetPaddingRef = useRef<() => boolean>(() => false);

  const syncSheetPadding = useCallback(() => {
    if (!mapRef || !enabled || !paddingEnabled) {
      return false;
    }

    const map = mapRef.getMap();
    if (!map.isStyleLoaded()) {
      return false;
    }

    const nextPadding = readMapPaddingFromCanvas({
      canvas: map.getCanvas(),
      fixedChromeInsets,
    });
    if (!nextPadding) {
      return false;
    }

    const changed = syncMapPadding(map, nextPadding);

    if (paddingDebug && changed) {
      console.info("[map-padding-sync] setPadding", nextPadding);
    }

    if (changed) {
      setPadding(readSyncedMapPadding(map) ?? nextPadding);
    }

    if (hasSyncedMapPadding(map) && !paddingReadyRef.current) {
      paddingReadyRef.current = true;
      setPaddingReady(true);
    }

    return changed;
  }, [mapRef, enabled, paddingEnabled, fixedChromeInsets, paddingDebug]);

  syncSheetPaddingRef.current = syncSheetPadding;

  const setAnchor = useCallback((position: MapPosition) => {
    dispatch({ type: "setAnchor", position });
  }, []);

  useEffect(() => {
    if (!mapRef || !enabled || !paddingEnabled) {
      paddingReadyRef.current = !paddingEnabled;
      setPadding(null);
      setPaddingReady(!paddingEnabled);
      return;
    }

    const map = mapRef.getMap();
    paddingReadyRef.current = false;
    setPaddingReady(false);

    const cancelWhenStyleReady = whenMapStyleReady(map, () => {
      syncSheetPaddingRef.current();
    });

    return () => {
      cancelWhenStyleReady();
    };
  }, [mapRef, enabled, paddingEnabled]);

  useEffect(() => {
    if (!paddingEnabled) {
      return;
    }

    syncSheetPadding();
  }, [syncSheetPadding, paddingEnabled]);

  useEffect(() => {
    if (!paddingEnabled || sheetObscuredBottomPx === undefined) {
      return;
    }

    syncSheetPaddingRef.current();
  }, [paddingEnabled, sheetObscuredBottomPx]);

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
    padding,
    paddingReady,
    setAnchor,
  };
}
