import { describe, expect, it } from "vitest";

import { MapLayout, useRegisterMapRoute } from "./index";

describe("@siegetag/sheet-map", () => {
  it("exports the public shell entry points", () => {
    expect(MapLayout).toBeTypeOf("function");
    expect(useRegisterMapRoute).toBeTypeOf("function");
  });
});
