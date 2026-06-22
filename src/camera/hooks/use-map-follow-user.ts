import { useCallback, useEffect, useReducer, useRef, useState } from "react";
import type { MapRef } from "react-map-gl/mapbox";

import type { MapObscuredInsets, SheetMotionPhase } from "../../viewport";
import type { PixelPoint } from "../../viewport/types/pixel";
import { createInitialMapFollowState, reduceMapFollow } from "../follow";
import {
  clearFollowReleasedForMapInstance,
  hasFollowAutoStartedForMapInstance,
  hasFollowReleasedForMapInstance,
  markFollowAutoStartedForMapInstance,
  markFollowReleasedForMapInstance,
} from "../instance/camera-state";
import { type MapPosition, positionKey } from "../shared/map-position";
import { useMapAnchor } from "./use-map-anchor";

export type MapUserLocationCoords = {
  lng: number;
  lat: number;
  accuracyMeters?: number | null;
};

export const DEFAULT_FOLLOW_RELEASE_THRESHOLD_PX = 40;

/** Optional zoom on my-location recenter; omit to preserve the current map level. */
export type RecenterOnUserOptions = {
  zoom?: number;
};

export type NavigateToMapAnchorOptions = {
  duration?: number;
  keepFollowing?: boolean;
};

export type UseMapFollowUserOptions = {
  mapRef: MapRef | null;
  userLocation: MapUserLocationCoords | null;
  enabled?: boolean;
  liveSheetObscuredBottomPx?: number;
  fixedChromeInsets?: Partial<MapObscuredInsets>;
  mapPaddingDebug?: boolean;
  sheetPhase?: SheetMotionPhase;
  /** Visible-area center offset for follow threshold. */
  centerOffset?: PixelPoint;
  /** Zoom for the one-shot boot fly only (`bootTarget.zoom`). */
  followZoom?: number;
  smoothFlyDurationMs?: number;
  /** Screen pixels before follow releases on user pan (demo default 40). */
  followReleaseThresholdPx?: number;
  onMapInstanceReleased?: () => void;
};

export function useMapFollowUser({
  mapRef,
  userLocation,
  enabled = true,
  liveSheetObscuredBottomPx,
  fixedChromeInsets,
  mapPaddingDebug = false,
  sheetPhase = "idle",
  centerOffset = { x: 0, y: 0 },
  followZoom = 15,
  smoothFlyDurationMs = 600,
  followReleaseThresholdPx = DEFAULT_FOLLOW_RELEASE_THRESHOLD_PX,
  onMapInstanceReleased: onMapInstanceReleasedOption,
}: UseMapFollowUserOptions) {
  const userLocationLng = userLocation?.lng;
  const userLocationLat = userLocation?.lat;
  const hasUserLocation =
    userLocationLng !== undefined && userLocationLat !== undefined;

  const [followState, followDispatch] = useReducer(
    reduceMapFollow,
    { autoFollow: false },
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
    if (!hasUserLocation || !mapRef) {
      return;
    }

    const map = mapRef.getMap();
    if (hasFollowReleasedForMapInstance(map)) {
      return;
    }

    if (!hasFollowAutoStartedForMapInstance(map)) {
      markFollowAutoStartedForMapInstance(map);
    }

    followDispatch({ type: "startFollowUser" });
  }, [hasUserLocation, mapRef]);

  useEffect(() => {
    if (!hasUserLocation || bootTarget !== null) {
      return;
    }

    setBootTarget({
      lat: userLocationLat,
      lng: userLocationLng,
      zoom: followZoom,
    });
  }, [
    hasUserLocation,
    userLocationLat,
    userLocationLng,
    followZoom,
    bootTarget,
  ]);

  const onMapInstanceReleased = useCallback(() => {
    followDispatch({ type: "resetBoot" });
    lastGpsPositionKeyRef.current = null;
    setBootTarget(null);
    onMapInstanceReleasedOption?.();
  }, [onMapInstanceReleasedOption]);

  const onBootIssued = useCallback(() => {
    const position = buildUserPosition();
    if (position) {
      rememberGpsPosition(position);
    }
    followDispatch({ type: "bootFlown" });
  }, [buildUserPosition, rememberGpsPosition]);

  const stopFollowingUser = useCallback(() => {
    if (mapRef) {
      markFollowReleasedForMapInstance(mapRef.getMap());
    }
    followDispatch({ type: "stopFollowUser" });
  }, [mapRef]);

  const follow =
    followState.followUser && hasUserLocation
      ? {
          userLocation: { lat: userLocationLat, lng: userLocationLng },
          centerOffset,
          thresholdPx: followReleaseThresholdPx,
        }
      : null;

  const { anchor, session, navigateTo, ...anchorRest } = useMapAnchor({
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
    follow,
    onReleaseFollow: stopFollowingUser,
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
      followDispatch({ type: "startFollowUser" });
      rememberGpsPosition(position);
      navigateToRef.current(target, {
        duration: smoothFlyDurationMs,
        keepFollowing: true,
      });
    },
    [buildUserPosition, rememberGpsPosition, smoothFlyDurationMs, mapRef],
  );

  useEffect(() => {
    if (
      !followState.followUser ||
      !followState.hasBootFlown ||
      !hasUserLocation ||
      !mapRef ||
      session !== "idle"
    ) {
      if (
        mapPaddingDebug &&
        hasUserLocation &&
        followState.followUser &&
        followState.hasBootFlown &&
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
      keepFollowing: true,
    });
    if (mapPaddingDebug) {
      console.info("[map-follow-gps] navigate", {
        lat: position.lat,
        lng: position.lng,
        applied,
      });
    }
  }, [
    followState.followUser,
    followState.hasBootFlown,
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
    tracking: followState.followUser,
    followUser: followState.followUser,
    hasBootFlown: followState.hasBootFlown,
    recenterOnUser,
  };
}
