import { type RefObject, useCallback, useLayoutEffect, useRef } from "react";
import type { MapRef } from "react-map-gl/mapbox";

import { areBootFlyGatesReady, tryBootFly } from "../../boot/try-boot-fly";
import { hasBootFlownForMapInstance } from "../../instance/camera-state";
import type { MapPosition } from "../../shared/map-position";
import type { NavigateToMapAnchorOptions } from "./types";

export type UseBootFlyCoordinatorInput = {
  mapRef: MapRef | null;
  enabled: boolean;
  bootTarget: MapPosition | null;
  bootDurationMs?: number;
  smoothFlyDurationMs: number;
  mapPaddingReadyRef: RefObject<boolean>;
  navigateToRef: RefObject<
    (position: MapPosition, options?: NavigateToMapAnchorOptions) => boolean
  >;
  onBootIssued?: () => void;
  mapPaddingDebug: boolean;
};

export type BootFlyCoordinatorHandle = {
  attemptBoot: () => void;
};

/**
 * Promise.all-style boot: `attemptBoot` runs after commit when map / target gates
 * change, and when padding becomes ready via `onPaddingReady`.
 */
export function useBootFlyCoordinator({
  mapRef,
  enabled,
  bootTarget,
  bootDurationMs,
  smoothFlyDurationMs,
  mapPaddingReadyRef,
  navigateToRef,
  onBootIssued,
  mapPaddingDebug,
}: UseBootFlyCoordinatorInput): BootFlyCoordinatorHandle {
  const onBootIssuedRef = useRef(onBootIssued);
  onBootIssuedRef.current = onBootIssued;

  const smoothFlyDurationMsRef = useRef(smoothFlyDurationMs);
  smoothFlyDurationMsRef.current = smoothFlyDurationMs;

  const bootDurationMsRef = useRef(bootDurationMs);
  bootDurationMsRef.current = bootDurationMs;

  const attemptBoot = useCallback(() => {
    if (
      !areBootFlyGatesReady({
        enabled,
        mapRef,
        bootTarget,
        mapPaddingReady: mapPaddingReadyRef.current,
      })
    ) {
      return;
    }

    const map = mapRef?.getMap();
    if (map && hasBootFlownForMapInstance(map)) {
      return;
    }

    tryBootFly({
      bootTarget,
      mapRef,
      enabled,
      mapPaddingReady: true,
      navigateTo: (position, options) =>
        navigateToRef.current(position, options),
      smoothFlyDurationMs: smoothFlyDurationMsRef.current,
      bootDurationMs: bootDurationMsRef.current,
      onBootIssued: () => onBootIssuedRef.current?.(),
      debug: mapPaddingDebug,
    });
  }, [
    mapRef,
    enabled,
    bootTarget,
    mapPaddingReadyRef,
    navigateToRef,
    mapPaddingDebug,
  ]);

  useLayoutEffect(() => {
    attemptBoot();
  }, [attemptBoot]);

  return { attemptBoot };
}
