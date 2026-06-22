import type { MapRef } from "react-map-gl/mapbox";

import {
  hasBootIssuedForMapInstance,
  markBootIssuedForMapInstance,
} from "../instance/camera-state";
import type { MapPosition } from "../shared/map-position";

export type BootFlyBlockReason =
  | "disabled"
  | "no_target"
  | "no_map"
  | "padding_not_ready"
  | "already_issued"
  | "navigate_rejected";

export type TryBootFlyResult =
  | { issued: true }
  | { issued: false; reason: BootFlyBlockReason };

export type TryBootFlyInput = {
  bootTarget: MapPosition | null;
  mapRef: MapRef | null;
  enabled: boolean;
  mapPaddingReady: boolean;
  navigateTo: (
    position: MapPosition,
    options?: { duration?: number; keepTracking?: boolean },
  ) => boolean;
  smoothFlyDurationMs: number;
  bootDurationMs?: number;
  onBootIssued?: () => void;
  debug?: boolean;
};

const silentBlockReasons = new Set<BootFlyBlockReason>([
  "already_issued",
  "no_target",
  "padding_not_ready",
]);

function blocked(reason: BootFlyBlockReason, debug: boolean): TryBootFlyResult {
  if (debug && !silentBlockReasons.has(reason)) {
    console.info("[boot-fly] blocked", { reason });
  }
  return { issued: false, reason };
}

/** All gates required before boot — mapRef implies style ready (MapCanvas publishes on `onLoad`). */
export function areBootFlyGatesReady(input: {
  enabled: boolean;
  mapRef: MapRef | null;
  bootTarget: MapPosition | null;
  mapPaddingReady: boolean;
}): boolean {
  return Boolean(
    input.enabled && input.mapRef && input.bootTarget && input.mapPaddingReady,
  );
}

/**
 * One-shot boot fly when map, padding, and target are ready.
 * Uses `navigateTo` (stops user momentum) — does not wait for session idle.
 */
export function tryBootFly(input: TryBootFlyInput): TryBootFlyResult {
  const {
    bootTarget,
    mapRef,
    enabled,
    mapPaddingReady,
    navigateTo,
    smoothFlyDurationMs,
    bootDurationMs,
    onBootIssued,
    debug = false,
  } = input;

  if (!enabled) {
    return blocked("disabled", debug);
  }
  if (!bootTarget) {
    return blocked("no_target", debug);
  }
  if (!mapRef) {
    return blocked("no_map", debug);
  }

  const map = mapRef.getMap();

  if (hasBootIssuedForMapInstance(map)) {
    return blocked("already_issued", debug);
  }
  if (!mapPaddingReady) {
    return blocked("padding_not_ready", debug);
  }

  const applied = navigateTo(bootTarget, {
    duration: bootDurationMs ?? smoothFlyDurationMs,
    keepTracking: true,
  });
  if (!applied) {
    return blocked("navigate_rejected", debug);
  }

  markBootIssuedForMapInstance(map);
  onBootIssued?.();

  if (debug) {
    console.info("[boot-fly] issued", { target: bootTarget });
  }

  return { issued: true };
}
