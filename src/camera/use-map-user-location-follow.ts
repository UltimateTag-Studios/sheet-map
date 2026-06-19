import { useEffect } from "react";
import type { MapRef } from "react-map-gl/mapbox";

import type { MapViewportSyncState } from "../canvas/viewport/use-map-viewport-sync";
import type { MapUserLocationCoords } from "../shell/config";
import type { MapCameraAnchor } from "./map-camera-anchor";
import { isProgrammaticCameraMove } from "./map-programmatic-camera";
import { userLocationCenterDistancePx } from "./map-user-location-follow";

type UseMapUserLocationFollowOptions = {
  mapRef: MapRef | null;
  userLocation?: MapUserLocationCoords;
  cameraAnchor: MapCameraAnchor;
  followUser: boolean;
  viewport: MapViewportSyncState;
  recenterUserSmooth: () => void;
  stopFollowingUser: () => void;
  followThresholdPx?: number;
};

export function useMapUserLocationFollow({
  mapRef,
  userLocation,
  cameraAnchor,
  followUser,
  viewport,
  recenterUserSmooth,
  stopFollowingUser,
  followThresholdPx = 40,
}: UseMapUserLocationFollowOptions) {
  useEffect(() => {
    if (
      !mapRef ||
      !userLocation ||
      !followUser ||
      cameraAnchor?.kind !== "user"
    ) {
      return;
    }

    const map = mapRef.getMap();

    const clearProgrammaticGuard = () => {
      isProgrammaticCameraMove.current = false;
    };

    const handleMapInteractionEnd = () => {
      if (isProgrammaticCameraMove.current) {
        isProgrammaticCameraMove.current = false;
        return;
      }

      const canvas = map.getCanvas();
      const distancePx = userLocationCenterDistancePx(
        (coords) => map.project(coords),
        { width: canvas.clientWidth, height: canvas.clientHeight },
        viewport.centerOffset,
        userLocation,
      );

      if (distancePx > followThresholdPx) {
        stopFollowingUser();
        return;
      }

      recenterUserSmooth();
    };

    map.on("dragstart", clearProgrammaticGuard);
    map.on("zoomstart", clearProgrammaticGuard);
    map.on("dragend", handleMapInteractionEnd);
    map.on("zoomend", handleMapInteractionEnd);

    return () => {
      map.off("dragstart", clearProgrammaticGuard);
      map.off("zoomstart", clearProgrammaticGuard);
      map.off("dragend", handleMapInteractionEnd);
      map.off("zoomend", handleMapInteractionEnd);
    };
  }, [
    mapRef,
    userLocation,
    cameraAnchor,
    followUser,
    viewport.centerOffset,
    recenterUserSmooth,
    stopFollowingUser,
    followThresholdPx,
  ]);
}
