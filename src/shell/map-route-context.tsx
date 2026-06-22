import type { GeoJsonProperties } from "geojson";
import type { ReactNode } from "react";
import { createContext, useContext } from "react";

import type { MapSheetHeaderProps, MapShellSlots } from "./config";
import type { MapRouteContentStore } from "./map-route-content-store";
import type { useMapShell } from "./use-map-shell";

export type MapRouteContent = {
  header?: MapSheetHeaderProps;
  /** Bypass header data + slot chain entirely. */
  headerContent?: ReactNode;
  body?: ReactNode;
  mapLayers?: ReactNode;
  overlay?: ReactNode | null;
  slots?: Partial<MapShellSlots>;
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

export function useMapShellContext() {
  const { shell } = useMapRouteContext();
  return {
    selectedItemId: shell.selectedItemId,
    selectItem: shell.selectItem,
    clearSelection: shell.clearSelection,
    navigateTo: shell.navigateTo,
    recenterOnUser: shell.recenterOnUser,
    tracking: shell.tracking,
  };
}
