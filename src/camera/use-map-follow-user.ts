import { useCallback, useEffect, useReducer, useRef, useState } from "react";
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

  /** Boot uses the first GPS fix only — watchPosition updates must not retrigger boot. */
  const [bootTarget, setBootTarget] = useState<MapPosition | null>(null);

  useEffect(() => {
    if (!hasUserLocation || hasStartedFollowRef.current) {
      return;
    }

    hasStartedFollowRef.current = true;
    followDispatch({ type: "startFollowUser" });
  }, [hasUserLocation]);

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
    hasStartedFollowRef.current = false;
    setBootTarget(null);
    onMapInstanceReleasedOption?.();
  }, [onMapInstanceReleasedOption]);

  const onBootIssued = useCallback(() => {
    followDispatch({ type: "bootFlown" });
  }, []);

  const anchor = useMapAnchor({
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
  });

  return {
    ...anchor,
    followUser: followState.followUser,
    hasBootFlown: followState.hasBootFlown,
  };
}
