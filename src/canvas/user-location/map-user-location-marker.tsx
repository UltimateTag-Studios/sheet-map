import type { ReactNode } from "react";

import { useMapUserTrackingContext } from "../../camera/hooks/map-user-tracking-context";
import type { MapUserLocationStyleOverrides } from "./style-overrides";
import { MapUserLocation } from "./user-location";

export type MapUserLocationMarkerRenderProps = {
  latitude: number;
  longitude: number;
  accuracyMeters?: number | null;
  focused: boolean;
};

export type MapUserLocationMarkerProps = {
  renderMarker?: (props: MapUserLocationMarkerRenderProps) => ReactNode;
  styleOverrides?: MapUserLocationStyleOverrides;
};

/**
 * Default user-location marker + accuracy halo.
 * Reads `tracking`, padding readiness, and coords from `MapUserTrackingProvider`.
 */
export function MapUserLocationMarker({
  renderMarker,
  styleOverrides,
}: MapUserLocationMarkerProps) {
  const { tracking, mapPaddingReady, userLocation } =
    useMapUserTrackingContext();

  if (!mapPaddingReady || !userLocation) {
    return null;
  }

  const markerProps: MapUserLocationMarkerRenderProps = {
    latitude: userLocation.lat,
    longitude: userLocation.lng,
    accuracyMeters: userLocation.accuracyMeters,
    focused: tracking,
  };

  if (renderMarker) {
    return renderMarker(markerProps);
  }

  return (
    <MapUserLocation
      latitude={markerProps.latitude}
      longitude={markerProps.longitude}
      accuracyMeters={markerProps.accuracyMeters}
      focused={markerProps.focused}
      styleOverrides={styleOverrides}
    />
  );
}
