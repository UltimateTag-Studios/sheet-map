import type { FeatureCollection, Point } from "geojson";

import {
  type MapGeoJsonMarkerProperties,
  MapGeoJsonMarkers,
} from "./geojson-markers";

export type MapMarkerProperties = MapGeoJsonMarkerProperties & {
  markerId: string;
};

export const MAP_MARKERS_LAYER_ID = "sheet-map-markers-fill";

export const MAP_MARKERS_HIT_LAYER_ID = "sheet-map-markers-hit";

export type MapMarkersProps = {
  id: string;
  data: FeatureCollection<Point, MapMarkerProperties>;
};

/** GeoJSON sprite markers with a shared shell hit layer (`MAP_MARKERS_HIT_LAYER_ID`). */
export function MapMarkers({ id, data }: MapMarkersProps) {
  return (
    <MapGeoJsonMarkers
      sourceId={`${id}-source`}
      layerPrefix={`${id}-markers`}
      data={data}
      hitLayerId={MAP_MARKERS_HIT_LAYER_ID}
    />
  );
}
