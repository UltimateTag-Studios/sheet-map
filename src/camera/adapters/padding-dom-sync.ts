import type { RefObject } from "react";
import { useCallback, useEffect, useRef } from "react";
import type { MapRef } from "react-map-gl/mapbox";

import type { MapObscuredInsets } from "../../viewport";
import type { MapCameraMachineDispatch } from "../machine";
import type { MapCameraState } from "../machine/state";
import { areMapPaddingOptionsEqual } from "../padding/compute";
import { readMapPaddingFromCanvas } from "../padding/read-from-canvas";
import { whenMapStyleReady } from "../shared/when-map-style-ready";

export type UsePaddingDomSyncInput = {
  mapRef: MapRef | null;
  enabled: boolean;
  mapPaddingFromCanvasEnabled: boolean;
  liveSheetObscuredBottomPx?: number;
  fixedChromeInsets?: Partial<MapObscuredInsets>;
  mapPaddingDebug: boolean;
  dispatch: MapCameraMachineDispatch;
  stateRef: RefObject<MapCameraState>;
  /** Fired when live-DOM padding first becomes measurable (boot retry hook). */
  onPaddingReady?: () => void;
};

export function usePaddingDomSync({
  mapRef,
  enabled,
  mapPaddingFromCanvasEnabled,
  liveSheetObscuredBottomPx,
  fixedChromeInsets,
  mapPaddingDebug,
  dispatch,
  stateRef,
  onPaddingReady,
}: UsePaddingDomSyncInput): void {
  const onPaddingReadyRef = useRef(onPaddingReady);
  onPaddingReadyRef.current = onPaddingReady;

  const measureAndDispatch = useCallback(() => {
    if (!mapRef || !enabled || !mapPaddingFromCanvasEnabled) {
      return;
    }

    const map = mapRef.getMap();
    if (!map.isStyleLoaded()) {
      return;
    }

    const nextPadding = readMapPaddingFromCanvas({
      canvas: map.getCanvas(),
      fixedChromeInsets,
    });

    if (!nextPadding) {
      return;
    }

    const wasPaddingReady = stateRef.current.padding.phase === "ready";
    const previous = stateRef.current.padding.options;
    const changed =
      previous === null || !areMapPaddingOptionsEqual(previous, nextPadding);

    if (mapPaddingDebug && changed) {
      console.info("[map-padding-from-canvas] measured", nextPadding);
    }

    dispatch({
      type: "paddingMeasured",
      options: nextPadding,
      changed,
    });

    if (!wasPaddingReady) {
      onPaddingReadyRef.current?.();
    }
  }, [
    mapRef,
    enabled,
    mapPaddingFromCanvasEnabled,
    fixedChromeInsets,
    mapPaddingDebug,
    dispatch,
    stateRef,
  ]);

  const measureRef = useRef(measureAndDispatch);
  measureRef.current = measureAndDispatch;

  useEffect(() => {
    if (!mapRef || !enabled || !mapPaddingFromCanvasEnabled) {
      return;
    }

    const map = mapRef.getMap();

    const cancelWhenStyleReady = whenMapStyleReady(map, () => {
      measureRef.current();
    });

    return () => {
      cancelWhenStyleReady();
    };
  }, [mapRef, enabled, mapPaddingFromCanvasEnabled]);

  useEffect(() => {
    if (!mapPaddingFromCanvasEnabled) {
      return;
    }

    measureAndDispatch();
  }, [measureAndDispatch, mapPaddingFromCanvasEnabled]);

  useEffect(() => {
    if (
      !mapPaddingFromCanvasEnabled ||
      liveSheetObscuredBottomPx === undefined
    ) {
      return;
    }

    measureRef.current();
  }, [mapPaddingFromCanvasEnabled, liveSheetObscuredBottomPx]);

  useEffect(() => {
    if (
      !mapRef ||
      !enabled ||
      !mapPaddingFromCanvasEnabled ||
      stateRef.current.padding.phase === "ready"
    ) {
      return;
    }

    const map = mapRef.getMap();

    const retryPaddingSync = () => {
      measureRef.current();
    };

    map.on("idle", retryPaddingSync);
    map.on("resize", retryPaddingSync);

    return () => {
      map.off("idle", retryPaddingSync);
      map.off("resize", retryPaddingSync);
    };
  }, [mapRef, enabled, mapPaddingFromCanvasEnabled, stateRef]);
}
