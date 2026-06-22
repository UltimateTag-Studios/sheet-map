import type { Map as MapboxMap } from "mapbox-gl";
import { describe, expect, it, vi } from "vitest";

import {
  hasBootFlownForMapInstance,
  markBootFlownForMapInstance,
  releaseMapInstanceCameraState,
} from "./map-instance-camera-state";
import { hasSyncedMapPadding, syncMapPadding } from "./sync-map-padding";

function createMap() {
  let padding = { top: 0, left: 0, right: 0, bottom: 0 };

  const map = {
    setPadding: vi.fn((next: typeof padding) => {
      padding = next;
    }),
    getPadding: () => padding,
  } as unknown as MapboxMap;

  return map;
}

describe("map instance camera state", () => {
  it("clears boot and padding latches so a released map can boot again", () => {
    const map = createMap();
    const nextPadding = { top: 0, left: 0, right: 0, bottom: 152 };

    syncMapPadding(map, nextPadding);
    markBootFlownForMapInstance(map);

    expect(hasSyncedMapPadding(map)).toBe(true);
    expect(hasBootFlownForMapInstance(map)).toBe(true);

    releaseMapInstanceCameraState(map);

    expect(hasSyncedMapPadding(map)).toBe(false);
    expect(hasBootFlownForMapInstance(map)).toBe(false);
    expect(syncMapPadding(map, nextPadding)).toBe(true);
  });
});
