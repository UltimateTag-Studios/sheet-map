import { describe, expect, it } from "vitest";

import { SHEET_MAP_REBUILD_PHASE } from "./index";

describe("@siegetag/sheet-map", () => {
  it("reports rebuild phase 4 (padding + anchor FSM)", () => {
    expect(SHEET_MAP_REBUILD_PHASE).toBe(4);
  });
});
