import type { ReactNode } from "react";
import { useCallback, useEffect, useRef } from "react";
import type { MapRef } from "react-map-gl/mapbox";
import GlMap from "react-map-gl/mapbox";
import "mapbox-gl/dist/mapbox-gl.css";

import type { PublishMapInstance } from "./instance";

export const MAP_CANVAS_ROOT_CLASS = "sheet-map-canvas-root";

export type MapCanvasProps = {
  accessToken: string;
  styleUrl?: string;
  children?: ReactNode;
  initialLongitude?: number;
  initialLatitude?: number;
  initialZoom?: number;
  /** Shell store callback; map instance is published from the Map ref + onLoad. */
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
  const mapRefHolder = useRef<MapRef | null>(null);

  const publishCurrentMapRef = useCallback(() => {
    publishRef.current?.(mapRefHolder.current);
  }, []);

  const handleMapRef = useCallback((next: MapRef | null) => {
    mapRefHolder.current = next;
    publishRef.current?.(next);
  }, []);

  const handleLoad = useCallback(() => {
    publishCurrentMapRef();
  }, [publishCurrentMapRef]);

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
      >
        {children}
      </GlMap>
    </div>
  );
}
