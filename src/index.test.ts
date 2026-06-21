import { describe, expect, it } from "vitest";

import { SHEET_MAP_REBUILD_PHASE } from "./index";

describe("@siegetag/sheet-map rebuild", () => {
  it("reports phase 5 after follow-user lands", () => {
    expect(SHEET_MAP_REBUILD_PHASE).toBe(5);
  });
});
