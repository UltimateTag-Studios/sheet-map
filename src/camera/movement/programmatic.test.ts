import type { MapRef } from "react-map-gl/mapbox";
import { describe, expect, it, vi } from "vitest";

import { moveCameraProgrammatic } from "./programmatic";

function createMapRefMock() {
  const map = {
    isStyleLoaded: () => true,
    getPadding: () => ({ top: 0, left: 0, right: 0, bottom: 0 }),
    stop: vi.fn(),
    flyTo: vi.fn(),
    jumpTo: vi.fn(),
  };

  return {
    mapRef: { getMap: () => map } as unknown as MapRef,
    map,
  };
}

describe("moveCameraProgrammatic", () => {
  it("stops user motion by default then jumps when duration is 0", () => {
    const { mapRef, map } = createMapRefMock();
    const onBeforeCamera = vi.fn();

    const applied = moveCameraProgrammatic({
      mapRef,
      position: { lat: 1, lng: 2 },
      duration: 0,
      onBeforeCamera,
    });

    expect(applied).toBe(true);
    expect(map.stop).toHaveBeenCalled();
    expect(onBeforeCamera).toHaveBeenCalledWith(map);
    expect(map.jumpTo).toHaveBeenCalled();
    expect(map.flyTo).not.toHaveBeenCalled();
  });

  it("flies when duration is greater than 0", () => {
    const { mapRef, map } = createMapRefMock();

    moveCameraProgrammatic({
      mapRef,
      position: { lat: 1, lng: 2, zoom: 14 },
      duration: 500,
    });

    expect(map.stop).toHaveBeenCalled();
    expect(map.flyTo).toHaveBeenCalledWith(
      expect.objectContaining({ duration: 500, zoom: 14 }),
    );
  });

  it("skips map.stop when stopUserMotion is false", () => {
    const { mapRef, map } = createMapRefMock();

    moveCameraProgrammatic({
      mapRef,
      position: { lat: 1, lng: 2 },
      stopUserMotion: false,
    });

    expect(map.stop).not.toHaveBeenCalled();
    expect(map.jumpTo).toHaveBeenCalled();
  });
});
