import { describe, expect, it } from "vitest";

import { SHEET_MAP_REBUILD_PHASE } from "./index";

describe("@siegetag/sheet-map", () => {
  it("reports rebuild phase 1 (visible viewport)", () => {
    expect(SHEET_MAP_REBUILD_PHASE).toBe(1);
  });
});
