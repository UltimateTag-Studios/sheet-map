import type { Map as MapboxMap } from "mapbox-gl";
import { describe, expect, it, vi } from "vitest";

import { whenMapStyleReady } from "./when-map-style-ready";

function createMap(options: { styleLoaded?: boolean } = {}) {
  let styleLoaded = options.styleLoaded ?? false;
  const handlers = new Map<string, Set<() => void>>();

  const map = {
    isStyleLoaded: () => styleLoaded,
    on(event: string, handler: () => void) {
      const set = handlers.get(event) ?? new Set();
      set.add(handler);
      handlers.set(event, set);
    },
    off(event: string, handler: () => void) {
      handlers.get(event)?.delete(handler);
    },
    emitLoad() {
      styleLoaded = true;
      for (const handler of handlers.get("load") ?? []) {
        handler();
      }
    },
    emitIdle() {
      for (const handler of handlers.get("idle") ?? []) {
        handler();
      }
    },
  } as unknown as MapboxMap;

  return {
    map,
    setStyleLoaded: (next: boolean) => {
      styleLoaded = next;
    },
    emitLoad: () => {
      styleLoaded = true;
      for (const handler of handlers.get("load") ?? []) {
        handler();
      }
    },
    emitIdle: () => {
      for (const handler of handlers.get("idle") ?? []) {
        handler();
      }
    },
  };
}

describe("whenMapStyleReady", () => {
  it("runs immediately when the style is already loaded", () => {
    const callback = vi.fn();
    const { map } = createMap({ styleLoaded: true });

    whenMapStyleReady(map, callback);

    expect(callback).toHaveBeenCalledTimes(1);
  });

  it("waits for load when the style is not ready yet", () => {
    const callback = vi.fn();
    const { map, emitLoad } = createMap({ styleLoaded: false });

    whenMapStyleReady(map, callback);
    expect(callback).not.toHaveBeenCalled();

    emitLoad();
    expect(callback).toHaveBeenCalledTimes(1);
  });

  it("recovers on idle when load fired before the subscription was attached", () => {
    const callback = vi.fn();
    const { map, setStyleLoaded, emitIdle } = createMap({ styleLoaded: false });

    setStyleLoaded(true);

    whenMapStyleReady(map, callback);
    expect(callback).toHaveBeenCalledTimes(1);

    emitIdle();
    expect(callback).toHaveBeenCalledTimes(2);
  });

  it("does not run after cleanup", () => {
    const callback = vi.fn();
    const { map, emitLoad } = createMap({ styleLoaded: false });

    const cancel = whenMapStyleReady(map, callback);
    cancel();
    emitLoad();

    expect(callback).not.toHaveBeenCalled();
  });
});
