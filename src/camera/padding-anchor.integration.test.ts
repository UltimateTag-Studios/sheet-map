import { act, createElement, useState } from "react";
import { createRoot, type Root } from "react-dom/client";
import type { MapRef } from "react-map-gl/mapbox";
import { describe, expect, it, vi } from "vitest";

import { useMapAnchor } from "./use-map-anchor";
import { useMapPaddingSync } from "./use-map-padding-sync";

type MapEventHandler = (event?: { originalEvent?: Event }) => void;

function createCombinedMapMock(
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
  let padding = { top: 0, left: 0, right: 0, bottom: 0 };

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

type HarnessSnapshot = {
  appliedPadding: ReturnType<typeof useMapPaddingSync>;
  anchor: ReturnType<typeof useMapAnchor>["anchor"];
  session: ReturnType<typeof useMapAnchor>["session"];
  navigateTo: ReturnType<typeof useMapAnchor>["navigateTo"];
};

function mountPaddingAnchorHarness(initialObscuredBottomPx: number) {
  const combined = createCombinedMapMock();
  const container = document.createElement("div");
  const root: Root = createRoot(container);
  let latest: HarnessSnapshot | null = null;
  let setObscuredBottomPx: ((next: number) => void) | null = null;

  function Harness() {
    const [sheetObscuredBottomPx, setSheetObscuredBottomPxState] = useState(
      initialObscuredBottomPx,
    );
    setObscuredBottomPx = setSheetObscuredBottomPxState;

    const appliedPadding = useMapPaddingSync({
      mapRef: combined.mapRef,
      sheetObscuredBottomPx,
    });
    const { anchor, session, navigateTo } = useMapAnchor({
      mapRef: combined.mapRef,
      enabled: appliedPadding !== null,
    });

    latest = { appliedPadding, anchor, session, navigateTo };

    return null;
  }

  act(() => {
    root.render(createElement(Harness));
  });

  return {
    ...combined,
    get latest() {
      if (!latest) {
        throw new Error("harness not mounted");
      }
      return latest;
    },
    setObscuredBottomPx(next: number) {
      act(() => {
        setObscuredBottomPx?.(next);
      });
    },
    unmount() {
      act(() => {
        root.unmount();
      });
    },
  };
}

describe("padding + anchor integration", () => {
  it("updates padding without changing anchor or session when idle", () => {
    const harness = mountPaddingAnchorHarness(152);
    const bootAnchor = harness.latest.anchor;

    expect(bootAnchor).toEqual({ lat: 10, lng: 20, zoom: 14 });
    expect(harness.latest.session).toBe("idle");
    expect(harness.map.setPadding).toHaveBeenCalledWith({
      top: 0,
      left: 0,
      right: 0,
      bottom: 152,
    });

    vi.mocked(harness.map.setPadding).mockClear();

    harness.setObscuredBottomPx(200);

    expect(harness.map.setPadding).toHaveBeenCalledWith({
      top: 0,
      left: 0,
      right: 0,
      bottom: 200,
    });
    expect(harness.latest.anchor).toEqual(bootAnchor);
    expect(harness.latest.session).toBe("idle");
    expect(harness.map.jumpTo).not.toHaveBeenCalled();

    harness.unmount();
  });

  it("keeps user session open when padding moveend fires during momentum", () => {
    const harness = mountPaddingAnchorHarness(152);
    const bootAnchor = harness.latest.anchor;

    act(() => {
      harness.map.setMoving(true);
      harness.map.emit("dragstart", {
        originalEvent: new Event("pointerdown"),
      });
    });

    expect(harness.latest.session).toBe("userGesture");

    harness.setObscuredBottomPx(200);

    expect(harness.latest.session).toBe("userGesture");
    expect(harness.latest.anchor).toEqual(bootAnchor);

    act(() => {
      harness.map.setMoving(false);
      harness.map.setCenter({ lat: 11, lng: 21 });
      harness.map.setZoom(15);
      harness.map.emit("moveend");
    });

    expect(harness.latest.session).toBe("idle");
    expect(harness.latest.anchor).toEqual({ lat: 11, lng: 21, zoom: 15 });

    harness.unmount();
  });

  it("completes programmatic navigation when padding interrupts flyTo", () => {
    const harness = mountPaddingAnchorHarness(152);
    const destination = { lat: 3, lng: 4, zoom: 16 };

    act(() => {
      harness.latest.navigateTo(destination);
    });

    expect(harness.latest.session).toBe("programmatic");
    expect(harness.latest.anchor).toEqual(destination);

    vi.mocked(harness.map.jumpTo).mockClear();

    harness.setObscuredBottomPx(200);

    expect(harness.map.jumpTo).toHaveBeenCalledWith({
      center: [4, 3],
      zoom: 16,
      padding: { top: 0, left: 0, right: 0, bottom: 200 },
    });
    expect(harness.latest.session).toBe("idle");
    expect(harness.latest.anchor).toEqual(destination);

    harness.unmount();
  });
});
