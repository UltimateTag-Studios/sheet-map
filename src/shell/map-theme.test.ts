import { describe, expect, it } from "vitest";

import {
  DEFAULT_THEME,
  MAPBOX_STYLE_URL_BY_THEME,
  resolveMapboxStyleUrl,
} from "./map-theme";

describe("resolveMapboxStyleUrl", () => {
  it("defaults to light map style", () => {
    expect(DEFAULT_THEME).toBe("light");
    expect(resolveMapboxStyleUrl()).toBe(MAPBOX_STYLE_URL_BY_THEME.light);
  });

  it("resolves dark map style", () => {
    expect(resolveMapboxStyleUrl("dark")).toBe(MAPBOX_STYLE_URL_BY_THEME.dark);
  });
});
