import { type ReactNode, useMemo } from "react";
import { Outlet } from "react-router-dom";

import type {
  MapShellConfig,
  MapShellSlots,
  MapUserLocationCoords,
} from "./config";
import { createMapInstanceStore } from "./map-instance-store";
import { createMapRouteContentStore } from "./map-route-content-store";
import { MapRouteProvider } from "./map-route-context";
import { MapShell } from "./map-shell";
import { useMapShell } from "./use-map-shell";

export type MapLayoutProps = {
  accessToken: string;
  userLocation?: MapUserLocationCoords;
  config?: MapShellConfig;
  slots?: MapShellSlots;
  mapTokenMissingMessage?: string;
  children?: ReactNode;
};

export function MapLayout({
  accessToken,
  userLocation,
  config,
  slots,
  mapTokenMissingMessage,
  children,
}: MapLayoutProps) {
  const mapInstanceStore = useMemo(() => createMapInstanceStore(), []);
  const routeContentStore = useMemo(() => createMapRouteContentStore(), []);
  const shell = useMapShell({
    mapInstanceStore,
    accessToken,
    userLocation,
    config,
  });

  return (
    <div className="sheet-map-layout">
      <MapRouteProvider shell={shell} routeContentStore={routeContentStore}>
        <MapShell
          shell={shell}
          routeContentStore={routeContentStore}
          mapTokenMissingMessage={mapTokenMissingMessage}
          slots={slots}
        />
        {children ?? <Outlet />}
      </MapRouteProvider>
    </div>
  );
}
