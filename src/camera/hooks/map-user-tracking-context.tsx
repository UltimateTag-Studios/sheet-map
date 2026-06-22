import { createContext, type ReactNode, useContext } from "react";

import type { MapUserLocationCoords } from "./use-map-user-tracking";

export type MapUserTrackingContextValue = {
  tracking: boolean;
  mapPaddingReady: boolean;
  userLocation: MapUserLocationCoords | null;
};

const MapUserTrackingContext =
  createContext<MapUserTrackingContextValue | null>(null);

export type MapUserTrackingProviderProps = {
  value: MapUserTrackingContextValue;
  children: ReactNode;
};

/** Supplies tracking UI state to map dots inside `MapCanvas`. */
export function MapUserTrackingProvider({
  value,
  children,
}: MapUserTrackingProviderProps) {
  return (
    <MapUserTrackingContext.Provider value={value}>
      {children}
    </MapUserTrackingContext.Provider>
  );
}

export function useMapUserTrackingContext(): MapUserTrackingContextValue {
  const value = useContext(MapUserTrackingContext);
  if (!value) {
    throw new Error(
      "useMapUserTrackingContext must be used within MapUserTrackingProvider",
    );
  }
  return value;
}
