import { useCallback, useEffect, useReducer, useRef } from "react";
import type { MapRef } from "react-map-gl/mapbox";

import type { PixelPoint } from "../viewport/types/pixel";
import { jumpToMapAnchor } from "./anchor";
import { createInitialMapFollowState, reduceMapFollow } from "./follow";
import type { MapPosition } from "./map-position";
import type {
  NavigateToMapAnchorOptions,
  UseMapAnchorOptions,
} from "./use-map-anchor";
import { useMapAnchor } from "./use-map-anchor";

export type MapUserLocationCoords = {
  lng: number;
  lat: number;
  accuracyMeters?: number | null;
};

export type UseMapFollowUserOptions = {
  mapRef: MapRef | null;
  userLocation: MapUserLocationCoords | null;
  /** True after measured snap heights are available from the sheet. */
  snapHeightsMeasured: boolean;
  centerOffset: PixelPoint;
  /** When false, skip boot sampling and gesture listeners. */
  anchorEnabled?: boolean;
  followZoom?: number;
  smoothFlyDurationMs?: number;
};

export function useMapFollowUser({
  mapRef,
  userLocation,
  snapHeightsMeasured,
  centerOffset,
  anchorEnabled = true,
  followZoom = 15,
  smoothFlyDurationMs = 1000,
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

  const zoomRef = useRef(followZoom);
  const followDispatchRef = useRef(followDispatch);
  followDispatchRef.current = followDispatch;
  const hasAutoFollowedRef = useRef(false);
  const bootCompletedRef = useRef(false);
  const lastGpsJumpLatRef = useRef<number | undefined>(undefined);
  const lastGpsJumpLngRef = useRef<number | undefined>(undefined);

  const rememberGpsJumpBaseline = useCallback(() => {
    if (!hasUserLocation) {
      return;
    }

    lastGpsJumpLatRef.current = userLocationLat;
    lastGpsJumpLngRef.current = userLocationLng;
  }, [hasUserLocation, userLocationLat, userLocationLng]);

  useEffect(() => {
    if (!hasUserLocation || hasAutoFollowedRef.current) {
      return;
    }

    hasAutoFollowedRef.current = true;
    followDispatch({ type: "startFollowUser" });
  }, [hasUserLocation]);

  const buildUserPosition = useCallback((): MapPosition | null => {
    if (!hasUserLocation) {
      return null;
    }

    return {
      lat: userLocationLat,
      lng: userLocationLng,
      zoom: zoomRef.current,
    };
  }, [hasUserLocation, userLocationLat, userLocationLng]);

  const navigateToRef = useRef<
    (position: MapPosition, options?: NavigateToMapAnchorOptions) => boolean
  >(() => false);

  const startFollowingUser = useCallback(() => {
    const position = buildUserPosition();
    if (!position) {
      return;
    }

    followDispatch({ type: "startFollowUser" });
    rememberGpsJumpBaseline();
    navigateToRef.current(position, { duration: smoothFlyDurationMs });
  }, [buildUserPosition, rememberGpsJumpBaseline, smoothFlyDurationMs]);

  const snapBackToUser = useCallback(() => {
    const position = buildUserPosition();
    if (!position) {
      return;
    }

    rememberGpsJumpBaseline();
    navigateToRef.current(position, { duration: smoothFlyDurationMs });
  }, [buildUserPosition, rememberGpsJumpBaseline, smoothFlyDurationMs]);

  const stopFollowingUser = useCallback(() => {
    followDispatchRef.current({ type: "stopFollowUser" });
  }, []);

  const followOptions: UseMapAnchorOptions["follow"] =
    followState.followUser && hasUserLocation
      ? {
          userLocation: {
            lat: userLocationLat,
            lng: userLocationLng,
          },
          centerOffset,
          onSnapBack: snapBackToUser,
          onExceedThreshold: stopFollowingUser,
        }
      : null;

  const { anchor, session, setAnchor, navigateTo } = useMapAnchor({
    mapRef,
    enabled: anchorEnabled,
    follow: followOptions,
  });

  navigateToRef.current = navigateTo;

  useEffect(() => {
    if (anchor?.zoom !== undefined) {
      zoomRef.current = anchor.zoom;
    }
  }, [anchor?.zoom]);

  useEffect(() => {
    bootCompletedRef.current = followState.hasBootFlown;
  }, [followState.hasBootFlown]);

  useEffect(() => {
    if (
      followState.hasBootFlown ||
      !snapHeightsMeasured ||
      !followState.followUser ||
      !hasUserLocation ||
      !mapRef ||
      !anchorEnabled
    ) {
      return;
    }

    const map = mapRef.getMap();

    const tryBootFly = () => {
      if (bootCompletedRef.current || !map.isStyleLoaded()) {
        return;
      }

      const position = buildUserPosition();
      if (!position) {
        return;
      }

      rememberGpsJumpBaseline();
      const flew = navigateToRef.current(position, {
        duration: smoothFlyDurationMs,
      });
      if (!flew) {
        return;
      }

      bootCompletedRef.current = true;
      followDispatch({ type: "bootFlown" });
    };

    tryBootFly();
    map.on("load", tryBootFly);
    map.on("idle", tryBootFly);

    return () => {
      map.off("load", tryBootFly);
      map.off("idle", tryBootFly);
    };
  }, [
    snapHeightsMeasured,
    followState.hasBootFlown,
    followState.followUser,
    hasUserLocation,
    mapRef,
    anchorEnabled,
    buildUserPosition,
    rememberGpsJumpBaseline,
    smoothFlyDurationMs,
  ]);

  useEffect(() => {
    if (
      !followState.followUser ||
      !followState.hasBootFlown ||
      !hasUserLocation ||
      !mapRef
    ) {
      return;
    }

    if (
      lastGpsJumpLatRef.current === userLocationLat &&
      lastGpsJumpLngRef.current === userLocationLng
    ) {
      return;
    }

    const position = buildUserPosition();
    if (!position) {
      return;
    }

    lastGpsJumpLatRef.current = userLocationLat;
    lastGpsJumpLngRef.current = userLocationLng;
    setAnchor(position);
    jumpToMapAnchor(mapRef, position);
  }, [
    followState.followUser,
    followState.hasBootFlown,
    hasUserLocation,
    userLocationLat,
    userLocationLng,
    mapRef,
    buildUserPosition,
    setAnchor,
  ]);

  const isFollowFocused = followState.followUser && followState.hasBootFlown;

  return {
    anchor,
    session,
    setAnchor,
    navigateTo,
    followUser: followState.followUser,
    hasBootFlown: followState.hasBootFlown,
    isFollowFocused,
    startFollowingUser,
  };
}
