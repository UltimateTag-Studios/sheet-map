import { renderHook, waitFor } from "@testing-library/react";
import type { MapRef } from "react-map-gl/mapbox";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { stubViewport } from "../testing/fixtures";
import { useMapVisibleViewportSync } from "./use-map-visible-viewport-sync";

function createMapRef(
  width: number,
  height: number,
  sheetObscuredBottomPx: number,
): { mapRef: MapRef; remove: () => void } {
  const host = document.createElement("div");
  host.className = "sheet-host";

  const sheet = document.createElement("div");
  sheet.className = "sheet";
  const sheetTop = height - sheetObscuredBottomPx;
  sheet.getBoundingClientRect = () =>
    ({
      top: sheetTop,
      bottom: height,
      left: 0,
      right: width,
      width,
      height: sheetObscuredBottomPx,
      x: 0,
      y: sheetTop,
      toJSON: () => ({}),
    }) as DOMRect;
  host.appendChild(sheet);

  const canvas = document.createElement("canvas");
  Object.defineProperty(canvas, "clientWidth", {
    configurable: true,
    value: width,
  });
  Object.defineProperty(canvas, "clientHeight", {
    configurable: true,
    value: height,
  });
  canvas.getBoundingClientRect = () =>
    ({
      top: 0,
      bottom: height,
      left: 0,
      right: width,
      width,
      height,
      x: 0,
      y: 0,
      toJSON: () => ({}),
    }) as DOMRect;
  canvas.closest = ((selector: string) =>
    selector === ".sheet-host" ? host : null) as typeof canvas.closest;

  host.appendChild(canvas);
  document.body.appendChild(host);

  const listeners = new Map<string, Set<() => void>>();
  const map = {
    getCanvas: () => canvas,
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
    mapRef: {
      getMap: () => map,
    } as unknown as MapRef,
    remove: () => {
      host.remove();
    },
  };
}

describe("useMapVisibleViewportSync", () => {
  beforeEach(() => {
    stubViewport();
    vi.stubGlobal("visualViewport", {
      offsetTop: 0,
      offsetLeft: 0,
      height: 800,
      width: 400,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    });
    vi.stubGlobal(
      "ResizeObserver",
      vi.fn(() => ({
        observe: vi.fn(),
        disconnect: vi.fn(),
      })),
    );
  });

  afterEach(() => {
    document.body.innerHTML = "";
    vi.unstubAllGlobals();
  });

  it("returns empty viewport when mapRef is null", () => {
    const { result } = renderHook(() =>
      useMapVisibleViewportSync({
        mapRef: null,
      }),
    );

    expect(result.current.hasVisibleArea).toBe(false);
    expect(result.current.clientRect).toBeNull();
  });

  it("derives visible area from live sheet DOM on the map canvas", async () => {
    const obscuredBottomPx = 152;
    const { mapRef, remove } = createMapRef(400, 844, obscuredBottomPx);

    const { result } = renderHook(() =>
      useMapVisibleViewportSync({
        mapRef,
        liveSheetObscuredBottomPx: obscuredBottomPx,
      }),
    );

    await waitFor(() => {
      expect(result.current.hasVisibleArea).toBe(true);
    });

    expect(result.current.clientRect?.height).toBe(844 - obscuredBottomPx);
    remove();
  });
});
