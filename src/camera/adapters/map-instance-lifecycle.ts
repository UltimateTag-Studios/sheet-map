import { useEffect, useRef } from "react";
import type { MapRef } from "react-map-gl/mapbox";

import type { MapCameraMachineDispatch } from "../machine";

export type UseMapInstanceLifecycleInput = {
  mapRef: MapRef | null;
  enabled: boolean;
  dispatch: MapCameraMachineDispatch;
  onMapInstanceReleased?: () => void;
};

/**
 * Dispatches `mapInstanceReleased` when the hook detaches from a map instance
 * for real (unmount or mapRef swap), not on React Strict Mode effect re-run cleanup.
 */
export function useMapInstanceLifecycle({
  mapRef,
  enabled,
  dispatch,
  onMapInstanceReleased,
}: UseMapInstanceLifecycleInput): void {
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
      dispatch({ type: "mapInstanceReleased" });
      onMapInstanceReleasedRef.current?.();
    }
  }, [mapRef, enabled, dispatch]);

  useEffect(() => {
    if (!mapRef || !enabled) {
      return;
    }

    const generation = ++releaseGenerationRef.current;

    return () => {
      const generationAtCleanup = generation;
      queueMicrotask(() => {
        if (releaseGenerationRef.current !== generationAtCleanup) {
          return;
        }
        dispatch({ type: "mapInstanceReleased" });
        onMapInstanceReleasedRef.current?.();
      });
    };
  }, [mapRef, enabled, dispatch]);
}
