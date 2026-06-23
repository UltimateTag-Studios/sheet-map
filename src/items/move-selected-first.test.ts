import { describe, expect, it } from "vitest";

import { moveSelectedFirst } from "./move-selected-first";

describe("moveSelectedFirst", () => {
  it("returns a copy when nothing is selected", () => {
    const items = [{ id: "a" }, { id: "b" }];
    expect(moveSelectedFirst(items, null, (item) => item.id)).toEqual(items);
  });

  it("moves the selected item to the front", () => {
    const items = [{ id: "a" }, { id: "b" }, { id: "c" }];
    expect(moveSelectedFirst(items, "b", (item) => item.id)).toEqual([
      { id: "b" },
      { id: "a" },
      { id: "c" },
    ]);
  });
});
