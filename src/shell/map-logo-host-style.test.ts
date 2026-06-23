import { describe, expect, it } from "vitest";

import {
  buildMapLogoHostStyle,
  SHEET_MAP_LOGO_BOTTOM_OFFSET_VAR,
} from "./map-logo-host-style";

describe("buildMapLogoHostStyle", () => {
  it("returns undefined when collapsed height is zero", () => {
    expect(buildMapLogoHostStyle(0)).toBeUndefined();
  });

  it("sets the logo offset CSS var from collapsed snap height", () => {
    const style = buildMapLogoHostStyle(120);
    expect(style).toBeDefined();
    if (!style) {
      return;
    }

    expect(
      (style as Record<string, string>)[SHEET_MAP_LOGO_BOTTOM_OFFSET_VAR],
    ).toBe("120px");
  });
});
