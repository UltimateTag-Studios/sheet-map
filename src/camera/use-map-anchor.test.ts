import type { Map as MapboxMap } from "mapbox-gl";
import { act, createElement } from "react";
import { createRoot, type Root } from "react-dom/client";
import type { MapRef } from "react-map-gl/mapbox";
import { describe, expect, it, vi } from "vitest";

import { clearMapPaddingSyncState, syncMapPadding } from "./sync-map-padding";
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
  let padding = { top: 0, left: 0, right: 0, bottom: 152 };

  const map = {
    isStyleLoaded: () => true,
    isMoving: () => isMoving,
    getCenter: () => center,
    getZoom: () => zoom,
    getPadding: () => padding,
    setPadding: vi.fn((next: typeof padding) => {
      padding = next;
      for (const handler of handlers.get("moveend") ?? []) {
        handler();
      }
    }),
    flyTo: vi.fn(),
    jumpTo: vi.fn(),
    stop: vi.fn(() => {
      isMoving = false;
    }),
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
  } as unknown as MapRef;

  return { mapRef, map };
}

type MapAnchorHookResult = ReturnType<typeof useMapAnchor>;

function mountAnchorWithMapRef(
  harness: ReturnType<typeof createMapRefWithEvents>,
  options: { liveSheetObscuredBottomPx?: number } = {},
) {
  const { mapRef, map } = harness;
  const container = document.createElement("div");
  const root: Root = createRoot(container);
  const latestRef: { current: MapAnchorHookResult | null } = { current: null };

  act(() => {
    root.render(
      createElement(() => {
        latestRef.current = useMapAnchor({
          mapRef,
          liveSheetObscuredBottomPx: options.liveSheetObscuredBottomPx,
        });
        return null;
      }),
    );
  });

  return {
    mapRef,
    map,
    get latest(): MapAnchorHookResult {
      if (!latestRef.current) {
        throw new Error("hook not mounted");
      }
      return latestRef.current;
    },
    unmount() {
      act(() => {
        root.unmount();
      });
    },
  };
}

function mountAnchor(options: { liveSheetObscuredBottomPx?: number } = {}) {
  return mountAnchorWithMapRef(createMapRefWithEvents(), options);
}

describe("useMapAnchor", () => {
  it("boots anchor from the map center when enabled", () => {
    const harness = mountAnchor();

    expect(harness.latest.anchor).toEqual({ lat: 10, lng: 20, zoom: 14 });
    expect(harness.latest.session).toBe("idle");

    harness.unmount();
  });

  it("skips moveend commits while the map is still moving", () => {
    const harness = mountAnchorWithMapRef(
      createMapRefWithEvents({ isMoving: true }),
    );

    act(() => {
      harness.map.emit("dragstart", {
        originalEvent: new Event("pointerdown"),
      });
      harness.map.emit("moveend");
    });

    expect(harness.latest.session).toBe("userGesture");
    expect(harness.latest.anchor).toEqual({ lat: 10, lng: 20, zoom: 14 });

    harness.unmount();
  });

  it("commits after moveend when the map has settled", () => {
    const harness = mountAnchorWithMapRef(
      createMapRefWithEvents({ isMoving: false }),
    );

    act(() => {
      harness.map.emit("dragstart", {
        originalEvent: new Event("pointerdown"),
      });
      harness.map.setMoving(true);
      harness.map.emit("moveend");
    });

    expect(harness.latest.session).toBe("userGesture");

    act(() => {
      harness.map.setMoving(false);
      harness.map.setCenter({ lat: 11, lng: 21 });
      harness.map.setZoom(15);
      harness.map.emit("moveend");
    });

    expect(harness.latest.anchor).toEqual({ lat: 11, lng: 21, zoom: 15 });
    expect(harness.latest.session).toBe("idle");

    harness.unmount();
  });

  it("ignores dragstart without a user originalEvent", () => {
    const harness = mountAnchor();

    act(() => {
      harness.map.emit("dragstart");
      harness.map.setMoving(false);
      harness.map.emit("moveend");
    });

    expect(harness.latest.session).toBe("idle");

    harness.unmount();
  });

  it("ignores padding-only moveend during a user gesture", () => {
    const harness = mountAnchor();

    act(() => {
      harness.map.emit("dragstart", {
        originalEvent: new Event("pointerdown"),
      });
    });

    expect(harness.latest.session).toBe("userGesture");

    act(() => {
      syncMapPadding(harness.map as unknown as MapboxMap, {
        top: 0,
        left: 0,
        right: 0,
        bottom: 200,
      });
    });

    expect(harness.latest.session).toBe("userGesture");
    expect(harness.latest.anchor).toEqual({ lat: 10, lng: 20, zoom: 14 });

    clearMapPaddingSyncState(harness.map as unknown as MapboxMap);
    harness.unmount();
  });
});
