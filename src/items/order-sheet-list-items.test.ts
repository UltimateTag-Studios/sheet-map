import { describe, expect, it } from "vitest";

import { orderSheetListItems } from "./order-sheet-list-items";
import type { MapItem } from "./types";

const items: MapItem[] = [
  { id: "a", location: { lat: 1, lng: 2 }, title: "Alpha" },
  { id: "b", location: { lat: 3, lng: 4 }, title: "Beta" },
  { id: "c", location: { lat: 5, lng: 6 }, title: "Gamma" },
];

describe("orderSheetListItems", () => {
  it("keeps stable order at full snap", () => {
    expect(orderSheetListItems(items, "b", "full")).toEqual(items);
  });

  it("keeps stable order at collapsed snap", () => {
    expect(orderSheetListItems(items, "b", "collapsed")).toEqual(items);
  });

  it("promotes selected item to front at half snap", () => {
    expect(orderSheetListItems(items, "b", "half")).toEqual([
      items[1],
      items[0],
      items[2],
    ]);
  });

  it("returns items unchanged when nothing is selected at half snap", () => {
    expect(orderSheetListItems(items, null, "half")).toEqual(items);
  });

  it("returns items unchanged when selected is already first at half snap", () => {
    expect(orderSheetListItems(items, "a", "half")).toEqual(items);
  });
});
