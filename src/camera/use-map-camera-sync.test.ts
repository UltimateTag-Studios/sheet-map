import { act, createElement } from "react";
import { createRoot, type Root } from "react-dom/client";
import type { MapRef } from "react-map-gl/mapbox";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import type { MapViewportSyncState } from "../canvas/viewport/use-map-viewport-sync";
import { flyMapToCoords } from "./fly-map-to-coords";
import type { MapCameraIntent } from "./map-camera-intent";
import { useMapCameraSync } from "./use-map-camera-sync";

vi.mock("./fly-map-to-coords", () => ({
  flyMapToCoords: vi.fn(),
}));

const hiddenViewport: MapViewportSyncState = {
  clientRect: null,
  centerOffset: { x: 0, y: 0 },
  hasVisibleArea: false,
};

const visibleViewport: MapViewportSyncState = {
  clientRect: { x: 0, y: 0, width: 400, height: 600 },
  centerOffset: { x: 0, y: -76 },
  hasVisibleArea: true,
};

const intent = {
  key: "user:1:2:e0",
  coords: { lng: 1, lat: 2 },
  instant: true as const,
};

function createMapRef(): MapRef {
  const listeners = new Map<string, Set<() => void>>();
  const map = {
    on: (event: string, handler: () => void) => {
      const set = listeners.get(event) ?? new Set();
      set.add(handler);
      listeners.set(event, set);
    },
    off: (event: string, handler: () => void) => {
      listeners.get(event)?.delete(handler);
    },
  };

  return {
    getMap: () => map,
  } as MapRef;
}

type CameraSyncProps = {
  mapRef: MapRef | null;
  intent: MapCameraIntent | null;
  viewport: MapViewportSyncState;
  settled: boolean;
  onFulfilled?: (intent: MapCameraIntent) => void;
};

function mountCameraSync(initialProps: CameraSyncProps) {
  const container = document.createElement("div");
  const root: Root = createRoot(container);
  let props = initialProps;

  function Harness() {
    useMapCameraSync(props);
    return null;
  }

  act(() => {
    root.render(createElement(Harness));
  });

  return {
    rerender(next: CameraSyncProps) {
      props = next;
      act(() => {
        root.render(createElement(Harness));
      });
    },
    unmount() {
      act(() => {
        root.unmount();
      });
    },
  };
}

describe("useMapCameraSync", () => {
  beforeEach(() => {
    vi.mocked(flyMapToCoords).mockClear();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it("does not fly when the viewport has no visible area", () => {
    const harness = mountCameraSync({
      mapRef: createMapRef(),
      intent,
      viewport: hiddenViewport,
      settled: true,
    });

    expect(flyMapToCoords).not.toHaveBeenCalled();
    harness.unmount();
  });

  it("does not fly while the sheet is dragging", () => {
    const harness = mountCameraSync({
      mapRef: createMapRef(),
      intent,
      viewport: visibleViewport,
      settled: false,
    });

    expect(flyMapToCoords).not.toHaveBeenCalled();
    harness.unmount();
  });

  it("flies when the viewport becomes valid", () => {
    const mapRef = createMapRef();

    const harness = mountCameraSync({
      mapRef,
      intent,
      viewport: hiddenViewport,
      settled: true,
    });

    expect(flyMapToCoords).not.toHaveBeenCalled();

    harness.rerender({
      mapRef,
      intent,
      viewport: visibleViewport,
      settled: true,
    });

    expect(flyMapToCoords).toHaveBeenCalledWith(mapRef, {
      coords: intent.coords,
      centerOffset: visibleViewport.centerOffset,
      durationMs: 0,
      zoom: 15,
    });
    harness.unmount();
  });

  it("preserves zoom after the first fly", () => {
    const mapRef = createMapRef();
    const secondIntent: MapCameraIntent = {
      key: "point:ABC:e1",
      coords: { lng: 3, lat: 4 },
    };

    const harness = mountCameraSync({
      mapRef,
      intent,
      viewport: visibleViewport,
      settled: true,
    });

    expect(flyMapToCoords).toHaveBeenCalledWith(mapRef, {
      coords: intent.coords,
      centerOffset: visibleViewport.centerOffset,
      durationMs: 0,
      zoom: 15,
    });

    harness.rerender({
      mapRef,
      intent: secondIntent,
      viewport: visibleViewport,
      settled: true,
    });

    expect(flyMapToCoords).toHaveBeenLastCalledWith(mapRef, {
      coords: secondIntent.coords,
      centerOffset: visibleViewport.centerOffset,
      durationMs: 600,
      zoom: undefined,
    });
    harness.unmount();
  });

  it("defers onFulfilled until moveend for smooth flies", () => {
    const moveListeners = new Map<string, Set<() => void>>();
    const map = {
      on: (event: string, handler: () => void) => {
        const listeners = moveListeners.get(event) ?? new Set();
        listeners.add(handler);
        moveListeners.set(event, listeners);
      },
      off: (event: string, handler: () => void) => {
        moveListeners.get(event)?.delete(handler);
      },
    };
    const mapRef = {
      getMap: () => map,
    } as MapRef;
    const onFulfilled = vi.fn();
    const smoothIntent: MapCameraIntent = {
      key: "user:1:2:smooth:e0",
      coords: { lng: 1, lat: 2 },
      instant: false,
    };

    const harness = mountCameraSync({
      mapRef,
      intent: smoothIntent,
      viewport: visibleViewport,
      settled: true,
      onFulfilled,
    });

    expect(flyMapToCoords).toHaveBeenCalledWith(mapRef, {
      coords: smoothIntent.coords,
      centerOffset: visibleViewport.centerOffset,
      durationMs: 600,
      zoom: 15,
    });
    expect(onFulfilled).not.toHaveBeenCalled();

    act(() => {
      for (const handler of moveListeners.get("moveend") ?? []) {
        handler();
      }
    });

    expect(onFulfilled).toHaveBeenCalledWith(smoothIntent);
    harness.unmount();
  });

  it("re-flies when the sheet-aware center offset changes", () => {
    const mapRef = createMapRef();
    const halfViewport: MapViewportSyncState = {
      clientRect: { x: 0, y: 0, width: 400, height: 400 },
      centerOffset: { x: 0, y: -200 },
      hasVisibleArea: true,
    };

    const pointIntent: MapCameraIntent = {
      key: "point:ABC:e0",
      coords: intent.coords,
    };

    const harness = mountCameraSync({
      mapRef,
      intent: pointIntent,
      viewport: visibleViewport,
      settled: true,
    });

    expect(flyMapToCoords).toHaveBeenCalledTimes(1);

    harness.rerender({
      mapRef,
      intent: pointIntent,
      viewport: halfViewport,
      settled: true,
    });

    expect(flyMapToCoords).toHaveBeenCalledTimes(2);
    expect(flyMapToCoords).toHaveBeenLastCalledWith(mapRef, {
      coords: intent.coords,
      centerOffset: halfViewport.centerOffset,
      durationMs: 600,
      zoom: undefined,
    });
    harness.unmount();
  });
});
