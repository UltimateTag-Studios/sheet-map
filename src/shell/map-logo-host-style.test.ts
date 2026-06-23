import { describe, expect, it } from "vitest";

import { buildMapLogoHostStyle } from "./map-logo-host-style";
import { SHEET_MAP_LOGO_REGION_BOTTOM_INSET_VAR } from "./sheet-map-theme-vars";

describe("buildMapLogoHostStyle", () => {
  it("returns undefined when collapsed height is zero", () => {
    expect(buildMapLogoHostStyle(0)).toBeUndefined();
  });

  it("sets the logo region bottom inset from collapsed snap height", () => {
    const style = buildMapLogoHostStyle(120);
    expect(style).toBeDefined();
    if (!style) {
      return;
    }

    expect(
      (style as Record<string, string>)[SHEET_MAP_LOGO_REGION_BOTTOM_INSET_VAR],
    ).toBe("120px");
  });
});
