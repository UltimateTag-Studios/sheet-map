import { act, createElement } from "react";
import { createRoot, type Root } from "react-dom/client";
import type { MapRef } from "react-map-gl/mapbox";
import { describe, expect, it, vi } from "vitest";

import { useMapAnchor } from "./use-map-anchor";

type MapEventHandler = (event?: { originalEvent?: Event }) => void;

function createMapRefWithEvents(
  options: {
    isMoving?: boolean;
    center?: { lat: number; lng: number };
    zoom?: number;
  } = {},
) {
  const handlers = new Map<string, Set<MapEventHandler>>();
  let isMoving = options.isMoving ?? false;
  let center = options.center ?? { lat: 10, lng: 20 };
  let zoom = options.zoom ?? 14;

  const map = {
    isStyleLoaded: () => true,
    isMoving: () => isMoving,
    getCenter: () => center,
    getZoom: () => zoom,
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
    setMoving(next: boolean) {
      isMoving = next;
    },
    setCenter(next: { lat: number; lng: number }) {
      center = next;
    },
    setZoom(next: number) {
      zoom = next;
    },
  };

  const mapRef = {
    getMap: () => map,
  } as MapRef;

  return { mapRef, map };
}

function mountAnchor(enabled = true) {
  const harness = createMapRefWithEvents();
  const container = document.createElement("div");
  const root: Root = createRoot(container);
  let latest: ReturnType<typeof useMapAnchor> | null = null;

  act(() => {
    root.render(
      createElement(() => {
        latest = useMapAnchor({ mapRef: harness.mapRef, enabled });
        return null;
      }),
    );
  });

  return {
    ...harness,
    get latest() {
      if (!latest) {
        throw new Error("hook not mounted");
      }
      return latest;
    },
    unmount() {
      act(() => {
        root.unmount();
      });
    },
  };
}

describe("useMapAnchor", () => {
  it("boots anchor from the map center when enabled", () => {
    const harness = mountAnchor();

    expect(harness.latest.anchor).toEqual({ lat: 10, lng: 20, zoom: 14 });

    harness.unmount();
  });

  it("skips moveend commits while the map is still moving", () => {
    const harness = createMapRefWithEvents({ isMoving: true });
    const container = document.createElement("div");
    const root: Root = createRoot(container);
    let latest: ReturnType<typeof useMapAnchor> | null = null;

    act(() => {
      root.render(
        createElement(() => {
          latest = useMapAnchor({ mapRef: harness.mapRef });
          return null;
        }),
      );
    });

    act(() => {
      harness.map.emit("dragstart", {
        originalEvent: new Event("pointerdown"),
      });
      harness.map.emit("moveend");
    });

    expect(latest?.session).toBe("userGesture");
    expect(latest?.anchor).toEqual({ lat: 10, lng: 20, zoom: 14 });

    act(() => {
      root.unmount();
    });
  });

  it("commits after moveend when the map has settled", () => {
    const harness = createMapRefWithEvents({ isMoving: false });
    const container = document.createElement("div");
    const root: Root = createRoot(container);
    let latest: ReturnType<typeof useMapAnchor> | null = null;

    act(() => {
      root.render(
        createElement(() => {
          latest = useMapAnchor({ mapRef: harness.mapRef });
          return null;
        }),
      );
    });

    act(() => {
      harness.map.emit("dragstart", {
        originalEvent: new Event("pointerdown"),
      });
      harness.map.setMoving(true);
      harness.map.emit("moveend");
    });

    expect(latest?.session).toBe("userGesture");

    act(() => {
      harness.map.setMoving(false);
      harness.map.setCenter({ lat: 11, lng: 21 });
      harness.map.setZoom(15);
      harness.map.emit("moveend");
    });

    expect(latest?.anchor).toEqual({ lat: 11, lng: 21, zoom: 15 });
    expect(latest?.session).toBe("idle");

    act(() => {
      root.unmount();
    });
  });

  it("navigateTo sets anchor, opens programmatic session, and flies", () => {
    const harness = mountAnchor();
    const destination = { lat: 3, lng: 4, zoom: 16 };

    act(() => {
      harness.latest.navigateTo(destination, { duration: 500 });
    });

    expect(harness.latest.anchor).toEqual(destination);
    expect(harness.latest.session).toBe("programmatic");
    expect(harness.map.flyTo).toHaveBeenCalledWith({
      center: [4, 3],
      zoom: 16,
      padding: { top: 0, left: 0, right: 0, bottom: 152 },
      duration: 500,
    });

    harness.unmount();
  });

  it("closes programmatic session on moveend when already at destination", () => {
    const harness = createMapRefWithEvents({
      center: { lat: 3, lng: 4 },
      zoom: 16,
    });
    const container = document.createElement("div");
    const root: Root = createRoot(container);
    let latest: ReturnType<typeof useMapAnchor> | null = null;
    const destination = { lat: 3, lng: 4, zoom: 16 };

    act(() => {
      root.render(
        createElement(() => {
          latest = useMapAnchor({ mapRef: harness.mapRef });
          return null;
        }),
      );
    });

    act(() => {
      latest?.navigateTo(destination);
    });

    act(() => {
      harness.map.emit("moveend");
    });

    expect(harness.map.jumpTo).not.toHaveBeenCalled();
    expect(latest?.session).toBe("idle");

    act(() => {
      root.unmount();
    });
  });

  it("jumpTo destination when programmatic moveend settles off target", () => {
    const harness = createMapRefWithEvents({ isMoving: false });
    const container = document.createElement("div");
    const root: Root = createRoot(container);
    let latest: ReturnType<typeof useMapAnchor> | null = null;
    const destination = { lat: 3, lng: 4, zoom: 16 };

    act(() => {
      root.render(
        createElement(() => {
          latest = useMapAnchor({ mapRef: harness.mapRef });
          return null;
        }),
      );
    });

    act(() => {
      latest?.navigateTo(destination);
    });

    act(() => {
      harness.map.emit("moveend");
    });

    expect(harness.map.jumpTo).toHaveBeenCalledWith({
      center: [4, 3],
      zoom: 16,
      padding: { top: 0, left: 0, right: 0, bottom: 152 },
    });
    expect(latest?.session).toBe("idle");

    act(() => {
      root.unmount();
    });
  });

  it("waits on programmatic moveend while the map is still moving", () => {
    const harness = createMapRefWithEvents({ isMoving: true });
    const container = document.createElement("div");
    const root: Root = createRoot(container);
    let latest: ReturnType<typeof useMapAnchor> | null = null;

    act(() => {
      root.render(
        createElement(() => {
          latest = useMapAnchor({ mapRef: harness.mapRef });
          return null;
        }),
      );
    });

    act(() => {
      latest?.navigateTo({ lat: 3, lng: 4, zoom: 16 });
      harness.map.emit("moveend");
    });

    expect(harness.map.jumpTo).not.toHaveBeenCalled();
    expect(latest?.session).toBe("programmatic");

    act(() => {
      root.unmount();
    });
  });

  it("reflies instead of jumping when a smooth navigation gets a spurious moveend", () => {
    const harness = createMapRefWithEvents();
    const container = document.createElement("div");
    const root: Root = createRoot(container);
    let latest: ReturnType<typeof useMapAnchor> | null = null;
    const destination = { lat: 3, lng: 4, zoom: 16 };

    act(() => {
      root.render(
        createElement(() => {
          latest = useMapAnchor({ mapRef: harness.mapRef });
          return null;
        }),
      );
    });

    act(() => {
      latest?.navigateTo(destination, { duration: 1000 });
    });

    act(() => {
      harness.map.emit("moveend");
    });

    expect(harness.map.jumpTo).not.toHaveBeenCalled();
    expect(harness.map.flyTo).toHaveBeenCalledTimes(2);

    act(() => {
      root.unmount();
    });
  });

  it("snaps back when follow is enabled and pan is within threshold", () => {
    const onSnapBack = vi.fn();
    const onExceedThreshold = vi.fn();
    const harness = createMapRefWithEvents();
    const container = document.createElement("div");
    const root: Root = createRoot(container);
    let latest: ReturnType<typeof useMapAnchor> | null = null;

    act(() => {
      root.render(
        createElement(() => {
          latest = useMapAnchor({
            mapRef: harness.mapRef,
            follow: {
              userLocation: { lat: 2, lng: 1 },
              centerOffset: { x: 20, y: -80 },
              onSnapBack,
              onExceedThreshold,
            },
          });
          return null;
        }),
      );
    });

    act(() => {
      harness.map.emit("dragstart", {
        originalEvent: new Event("pointerdown"),
      });
    });

    act(() => {
      harness.map.emit("moveend");
    });

    expect(onSnapBack).toHaveBeenCalledTimes(1);
    expect(onExceedThreshold).not.toHaveBeenCalled();
    expect(latest?.session).toBe("userGesture");

    act(() => {
      root.unmount();
    });
  });

  it("stops follow when pan exceeds threshold", () => {
    const onSnapBack = vi.fn();
    const onExceedThreshold = vi.fn();
    const harness = createMapRefWithEvents();
    const map = harness.map as typeof harness.map & {
      project: () => { x: number; y: number };
    };
    map.project = () => ({ x: 300, y: 320 });
    const container = document.createElement("div");
    const root: Root = createRoot(container);
    let latest: ReturnType<typeof useMapAnchor> | null = null;

    act(() => {
      root.render(
        createElement(() => {
          latest = useMapAnchor({
            mapRef: harness.mapRef,
            follow: {
              userLocation: { lat: 2, lng: 1 },
              centerOffset: { x: 20, y: -80 },
              onSnapBack,
              onExceedThreshold,
            },
          });
          return null;
        }),
      );
    });

    act(() => {
      harness.map.emit("dragstart", {
        originalEvent: new Event("pointerdown"),
      });
      harness.map.setCenter({ lat: 11, lng: 21 });
    });

    act(() => {
      harness.map.emit("moveend");
    });

    expect(onSnapBack).not.toHaveBeenCalled();
    expect(onExceedThreshold).toHaveBeenCalledTimes(1);
    expect(latest?.anchor).toEqual({ lat: 11, lng: 21, zoom: 14 });
    expect(latest?.session).toBe("idle");

    act(() => {
      root.unmount();
    });
  });

  it("stops follow during drag as soon as threshold is crossed", () => {
    const onSnapBack = vi.fn();
    const onExceedThreshold = vi.fn();
    const harness = createMapRefWithEvents();
    let projected = { x: 220, y: 320 };
    const map = harness.map as typeof harness.map & {
      project: () => { x: number; y: number };
    };
    map.project = () => projected;
    const container = document.createElement("div");
    const root: Root = createRoot(container);

    act(() => {
      root.render(
        createElement(() => {
          useMapAnchor({
            mapRef: harness.mapRef,
            follow: {
              userLocation: { lat: 2, lng: 1 },
              centerOffset: { x: 20, y: -80 },
              onSnapBack,
              onExceedThreshold,
            },
          });
          return null;
        }),
      );
    });

    act(() => {
      harness.map.emit("dragstart", {
        originalEvent: new Event("pointerdown"),
      });
    });

    act(() => {
      projected = { x: 300, y: 320 };
      harness.map.emit("move");
    });

    expect(onExceedThreshold).toHaveBeenCalledTimes(1);
    expect(onSnapBack).not.toHaveBeenCalled();

    act(() => {
      projected = { x: 220, y: 320 };
      harness.map.emit("moveend");
    });

    expect(onSnapBack).not.toHaveBeenCalled();

    act(() => {
      root.unmount();
    });
  });
});
