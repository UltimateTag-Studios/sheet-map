import type { GeoJsonProperties } from "geojson";
import type { ReactNode } from "react";
import { createContext, useContext } from "react";

import type { MapRouteContentStore } from "./map-route-content-store";
import type { useMapShell } from "./use-map-shell";

export type MapRouteContent = {
  mapLayers: ReactNode;
  peek: ReactNode;
  expanded: ReactNode;
  overlayTopLeft?: ReactNode;
  overlayTopRight?: ReactNode;
  onMarkerPress?: (markerId: string) => void;
  extraInteractiveLayerIds?: string[];
  onLayerFeaturePress?: (
    layerId: string,
    properties: GeoJsonProperties,
  ) => void;
  isUserLocationFocused: boolean;
  onUserLocationPress: () => void;
};

export type MapShellState = ReturnType<typeof useMapShell>;

type MapRouteContextValue = {
  shell: MapShellState;
  routeContentStore: MapRouteContentStore;
};

const MapRouteContext = createContext<MapRouteContextValue | null>(null);

export type MapRouteProviderProps = {
  shell: MapShellState;
  routeContentStore: MapRouteContentStore;
  children: ReactNode;
};

export function MapRouteProvider({
  shell,
  routeContentStore,
  children,
}: MapRouteProviderProps) {
  return (
    <MapRouteContext.Provider value={{ shell, routeContentStore }}>
      {children}
    </MapRouteContext.Provider>
  );
}

export function useMapRouteContext(): MapRouteContextValue {
  const value = useContext(MapRouteContext);
  if (!value) {
    throw new Error("useMapRouteContext must be used within MapRouteProvider");
  }
  return value;
}
