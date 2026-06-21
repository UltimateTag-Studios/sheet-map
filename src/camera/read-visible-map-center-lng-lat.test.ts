import { describe, expect, it } from "vitest";

import { readVisibleMapCenterLngLat } from "./read-visible-map-center-lng-lat";

describe("readVisibleMapCenterLngLat", () => {
  it("unprojects the client rect center in canvas coordinates", () => {
    const coords = readVisibleMapCenterLngLat(
      { width: 400, height: 800 },
      { x: 0, y: -100 },
      { x: 100, y: 50, width: 400, height: 300 },
      ([x, y]) => ({ lng: x, lat: y }),
      { canvasOrigin: { x: 100, y: 50 } },
    );

    expect(coords).toEqual({ lng: 200, lat: 150 });
  });

  it("falls back to canvas center plus offset when client rect is missing", () => {
    const coords = readVisibleMapCenterLngLat(
      { width: 400, height: 800 },
      { x: 10, y: -50 },
      null,
      ([x, y]) => ({ lng: x, lat: y }),
    );

    expect(coords).toEqual({ lng: 210, lat: 350 });
  });
});
