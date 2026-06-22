import type { Map as MapboxMap } from "mapbox-gl";
import { act, createElement, useState } from "react";
import { createRoot, type Root } from "react-dom/client";
import type { MapRef } from "react-map-gl/mapbox";
import { describe, expect, it, vi } from "vitest";

import { mockCanvas, stubViewport } from "../viewport/testing/fixtures";
import { mountSheetHostFixture } from "../viewport/testing/mount-sheet-host-fixture";
import { clearMapPaddingSyncState, syncMapPadding } from "./sync-map-padding";
import { useMapAnchor } from "./use-map-anchor";

type MapEventHandler = (event?: { originalEvent?: Event }) => void;

function createMapRefWithEvents(
  options: {
    isMoving?: boolean;
    center?: { lat: number; lng: number };
    zoom?: number;
    canvas?: HTMLCanvasElement;
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
    getCanvas: () =>
      options.canvas ??
      ({ clientWidth: 400, clientHeight: 800 } as HTMLCanvasElement),
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
  options: {
    liveSheetObscuredBottomPx?: number;
    sheetMotionActive?: boolean;
  } = {},
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
          sheetMotionActive: options.sheetMotionActive,
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

function mountAnchor(
  options: {
    liveSheetObscuredBottomPx?: number;
    sheetMotionActive?: boolean;
  } = {},
) {
  return mountAnchorWithMapRef(createMapRefWithEvents(), options);
}

function mountAnchorWithLiveSheetPadding(initialPx = 152) {
  stubViewport();
  const fixture = mountSheetHostFixture(
    mockCanvas,
    {},
    {
      top: 800 - initialPx,
      bottom: 800,
      height: initialPx,
      y: 800 - initialPx,
    },
  );

  const harness = createMapRefWithEvents({ canvas: fixture.canvas });
  const container = document.createElement("div");
  const root: Root = createRoot(container);
  const latestRef: { current: MapAnchorHookResult | null } = { current: null };
  let setLivePx: ((next: number) => void) | null = null;

  const updateSheetSlideRect = (obscuredBottomPx: number) => {
    fixture.sheetSlide.getBoundingClientRect = () =>
      ({
        top: 800 - obscuredBottomPx,
        bottom: 800,
        left: 0,
        right: 400,
        width: 400,
        height: obscuredBottomPx,
        x: 0,
        y: 800 - obscuredBottomPx,
        toJSON: () => ({}),
      }) as DOMRect;
  };

  act(() => {
    root.render(
      createElement(function Harness() {
        const [liveSheetObscuredBottomPx, setLiveSheetObscuredBottomPx] =
          useState(initialPx);
        setLivePx = setLiveSheetObscuredBottomPx;
        latestRef.current = useMapAnchor({
          mapRef: harness.mapRef,
          liveSheetObscuredBottomPx,
        });
        return null;
      }),
    );
  });

  return {
    ...harness,
    get latest(): MapAnchorHookResult {
      if (!latestRef.current) {
        throw new Error("hook not mounted");
      }
      return latestRef.current;
    },
    setObscuredBottomPx(nextPx: number) {
      updateSheetSlideRect(nextPx);
      setLivePx?.(nextPx);
    },
    unmount() {
      act(() => {
        root.unmount();
      });
      fixture.remove();
    },
  };
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

  it("navigateTo sets anchor, opens navigating session, and flies", () => {
    const harness = mountAnchor();
    const destination = { lat: 3, lng: 4, zoom: 16 };

    act(() => {
      harness.latest.navigateTo(destination, { duration: 500 });
    });

    expect(harness.latest.anchor).toEqual(destination);
    expect(harness.latest.session).toBe("navigating");
    expect(harness.map.flyTo).toHaveBeenCalledWith({
      center: [4, 3],
      zoom: 16,
      padding: { top: 0, left: 0, right: 0, bottom: 152 },
      duration: 500,
    });

    harness.unmount();
  });

  it("navigateTo stops inertial map motion before flying", () => {
    const harness = mountAnchorWithMapRef(
      createMapRefWithEvents({ isMoving: true }),
    );

    act(() => {
      harness.latest.navigateTo(
        { lat: 3, lng: 4, zoom: 16 },
        { duration: 500 },
      );
    });

    expect(harness.map.stop).toHaveBeenCalledTimes(1);
    expect(harness.map.flyTo).toHaveBeenCalledTimes(1);

    harness.unmount();
  });

  it("navigateTo without duration jumps and omits zoom when not in position", () => {
    const harness = mountAnchor();
    const destination = { lat: 3, lng: 4 };

    act(() => {
      harness.latest.navigateTo(destination);
    });

    expect(harness.latest.session).toBe("navigating");
    expect(harness.map.jumpTo).toHaveBeenCalledWith({
      center: [4, 3],
      padding: { top: 0, left: 0, right: 0, bottom: 152 },
    });

    harness.unmount();
  });

  it("settles navigating session on moveend when at target", () => {
    const harness = mountAnchorWithMapRef(
      createMapRefWithEvents({
        center: { lat: 3, lng: 4 },
        zoom: 16,
      }),
    );
    const destination = { lat: 3, lng: 4, zoom: 16 };

    act(() => {
      harness.latest.navigateTo(destination);
    });

    vi.mocked(harness.map.jumpTo).mockClear();

    act(() => {
      harness.map.emit("moveend");
    });

    expect(harness.map.jumpTo).not.toHaveBeenCalled();
    expect(harness.latest.session).toBe("idle");

    harness.unmount();
  });

  it("waits on navigating moveend while the map is still moving", () => {
    const harness = mountAnchorWithMapRef(
      createMapRefWithEvents({ isMoving: true }),
    );

    act(() => {
      harness.latest.navigateTo(
        { lat: 3, lng: 4, zoom: 16 },
        { duration: 1000 },
      );
    });

    act(() => {
      harness.map.emit("moveend");
    });

    expect(harness.latest.session).toBe("navigating");

    harness.unmount();
  });

  it("navigateTo jumps when sheet is already moving", () => {
    const harness = mountAnchor({ sheetMotionActive: true });
    const destination = { lat: 3, lng: 4, zoom: 16 };

    act(() => {
      harness.latest.navigateTo(destination, { duration: 1000 });
    });

    expect(harness.latest.session).toBe("navigating");
    expect(harness.map.flyTo).not.toHaveBeenCalled();
    expect(harness.map.jumpTo).toHaveBeenCalled();

    harness.unmount();
  });

  it("jumps to anchor when map padding changes during navigation", () => {
    const harness = mountAnchorWithLiveSheetPadding(152);
    const destination = { lat: 3, lng: 4, zoom: 16 };

    act(() => {
      harness.latest.navigateTo(destination, { duration: 1000 });
    });

    vi.mocked(harness.map.jumpTo).mockClear();

    act(() => {
      harness.setObscuredBottomPx(200);
    });

    expect(harness.latest.session).toBe("navigating");
    expect(harness.map.jumpTo).toHaveBeenCalledWith(
      expect.objectContaining({
        center: [destination.lng, destination.lat],
        zoom: destination.zoom,
      }),
    );

    harness.unmount();
  });

  it("user pan during navigating cancels fly and opens userGesture", () => {
    const harness = mountAnchor();

    act(() => {
      harness.latest.navigateTo({ lat: 3, lng: 4 }, { duration: 1000 });
    });

    act(() => {
      harness.map.emit("dragstart", {
        originalEvent: new Event("pointerdown"),
      });
    });

    expect(harness.latest.session).toBe("userGesture");
    expect(harness.latest.navigationIntent).toBeNull();

    harness.unmount();
  });
});
