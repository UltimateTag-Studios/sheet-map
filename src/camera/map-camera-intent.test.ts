import { describe, expect, it } from "vitest";

import { buildPointListCameraIntent } from "./map-camera-intent";

describe("buildPointListCameraIntent", () => {
  it("flies to user location instantly when anchored on user", () => {
    const intent = buildPointListCameraIntent({
      cameraAnchor: { kind: "user" },
      userLocation: { lng: 1, lat: 2 },
      cameraEpoch: 0,
    });

    expect(intent).toEqual({
      key: "user:1:2:instant:e0",
      coords: { lng: 1, lat: 2 },
      instant: true,
    });
  });

  it("flies to user location smoothly when motion is smooth", () => {
    const intent = buildPointListCameraIntent({
      cameraAnchor: { kind: "user", motion: "smooth" },
      userLocation: { lng: 1, lat: 2 },
      cameraEpoch: 0,
    });

    expect(intent).toEqual({
      key: "user:1:2:smooth:e0",
      coords: { lng: 1, lat: 2 },
      instant: false,
    });
  });

  it("returns null when camera anchor is null", () => {
    expect(
      buildPointListCameraIntent({
        cameraAnchor: null,
        userLocation: { lng: 1, lat: 2 },
        cameraEpoch: 0,
      }),
    ).toBeNull();
  });

  it("flies to a point by id", () => {
    const intent = buildPointListCameraIntent({
      cameraAnchor: { kind: "point", id: "ABC123" },
      points: [
        {
          id: "ABC123",
          location: { lng: -122.5, lat: 37.8 },
        },
      ],
      cameraEpoch: 0,
    });

    expect(intent).toEqual({
      key: "point:ABC123:e0",
      coords: { lng: -122.5, lat: 37.8 },
    });
  });

  it("returns null for point anchor without location", () => {
    expect(
      buildPointListCameraIntent({
        cameraAnchor: { kind: "point", id: "ABC123" },
        points: [{ id: "ABC123" }],
        cameraEpoch: 0,
      }),
    ).toBeNull();
  });
});
