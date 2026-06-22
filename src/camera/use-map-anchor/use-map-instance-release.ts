import { useEffect, useRef } from "react";
import type { MapRef } from "react-map-gl/mapbox";

import { releaseMapInstanceCameraState } from "../map-instance-camera-state";

export type UseMapInstanceReleaseInput = {
  mapRef: MapRef | null;
  enabled: boolean;
  onMapInstanceReleased?: () => void;
};

/**
 * Release per-map camera latches when the anchor hook detaches from a map
 * instance for real (unmount or mapRef swap), not on React Strict Mode's
 * effect re-run cleanup.
 */
export function useMapInstanceRelease({
  mapRef,
  enabled,
  onMapInstanceReleased,
}: UseMapInstanceReleaseInput): void {
  const onMapInstanceReleasedRef = useRef(onMapInstanceReleased);
  onMapInstanceReleasedRef.current = onMapInstanceReleased;

  const releaseGenerationRef = useRef(0);
  const previousMapRef = useRef<MapRef | null>(null);

  useEffect(() => {
    if (!enabled) {
      previousMapRef.current = mapRef;
      return;
    }

    const previous = previousMapRef.current;
    previousMapRef.current = mapRef;

    if (previous && previous !== mapRef) {
      releaseMapInstanceCameraState(previous.getMap());
      onMapInstanceReleasedRef.current?.();
    }
  }, [mapRef, enabled]);

  useEffect(() => {
    if (!mapRef || !enabled) {
      return;
    }

    const map = mapRef.getMap();
    const generation = ++releaseGenerationRef.current;

    return () => {
      const generationAtCleanup = generation;
      queueMicrotask(() => {
        if (releaseGenerationRef.current !== generationAtCleanup) {
          return;
        }
        releaseMapInstanceCameraState(map);
        onMapInstanceReleasedRef.current?.();
      });
    };
  }, [mapRef, enabled]);
}
