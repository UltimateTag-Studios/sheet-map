import type { MapRef } from "react-map-gl/mapbox";

import type { MapAnchorSession } from "./anchor";
import {
  hasBootFlownForMapInstance,
  markBootFlownForMapInstance,
} from "./map-instance-camera-state";
import type { MapPosition } from "./map-position";

export type MapAnchorBootConfig = {
  /** When true, issue one boot fly after padding and style are ready. */
  enabled: boolean;
  getTarget: () => MapPosition | null;
  onIssued?: () => void;
  durationMs?: number;
};

export type TryBootFlyInput = {
  bootEnabled: boolean;
  bootConfig: MapAnchorBootConfig | null | undefined;
  mapRef: MapRef | null;
  enabled: boolean;
  mapPaddingReady: boolean;
  session: MapAnchorSession;
  navigateTo: (
    position: MapPosition,
    options?: { duration?: number },
  ) => boolean;
  smoothFlyDurationMs: number;
};

/** One-shot boot fly after map padding and style are ready. Returns true when issued. */
export function tryBootFly(input: TryBootFlyInput): boolean {
  const {
    bootEnabled,
    bootConfig,
    mapRef,
    enabled,
    mapPaddingReady,
    session,
    navigateTo,
    smoothFlyDurationMs,
  } = input;

  if (!bootEnabled || !bootConfig?.enabled || !mapRef || !enabled) {
    return false;
  }

  const map = mapRef.getMap();
  if (!map.isStyleLoaded() || !mapPaddingReady) {
    return false;
  }
  if (hasBootFlownForMapInstance(map)) {
    return false;
  }
  if (session !== "idle") {
    return false;
  }

  const target = bootConfig.getTarget();
  if (!target) {
    return false;
  }

  const applied = navigateTo(target, {
    duration: bootConfig.durationMs ?? smoothFlyDurationMs,
  });
  if (!applied) {
    return false;
  }

  markBootFlownForMapInstance(map);
  bootConfig.onIssued?.();
  return true;
}
