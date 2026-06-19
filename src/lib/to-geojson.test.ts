import { describe, expect, it } from "vitest";

import { dotImageId } from "../canvas";
import { type MapPointLike, mapPointsToGeoJson } from "./to-geojson";

const pointWithLocation: MapPointLike = {
  id: "ABC123",
  markerId: "marker-1",
  primaryHex: "#ff0000",
  secondaryHex: "#00ff00",
  location: { lng: -111.8, lat: 41.7 },
};

const pointWithoutLocation: MapPointLike = {
  id: "NOLOC",
  markerId: "marker-2",
  primaryHex: "#0000ff",
};

describe("mapPointsToGeoJson", () => {
  it("skips points without a location", () => {
    const geoJson = mapPointsToGeoJson([
      pointWithoutLocation,
      pointWithLocation,
    ]);

    expect(geoJson.features).toHaveLength(1);
    expect(geoJson.features[0]?.properties.markerId).toBe("marker-1");
  });

  it("marks the focused id with a focused dot image id", () => {
    const geoJson = mapPointsToGeoJson([pointWithLocation], {
      focusedId: "ABC123",
    });

    expect(geoJson.features[0]?.properties.imageId).toBe(
      dotImageId("#ff0000", "#00ff00", { focused: true }),
    );
  });
});
