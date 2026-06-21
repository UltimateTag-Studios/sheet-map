import { act, createElement } from "react";
import { createRoot, type Root } from "react-dom/client";
import type { MapRef } from "react-map-gl/mapbox";
import { describe, expect, it, vi } from "vitest";

import { useMapPaddingSync } from "./use-map-padding-sync";

function createMapRefWithPadding(
  options: { isStyleLoaded?: () => boolean } = {},
) {
  let padding = { top: 0, left: 0, right: 0, bottom: 0 };
  const handlers = new Map<string, Set<() => void>>();
  const map = {
    isStyleLoaded: options.isStyleLoaded ?? (() => true),
    getPadding: () => padding,
    setPadding: vi.fn((next: typeof padding) => {
      padding = next;
    }),
    on: vi.fn((event: string, handler: () => void) => {
      const set = handlers.get(event) ?? new Set();
      set.add(handler);
      handlers.set(event, set);
    }),
    off: vi.fn((event: string, handler: () => void) => {
      handlers.get(event)?.delete(handler);
    }),
    emit(event: string) {
      for (const handler of handlers.get(event) ?? []) {
        handler();
      }
    },
  };

  const mapRef = {
    getMap: () => map,
  } as MapRef;

  return { mapRef, map };
}

function mountPaddingSync(sheetObscuredBottomPx: number) {
  const harness = createMapRefWithPadding();
  const container = document.createElement("div");
  const root: Root = createRoot(container);
  let applied: ReturnType<typeof useMapPaddingSync> = null;

  act(() => {
    root.render(
      createElement(() => {
        applied = useMapPaddingSync({
          mapRef: harness.mapRef,
          sheetObscuredBottomPx,
        });
        return null;
      }),
    );
  });

  return {
    ...harness,
    get applied() {
      return applied;
    },
    unmount() {
      act(() => {
        root.unmount();
      });
    },
  };
}

describe("useMapPaddingSync", () => {
  it("calls setPadding when sheet obscured height changes", () => {
    const harness = mountPaddingSync(152);

    expect(harness.map.setPadding).toHaveBeenCalledWith({
      top: 0,
      left: 0,
      right: 0,
      bottom: 152,
    });
    expect(harness.applied).toEqual({
      top: 0,
      left: 0,
      right: 0,
      bottom: 152,
    });

    harness.unmount();
  });

  it("skips duplicate setPadding when padding is unchanged", () => {
    const harness = mountPaddingSync(152);
    vi.mocked(harness.map.setPadding).mockClear();

    const container = document.createElement("div");
    const root: Root = createRoot(container);

    act(() => {
      root.render(
        createElement(() => {
          useMapPaddingSync({
            mapRef: harness.mapRef,
            sheetObscuredBottomPx: 152,
          });
          return null;
        }),
      );
    });

    expect(harness.map.setPadding).not.toHaveBeenCalled();

    act(() => {
      root.unmount();
    });
    harness.unmount();
  });

  it("applies padding after style load when the map is not ready yet", () => {
    let styleLoaded = false;
    const harness = createMapRefWithPadding({
      isStyleLoaded: () => styleLoaded,
    });
    const container = document.createElement("div");
    const root: Root = createRoot(container);
    let applied: ReturnType<typeof useMapPaddingSync> = null;

    act(() => {
      root.render(
        createElement(() => {
          applied = useMapPaddingSync({
            mapRef: harness.mapRef,
            sheetObscuredBottomPx: 152,
          });
          return null;
        }),
      );
    });

    expect(harness.map.setPadding).not.toHaveBeenCalled();
    expect(applied).toBeNull();

    act(() => {
      styleLoaded = true;
      harness.map.emit("load");
    });

    expect(harness.map.setPadding).toHaveBeenCalledWith({
      top: 0,
      left: 0,
      right: 0,
      bottom: 152,
    });
    expect(applied).toEqual({
      top: 0,
      left: 0,
      right: 0,
      bottom: 152,
    });

    act(() => {
      root.unmount();
    });
  });

  it("clears applied padding when mapRef becomes null", () => {
    const harness = createMapRefWithPadding();
    const container = document.createElement("div");
    const root: Root = createRoot(container);
    let applied: ReturnType<typeof useMapPaddingSync> = null;

    function Harness({ mapRef }: { mapRef: MapRef | null }) {
      applied = useMapPaddingSync({
        mapRef,
        sheetObscuredBottomPx: 152,
      });
      return null;
    }

    act(() => {
      root.render(createElement(Harness, { mapRef: harness.mapRef }));
    });

    expect(applied).not.toBeNull();

    act(() => {
      root.render(createElement(Harness, { mapRef: null }));
    });

    expect(applied).toBeNull();

    act(() => {
      root.unmount();
    });
  });
});
