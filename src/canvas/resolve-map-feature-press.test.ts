import { describe, expect, it, vi } from "vitest";

import { MAP_MARKERS_HIT_LAYER_ID } from "./geojson-markers";
import { resolveMapFeaturePress } from "./resolve-map-feature-press";
import { MAP_USER_LOCATION_HIT_LAYER_ID } from "./user-location/user-location";

describe("resolveMapFeaturePress", () => {
  it("routes marker hit features to onMarkerPress", () => {
    const onMarkerPress = vi.fn();

    const handled = resolveMapFeaturePress(
      [
        {
          layer: { id: MAP_MARKERS_HIT_LAYER_ID },
          properties: { markerId: "pin-1" },
        } as never,
      ],
      {
        onMarkerPress,
        extraInteractiveLayerIds: [],
      },
    );

    expect(handled).toBe(true);
    expect(onMarkerPress).toHaveBeenCalledWith("pin-1");
  });

  it("routes extra interactive layers to onLayerFeaturePress", () => {
    const onLayerFeaturePress = vi.fn();

    const handled = resolveMapFeaturePress(
      [
        {
          layer: { id: "custom-hit" },
          properties: { id: "zone-a" },
        } as never,
      ],
      {
        extraInteractiveLayerIds: ["custom-hit"],
        onLayerFeaturePress,
      },
    );

    expect(handled).toBe(true);
    expect(onLayerFeaturePress).toHaveBeenCalledWith("custom-hit", {
      id: "zone-a",
    });
  });

  it("routes user location hits to onUserLocationPress", () => {
    const onUserLocationPress = vi.fn();

    const handled = resolveMapFeaturePress(
      [
        {
          layer: { id: MAP_USER_LOCATION_HIT_LAYER_ID },
          properties: {},
        } as never,
      ],
      {
        extraInteractiveLayerIds: [],
        onUserLocationPress,
      },
    );

    expect(handled).toBe(true);
    expect(onUserLocationPress).toHaveBeenCalledTimes(1);
  });
});
