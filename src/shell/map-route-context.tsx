import type { GeoJsonProperties } from "geojson";
import type { ReactNode } from "react";
import { createContext, useContext } from "react";

import type { MapRouteContentStore } from "./map-route-content-store";
import type { useMapShell } from "./use-map-shell";

export type MapSelectablePoint = {
  id: string;
  location?: { lng: number; lat: number };
};

export type MapRouteContent = {
  mapLayers: ReactNode;
  header: ReactNode;
  body: ReactNode;
  /** Points the shell uses for camera fly-to and map feature selection. */
  selectablePoints: MapSelectablePoint[];
  /** Fills the visible map area; tracks sheet snap via shell viewport sync. */
  overlay?: ReactNode;
  /** Shown top-right when the sheet is collapsed (e.g. trail back). */
  collapsedTopRight?: ReactNode;
  /** Extract selectable id from GeoJSON layer clicks (non-marker layers). */
  resolveFeatureId?: (
    layerId: string,
    properties: GeoJsonProperties,
  ) => string | null;
  extraInteractiveLayerIds?: string[];
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
