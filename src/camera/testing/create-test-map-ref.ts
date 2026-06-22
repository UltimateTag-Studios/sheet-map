import type { Map as MapboxMap } from "mapbox-gl";
import type { MapRef } from "react-map-gl/mapbox";
import { vi } from "vitest";

export type MapPadding = {
  top: number;
  left: number;
  right: number;
  bottom: number;
};

export type CreateTestMapRefOptions = {
  isMoving?: boolean;
  center?: { lat: number; lng: number };
  zoom?: number;
  canvas?: HTMLCanvasElement;
  /** When false, call `emitLoad` to flip style ready (default true). */
  styleLoaded?: boolean;
  initialPadding?: MapPadding;
  /** When false, `setPadding` does not emit map events (default true). */
  emitEventsOnSetPadding?: boolean;
};

type MapEventHandler = (event?: { originalEvent?: Event }) => void;

export type TestMapRefHarness = {
  mapRef: MapRef;
  map: TestMapInstance;
};

/** Minimal Mapbox stand-in used across camera hook tests. */
export type TestMapInstance = {
  isStyleLoaded: () => boolean;
  isMoving: () => boolean;
  getCenter: () => { lat: number; lng: number };
  getZoom: () => number;
  getPadding: () => MapPadding;
  setPadding: ReturnType<typeof vi.fn>;
  flyTo: ReturnType<typeof vi.fn>;
  jumpTo: ReturnType<typeof vi.fn>;
  stop: ReturnType<typeof vi.fn>;
  getCanvas: () => HTMLCanvasElement;
  on: (event: string, handler: MapEventHandler) => void;
  off: (event: string, handler: MapEventHandler) => void;
  once: (event: string, handler: MapEventHandler) => void;
  emit: (event: string, payload?: { originalEvent?: Event }) => void;
  setMoving: (next: boolean) => void;
  setCenter: (next: { lat: number; lng: number }) => void;
  setZoom: (next: number) => void;
  setStyleLoaded: (next: boolean) => void;
  emitLoad: () => void;
};

export function asTestMapboxMap(map: TestMapInstance): MapboxMap {
  return map as unknown as MapboxMap;
}

export function createTestMapRef(
  options: CreateTestMapRefOptions = {},
): TestMapRefHarness {
  const handlers = new Map<string, Set<MapEventHandler>>();
  let isMoving = options.isMoving ?? false;
  let center = options.center ?? { lat: 10, lng: 20 };
  let zoom = options.zoom ?? 14;
  let styleLoaded = options.styleLoaded ?? true;
  let padding = options.initialPadding ?? {
    top: 0,
    left: 0,
    right: 0,
    bottom: 152,
  };
  const emitEventsOnSetPadding = options.emitEventsOnSetPadding ?? true;

  const map: TestMapInstance = {
    isStyleLoaded: () => styleLoaded,
    isMoving: () => isMoving,
    getCenter: () => center,
    getZoom: () => zoom,
    getPadding: () => padding,
    setPadding: vi.fn((next: MapPadding) => {
      padding = next;
      if (!emitEventsOnSetPadding) {
        return;
      }
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
    setStyleLoaded(next: boolean) {
      styleLoaded = next;
    },
    emitLoad() {
      styleLoaded = true;
      for (const handler of handlers.get("load") ?? []) {
        handler();
      }
    },
  };

  const mapRef = {
    getMap: () => asTestMapboxMap(map),
  } as unknown as MapRef;

  return { mapRef, map };
}
