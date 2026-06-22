import type { Map as MapboxMap } from "mapbox-gl";
import { describe, expect, it, vi } from "vitest";

import {
  clearMapPaddingSyncState,
  consumePaddingSyncMoveEnd,
  hasSyncedMapPadding,
  syncMapPadding,
} from "./sync";

function createMap() {
  let padding = { top: 0, left: 0, right: 0, bottom: 0 };

  const map = {
    setPadding: vi.fn((next: typeof padding) => {
      padding = next;
    }),
    getPadding: () => padding,
  } as unknown as MapboxMap;

  return { map, getPadding: () => padding };
}

describe("syncMapPadding", () => {
  it("applies padding once and dedupes identical values", () => {
    const { map } = createMap();
    const next = { top: 0, left: 0, right: 0, bottom: 152 };

    expect(syncMapPadding(map, next)).toBe(true);
    expect(syncMapPadding(map, next)).toBe(false);
    expect(map.setPadding).toHaveBeenCalledTimes(1);
    expect(hasSyncedMapPadding(map)).toBe(true);

    clearMapPaddingSyncState(map);
  });

  it("marks padding moveends for camera session to ignore", () => {
    const { map } = createMap();

    syncMapPadding(map, { top: 0, left: 0, right: 0, bottom: 152 });

    expect(consumePaddingSyncMoveEnd(map)).toBe(true);
    expect(consumePaddingSyncMoveEnd(map)).toBe(false);

    clearMapPaddingSyncState(map);
  });

  it("applies again when padding values change", () => {
    const { map } = createMap();

    syncMapPadding(map, { top: 0, left: 0, right: 0, bottom: 152 });
    syncMapPadding(map, { top: 0, left: 0, right: 0, bottom: 200 });

    expect(map.setPadding).toHaveBeenCalledTimes(2);

    clearMapPaddingSyncState(map);
  });

  it("marks pending moveend only when setPadding runs", () => {
    const { map } = createMap();

    syncMapPadding(map, { top: 0, left: 0, right: 0, bottom: 152 });
    expect(consumePaddingSyncMoveEnd(map)).toBe(true);
    expect(consumePaddingSyncMoveEnd(map)).toBe(false);

    syncMapPadding(map, { top: 0, left: 0, right: 0, bottom: 200 });
    expect(consumePaddingSyncMoveEnd(map)).toBe(true);

    clearMapPaddingSyncState(map);
  });
});
