import { act, createElement, useState } from "react";
import { createRoot, type Root } from "react-dom/client";
import type { MapRef } from "react-map-gl/mapbox";
import { describe, expect, it, vi } from "vitest";

import type { SheetMotionPhase } from "../viewport";
import { mockCanvas, stubViewport } from "../viewport/testing/fixtures";
import { mountSheetHostFixture } from "../viewport/testing/mount-sheet-host-fixture";
import { useMapAnchor } from "./use-map-anchor";

type MapEventHandler = (event?: { originalEvent?: Event }) => void;

function createCombinedMapMock(
  canvas: HTMLCanvasElement,
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
    getCanvas: () => canvas,
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

type HarnessSnapshot = {
  mapPadding: ReturnType<typeof useMapAnchor>["mapPadding"];
  mapPaddingReady: ReturnType<typeof useMapAnchor>["mapPaddingReady"];
  anchor: ReturnType<typeof useMapAnchor>["anchor"];
  session: ReturnType<typeof useMapAnchor>["session"];
  navigateTo: ReturnType<typeof useMapAnchor>["navigateTo"];
};

function mountPaddingAnchorHarness(initialObscuredBottomPx = 152) {
  stubViewport();
  const fixture = mountSheetHostFixture(
    mockCanvas,
    {},
    {
      top: 800 - initialObscuredBottomPx,
      bottom: 800,
      height: initialObscuredBottomPx,
      y: 800 - initialObscuredBottomPx,
    },
  );

  const combined = createCombinedMapMock(fixture.canvas);
  const container = document.createElement("div");
  const root: Root = createRoot(container);
  let latest: HarnessSnapshot | null = null;
  let setLivePx: ((next: number) => void) | null = null;
  let setSheetPhase: ((next: SheetMotionPhase) => void) | null = null;

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
          useState(initialObscuredBottomPx);
        const [sheetPhase, setSheetPhaseState] =
          useState<SheetMotionPhase>("idle");
        setLivePx = setLiveSheetObscuredBottomPx;
        setSheetPhase = setSheetPhaseState;

        const hook = useMapAnchor({
          mapRef: combined.mapRef,
          liveSheetObscuredBottomPx,
          sheetPhase,
        });
        latest = {
          mapPadding: hook.mapPadding,
          mapPaddingReady: hook.mapPaddingReady,
          anchor: hook.anchor,
          session: hook.session,
          navigateTo: hook.navigateTo,
        };
        return null;
      }),
    );
  });

  return {
    ...combined,
    get latest(): HarnessSnapshot {
      if (!latest) {
        throw new Error("harness not mounted");
      }
      return latest;
    },
    setObscuredBottomPx(nextPx: number) {
      updateSheetSlideRect(nextPx);
      act(() => {
        setLivePx?.(nextPx);
      });
    },
    setSheetPhase(next: SheetMotionPhase) {
      act(() => {
        setSheetPhase?.(next);
      });
    },
    unmount() {
      act(() => {
        root.unmount();
      });
      fixture.remove();
    },
  };
}

describe("padding + anchor integration", () => {
  it("updates padding without changing anchor or session when idle", () => {
    const harness = mountPaddingAnchorHarness(152);
    const bootAnchor = harness.latest.anchor;

    expect(bootAnchor).toEqual({ lat: 10, lng: 20, zoom: 14 });
    expect(harness.latest.session).toBe("idle");
    expect(harness.latest.mapPaddingReady).toBe(true);
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
    expect(harness.map.jumpTo).not.toHaveBeenCalled();

    harness.unmount();
  });

  it("applies padding live during userGesture without jumpTo", () => {
    const harness = mountPaddingAnchorHarness(152);

    act(() => {
      harness.map.setMoving(true);
      harness.map.emit("dragstart", {
        originalEvent: new Event("pointerdown"),
      });
    });

    vi.mocked(harness.map.setPadding).mockClear();

    harness.setSheetPhase("dragging");
    harness.setObscuredBottomPx(350);

    expect(harness.map.setPadding).toHaveBeenCalledWith(
      expect.objectContaining({ bottom: 350 }),
    );
    expect(harness.map.jumpTo).not.toHaveBeenCalled();

    harness.unmount();
  });

  it("jumps to nav target when padding changes during navigation and sheet moves", () => {
    const harness = mountPaddingAnchorHarness(152);
    const destination = { lat: 3, lng: 4, zoom: 16 };

    act(() => {
      harness.latest.navigateTo(destination, { duration: 1000 });
    });

    expect(harness.latest.session).toBe("navigating");

    vi.mocked(harness.map.flyTo).mockClear();
    vi.mocked(harness.map.jumpTo).mockClear();

    harness.setSheetPhase("dragging");
    harness.setObscuredBottomPx(200);

    expect(harness.map.flyTo).not.toHaveBeenCalled();
    expect(harness.map.jumpTo).toHaveBeenCalledWith(
      expect.objectContaining({
        center: [destination.lng, destination.lat],
        zoom: destination.zoom,
      }),
    );
    expect(harness.latest.session).toBe("navigating");
    expect(harness.latest.anchor).toEqual(destination);

    harness.unmount();
  });

  it("settles navigating session on fly moveend", () => {
    const harness = mountPaddingAnchorHarness(152);
    const destination = { lat: 3, lng: 4, zoom: 16 };

    act(() => {
      harness.latest.navigateTo(destination, { duration: 1000 });
    });

    vi.mocked(harness.map.flyTo).mockClear();

    act(() => {
      harness.map.setCenter({ lat: destination.lat, lng: destination.lng });
      harness.map.setZoom(destination.zoom);
      harness.map.emit("moveend");
    });

    expect(harness.map.flyTo).not.toHaveBeenCalled();
    expect(harness.map.jumpTo).not.toHaveBeenCalled();
    expect(harness.latest.session).toBe("idle");

    harness.unmount();
  });
});
