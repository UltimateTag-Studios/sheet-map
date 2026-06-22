import {
  type MutableRefObject,
  useCallback,
  useLayoutEffect,
  useRef,
} from "react";
import type { MapRef } from "react-map-gl/mapbox";

import { hasBootFlownForMapInstance } from "../map-instance-camera-state";
import type { MapPosition } from "../map-position";
import { areBootFlyGatesReady, tryBootFly } from "../try-boot-fly";
import type { MapAnchorSessionRefs } from "./session-refs";
import type { NavigateToMapAnchorOptions } from "./types";

export type UseBootFlyCoordinatorInput = {
  mapRef: MapRef | null;
  enabled: boolean;
  bootTarget: MapPosition | null;
  bootDurationMs?: number;
  smoothFlyDurationMs: number;
  mapPaddingReadyRef: MutableRefObject<boolean>;
  onBootAttemptRef: MutableRefObject<(() => void) | null>;
  session: MapAnchorSessionRefs;
  navigateToRef: MutableRefObject<
    (position: MapPosition, options?: NavigateToMapAnchorOptions) => boolean
  >;
  onBootIssued?: () => void;
  mapPaddingDebug: boolean;
};

/**
 * Promise.all-style boot: `maybeBoot` runs after commit when map / target gates
 * change, and synchronously when padding or session-idle flips via `onBootAttemptRef`.
 */
export function useBootFlyCoordinator({
  mapRef,
  enabled,
  bootTarget,
  bootDurationMs,
  smoothFlyDurationMs,
  mapPaddingReadyRef,
  onBootAttemptRef,
  session,
  navigateToRef,
  onBootIssued,
  mapPaddingDebug,
}: UseBootFlyCoordinatorInput): void {
  const bootTargetRef = useRef(bootTarget);
  bootTargetRef.current = bootTarget;

  const onBootIssuedRef = useRef(onBootIssued);
  onBootIssuedRef.current = onBootIssued;

  const smoothFlyDurationMsRef = useRef(smoothFlyDurationMs);
  smoothFlyDurationMsRef.current = smoothFlyDurationMs;

  const bootDurationMsRef = useRef(bootDurationMs);
  bootDurationMsRef.current = bootDurationMs;

  const { stateRef } = session;

  const maybeBoot = useCallback(() => {
    const target = bootTargetRef.current;
    if (
      !areBootFlyGatesReady({
        enabled,
        mapRef,
        bootTarget: target,
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
      bootTarget: target,
      mapRef,
      enabled,
      mapPaddingReady: true,
      session: stateRef.current.session,
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
    mapPaddingReadyRef,
    stateRef,
    navigateToRef,
    mapPaddingDebug,
  ]);

  onBootAttemptRef.current = maybeBoot;

  // After commit — never call navigateTo during render (Strict Mode / dispatch rules).
  useLayoutEffect(() => {
    maybeBoot();
  }, [maybeBoot, mapRef, enabled, bootTarget]);
}
