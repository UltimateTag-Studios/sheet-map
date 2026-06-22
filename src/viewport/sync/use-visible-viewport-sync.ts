import { type RefObject, useEffect, useState } from "react";

import { readSheetHost } from "../dom";
import type { MapObscuredInsets, MapViewportSyncState } from "../types";
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
  fixedChromeInsets?: Partial<MapObscuredInsets>;
  debug?: boolean;
};

/** Tracks visible map bounds from a canvas + live sheet DOM; resizes with layout changes. */
export function useVisibleViewportSync({
  canvasRef,
  fixedChromeInsets,
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
      const next = readSyncViewport(canvas, fixedChromeInsets);
      if (debug) {
        console.info("[visible-viewport-sync]", {
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
  }, [canvasRef, fixedChromeInsets, debug]);

  return viewport;
}
