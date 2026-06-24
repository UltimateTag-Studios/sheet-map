import { useCallback, useEffect, useReducer, useRef, useState } from "react";
import type { MapRef } from "react-map-gl/mapbox";

import type { MapObscuredInsets, SheetMotionPhase } from "../../viewport";
import type { PixelPoint } from "../../viewport/types/pixel";
import { createInitialMapFollowState, reduceMapFollow } from "../follow";
import {
  clearFollowReleasedForMapInstance,
  markFollowReleasedForMapInstance,
} from "../instance/camera-state";
import { type MapPosition, positionKey } from "../shared/map-position";
import type { NavigateToMapAnchorOptions } from "./use-map-anchor/types";
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

export type { NavigateToMapAnchorOptions } from "./use-map-anchor/types";

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

  const [trackingState, trackingDispatch] = useReducer(
    reduceMapFollow,
    { tracking: false },
    createInitialMapFollowState,
  );

  const lastGpsPositionKeyRef = useRef<string | null>(null);

  /** Boot uses the first GPS fix only — watchPosition updates must not retrigger boot. */
  const [bootTarget, setBootTarget] = useState<MapPosition | null>(null);

  const buildUserPosition = useCallback((): MapPosition | null => {
    if (!hasUserLocation) {
      return null;
    }

    return {
      lat: userLocationLat,
      lng: userLocationLng,
    };
  }, [hasUserLocation, userLocationLat, userLocationLng]);

  const rememberGpsPosition = useCallback((position: MapPosition) => {
    lastGpsPositionKeyRef.current = positionKey(position);
  }, []);

  const navigateToRef = useRef<
    (position: MapPosition, options?: NavigateToMapAnchorOptions) => boolean
  >(() => false);

  useEffect(() => {
    if (!hasUserLocation || bootTarget !== null) {
      return;
    }

    setBootTarget({
      lat: userLocationLat,
      lng: userLocationLng,
      zoom: bootZoom,
    });
  }, [hasUserLocation, userLocationLat, userLocationLng, bootZoom, bootTarget]);

  const onMapInstanceReleased = useCallback(() => {
    lastGpsPositionKeyRef.current = null;
    setBootTarget(null);
    onMapInstanceReleasedOption?.();
  }, [onMapInstanceReleasedOption]);

  const onBootIssued = useCallback(() => {
    const position = buildUserPosition();
    if (position) {
      rememberGpsPosition(position);
    }
    trackingDispatch({ type: "bootIssued" });
  }, [buildUserPosition, rememberGpsPosition]);

  const stopTracking = useCallback(() => {
    if (mapRef) {
      markFollowReleasedForMapInstance(mapRef.getMap());
    }
    trackingDispatch({ type: "stopTracking" });
  }, [mapRef]);

  const trackingConfig =
    trackingState.tracking && hasUserLocation
      ? {
          userLocation: { lat: userLocationLat, lng: userLocationLng },
          centerOffset,
          thresholdPx: trackingReleaseThresholdPx,
        }
      : null;

  const { anchor, session, navigateTo, ...anchorRest } = useMapCamera({
    mapRef,
    enabled,
    liveSheetObscuredBottomPx,
    fixedChromeInsets,
    mapPaddingDebug,
    sheetPhase,
    smoothFlyDurationMs,
    bootTarget,
    bootDurationMs: smoothFlyDurationMs,
    onBootIssued,
    onMapInstanceReleased,
    follow: trackingConfig,
    onReleaseTracking: stopTracking,
  });

  navigateToRef.current = navigateTo;

  const recenterOnUser = useCallback(
    (options?: RecenterOnUserOptions) => {
      const position = buildUserPosition();
      if (!position) {
        return;
      }

      const target =
        options?.zoom !== undefined
          ? { ...position, zoom: options.zoom }
          : position;

      if (mapRef) {
        clearFollowReleasedForMapInstance(mapRef.getMap());
      }
      trackingDispatch({ type: "startTracking" });
      rememberGpsPosition(position);
      navigateToRef.current(target, {
        duration: smoothFlyDurationMs,
        keepTracking: true,
      });
    },
    [buildUserPosition, rememberGpsPosition, smoothFlyDurationMs, mapRef],
  );

  useEffect(() => {
    if (
      !trackingState.tracking ||
      !hasUserLocation ||
      !mapRef ||
      session !== "idle"
    ) {
      if (
        mapPaddingDebug &&
        hasUserLocation &&
        trackingState.tracking &&
        session !== "idle"
      ) {
        console.info("[map-follow-gps] skipped", {
          reason: "session",
          session,
        });
      }
      return;
    }

    const position = buildUserPosition();
    if (!position) {
      return;
    }

    const nextKey = positionKey(position);
    if (lastGpsPositionKeyRef.current === nextKey) {
      return;
    }

    lastGpsPositionKeyRef.current = nextKey;
    const applied = navigateToRef.current(position, {
      duration: 0,
      keepTracking: true,
    });
    if (mapPaddingDebug) {
      console.info("[map-follow-gps] navigate", {
        lat: position.lat,
        lng: position.lng,
        applied,
      });
    }
  }, [
    trackingState.tracking,
    hasUserLocation,
    mapRef,
    session,
    mapPaddingDebug,
    buildUserPosition,
  ]);

  return {
    ...anchorRest,
    anchor,
    session,
    navigateTo,
    userLocation: hasUserLocation ? userLocation : null,
    tracking: trackingState.tracking,
    recenterOnUser,
  };
}
