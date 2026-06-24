import type { Map as MapboxMap } from "mapbox-gl";
import { describe, expect, it, vi } from "vitest";

import { setMapPaddingIfChanged } from "./sync";

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

describe("setMapPaddingIfChanged", () => {
  it("applies padding once and dedupes identical values", () => {
    const { map } = createMap();
    const next = { top: 0, left: 0, right: 0, bottom: 152 };

    expect(setMapPaddingIfChanged(map, next)).toBe(true);
    expect(setMapPaddingIfChanged(map, next)).toBe(false);
    expect(map.setPadding).toHaveBeenCalledTimes(1);
  });

  it("applies again when padding values change", () => {
    const { map } = createMap();

    setMapPaddingIfChanged(map, { top: 0, left: 0, right: 0, bottom: 152 });
    setMapPaddingIfChanged(map, { top: 0, left: 0, right: 0, bottom: 200 });

    expect(map.setPadding).toHaveBeenCalledTimes(2);
  });
});
