import type { ReactNode } from "react";

import { useMapUserTrackingContext } from "../../camera/hooks/map-user-tracking-context";
import { MapUserLocation } from "./user-location";

export type MapUserLocationDotRenderProps = {
  latitude: number;
  longitude: number;
  accuracyMeters?: number | null;
  focused: boolean;
};

export type MapUserLocationDotProps = {
  renderDot?: (props: MapUserLocationDotRenderProps) => ReactNode;
};

/**
 * Default user-location dot + accuracy halo.
 * Reads `tracking`, padding readiness, and coords from `MapUserTrackingProvider`.
 */
export function MapUserLocationDot({ renderDot }: MapUserLocationDotProps) {
  const { tracking, mapPaddingReady, userLocation } =
    useMapUserTrackingContext();

  if (!mapPaddingReady || !userLocation) {
    return null;
  }

  const dotProps: MapUserLocationDotRenderProps = {
    latitude: userLocation.lat,
    longitude: userLocation.lng,
    accuracyMeters: userLocation.accuracyMeters,
    focused: tracking,
  };

  if (renderDot) {
    return renderDot(dotProps);
  }

  return (
    <MapUserLocation
      latitude={dotProps.latitude}
      longitude={dotProps.longitude}
      accuracyMeters={dotProps.accuracyMeters}
      focused={dotProps.focused}
    />
  );
}
