import { describe, expect, it } from "vitest";

import { SHEET_MAP_REBUILD_PHASE } from "./index";

describe("@siegetag/sheet-map", () => {
  it("reports rebuild phase 3 (sheet on map)", () => {
    expect(SHEET_MAP_REBUILD_PHASE).toBe(3);
  });
});
