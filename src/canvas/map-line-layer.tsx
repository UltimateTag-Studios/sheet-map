import type { Feature, LineString } from "geojson";
import { Layer, Source } from "react-map-gl/mapbox";

export type MapLineLayerProps = {
  id: string;
  data: Feature<LineString>;
  color?: string;
};

export function MapLineLayer({
  id,
  data,
  color = "#00f0ff",
}: MapLineLayerProps) {
  const sourceId = `${id}-line-source`;
  const layerId = `${id}-line-layer`;

  return (
    <Source id={sourceId} type="geojson" data={data}>
      <Layer
        id={layerId}
        type="line"
        paint={{
          "line-color": color,
          "line-width": 2,
          "line-opacity": 0.6,
          "line-dasharray": [2, 2],
        }}
      />
    </Source>
  );
}
