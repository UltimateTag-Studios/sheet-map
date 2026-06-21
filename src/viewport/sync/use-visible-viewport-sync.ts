import type { SheetSnap } from "@siegetag/sheet";
import { type RefObject, useEffect, useState } from "react";

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

export type UseVisibleViewportSyncOptions = {
  canvasRef: RefObject<HTMLCanvasElement | null>;
  sheetSnap: SheetSnap;
  snapHeights: SheetSnapHeightsPx;
  fixedChromeInsets?: Partial<MapObscuredInsets>;
  useSnapGeometryOnly?: boolean;
  debug?: boolean;
};

/** Tracks visible map bounds from a canvas + sheet geometry; resizes with DOM changes. */
export function useVisibleViewportSync({
  canvasRef,
  sheetSnap,
  snapHeights,
  fixedChromeInsets,
  useSnapGeometryOnly = false,
  debug = false,
}: UseVisibleViewportSyncOptions): MapViewportSyncState {
  const [viewport, setViewport] =
    useState<MapViewportSyncState>(EMPTY_VIEWPORT);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) {
      setViewport(EMPTY_VIEWPORT);
      return;
    }

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
        console.info("[visible-viewport-sync]", {
          sheetSnap,
          snapHeights,
          hasVisibleArea: next.hasVisibleArea,
          clientRect: next.clientRect,
          centerOffset: next.centerOffset,
          canvasWidth: canvas.clientWidth,
          canvasHeight: canvas.clientHeight,
          visualViewportHeight: window.visualViewport?.height,
        });
      }
      setViewport((current) =>
        areMapViewportsEqual(current, next) ? current : next,
      );
    };

    sync();
    return attachViewportObservers(canvas, readSheetHost(canvas), sync);
  }, [
    canvasRef,
    sheetSnap,
    snapHeights,
    fixedChromeInsets,
    useSnapGeometryOnly,
    debug,
  ]);

  return viewport;
}
