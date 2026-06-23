import { createContext, useContext } from "react";

import type { MapShellSlots } from "./config";

const MapShellSlotsContext = createContext<MapShellSlots>({});

export type MapShellSlotsProviderProps = {
  slots: MapShellSlots;
  children: React.ReactNode;
};

export function MapShellSlotsProvider({
  slots,
  children,
}: MapShellSlotsProviderProps) {
  return (
    <MapShellSlotsContext.Provider value={slots}>
      {children}
    </MapShellSlotsContext.Provider>
  );
}

export function useMapShellSlots(): MapShellSlots {
  return useContext(MapShellSlotsContext);
}

/** Route slot overrides win over layout defaults. */
export function mergeMapShellSlots(
  layoutSlots: MapShellSlots = {},
  routeSlots?: Partial<MapShellSlots>,
): MapShellSlots {
  if (!routeSlots) {
    return layoutSlots;
  }

  return { ...layoutSlots, ...routeSlots };
}
