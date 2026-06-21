import { act, createElement, useEffect, useState } from "react";
import { createRoot, type Root } from "react-dom/client";
import type { MapRef } from "react-map-gl/mapbox";
import { describe, expect, it, vi } from "vitest";

import type { MapUserLocationCoords } from "./use-map-follow-user";
import { useMapFollowUser } from "./use-map-follow-user";

type MapEventHandler = (event?: { originalEvent?: Event }) => void;

function createMapRefWithEvents() {
  const handlers = new Map<string, Set<MapEventHandler>>();

  const map = {
    isStyleLoaded: () => true,
    isMoving: () => false,
    getCenter: () => ({ lat: 10, lng: 20 }),
    getZoom: () => 14,
    getPadding: () => ({ top: 0, left: 0, right: 0, bottom: 152 }),
    flyTo: vi.fn(),
    jumpTo: vi.fn(),
    project: () => ({ x: 220, y: 320 }),
    getCanvas: () => ({ clientWidth: 400, clientHeight: 800 }),
    on(event: string, handler: MapEventHandler) {
      const set = handlers.get(event) ?? new Set();
      set.add(handler);
      handlers.set(event, set);
    },
    off(event: string, handler: MapEventHandler) {
      handlers.get(event)?.delete(handler);
    },
    once(event: string, handler: MapEventHandler) {
      const wrapper: MapEventHandler = (payload) => {
        map.off(event, wrapper);
        handler(payload);
      };
      map.on(event, wrapper);
    },
    emit(event: string, payload?: { originalEvent?: Event }) {
      for (const handler of handlers.get(event) ?? []) {
        handler(payload);
      }
    },
  };

  const mapRef = {
    getMap: () => map,
  } as MapRef;

  return { mapRef, map };
}

describe("useMapFollowUser", () => {
  it("boot flies once after snap heights are measured", () => {
    const { mapRef, map } = createMapRefWithEvents();
    const container = document.createElement("div");
    const root: Root = createRoot(container);
    let latest: ReturnType<typeof useMapFollowUser> | null = null;

    act(() => {
      root.render(
        createElement(() => {
          latest = useMapFollowUser({
            mapRef,
            userLocation: { lat: 37.1, lng: -113.57 },
            snapHeightsMeasured: true,
            centerOffset: { x: 0, y: -50 },
          });
          return null;
        }),
      );
    });

    expect(latest?.followUser).toBe(true);
    expect(latest?.hasBootFlown).toBe(true);
    expect(latest?.isFollowFocused).toBe(true);
    expect(map.flyTo).toHaveBeenCalledTimes(1);
    expect(map.jumpTo).not.toHaveBeenCalled();

    act(() => {
      root.unmount();
    });
  });

  it("jumps on gps updates after boot without flying again", () => {
    const { mapRef, map } = createMapRefWithEvents();
    const container = document.createElement("div");
    const root: Root = createRoot(container);

    function GpsHarness() {
      const [userLocation, setUserLocation] = useState<MapUserLocationCoords>({
        lat: 37.1,
        lng: -113.57,
      });

      useMapFollowUser({
        mapRef,
        userLocation,
        snapHeightsMeasured: true,
        centerOffset: { x: 0, y: -50 },
      });

      return createElement("button", {
        type: "button",
        onClick: () => {
          setUserLocation({ lat: 37.11, lng: -113.58 });
        },
      });
    }

    act(() => {
      root.render(createElement(GpsHarness));
    });

    const flyCallsAfterBoot = map.flyTo.mock.calls.length;
    const jumpCallsAfterBoot = map.jumpTo.mock.calls.length;

    act(() => {
      container
        .querySelector("button")
        ?.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    });

    expect(map.flyTo.mock.calls.length).toBe(flyCallsAfterBoot);
    expect(map.jumpTo.mock.calls.length).toBeGreaterThan(jumpCallsAfterBoot);

    act(() => {
      root.unmount();
    });
  });

  it("boot flies when user location arrives after snap heights", () => {
    const { mapRef, map } = createMapRefWithEvents();
    const container = document.createElement("div");
    const root: Root = createRoot(container);

    function AsyncLocationHarness() {
      const [userLocation, setUserLocation] =
        useState<MapUserLocationCoords | null>(null);
      const [snapHeightsMeasured, setSnapHeightsMeasured] = useState(false);

      useEffect(() => {
        setSnapHeightsMeasured(true);
      }, []);

      useEffect(() => {
        setUserLocation({ lat: 37.1, lng: -113.57 });
      }, []);

      useMapFollowUser({
        mapRef,
        userLocation,
        snapHeightsMeasured,
        centerOffset: { x: 0, y: -50 },
      });

      return null;
    }

    act(() => {
      root.render(createElement(AsyncLocationHarness));
    });

    expect(map.flyTo).toHaveBeenCalledTimes(1);
    expect(map.jumpTo).not.toHaveBeenCalled();

    act(() => {
      root.unmount();
    });
  });

  it("isFollowFocused stays false until boot fly succeeds", () => {
    const { mapRef } = createMapRefWithEvents();
    const container = document.createElement("div");
    const root: Root = createRoot(container);
    let latest: ReturnType<typeof useMapFollowUser> | null = null;

    act(() => {
      root.render(
        createElement(() => {
          latest = useMapFollowUser({
            mapRef,
            userLocation: null,
            snapHeightsMeasured: true,
            centerOffset: { x: 0, y: -50 },
          });
          return null;
        }),
      );
    });

    expect(latest?.followUser).toBe(false);
    expect(latest?.isFollowFocused).toBe(false);

    act(() => {
      root.unmount();
    });
  });

  it("startFollowingUser flies without an immediate gps jump", () => {
    const { mapRef, map } = createMapRefWithEvents();
    const container = document.createElement("div");
    const root: Root = createRoot(container);
    let latest: ReturnType<typeof useMapFollowUser> | null = null;

    act(() => {
      root.render(
        createElement(() => {
          latest = useMapFollowUser({
            mapRef,
            userLocation: { lat: 37.1, lng: -113.57 },
            snapHeightsMeasured: true,
            centerOffset: { x: 0, y: -50 },
          });
          return null;
        }),
      );
    });

    map.flyTo.mockClear();
    map.jumpTo.mockClear();

    act(() => {
      latest?.startFollowingUser();
    });

    expect(map.flyTo).toHaveBeenCalledTimes(1);
    expect(map.jumpTo).not.toHaveBeenCalled();

    act(() => {
      root.unmount();
    });
  });
});
