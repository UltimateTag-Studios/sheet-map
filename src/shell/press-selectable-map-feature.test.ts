import { describe, expect, it, vi } from "vitest";

import type { MapItem } from "../items/types";
import { pressSelectableMapFeature } from "./press-selectable-map-feature";

const items: MapItem[] = [
  {
    id: "abc",
    location: { lat: 2, lng: 1 },
    title: "A",
  },
];

describe("pressSelectableMapFeature", () => {
  it("selects an item with its location", () => {
    const selectItem = vi.fn();

    pressSelectableMapFeature("abc", items, selectItem);

    expect(selectItem).toHaveBeenCalledWith("abc", { lat: 2, lng: 1 });
  });

  it("ignores unknown ids", () => {
    const selectItem = vi.fn();

    pressSelectableMapFeature("missing", items, selectItem);

    expect(selectItem).not.toHaveBeenCalled();
  });

  it("ignores items without a location", () => {
    const selectItem = vi.fn();

    pressSelectableMapFeature(
      "no-loc",
      [{ id: "no-loc", location: null, title: "X" }],
      selectItem,
    );

    expect(selectItem).not.toHaveBeenCalled();
  });
});
