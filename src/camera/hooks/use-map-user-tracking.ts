import { useCallback, useEffect, useMemo, useState } from "react";
import type { MapRef } from "react-map-gl/mapbox";

import type { MapObscuredInsets, SheetMotionPhase } from "../../viewport";
import type { PixelPoint } from "../../viewport/types/pixel";
import { type MapPosition, positionKey } from "../shared/map-position";
import type { MapCameraBootRequest } from "./types";
import { useMapCamera } from "./use-map-camera";

export type MapUserLocationCoords = {
  lng: number;
  lat: number;
  accuracyMeters?: number | null;
};

export const DEFAULT_TRACKING_RELEASE_THRESHOLD_PX = 40;

/** Optional zoom on my-location recenter; omit to preserve the current map level. */
export type RecenterOnUserOptions = {
  zoom?: number;
};

export type { NavigateToMapAnchorOptions } from "./types";

export type UseMapUserTrackingOptions = {
  mapRef: MapRef | null;
  userLocation: MapUserLocationCoords | null;
  enabled?: boolean;
  liveSheetObscuredBottomPx?: number;
  fixedChromeInsets?: Partial<MapObscuredInsets>;
  mapPaddingDebug?: boolean;
  sheetPhase?: SheetMotionPhase;
  /** Visible-area center offset for tracking threshold. */
  centerOffset?: PixelPoint;
  /** Zoom for the one-shot boot fly only. */
  bootZoom?: number;
  smoothFlyDurationMs?: number;
  /** Screen pixels before tracking releases on user pan (demo default 40). */
  trackingReleaseThresholdPx?: number;
  onMapInstanceReleased?: () => void;
};

/** Public map camera hook: boot fly, GPS tracking, gesture threshold, `navigateTo`. */
export function useMapUserTracking({
  mapRef,
  userLocation,
  enabled = true,
  liveSheetObscuredBottomPx,
  fixedChromeInsets,
  mapPaddingDebug = false,
  sheetPhase = "idle",
  centerOffset = { x: 0, y: 0 },
  bootZoom = 15,
  smoothFlyDurationMs = 600,
  trackingReleaseThresholdPx = DEFAULT_TRACKING_RELEASE_THRESHOLD_PX,
  onMapInstanceReleased: onMapInstanceReleasedOption,
}: UseMapUserTrackingOptions) {
  const userLocationLng = userLocation?.lng;
  const userLocationLat = userLocation?.lat;
  const hasUserLocation =
    userLocationLng !== undefined && userLocationLat !== undefined;

  const [bootRequest, setBootRequest] = useState<MapCameraBootRequest | null>(
    null,
  );

  const buildUserPosition = useCallback((): MapPosition | null => {
    if (!hasUserLocation) {
      return null;
    }

    return {
      lat: userLocationLat,
      lng: userLocationLng,
    };
  }, [hasUserLocation, userLocationLat, userLocationLng]);

  const buildFollowConfig = useCallback(() => {
    if (!hasUserLocation) {
      return null;
    }

    return {
      userLocation: { lat: userLocationLat, lng: userLocationLng },
      centerOffset,
      thresholdPx: trackingReleaseThresholdPx,
    };
  }, [
    hasUserLocation,
    userLocationLat,
    userLocationLng,
    centerOffset,
    trackingReleaseThresholdPx,
  ]);

  useEffect(() => {
    if (!hasUserLocation || bootRequest !== null) {
      return;
    }

    const position = {
      lat: userLocationLat,
      lng: userLocationLng,
      zoom: bootZoom,
    };
    const follow = buildFollowConfig();
    if (!follow) {
      return;
    }

    setBootRequest({
      position,
      follow,
      positionKey: positionKey(position),
    });
  }, [
    hasUserLocation,
    userLocationLat,
    userLocationLng,
    bootZoom,
    bootRequest,
    buildFollowConfig,
  ]);

  const onMapInstanceReleased = useCallback(() => {
    setBootRequest(null);
    onMapInstanceReleasedOption?.();
  }, [onMapInstanceReleasedOption]);

  const {
    anchor,
    session,
    boot,
    tracking,
    navigateTo,
    dispatch,
    ...cameraRest
  } = useMapCamera({
    mapRef,
    enabled,
    liveSheetObscuredBottomPx,
    fixedChromeInsets,
    mapPaddingDebug,
    sheetPhase,
    smoothFlyDurationMs,
    bootRequest,
    bootDurationMs: smoothFlyDurationMs,
    onMapInstanceReleased,
  });

  const gpsPosition = buildUserPosition();
  const gpsPositionKey = useMemo(
    () => (gpsPosition ? positionKey(gpsPosition) : null),
    [gpsPosition],
  );

  useEffect(() => {
    if (!gpsPosition || !gpsPositionKey) {
      return;
    }

    dispatch({
      type: "gpsFix",
      position: gpsPosition,
      positionKey: gpsPositionKey,
    });
  }, [dispatch, gpsPosition, gpsPositionKey]);

  const recenterOnUser = useCallback(
    (options?: RecenterOnUserOptions) => {
      const position = buildUserPosition();
      const follow = buildFollowConfig();
      if (!position || !follow) {
        return;
      }

      const target =
        options?.zoom !== undefined
          ? { ...position, zoom: options.zoom }
          : position;

      dispatch({
        type: "recenterRequested",
        position: target,
        follow,
      });
    },
    [buildUserPosition, buildFollowConfig, dispatch],
  );

  return {
    ...cameraRest,
    anchor,
    session,
    boot,
    navigateTo,
    dispatch,
    userLocation: hasUserLocation ? userLocation : null,
    tracking,
    recenterOnUser,
  };
}
