import type { CSSProperties } from "react";

import { SHEET_MAP_LOGO_REGION_BOTTOM_INSET_VAR } from "./sheet-map-theme-vars";

/** Host inline style: logo region excludes collapsed sheet height at the bottom. */
export function buildMapLogoHostStyle(
  collapsedSheetHeightPx: number,
): CSSProperties | undefined {
  if (collapsedSheetHeightPx <= 0) {
    return undefined;
  }

  return {
    [SHEET_MAP_LOGO_REGION_BOTTOM_INSET_VAR]: `${collapsedSheetHeightPx}px`,
  } as CSSProperties;
}
