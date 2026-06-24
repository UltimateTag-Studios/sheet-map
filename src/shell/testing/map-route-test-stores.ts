import { createMapRouteContentStore } from "../map-route-content-store";

export function createTestMapRouteStores() {
  return {
    routeContentStore: createMapRouteContentStore(),
  };
}
