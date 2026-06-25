import { type RefObject, useEffect, useState } from "react";

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

export type UseVisibleViewportSyncOptions = MapVisibleViewportOptions & {
  canvasRef: RefObject<HTMLCanvasElement | null>;
  debug?: boolean;
};

/** Tracks visible map bounds from a canvas + live sheet DOM; resizes with layout changes. */
export function useVisibleViewportSync({
  canvasRef,
  fixedChromeInsets,
  overlayMinVisibleHeightPx,
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
      const next = readSyncViewport(canvas, {
        fixedChromeInsets,
        overlayMinVisibleHeightPx,
      });
      if (debug) {
        console.info("[visible-viewport-sync]", {
          hasMinimumArea: next.hasMinimumArea,
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
  }, [canvasRef, fixedChromeInsets, overlayMinVisibleHeightPx, debug]);

  return viewport;
}
