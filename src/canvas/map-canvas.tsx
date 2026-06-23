import type { GeoJsonProperties } from "geojson";
import type { ReactNode } from "react";
import { useCallback, useEffect, useRef } from "react";
import GlMap, { type MapMouseEvent, type MapRef } from "react-map-gl/mapbox";
import "mapbox-gl/dist/mapbox-gl.css";

import { MAP_MARKERS_HIT_LAYER_ID } from "./geojson-markers";
import type { PublishMapInstance } from "./publish-map-instance";
import { MAP_USER_LOCATION_HIT_LAYER_ID } from "./user-location/user-location";

export const MAP_CANVAS_ROOT_CLASS = "sheet-map-canvas-root";

export type MapCanvasProps = {
  accessToken: string;
  styleUrl?: string;
  children?: ReactNode;
  initialLongitude?: number;
  initialLatitude?: number;
  initialZoom?: number;
  /**
   * Optional shell store callback. The map ref stays unpublished until `onLoad`
   * (style ready) — callers see `null` until then.
   */
  publishMapInstance?: PublishMapInstance | null;
  onMarkerPress?: (markerId: string) => void;
  /** Extra hit layers registered by route mapLayers (e.g. GeoJSON marker hit targets). */
  extraInteractiveLayerIds?: string[];
  onLayerFeaturePress?: (
    layerId: string,
    properties: GeoJsonProperties,
  ) => void;
  onUserLocationPress?: () => void;
  /** Keep the Mapbox instance between unmounts. Demo uses `false` for reliable refresh. */
  reuseMaps?: boolean;
  className?: string;
};

export function MapCanvas({
  accessToken,
  styleUrl = "mapbox://styles/mapbox/light-v11",
  children,
  initialLongitude = -113.57,
  initialLatitude = 37.1,
  initialZoom = 12,
  publishMapInstance = null,
  onMarkerPress,
  extraInteractiveLayerIds = [],
  onLayerFeaturePress,
  onUserLocationPress,
  reuseMaps = false,
  className = "",
}: MapCanvasProps) {
  const publishRef = useRef(publishMapInstance);
  publishRef.current = publishMapInstance;
  const mapRefHolder = useRef<MapRef | null>(null);

  const publishCurrentMapRef = useCallback(() => {
    publishRef.current?.(mapRefHolder.current);
  }, []);

  const handleMapRef = useCallback((next: MapRef | null) => {
    mapRefHolder.current = next;
    if (!next) {
      publishRef.current?.(null);
    }
  }, []);

  const handleLoad = useCallback(() => {
    publishCurrentMapRef();
  }, [publishCurrentMapRef]);

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

  const rootClassName = className
    ? `${MAP_CANVAS_ROOT_CLASS} ${className}`
    : MAP_CANVAS_ROOT_CLASS;

  return (
    <div className={rootClassName}>
      <GlMap
        ref={handleMapRef}
        mapboxAccessToken={accessToken}
        mapStyle={styleUrl}
        initialViewState={{
          longitude: initialLongitude,
          latitude: initialLatitude,
          zoom: initialZoom,
        }}
        style={{ width: "100%", height: "100%" }}
        attributionControl={false}
        reuseMaps={reuseMaps}
        pitchWithRotate={false}
        dragRotate={false}
        touchPitch={false}
        onLoad={handleLoad}
        onClick={handleClick}
        interactiveLayerIds={
          interactiveLayerIds.length > 0 ? interactiveLayerIds : undefined
        }
      >
        {children}
      </GlMap>
    </div>
  );
}
