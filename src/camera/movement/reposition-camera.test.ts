import type { MapRef } from "react-map-gl/mapbox";
import { describe, expect, it, vi } from "vitest";

import type { MapPosition } from "../shared/map-position";
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
  it("jumps without updating anchor when updateAnchor is omitted", () => {
    const { mapRef, map } = createMapRefMock();

    const applied = repositionCamera({
      mapRef,
      position: { lat: 37.5, lng: -112.5 },
      currentAnchor: { lat: 1, lng: 2, zoom: 12 },
    });

    expect(applied).toBe(true);
    expect(map.jumpTo).toHaveBeenCalled();
    expect(map.flyTo).not.toHaveBeenCalled();
  });

  it("jumps instantly and merges anchor when updateAnchor is provided", () => {
    const { mapRef, map } = createMapRefMock();
    const updateAnchor = vi.fn();
    const currentAnchor: MapPosition = { lat: 1, lng: 2, zoom: 12 };
    const next: MapPosition = { lat: 37.5, lng: -112.5 };

    const applied = repositionCamera({
      mapRef,
      position: next,
      currentAnchor,
      updateAnchor,
    });

    expect(applied).toBe(true);
    expect(updateAnchor).toHaveBeenCalledWith({
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
});
