import type { SheetSnap } from "@siegetag/sheet";
import { normalizeHalfSnapFraction } from "@siegetag/sheet";
import { useLayoutEffect, useState } from "react";
import type { MapRef } from "react-map-gl/mapbox";

import {
  type MapObscuredInsets,
  type PixelPoint,
  type PixelRect,
  resolveMapVisibleViewport,
} from "./map-viewport";

export type MapViewportSyncState = {
  clientRect: PixelRect | null;
  centerOffset: PixelPoint;
  hasVisibleArea: boolean;
};

const EMPTY_VIEWPORT: MapViewportSyncState = {
  clientRect: null,
  centerOffset: { x: 0, y: 0 },
  hasVisibleArea: false,
};

function readViewport(
  mapRef: MapRef,
  sheetSnap: SheetSnap,
  collapsedHeightPx: number,
  fullHeightPx: number,
  halfSnapFraction: number,
  fixedChromeInsets?: Partial<MapObscuredInsets>,
): MapViewportSyncState | null {
  const map = mapRef.getMap();
  const canvas = map.getCanvas();

  if (canvas.clientWidth === 0 || canvas.clientHeight === 0) {
    return null;
  }

  const viewport = resolveMapVisibleViewport(
    canvas,
    sheetSnap,
    collapsedHeightPx,
    fullHeightPx,
    {
      top: fixedChromeInsets?.top ?? 0,
      left: fixedChromeInsets?.left ?? 0,
      right: fixedChromeInsets?.right ?? 0,
      bottom: fixedChromeInsets?.bottom ?? 0,
    },
    halfSnapFraction,
  );

  return {
    ...viewport,
    clientRect: viewport.hasVisibleArea ? viewport.clientRect : null,
  };
}

function viewportEquals(
  a: MapViewportSyncState,
  b: MapViewportSyncState,
): boolean {
  if (a.hasVisibleArea !== b.hasVisibleArea) {
    return false;
  }

  if (a.centerOffset.x !== b.centerOffset.x) {
    return false;
  }
  if (a.centerOffset.y !== b.centerOffset.y) {
    return false;
  }

  const rectA = a.clientRect;
  const rectB = b.clientRect;
  if (rectA === null && rectB === null) {
    return true;
  }
  if (rectA === null || rectB === null) {
    return false;
  }

  return (
    rectA.x === rectB.x &&
    rectA.y === rectB.y &&
    rectA.width === rectB.width &&
    rectA.height === rectB.height
  );
}

export type UseMapViewportSyncOptions = {
  mapRef: MapRef | null;
  sheetSnap: SheetSnap;
  collapsedHeightPx: number;
  fullHeightPx: number;
  halfSnapFraction?: number;
  /** When false, viewport state is frozen and resize listeners are detached. */
  settled?: boolean;
  /** Extra obscured area (tab bar, top nav). */
  fixedChromeInsets?: Partial<MapObscuredInsets>;
  /** Log sync results to the console (map debug tooling). */
  debug?: boolean;
};

/** Sheet-aware map viewport; syncs when settled and on canvas/layout resize. */
export function useMapViewportSync({
  mapRef,
  sheetSnap,
  collapsedHeightPx,
  fullHeightPx,
  halfSnapFraction,
  settled = true,
  fixedChromeInsets,
  debug = false,
}: UseMapViewportSyncOptions): MapViewportSyncState {
  const resolvedHalfSnap = normalizeHalfSnapFraction(halfSnapFraction);
  const [viewport, setViewport] =
    useState<MapViewportSyncState>(EMPTY_VIEWPORT);

  useLayoutEffect(() => {
    if (!mapRef) {
      setViewport(EMPTY_VIEWPORT);
      return;
    }

    if (!settled) {
      return;
    }

    const sync = () => {
      const next = readViewport(
        mapRef,
        sheetSnap,
        collapsedHeightPx,
        fullHeightPx,
        resolvedHalfSnap,
        fixedChromeInsets,
      );
      if (!next) {
        return;
      }

      if (debug) {
        const canvas = mapRef.getMap().getCanvas();
        console.info("[map-viewport-sync]", {
          sheetSnap,
          hasVisibleArea: next.hasVisibleArea,
          clientRect: next.clientRect,
          centerOffset: next.centerOffset,
          canvasWidth: canvas.clientWidth,
          canvasHeight: canvas.clientHeight,
          visualViewportHeight: window.visualViewport?.height,
        });
      }

      setViewport((current) =>
        viewportEquals(current, next) ? current : next,
      );
    };

    sync();

    const map = mapRef.getMap();
    const canvas = map.getCanvas();

    map.on("load", sync);
    map.on("resize", sync);
    map.on("idle", sync);

    const canvasObserver = new ResizeObserver(sync);
    canvasObserver.observe(canvas);

    window.addEventListener("resize", sync);
    const visualViewport = window.visualViewport;
    visualViewport?.addEventListener("resize", sync);
    visualViewport?.addEventListener("scroll", sync);

    return () => {
      map.off("load", sync);
      map.off("resize", sync);
      map.off("idle", sync);
      canvasObserver.disconnect();
      window.removeEventListener("resize", sync);
      visualViewport?.removeEventListener("resize", sync);
      visualViewport?.removeEventListener("scroll", sync);
    };
  }, [
    mapRef,
    settled,
    sheetSnap,
    collapsedHeightPx,
    fullHeightPx,
    resolvedHalfSnap,
    fixedChromeInsets,
    debug,
  ]);

  return viewport;
}
