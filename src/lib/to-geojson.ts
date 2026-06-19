import type { Feature, FeatureCollection, Point } from "geojson";

import type { MapMarkerProperties } from "../canvas";
import { dotImageId } from "../canvas";

type MapLocation = {
  lat: number;
  lng: number;
};

export type MapPointLike = {
  id: string;
  markerId: string;
  primaryHex: string;
  secondaryHex?: string;
  location?: MapLocation;
};

export function mapPointsToGeoJson(
  points: MapPointLike[],
  options: { focusedId?: string } = {},
): FeatureCollection<Point, MapMarkerProperties> {
  const { focusedId } = options;

  const features = points
    .filter((point) => point.location)
    .map((point) => {
      const location = point.location;
      if (!location) {
        return null;
      }

      const properties: MapMarkerProperties = {
        markerId: point.markerId,
        primaryHex: point.primaryHex,
        imageId: dotImageId(point.primaryHex, point.secondaryHex, {
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
          coordinates: [location.lng, location.lat],
        },
        properties,
      };
    })
    .filter(
      (feature): feature is Feature<Point, MapMarkerProperties> =>
        feature !== null,
    );

  return {
    type: "FeatureCollection",
    features,
  };
}
