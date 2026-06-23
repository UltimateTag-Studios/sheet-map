import { readFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

import { SHEET_MAP_LAYOUT_VARS } from "./map-shell-layout-vars";
import {
  SHEET_MAP_LOGO_REGION_BOTTOM_INSET_VAR,
  SHEET_MAP_THEME_VARS,
} from "./sheet-map-theme-vars";

const packageRoot = join(fileURLToPath(import.meta.url), "..", "..", "..");
const builtCssPath = join(packageRoot, "dist/style.css");
const sourceCssPath = join(packageRoot, "styles/sheet-map.css");

describe("built sheet-map styles", () => {
  it("copies theme and referenced layout tokens into dist/style.css", () => {
    const builtCss = readFileSync(builtCssPath, "utf8");
    const sourceCss = readFileSync(sourceCssPath, "utf8");

    for (const token of Object.values(SHEET_MAP_THEME_VARS)) {
      expect(builtCss).toContain(token);
    }

    for (const token of Object.values(SHEET_MAP_LAYOUT_VARS)) {
      if (sourceCss.includes(token)) {
        expect(builtCss).toContain(token);
      }
    }

    expect(builtCss).toContain(SHEET_MAP_LOGO_REGION_BOTTOM_INSET_VAR);
    expect(builtCss).toContain('[data-sheet-map-theme="light"]');
    expect(builtCss).toContain('[data-sheet-map-theme="dark"]');
  });
});
