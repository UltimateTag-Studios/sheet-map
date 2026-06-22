import { describe, expect, it } from "vitest";

import { SHEET_MAP_REBUILD_PHASE } from "./index";

describe("@siegetag/sheet-map", () => {
  it("reports rebuild phase 2 (map canvas)", () => {
    expect(SHEET_MAP_REBUILD_PHASE).toBe(2);
  });
});
