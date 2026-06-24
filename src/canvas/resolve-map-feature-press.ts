import type { GeoJsonProperties } from "geojson";
import type { GeoJSONFeature } from "mapbox-gl";

import { MAP_MARKERS_HIT_LAYER_ID } from "./geojson-markers";
import { MAP_USER_LOCATION_HIT_LAYER_ID } from "./user-location/user-location";

export type MapFeaturePressHandlers = {
  onMarkerPress?: (markerId: string) => void;
  extraInteractiveLayerIds: readonly string[];
  onLayerFeaturePress?: (
    layerId: string,
    properties: GeoJsonProperties,
  ) => void;
  onUserLocationPress?: () => void;
};

/** Shared press routing for Mapbox `click` and pointer fallback picking. */
export function resolveMapFeaturePress(
  features: readonly GeoJSONFeature[],
  handlers: MapFeaturePressHandlers,
): boolean {
  const markerFeature = features.find(
    (feature) => feature.layer?.id === MAP_MARKERS_HIT_LAYER_ID,
  );
  if (markerFeature && handlers.onMarkerPress) {
    const markerId = markerFeature.properties?.markerId;
    if (typeof markerId === "string") {
      handlers.onMarkerPress(markerId);
      return true;
    }
  }

  if (
    handlers.onLayerFeaturePress &&
    handlers.extraInteractiveLayerIds.length > 0
  ) {
    const layerFeature = features.find(
      (feature) =>
        feature.layer?.id &&
        handlers.extraInteractiveLayerIds.includes(feature.layer.id),
    );
    if (layerFeature?.layer?.id) {
      handlers.onLayerFeaturePress(
        layerFeature.layer.id,
        layerFeature.properties ?? {},
      );
      return true;
    }
  }

  if (handlers.onUserLocationPress) {
    const userFeature = features.find(
      (feature) => feature.layer?.id === MAP_USER_LOCATION_HIT_LAYER_ID,
    );
    if (userFeature) {
      handlers.onUserLocationPress();
      return true;
    }
  }

  return false;
}
