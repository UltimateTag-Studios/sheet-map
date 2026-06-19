import type { FeatureCollection, Point } from "geojson";

import { type MapDotMarkerProperties, MapDotMarkers } from "./dot/dot-markers";

export type MapMarkerProperties = MapDotMarkerProperties & {
  markerId: string;
};

export const MAP_MARKERS_LAYER_ID = "sheet-map-markers-fill";
export const MAP_MARKERS_HIT_LAYER_ID = "sheet-map-markers-hit";

export type MapMarkersProps = {
  id: string;
  data: FeatureCollection<Point, MapMarkerProperties>;
};

export function MapMarkers({ id, data }: MapMarkersProps) {
  return (
    <MapDotMarkers
      sourceId={`${id}-source`}
      layerPrefix={`${id}-markers`}
      data={data}
      hitLayerId={MAP_MARKERS_HIT_LAYER_ID}
    />
  );
}
