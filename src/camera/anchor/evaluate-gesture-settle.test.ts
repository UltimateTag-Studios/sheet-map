import type { Map as MapboxMap } from "mapbox-gl";
import { describe, expect, it } from "vitest";

import {
  evaluateFollowAtGestureSettle,
  type MapAnchorFollowConfig,
} from "./evaluate-gesture-settle";

const follow: MapAnchorFollowConfig = {
  userLocation: { lat: 2, lng: 1 },
  centerOffset: { x: 20, y: -80 },
  thresholdPx: 40,
};

function createMap(project: () => { x: number; y: number }) {
  return {
    getCenter: () => ({ lat: 10, lng: 20 }),
    getZoom: () => 14,
    project,
    getCanvas: () => ({ clientWidth: 400, clientHeight: 800 }),
  } as unknown as MapboxMap;
}

describe("evaluateFollowAtGestureSettle", () => {
  it("commits anchor when follow is disabled", () => {
    const map = createMap(() => ({ x: 220, y: 320 }));

    expect(evaluateFollowAtGestureSettle(map, null, false)).toEqual({
      kind: "commitAnchor",
      position: { lat: 10, lng: 20, zoom: 14 },
    });
  });

  it("releases follow when threshold was exceeded during the gesture", () => {
    const map = createMap(() => ({ x: 220, y: 320 }));

    expect(evaluateFollowAtGestureSettle(map, follow, true)).toEqual({
      kind: "releaseFollow",
    });
  });

  it("releases follow when distance exceeds threshold at settle", () => {
    const map = createMap(() => ({ x: 300, y: 320 }));

    expect(evaluateFollowAtGestureSettle(map, follow, false)).toEqual({
      kind: "releaseFollow",
    });
  });

  it("snaps back when distance is within threshold", () => {
    const map = createMap(() => ({ x: 220, y: 320 }));

    expect(evaluateFollowAtGestureSettle(map, follow, false)).toEqual({
      kind: "snapBackToUser",
      target: { lat: 2, lng: 1 },
    });
  });
});
