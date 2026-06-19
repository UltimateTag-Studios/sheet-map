import type { GeoJsonProperties } from "geojson";
import type { ReactNode } from "react";
import { useCallback, useEffect, useRef } from "react";
import GlMap, { type MapMouseEvent, type MapRef } from "react-map-gl/mapbox";
import "mapbox-gl/dist/mapbox-gl.css";

import {
  MapInstanceProvider,
  MapInstancePublisherLayer,
  type PublishMapInstance,
} from "./map-instance-context";
import { MAP_MARKERS_HIT_LAYER_ID } from "./markers";
import { MAP_USER_LOCATION_HIT_LAYER_ID } from "./user-location/user-location";

export type MapCanvasProps = {
  accessToken: string;
  styleUrl?: string;
  children?: ReactNode;
  initialLongitude?: number;
  initialLatitude?: number;
  initialZoom?: number;
  /** Shell store callback; map instance is published from in-map layers via useMap(). */
  publishMapInstance?: PublishMapInstance | null;
  onMarkerPress?: (markerId: string) => void;
  /** Extra hit layers registered by route mapLayers (e.g. dot marker hit targets). */
  extraInteractiveLayerIds?: string[];
  onLayerFeaturePress?: (
    layerId: string,
    properties: GeoJsonProperties,
  ) => void;
  onUserLocationPress?: () => void;
  /** Keep the Mapbox instance between unmounts. Off for tab screens that need a fresh fly on each visit. */
  reuseMaps?: boolean;
  className?: string;
};

export function MapCanvas({
  accessToken,
  styleUrl = "mapbox://styles/mapbox/dark-v11",
  children,
  initialLongitude = -113.57,
  initialLatitude = 37.1,
  initialZoom = 12,
  publishMapInstance = null,
  onMarkerPress,
  extraInteractiveLayerIds = [],
  onLayerFeaturePress,
  onUserLocationPress,
  reuseMaps = true,
  className = "",
}: MapCanvasProps) {
  const publishRef = useRef(publishMapInstance);
  publishRef.current = publishMapInstance;

  const handlePublishMapInstance = useCallback((mapRef: MapRef | null) => {
    publishRef.current?.(mapRef);
  }, []);

  useEffect(() => {
    return () => {
      publishRef.current?.(null);
    };
  }, []);

  const handleClick = useCallback(
    (event: MapMouseEvent) => {
      const features = event.features ?? [];

      const markerFeature = features.find(
        (feature) => feature.layer?.id === MAP_MARKERS_HIT_LAYER_ID,
      );
      if (markerFeature && onMarkerPress) {
        const markerId = markerFeature.properties?.markerId;
        if (typeof markerId === "string") {
          onMarkerPress(markerId);
          return;
        }
      }

      if (onLayerFeaturePress && extraInteractiveLayerIds.length > 0) {
        const layerFeature = features.find(
          (feature) =>
            feature.layer?.id &&
            extraInteractiveLayerIds.includes(feature.layer.id),
        );
        if (layerFeature?.layer?.id) {
          onLayerFeaturePress(
            layerFeature.layer.id,
            layerFeature.properties ?? {},
          );
          return;
        }
      }

      if (onUserLocationPress) {
        const userFeature = features.find(
          (feature) => feature.layer?.id === MAP_USER_LOCATION_HIT_LAYER_ID,
        );
        if (userFeature) {
          onUserLocationPress();
        }
      }
    },
    [
      onMarkerPress,
      extraInteractiveLayerIds,
      onLayerFeaturePress,
      onUserLocationPress,
    ],
  );

  const interactiveLayerIds = [
    ...(onMarkerPress ? [MAP_MARKERS_HIT_LAYER_ID] : []),
    ...extraInteractiveLayerIds,
    ...(onUserLocationPress ? [MAP_USER_LOCATION_HIT_LAYER_ID] : []),
  ];

  return (
    <div className={`relative h-full w-full ${className}`.trim()}>
      <GlMap
        mapboxAccessToken={accessToken}
        mapStyle={styleUrl}
        initialViewState={{
          longitude: initialLongitude,
          latitude: initialLatitude,
          zoom: initialZoom,
        }}
        style={{ width: "100%", height: "100%" }}
        attributionControl={false}
        onClick={handleClick}
        interactiveLayerIds={
          interactiveLayerIds.length > 0 ? interactiveLayerIds : undefined
        }
        reuseMaps={reuseMaps}
        pitchWithRotate={false}
        dragRotate={false}
        touchPitch={false}
      >
        <MapInstanceProvider publishMapInstance={handlePublishMapInstance}>
          <MapInstancePublisherLayer />
          {children}
        </MapInstanceProvider>
      </GlMap>
    </div>
  );
}
