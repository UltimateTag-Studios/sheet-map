import type { MapRef } from "react-map-gl/mapbox";
import { describe, expect, it, vi } from "vitest";

import type { MapAnchorState } from "../lib";
import { applyMapPadding } from "./apply";

function createMapRefMock() {
  const map = {
    isStyleLoaded: () => true,
    getPadding: () => ({ top: 0, left: 0, right: 0, bottom: 152 }),
    flyTo: vi.fn(),
    jumpTo: vi.fn(),
  };

  return {
    mapRef: { getMap: () => map } as unknown as MapRef,
    map,
  };
}

const idleState: MapAnchorState = {
  anchor: { lat: 10, lng: 20, zoom: 14 },
  session: "idle",
};

const userGestureState: MapAnchorState = {
  ...idleState,
  session: "userGesture",
};

const flyingState: MapAnchorState = {
  anchor: { lat: 3, lng: 4, zoom: 16 },
  session: "flying",
};

describe("applyMapPadding", () => {
  it("does nothing when padding did not change", () => {
    const { mapRef, map } = createMapRefMock();

    applyMapPadding({
      mapRef,
      state: flyingState,
      paddingChanged: false,
    });

    expect(map.jumpTo).not.toHaveBeenCalled();
  });

  it("does nothing when realign is false", () => {
    const { mapRef, map } = createMapRefMock();

    applyMapPadding({
      mapRef,
      state: flyingState,
      paddingChanged: true,
      realign: false,
    });

    expect(map.jumpTo).not.toHaveBeenCalled();
  });

  it("idle + sheet moves: jumps to anchor", () => {
    const { mapRef, map } = createMapRefMock();

    applyMapPadding({
      mapRef,
      state: idleState,
      paddingChanged: true,
    });

    expect(map.jumpTo).toHaveBeenCalledWith(
      expect.objectContaining({
        center: [20, 10],
        zoom: 14,
      }),
    );
  });

  it("userGesture + sheet moves: setPadding only (no jump)", () => {
    const { mapRef, map } = createMapRefMock();

    applyMapPadding({
      mapRef,
      state: userGestureState,
      paddingChanged: true,
    });

    expect(map.jumpTo).not.toHaveBeenCalled();
  });

  it("flying + sheet moves: jumps to anchor", () => {
    const { mapRef, map } = createMapRefMock();
    const onRealignAnchor = vi.fn();

    applyMapPadding({
      mapRef,
      state: flyingState,
      paddingChanged: true,
      onRealignAnchor,
    });

    expect(map.jumpTo).toHaveBeenCalledWith(
      expect.objectContaining({
        center: [4, 3],
        zoom: 16,
      }),
    );
    expect(onRealignAnchor).toHaveBeenCalledWith({
      lat: 3,
      lng: 4,
      zoom: 16,
    });
  });

  it("flying + realign disabled: no jump", () => {
    const { mapRef, map } = createMapRefMock();

    applyMapPadding({
      mapRef,
      state: flyingState,
      paddingChanged: true,
      realign: false,
    });

    expect(map.jumpTo).not.toHaveBeenCalled();
  });
});
