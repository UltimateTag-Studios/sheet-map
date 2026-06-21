import type { SheetSnap } from "@siegetag/sheet";
import { useEffect, useState } from "react";
import type { MapRef } from "react-map-gl/mapbox";

import { readSheetHost } from "../dom";
import type {
  MapObscuredInsets,
  MapViewportSyncState,
  SheetSnapHeightsPx,
} from "../types";
import { areMapViewportsEqual } from "./are-map-viewports-equal";
import { attachViewportObservers } from "./attach-viewport-observers";
import { readSyncViewport } from "./read-sync-viewport";

const EMPTY_VIEWPORT: MapViewportSyncState = {
  clientRect: null,
  centerOffset: { x: 0, y: 0 },
  hasVisibleArea: false,
};

export type UseMapVisibleViewportSyncOptions = {
  mapRef: MapRef | null;
  sheetSnap: SheetSnap;
  snapHeights: SheetSnapHeightsPx;
  fixedChromeInsets?: Partial<MapObscuredInsets>;
  useSnapGeometryOnly?: boolean;
  debug?: boolean;
};

/** Tracks visible map bounds from a Mapbox instance + sheet geometry. */
export function useMapVisibleViewportSync({
  mapRef,
  sheetSnap,
  snapHeights,
  fixedChromeInsets,
  useSnapGeometryOnly = false,
  debug = false,
}: UseMapVisibleViewportSyncOptions): MapViewportSyncState {
  const [viewport, setViewport] =
    useState<MapViewportSyncState>(EMPTY_VIEWPORT);

  useEffect(() => {
    if (!mapRef) {
      setViewport(EMPTY_VIEWPORT);
      return;
    }

    const map = mapRef.getMap();
    const canvas = map.getCanvas();

    const sync = () => {
      const next = readSyncViewport(
        canvas,
        sheetSnap,
        snapHeights,
        fixedChromeInsets,
        useSnapGeometryOnly,
      );
      if (!next) {
        return;
      }
      if (debug) {
        console.info("[map-visible-viewport-sync]", {
          sheetSnap,
          snapHeights,
          hasVisibleArea: next.hasVisibleArea,
          clientRect: next.clientRect,
          centerOffset: next.centerOffset,
        });
      }
      setViewport((current) =>
        areMapViewportsEqual(current, next) ? current : next,
      );
    };

    sync();
    const cleanupObservers = attachViewportObservers(
      canvas,
      readSheetHost(canvas),
      sync,
    );
    map.on("resize", sync);

    return () => {
      cleanupObservers();
      map.off("resize", sync);
    };
  }, [
    mapRef,
    sheetSnap,
    snapHeights,
    fixedChromeInsets,
    useSnapGeometryOnly,
    debug,
  ]);

  return viewport;
}
