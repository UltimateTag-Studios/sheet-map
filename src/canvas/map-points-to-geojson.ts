import type { FeatureCollection, Point } from "geojson";

import type { MapMarkerProperties } from "./geojson-markers";
import { markerImageId } from "./geojson-markers";

type MapLocation = {
  lat: number;
  lng: number;
};

export type MapPointLike = {
  id: string;
  markerId: string;
  primaryHex: string;
  secondaryHex?: string;
  location: MapLocation;
};

export function mapPointsToGeoJson(
  points: MapPointLike[],
  options: { focusedId?: string } = {},
): FeatureCollection<Point, MapMarkerProperties> {
  const { focusedId } = options;

  const features = points.map((point) => {
    const properties: MapMarkerProperties = {
      markerId: point.markerId,
      primaryHex: point.primaryHex,
      imageId: markerImageId(point.primaryHex, point.secondaryHex, {
        focused: point.id === focusedId,
      }),
    };
    if (point.secondaryHex) {
      properties.secondaryHex = point.secondaryHex;
    }

    return {
      type: "Feature" as const,
      geometry: {
        type: "Point" as const,
        coordinates: [point.location.lng, point.location.lat],
      },
      properties,
    };
  });

  return {
    type: "FeatureCollection",
    features,
  };
}
