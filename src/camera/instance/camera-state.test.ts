import type { Map as MapboxMap } from "mapbox-gl";
import { describe, expect, it, vi } from "vitest";

import { hasSyncedMapPadding, syncMapPadding } from "../padding/sync";
import {
  hasBootIssuedForMapInstance,
  hasFollowAutoStartedForMapInstance,
  hasFollowReleasedForMapInstance,
  markBootIssuedForMapInstance,
  markFollowAutoStartedForMapInstance,
  markFollowReleasedForMapInstance,
  releaseMapInstanceCameraState,
} from "./camera-state";

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
  it("clears boot, follow, and padding latches so a released map can boot again", () => {
    const map = createMap();
    const nextPadding = { top: 0, left: 0, right: 0, bottom: 152 };

    syncMapPadding(map, nextPadding);
    markBootIssuedForMapInstance(map);
    markFollowAutoStartedForMapInstance(map);
    markFollowReleasedForMapInstance(map);

    expect(hasSyncedMapPadding(map)).toBe(true);
    expect(hasBootIssuedForMapInstance(map)).toBe(true);
    expect(hasFollowAutoStartedForMapInstance(map)).toBe(true);
    expect(hasFollowReleasedForMapInstance(map)).toBe(true);

    releaseMapInstanceCameraState(map);

    expect(hasSyncedMapPadding(map)).toBe(false);
    expect(hasBootIssuedForMapInstance(map)).toBe(false);
    expect(hasFollowAutoStartedForMapInstance(map)).toBe(false);
    expect(hasFollowReleasedForMapInstance(map)).toBe(false);
    expect(syncMapPadding(map, nextPadding)).toBe(true);
  });
});
