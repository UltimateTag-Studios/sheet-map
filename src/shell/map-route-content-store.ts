import type { MapRouteContent } from "./map-route-context";

type Listener = () => void;

export type MapRouteContentStore = {
  getContent: () => MapRouteContent | null;
  setContent: (content: MapRouteContent | null) => void;
  subscribe: (listener: Listener) => () => void;
};

export function createMapRouteContentStore(): MapRouteContentStore {
  let content: MapRouteContent | null = null;
  const listeners = new Set<Listener>();

  return {
    getContent: () => content,
    setContent: (next) => {
      content = next;
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
