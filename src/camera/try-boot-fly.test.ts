import type { MapRef } from "react-map-gl/mapbox";
import { describe, expect, it, vi } from "vitest";

import {
  hasBootFlownForMapInstance,
  markBootFlownForMapInstance,
} from "./map-instance-camera-state";
import { tryBootFly } from "./try-boot-fly";

function createMapRef() {
  const map = {
    isStyleLoaded: () => true,
  };

  return {
    getMap: () => map,
  } as unknown as MapRef;
}

describe("tryBootFly", () => {
  it("navigates once when boot is enabled and padding is ready", () => {
    const mapRef = createMapRef();
    const navigateTo = vi.fn(() => true);
    const onIssued = vi.fn();
    const target = { lat: 40, lng: -74, zoom: 12 };

    const issued = tryBootFly({
      bootEnabled: true,
      bootConfig: {
        enabled: true,
        getTarget: () => target,
        onIssued,
        durationMs: 500,
      },
      mapRef,
      enabled: true,
      mapPaddingReady: true,
      session: "idle",
      navigateTo,
      smoothFlyDurationMs: 600,
    });

    expect(issued).toBe(true);
    expect(navigateTo).toHaveBeenCalledWith(target, { duration: 500 });
    expect(onIssued).toHaveBeenCalledTimes(1);
    expect(hasBootFlownForMapInstance(mapRef.getMap())).toBe(true);
  });

  it("skips when the boot latch is already set", () => {
    const mapRef = createMapRef();
    markBootFlownForMapInstance(mapRef.getMap());
    const navigateTo = vi.fn(() => true);

    const issued = tryBootFly({
      bootEnabled: true,
      bootConfig: {
        enabled: true,
        getTarget: () => ({ lat: 1, lng: 2 }),
      },
      mapRef,
      enabled: true,
      mapPaddingReady: true,
      session: "idle",
      navigateTo,
      smoothFlyDurationMs: 600,
    });

    expect(issued).toBe(false);
    expect(navigateTo).not.toHaveBeenCalled();
  });

  it("skips when getTarget returns null", () => {
    const mapRef = createMapRef();
    const navigateTo = vi.fn(() => true);

    const issued = tryBootFly({
      bootEnabled: true,
      bootConfig: {
        enabled: true,
        getTarget: () => null,
      },
      mapRef,
      enabled: true,
      mapPaddingReady: true,
      session: "idle",
      navigateTo,
      smoothFlyDurationMs: 600,
    });

    expect(issued).toBe(false);
    expect(navigateTo).not.toHaveBeenCalled();
    expect(hasBootFlownForMapInstance(mapRef.getMap())).toBe(false);
  });

  it("skips when map padding is not ready", () => {
    const mapRef = createMapRef();
    const navigateTo = vi.fn(() => true);

    const issued = tryBootFly({
      bootEnabled: true,
      bootConfig: {
        enabled: true,
        getTarget: () => ({ lat: 1, lng: 2 }),
      },
      mapRef,
      enabled: true,
      mapPaddingReady: false,
      session: "idle",
      navigateTo,
      smoothFlyDurationMs: 600,
    });

    expect(issued).toBe(false);
    expect(navigateTo).not.toHaveBeenCalled();
  });
});
