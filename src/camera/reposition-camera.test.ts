import type { MapRef } from "react-map-gl/mapbox";
import { describe, expect, it, vi } from "vitest";

import type { MapPosition } from "./map-position";
import { repositionCamera } from "./reposition-camera";

function createMapRefMock(styleLoaded = true) {
  const map = {
    isStyleLoaded: () => styleLoaded,
    getPadding: () => ({ top: 0, left: 0, right: 0, bottom: 152 }),
    flyTo: vi.fn(),
    jumpTo: vi.fn(),
  };

  return {
    mapRef: { getMap: () => map } as unknown as MapRef,
    map,
  };
}

describe("repositionCamera", () => {
  it("jumps instantly and updates anchor without starting navigation", () => {
    const { mapRef, map } = createMapRefMock();
    const setAnchor = vi.fn();
    const currentAnchor: MapPosition = { lat: 1, lng: 2, zoom: 12 };
    const next: MapPosition = { lat: 37.5, lng: -112.5 };

    const applied = repositionCamera(mapRef, next, currentAnchor, setAnchor);

    expect(applied).toBe(true);
    expect(setAnchor).toHaveBeenCalledWith({
      lat: 37.5,
      lng: -112.5,
      zoom: 12,
    });
    expect(map.jumpTo).toHaveBeenCalledWith({
      center: [-112.5, 37.5],
      padding: { top: 0, left: 0, right: 0, bottom: 152 },
    });
    expect(map.flyTo).not.toHaveBeenCalled();
  });

  it("returns false when the map style is not loaded", () => {
    const { mapRef, map } = createMapRefMock(false);
    const setAnchor = vi.fn();

    const applied = repositionCamera(
      mapRef,
      { lat: 1, lng: 2 },
      null,
      setAnchor,
    );

    expect(applied).toBe(false);
    expect(setAnchor).not.toHaveBeenCalled();
    expect(map.jumpTo).not.toHaveBeenCalled();
  });
});
