import { describe, expect, it } from "vitest";

import {
  routeEnterFliesEqual,
  routeEnterFlyKey,
} from "./map-shell-machine/route-enter-fly";

describe("route enter-fly helpers", () => {
  it("compares entries by value", () => {
    expect(
      routeEnterFliesEqual({ kind: "userLocation" }, { kind: "userLocation" }),
    ).toBe(true);
    expect(
      routeEnterFliesEqual(
        { kind: "userLocation", zoom: 12 },
        { kind: "userLocation", zoom: 12 },
      ),
    ).toBe(true);
    expect(
      routeEnterFliesEqual(
        { kind: "userLocation", zoom: 12 },
        { kind: "userLocation" },
      ),
    ).toBe(false);
    expect(
      routeEnterFliesEqual(
        { kind: "item", id: "a", location: { lat: 1, lng: 2 } },
        { kind: "item", id: "a", location: { lat: 1, lng: 2 } },
      ),
    ).toBe(true);
    expect(
      routeEnterFliesEqual(
        { kind: "item", id: "a", location: { lat: 1, lng: 2 } },
        { kind: "item", id: "b", location: { lat: 1, lng: 2 } },
      ),
    ).toBe(false);
  });

  it("builds stable entry keys", () => {
    expect(routeEnterFlyKey({ kind: "userLocation" })).toBe("userLocation");
    expect(routeEnterFlyKey({ kind: "userLocation", zoom: 14 })).toBe(
      "userLocation:14",
    );
    expect(
      routeEnterFlyKey({
        kind: "item",
        id: "a",
        location: { lat: 1, lng: 2 },
        zoom: 15,
      }),
    ).toBe("item:a:1,2:z15");
    expect(
      routeEnterFlyKey({
        kind: "item",
        id: "a",
        location: { lat: 1, lng: 2 },
      }),
    ).toBe("item:a:1,2");
  });
});
