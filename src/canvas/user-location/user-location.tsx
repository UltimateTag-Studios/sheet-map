import type { FeatureCollection, Point } from "geojson";
import { useLayoutEffect } from "react";
import type { MapRef } from "react-map-gl/mapbox";
import { Layer, Source, useMap } from "react-map-gl/mapbox";

import { resolveMapRef } from "../instance/resolve-map-ref";
import { mapMarkerHitLayerPaint } from "../marker/hit";
import {
  MAP_USER_LOCATION_HALO_OPACITY,
  MAP_USER_LOCATION_HALO_OPACITY_IDLE,
  mapUserLocationHaloPaint,
  mapUserLocationMarkerPaint,
} from "../marker/style";
import { useMapLayoutMarkerSizes } from "../marker/use-map-layout-marker-sizes";
import { accuracyMetersToHaloRadiusPx } from "./accuracy-to-halo-radius";
import type { MapUserLocationStyleOverrides } from "./style-overrides";
import { useMapCanvasZoom } from "./use-zoom";

export type MapUserLocationProps = {
  longitude: number;
  latitude: number;
  accuracyMeters?: number | null;
  /** Brighter accuracy halo when the user location is the active map focus. */
  focused?: boolean;
  styleOverrides?: MapUserLocationStyleOverrides;
};

const SOURCE_ID = "sheet-map-user-location-source";
const HALO_LAYER_ID = "sheet-map-user-location-halo";
export const MAP_USER_LOCATION_HALO_LAYER_ID = HALO_LAYER_ID;
export const MAP_USER_LOCATION_LAYER_ID = "sheet-map-user-location";
export const MAP_USER_LOCATION_HIT_LAYER_ID = "sheet-map-user-location-hit";

function raiseUserLocationLayers(
  map: ReturnType<NonNullable<MapRef>["getMap"]>,
) {
  for (const layerId of [
    MAP_USER_LOCATION_LAYER_ID,
    MAP_USER_LOCATION_HIT_LAYER_ID,
  ]) {
    if (map.getLayer(layerId)) {
      map.moveLayer(layerId);
    }
  }
}

/** Google Maps–style current-location marker; halo radius follows GPS accuracy. */
export function MapUserLocation({
  longitude,
  latitude,
  accuracyMeters = null,
  focused = false,
  styleOverrides,
}: MapUserLocationProps) {
  const maps = useMap();
  const zoom = useMapCanvasZoom();
  const { locationMarkerSizePx, locationMarkerHitSizePx } =
    useMapLayoutMarkerSizes();
  const haloRadiusPx =
    styleOverrides?.haloRadiusPx ??
    accuracyMetersToHaloRadiusPx(accuracyMeters, latitude, zoom);
  const hitRadiusPx = locationMarkerHitSizePx / 2;
  const markerRadiusPx = locationMarkerSizePx / 2;
  const haloOpacity =
    styleOverrides?.haloOpacity ??
    (focused
      ? MAP_USER_LOCATION_HALO_OPACITY
      : MAP_USER_LOCATION_HALO_OPACITY_IDLE);

  const data: FeatureCollection<Point> = {
    type: "FeatureCollection",
    features: [
      {
        type: "Feature",
        geometry: { type: "Point", coordinates: [longitude, latitude] },
        properties: {},
      },
    ],
  };

  useLayoutEffect(() => {
    const map = resolveMapRef(maps)?.getMap();
    if (!map) {
      return;
    }

    const raise = () => {
      raiseUserLocationLayers(map);
    };

    raise();
    map.on("styledata", raise);
    return () => {
      map.off("styledata", raise);
    };
  }, [maps]);

  return (
    <Source id={SOURCE_ID} type="geojson" data={data}>
      <Layer
        id={HALO_LAYER_ID}
        type="circle"
        paint={{
          ...mapUserLocationHaloPaint,
          "circle-radius": haloRadiusPx,
          "circle-opacity": haloOpacity,
        }}
      />
      <Layer
        id={MAP_USER_LOCATION_LAYER_ID}
        type="circle"
        paint={{
          ...mapUserLocationMarkerPaint,
          "circle-radius": markerRadiusPx,
        }}
      />
      <Layer
        id={MAP_USER_LOCATION_HIT_LAYER_ID}
        type="circle"
        paint={{
          ...mapMarkerHitLayerPaint,
          "circle-radius": hitRadiusPx,
        }}
      />
    </Source>
  );
}
