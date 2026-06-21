import type { FeatureCollection, Point } from "geojson";
import { useLayoutEffect } from "react";
import type { MapRef } from "react-map-gl/mapbox";
import { Layer, Source, useMap } from "react-map-gl/mapbox";

import { MAP_DOT_HIT_RADIUS_PX, mapDotHitLayerPaint } from "../dot/hit";
import {
  MAP_USER_LOCATION_HALO_OPACITY,
  MAP_USER_LOCATION_HALO_OPACITY_IDLE,
  mapUserLocationDotPaint,
  mapUserLocationHaloPaint,
} from "../dot/style";
import { resolveMapRef } from "../instance/resolve-map-ref";
import { accuracyMetersToHaloRadiusPx } from "./accuracy-to-halo-radius";
import { useMapCanvasZoom } from "./use-zoom";

export type MapUserLocationProps = {
  longitude: number;
  latitude: number;
  accuracyMeters?: number | null;
  /** Brighter accuracy halo when the user location is the active map focus. */
  focused?: boolean;
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

/** Google Maps–style current-location dot; halo radius follows GPS accuracy. */
export function MapUserLocation({
  longitude,
  latitude,
  accuracyMeters = null,
  focused = false,
}: MapUserLocationProps) {
  const maps = useMap();
  const zoom = useMapCanvasZoom();
  const haloRadiusPx = accuracyMetersToHaloRadiusPx(
    accuracyMeters,
    latitude,
    zoom,
  );
  const hitRadiusPx = MAP_DOT_HIT_RADIUS_PX;
  const haloOpacity = focused
    ? MAP_USER_LOCATION_HALO_OPACITY
    : MAP_USER_LOCATION_HALO_OPACITY_IDLE;

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
        paint={mapUserLocationDotPaint}
      />
      <Layer
        id={MAP_USER_LOCATION_HIT_LAYER_ID}
        type="circle"
        paint={{
          ...mapDotHitLayerPaint,
          "circle-radius": hitRadiusPx,
        }}
      />
    </Source>
  );
}
