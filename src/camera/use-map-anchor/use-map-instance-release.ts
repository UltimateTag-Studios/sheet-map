import { useEffect, useRef } from "react";
import type { MapRef } from "react-map-gl/mapbox";

import { releaseMapInstanceCameraState } from "../map-instance-camera-state";

export type UseMapInstanceReleaseInput = {
  mapRef: MapRef | null;
  enabled: boolean;
  onMapInstanceReleased?: () => void;
};

export function useMapInstanceRelease({
  mapRef,
  enabled,
  onMapInstanceReleased,
}: UseMapInstanceReleaseInput): void {
  const onMapInstanceReleasedRef = useRef(onMapInstanceReleased);
  onMapInstanceReleasedRef.current = onMapInstanceReleased;

  useEffect(() => {
    if (!mapRef || !enabled) {
      return;
    }

    const map = mapRef.getMap();

    return () => {
      releaseMapInstanceCameraState(map);
      onMapInstanceReleasedRef.current?.();
    };
  }, [mapRef, enabled]);
}
