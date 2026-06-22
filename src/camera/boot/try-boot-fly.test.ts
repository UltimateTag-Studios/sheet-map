import type { MapRef } from "react-map-gl/mapbox";
import { describe, expect, it, vi } from "vitest";

import {
  hasBootFlownForMapInstance,
  markBootFlownForMapInstance,
} from "../instance/camera-state";
import { areBootFlyGatesReady, tryBootFly } from "./try-boot-fly";

function createMapRef() {
  const map = {
    isStyleLoaded: () => true,
  };

  return {
    getMap: () => map,
  } as unknown as MapRef;
}

describe("areBootFlyGatesReady", () => {
  it("requires map, target, and padding", () => {
    const mapRef = createMapRef();
    const target = { lat: 1, lng: 2 };

    expect(
      areBootFlyGatesReady({
        enabled: true,
        mapRef,
        bootTarget: target,
        mapPaddingReady: true,
      }),
    ).toBe(true);

    expect(
      areBootFlyGatesReady({
        enabled: true,
        mapRef: null,
        bootTarget: target,
        mapPaddingReady: true,
      }),
    ).toBe(false);
  });
});

describe("tryBootFly", () => {
  it("navigates once when boot target and padding are ready", () => {
    const mapRef = createMapRef();
    const navigateTo = vi.fn(() => true);
    const onBootIssued = vi.fn();
    const target = { lat: 40, lng: -74, zoom: 12 };

    const result = tryBootFly({
      bootTarget: target,
      mapRef,
      enabled: true,
      mapPaddingReady: true,
      navigateTo,
      smoothFlyDurationMs: 600,
      bootDurationMs: 500,
      onBootIssued,
    });

    expect(result).toEqual({ issued: true });
    expect(navigateTo).toHaveBeenCalledWith(target, {
      duration: 500,
      keepTracking: true,
    });
    expect(onBootIssued).toHaveBeenCalledTimes(1);
    expect(hasBootFlownForMapInstance(mapRef.getMap())).toBe(true);
  });

  it("skips when the boot latch is already set", () => {
    const mapRef = createMapRef();
    markBootFlownForMapInstance(mapRef.getMap());
    const navigateTo = vi.fn(() => true);

    const result = tryBootFly({
      bootTarget: { lat: 1, lng: 2 },
      mapRef,
      enabled: true,
      mapPaddingReady: true,
      navigateTo,
      smoothFlyDurationMs: 600,
    });

    expect(result).toEqual({ issued: false, reason: "already_flown" });
    expect(navigateTo).not.toHaveBeenCalled();
  });

  it("skips when boot target is null", () => {
    const mapRef = createMapRef();
    const navigateTo = vi.fn(() => true);

    const result = tryBootFly({
      bootTarget: null,
      mapRef,
      enabled: true,
      mapPaddingReady: true,
      navigateTo,
      smoothFlyDurationMs: 600,
    });

    expect(result).toEqual({ issued: false, reason: "no_target" });
    expect(navigateTo).not.toHaveBeenCalled();
    expect(hasBootFlownForMapInstance(mapRef.getMap())).toBe(false);
  });

  it("skips when map padding is not ready", () => {
    const mapRef = createMapRef();
    const navigateTo = vi.fn(() => true);

    const result = tryBootFly({
      bootTarget: { lat: 1, lng: 2 },
      mapRef,
      enabled: true,
      mapPaddingReady: false,
      navigateTo,
      smoothFlyDurationMs: 600,
    });

    expect(result).toEqual({ issued: false, reason: "padding_not_ready" });
    expect(navigateTo).not.toHaveBeenCalled();
  });

  it("does not gate boot on isStyleLoaded when mapRef is published", () => {
    const map = {
      isStyleLoaded: () => false,
    };
    const mapRef = {
      getMap: () => map,
    } as unknown as MapRef;
    const navigateTo = vi.fn(() => true);

    const result = tryBootFly({
      bootTarget: { lat: 1, lng: 2, zoom: 12 },
      mapRef,
      enabled: true,
      mapPaddingReady: true,
      navigateTo,
      smoothFlyDurationMs: 600,
    });

    expect(result).toEqual({ issued: true });
    expect(navigateTo).toHaveBeenCalledTimes(1);
  });
});
