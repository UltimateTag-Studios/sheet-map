import { describe, expect, it } from "vitest";

import { markerImageId } from "./geojson-markers";
import { type MapPointLike, mapPointsToGeoJson } from "./map-points-to-geojson";

const pointWithLocation: MapPointLike = {
  id: "ABC123",
  markerId: "marker-1",
  primaryHex: "#ff0000",
  secondaryHex: "#00ff00",
  location: { lng: -111.8, lat: 41.7 },
};

describe("mapPointsToGeoJson", () => {
  it("maps points to geojson features", () => {
    const geoJson = mapPointsToGeoJson([pointWithLocation]);

    expect(geoJson.features).toHaveLength(1);
    expect(geoJson.features[0]?.properties.markerId).toBe("marker-1");
    expect(geoJson.features[0]?.geometry.coordinates).toEqual([-111.8, 41.7]);
  });

  it("marks the focused id with a focused marker image id", () => {
    const geoJson = mapPointsToGeoJson([pointWithLocation], {
      focusedId: "ABC123",
    });

    expect(geoJson.features[0]?.properties.imageId).toBe(
      markerImageId("#ff0000", "#00ff00", { focused: true }),
    );
  });
});
