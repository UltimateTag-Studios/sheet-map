import { useEffect, useRef, useState } from "react";
import type { MapRef } from "react-map-gl/mapbox";

import { readSheetHost } from "../dom";
import type { MapViewportSyncState, MapVisibleViewportOptions } from "../types";
import { areMapViewportsEqual } from "./are-map-viewports-equal";
import { attachViewportObservers } from "./attach-viewport-observers";
import { readSyncViewport } from "./read-sync-viewport";

const EMPTY_VIEWPORT: MapViewportSyncState = {
  clientRect: null,
  centerOffset: { x: 0, y: 0 },
  hasMinimumArea: false,
};

export type UseMapVisibleViewportSyncOptions = MapVisibleViewportOptions & {
  mapRef: MapRef | null;
  /** Re-sync when live sheet obscured height changes (e.g. during sheet drag). */
  liveSheetObscuredBottomPx?: number;
  debug?: boolean;
};

/** Tracks visible map bounds from a Mapbox instance + live sheet DOM. */
export function useMapVisibleViewportSync({
  mapRef,
  fixedChromeInsets,
  overlayMinVisibleHeightPx,
  liveSheetObscuredBottomPx,
  debug = false,
}: UseMapVisibleViewportSyncOptions): MapViewportSyncState {
  const [viewport, setViewport] =
    useState<MapViewportSyncState>(EMPTY_VIEWPORT);
  const syncViewportRef = useRef<() => void>(() => {});

  useEffect(() => {
    if (!mapRef) {
      setViewport(EMPTY_VIEWPORT);
      return;
    }

    const map = mapRef.getMap();
    const canvas = map.getCanvas();

    const sync = () => {
      const next = readSyncViewport(canvas, {
        fixedChromeInsets,
        overlayMinVisibleHeightPx,
      });
      if (debug) {
        console.info("[map-visible-viewport-sync]", {
          hasMinimumArea: next.hasMinimumArea,
          clientRect: next.clientRect,
          centerOffset: next.centerOffset,
        });
      }
      setViewport((current) =>
        areMapViewportsEqual(current, next) ? current : next,
      );
    };

    sync();
    syncViewportRef.current = sync;
    const cleanupObservers = attachViewportObservers(
      canvas,
      readSheetHost(canvas),
      sync,
    );
    map.on("resize", sync);

    return () => {
      syncViewportRef.current = () => {};
      cleanupObservers();
      map.off("resize", sync);
    };
  }, [mapRef, fixedChromeInsets, overlayMinVisibleHeightPx, debug]);

  useEffect(() => {
    if (liveSheetObscuredBottomPx === undefined) {
      return;
    }

    syncViewportRef.current();
  }, [liveSheetObscuredBottomPx]);

  return viewport;
}
