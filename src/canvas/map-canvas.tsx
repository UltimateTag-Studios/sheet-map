import type { ReactNode } from "react";
import { useCallback, useEffect, useRef } from "react";
import GlMap from "react-map-gl/mapbox";
import "mapbox-gl/dist/mapbox-gl.css";

import {
  MapInstanceProvider,
  MapInstancePublisherLayer,
  type PublishMapInstance,
} from "./instance";

export const MAP_CANVAS_ROOT_CLASS = "sheet-map-canvas-root";

export type MapCanvasProps = {
  accessToken: string;
  styleUrl?: string;
  children?: ReactNode;
  initialLongitude?: number;
  initialLatitude?: number;
  initialZoom?: number;
  /** Shell store callback; map instance is published from in-map layers via useMap(). */
  publishMapInstance?: PublishMapInstance | null;
  /** Keep the Mapbox instance between unmounts. */
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
  reuseMaps = true,
  className = "",
}: MapCanvasProps) {
  const publishRef = useRef(publishMapInstance);
  publishRef.current = publishMapInstance;

  const handlePublishMapInstance = useCallback(
    (mapRef: Parameters<NonNullable<PublishMapInstance>>[0]) => {
      publishRef.current?.(mapRef);
    },
    [],
  );

  useEffect(() => {
    return () => {
      publishRef.current?.(null);
    };
  }, []);

  const rootClassName = className
    ? `${MAP_CANVAS_ROOT_CLASS} ${className}`
    : MAP_CANVAS_ROOT_CLASS;

  return (
    <div className={rootClassName}>
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
