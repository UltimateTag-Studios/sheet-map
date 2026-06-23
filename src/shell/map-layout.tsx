import { type ReactNode, useMemo } from "react";
import { Outlet } from "react-router-dom";

import type {
  MapShellConfig,
  MapShellSlots,
  MapUserLocationCoords,
} from "./config";
import { defaultMapShellConfig } from "./config";
import { createMapInstanceStore } from "./map-instance-store";
import { MapLayoutRoot } from "./map-layout-root";
import { createMapRouteContentStore } from "./map-route-content-store";
import { MapRouteProvider } from "./map-route-context";
import { MapShell } from "./map-shell";
import { buildMapShellLayoutVars } from "./map-shell-layout-vars";
import { resolveMapShellLayout } from "./resolve-map-shell-layout";
import { useMapShell } from "./use-map-shell";

export type MapLayoutProps = {
  accessToken: string;
  userLocation?: MapUserLocationCoords | null;
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

  const resolvedTheme = config?.theme ?? defaultMapShellConfig.theme;
  const rootStyle = buildMapShellLayoutVars(
    resolveMapShellLayout(config?.layout),
  );

  return (
    <MapLayoutRoot
      className="sheet-map-layout"
      theme={resolvedTheme}
      style={rootStyle}
    >
      <MapRouteProvider shell={shell} routeContentStore={routeContentStore}>
        <MapShell
          shell={shell}
          routeContentStore={routeContentStore}
          mapTokenMissingMessage={mapTokenMissingMessage}
          slots={slots}
        />
        {children ?? <Outlet />}
      </MapRouteProvider>
    </MapLayoutRoot>
  );
}
