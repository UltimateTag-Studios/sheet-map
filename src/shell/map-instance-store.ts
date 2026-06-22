import type { MapRef } from "react-map-gl/mapbox";

type Listener = () => void;

export type MapInstanceStore = {
  getMapRef: () => MapRef | null;
  setMapRef: (mapRef: MapRef | null) => void;
  subscribe: (listener: Listener) => () => void;
};

export function createMapInstanceStore(): MapInstanceStore {
  let mapRef: MapRef | null = null;
  const listeners = new Set<Listener>();

  return {
    getMapRef: () => mapRef,
    setMapRef: (next) => {
      if (mapRef === next) {
        return;
      }
      mapRef = next;
      for (const listener of listeners) {
        listener();
      }
    },
    subscribe: (listener) => {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
  };
}
