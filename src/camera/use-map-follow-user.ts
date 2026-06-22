import { useCallback, useEffect, useMemo, useReducer, useRef } from "react";
import type { MapRef } from "react-map-gl/mapbox";

import type { MapObscuredInsets, SheetMotionPhase } from "../viewport";
import { createInitialMapFollowState, reduceMapFollow } from "./follow";
import type { MapPosition } from "./map-position";
import { useMapAnchor } from "./use-map-anchor";

export type MapUserLocationCoords = {
  lng: number;
  lat: number;
  accuracyMeters?: number | null;
};

export type UseMapFollowUserOptions = {
  mapRef: MapRef | null;
  userLocation: MapUserLocationCoords | null;
  enabled?: boolean;
  liveSheetObscuredBottomPx?: number;
  fixedChromeInsets?: Partial<MapObscuredInsets>;
  mapPaddingDebug?: boolean;
  sheetPhase?: SheetMotionPhase;
  followZoom?: number;
  smoothFlyDurationMs?: number;
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
  followZoom = 15,
  smoothFlyDurationMs = 600,
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

  const hasStartedFollowRef = useRef(false);

  useEffect(() => {
    if (!hasUserLocation || hasStartedFollowRef.current) {
      return;
    }

    hasStartedFollowRef.current = true;
    followDispatch({ type: "startFollowUser" });
  }, [hasUserLocation]);

  const buildUserPosition = useCallback(
    (options: { includeZoom?: boolean } = {}): MapPosition | null => {
      if (!hasUserLocation) {
        return null;
      }

      const position: MapPosition = {
        lat: userLocationLat,
        lng: userLocationLng,
      };

      if (options.includeZoom) {
        position.zoom = followZoom;
      }

      return position;
    },
    [hasUserLocation, userLocationLat, userLocationLng, followZoom],
  );

  const onMapInstanceReleased = useCallback(() => {
    followDispatch({ type: "resetBoot" });
    hasStartedFollowRef.current = false;
    onMapInstanceReleasedOption?.();
  }, [onMapInstanceReleasedOption]);

  const boot = useMemo(() => {
    if (!followState.followUser || !hasUserLocation) {
      return null;
    }

    return {
      enabled: true as const,
      getTarget: () => buildUserPosition({ includeZoom: true }),
      onIssued: () => {
        followDispatch({ type: "bootFlown" });
      },
      durationMs: smoothFlyDurationMs,
    };
  }, [
    followState.followUser,
    hasUserLocation,
    buildUserPosition,
    smoothFlyDurationMs,
  ]);

  const anchor = useMapAnchor({
    mapRef,
    enabled,
    liveSheetObscuredBottomPx,
    fixedChromeInsets,
    mapPaddingDebug,
    sheetPhase,
    smoothFlyDurationMs,
    boot,
    onMapInstanceReleased,
  });

  return {
    ...anchor,
    followUser: followState.followUser,
    hasBootFlown: followState.hasBootFlown,
  };
}
