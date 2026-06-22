import type { MapRef } from "react-map-gl/mapbox";
import { describe, expect, it, vi } from "vitest";

import type { MapAnchorState } from "../anchor";
import { applyMapPadding } from "./apply";

function createMapRefMock() {
  const map = {
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
  navigationIntent: null,
};

const userGestureState: MapAnchorState = {
  ...idleState,
  session: "userGesture",
};

const navigatingState: MapAnchorState = {
  anchor: { lat: 3, lng: 4, zoom: 16 },
  session: "navigating",
  navigationIntent: { target: { lat: 3, lng: 4, zoom: 16 } },
};

describe("applyMapPadding", () => {
  it("does nothing when padding did not change", () => {
    const { mapRef, map } = createMapRefMock();

    applyMapPadding({
      mapRef,
      state: navigatingState,
      paddingChanged: false,
      sheetMotionActive: true,
    });

    expect(map.jumpTo).not.toHaveBeenCalled();
  });

  it("does nothing when realign is false", () => {
    const { mapRef, map } = createMapRefMock();

    applyMapPadding({
      mapRef,
      state: navigatingState,
      paddingChanged: true,
      realign: false,
      sheetMotionActive: true,
    });

    expect(map.jumpTo).not.toHaveBeenCalled();
  });

  it("idle + sheet moves + follow off: no camera realign", () => {
    const { mapRef, map } = createMapRefMock();

    applyMapPadding({
      mapRef,
      state: idleState,
      paddingChanged: true,
      sheetMotionActive: true,
    });

    expect(map.jumpTo).not.toHaveBeenCalled();
  });

  it("idle + sheet moves + follow on: jumps to follow target", () => {
    const { mapRef, map } = createMapRefMock();
    const followTarget = { lat: 11, lng: 21, zoom: 15 };

    applyMapPadding({
      mapRef,
      state: idleState,
      paddingChanged: true,
      sheetMotionActive: true,
      followUser: true,
      followTarget,
    });

    expect(map.jumpTo).toHaveBeenCalledWith(
      expect.objectContaining({
        center: [21, 11],
        zoom: 15,
      }),
    );
  });

  it("userGesture + sheet moves: setPadding only (no jump)", () => {
    const { mapRef, map } = createMapRefMock();

    applyMapPadding({
      mapRef,
      state: userGestureState,
      paddingChanged: true,
      sheetMotionActive: true,
      followUser: true,
      followTarget: { lat: 11, lng: 21 },
    });

    expect(map.jumpTo).not.toHaveBeenCalled();
  });

  it("navigating + sheet moves: jumps to navigation target", () => {
    const { mapRef, map } = createMapRefMock();

    applyMapPadding({
      mapRef,
      state: navigatingState,
      paddingChanged: true,
      sheetMotionActive: true,
    });

    expect(map.jumpTo).toHaveBeenCalledWith(
      expect.objectContaining({
        center: [4, 3],
        zoom: 16,
      }),
    );
  });

  it("navigating + sheet idle: no jump", () => {
    const { mapRef, map } = createMapRefMock();

    applyMapPadding({
      mapRef,
      state: navigatingState,
      paddingChanged: true,
      sheetMotionActive: false,
    });

    expect(map.jumpTo).not.toHaveBeenCalled();
  });
});
