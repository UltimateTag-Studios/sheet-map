import type { FeatureCollection, Point } from "geojson";
import { Layer, Source } from "react-map-gl/mapbox";

import { mapDotHitLayerPaint } from "./hit";
import { useMapCanvasDotImages } from "./use-dot-images";

export type MapDotMarkerProperties = {
  primaryHex: string;
  secondaryHex?: string;
  imageId: string;
  badgeSymbol?: string;
};

export type MapDotMarkersProps = {
  sourceId: string;
  layerPrefix: string;
  data: FeatureCollection<Point, MapDotMarkerProperties>;
  hitLayerId: string;
  showBadges?: boolean;
};

export function MapDotMarkers({
  sourceId,
  layerPrefix,
  data,
  hitLayerId,
  showBadges = false,
}: MapDotMarkersProps) {
  useMapCanvasDotImages(data);

  const fillLayerId = `${layerPrefix}-fill`;
  const badgeLayerId = `${layerPrefix}-badge`;

  return (
    <Source id={sourceId} type="geojson" data={data}>
      <Layer
        id={fillLayerId}
        type="symbol"
        layout={{
          "icon-image": ["get", "imageId"],
          "icon-size": 1,
          "icon-allow-overlap": true,
          "icon-ignore-placement": true,
        }}
      />
      {showBadges ? (
        <Layer
          id={badgeLayerId}
          type="symbol"
          filter={["!=", ["get", "badgeSymbol"], ""]}
          layout={{
            "text-field": ["get", "badgeSymbol"],
            "text-size": 10,
            "text-offset": [0.85, -0.85],
            "text-anchor": "bottom-left",
            "text-allow-overlap": true,
            "text-ignore-placement": true,
          }}
          paint={{
            "text-color": "#ffffff",
            "text-halo-color": "rgba(0,0,0,0.8)",
            "text-halo-width": 1,
          }}
        />
      ) : null}
      <Layer id={hitLayerId} type="circle" paint={mapDotHitLayerPaint} />
    </Source>
  );
}
