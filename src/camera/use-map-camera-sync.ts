import { useEffect, useRef } from "react";
import type { MapRef } from "react-map-gl/mapbox";

import type { MapViewportSyncState } from "../canvas/viewport/use-map-viewport-sync";
import { flyMapToCoords } from "./fly-map-to-coords";
import type { MapCameraIntent } from "./map-camera-intent";

type UseMapCameraSyncOptions = {
  mapRef: MapRef | null;
  intent: MapCameraIntent | null;
  viewport: MapViewportSyncState;
  settled: boolean;
  initialZoom?: number;
  smoothFlyDurationMs?: number;
  debug?: boolean;
  onFulfilled?: (intent: MapCameraIntent) => void;
};

function viewportFlyKey(viewport: MapViewportSyncState): string {
  if (!viewport.hasVisibleArea) {
    return "hidden";
  }

  const x = Math.round(viewport.centerOffset.x);
  const y = Math.round(viewport.centerOffset.y);
  return `${x}:${y}`;
}

/** Applies a camera intent when the map viewport is valid and the sheet has settled. */
export function useMapCameraSync({
  mapRef,
  intent,
  viewport,
  settled,
  initialZoom = 15,
  smoothFlyDurationMs = 600,
  debug = false,
  onFulfilled,
}: UseMapCameraSyncOptions) {
  const fulfilledKeyRef = useRef<string | null>(null);
  const initialZoomAppliedRef = useRef(false);
  const viewportKey = viewportFlyKey(viewport);

  useEffect(() => {
    if (!mapRef || !intent) {
      if (!intent) {
        fulfilledKeyRef.current = null;
        initialZoomAppliedRef.current = false;
      }
      if (debug && intent) {
        console.info("[map-camera-sync] blocked: missing mapRef");
      }
      return;
    }

    if (!settled || !viewport.hasVisibleArea) {
      if (debug) {
        console.info("[map-camera-sync] blocked", {
          settled,
          hasVisibleArea: viewport.hasVisibleArea,
          intentKey: intent.key,
        });
      }
      return;
    }

    const flyKey = `${intent.key}@${viewportKey}`;
    if (fulfilledKeyRef.current === flyKey) {
      return;
    }

    const setZoomOnFly = !initialZoomAppliedRef.current;

    if (debug) {
      console.info("[map-camera-sync] fly", {
        flyKey,
        coords: intent.coords,
        centerOffset: viewport.centerOffset,
        setZoomOnFly,
      });
    }

    flyMapToCoords(mapRef, {
      coords: intent.coords,
      centerOffset: viewport.centerOffset,
      durationMs: intent.instant ? 0 : smoothFlyDurationMs,
      zoom: setZoomOnFly ? initialZoom : undefined,
    });
    initialZoomAppliedRef.current = true;
    fulfilledKeyRef.current = flyKey;

    if (intent.instant) {
      onFulfilled?.(intent);
      return;
    }

    const map = mapRef.getMap();
    const handleMoveEnd = () => {
      map.off("moveend", handleMoveEnd);
      onFulfilled?.(intent);
    };
    map.on("moveend", handleMoveEnd);

    return () => {
      map.off("moveend", handleMoveEnd);
    };
  }, [
    mapRef,
    intent,
    viewport,
    viewportKey,
    settled,
    initialZoom,
    smoothFlyDurationMs,
    debug,
    onFulfilled,
  ]);
}
